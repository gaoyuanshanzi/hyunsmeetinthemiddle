import { STATIONS, SUBWAY_EDGES, STATION_MAP } from '../data/subwayData';
import type { Station } from '../data/subwayData';

export interface RouteDetail {
  fromStationId: string;
  toStationId: string;
  duration: number; // 분
  path: string[];   // 역 ID 경로 리스트
  linesUsed: string[];
}

export interface CandidateResult {
  station: Station;
  rank: number;
  maxTime: number;      // 최대 소요시간
  totalTime: number;    // 전체 소요시간 합
  avgTime: number;      // 평균 소요시간
  timeVariance: number; // 분산
  details: {
    originIndex: number;
    originStation: Station;
    time: number;
    path: Station[];
    lines: string[];
  }[];
}

interface GraphAdj {
  to: string;
  line: string;
  duration: number;
}

// 인접 리스트 생성 (양방향)
const adjacencyList = new Map<string, GraphAdj[]>();

STATIONS.forEach((st) => {
  adjacencyList.set(st.id, []);
});

SUBWAY_EDGES.forEach((edge) => {
  adjacencyList.get(edge.from)?.push({
    to: edge.to,
    line: edge.line,
    duration: edge.duration,
  });
  adjacencyList.get(edge.to)?.push({
    to: edge.from,
    line: edge.line,
    duration: edge.duration,
  });
});

/**
 * 다익스트라 최단 경로 알고리즘
 * @param startStationId 시작 역 ID
 * @returns 모든 역에 대한 최단 소요시간 및 이전 노드 맵
 */
export function calculateShortestPaths(startStationId: string): {
  distances: Map<string, number>;
  previous: Map<string, { stationId: string; line: string } | null>;
} {
  const distances = new Map<string, number>();
  const previous = new Map<string, { stationId: string; line: string } | null>();
  const visited = new Set<string>();

  STATIONS.forEach((st) => {
    distances.set(st.id, Infinity);
    previous.set(st.id, null);
  });

  distances.set(startStationId, 0);

  // 우선순위 큐 대체 (정점 수가 약 100개이므로 단순 탐색도 1ms 미만으로 매우 빠름)
  const unvisited = new Set<string>(STATIONS.map((s) => s.id));

  while (unvisited.size > 0) {
    let currentStationId: string | null = null;
    let shortestDist = Infinity;

    unvisited.forEach((stId) => {
      const dist = distances.get(stId) ?? Infinity;
      if (dist < shortestDist) {
        shortestDist = dist;
        currentStationId = stId;
      }
    });

    if (currentStationId === null || shortestDist === Infinity) {
      break;
    }

    unvisited.delete(currentStationId);
    visited.add(currentStationId);

    const neighbors = adjacencyList.get(currentStationId) || [];
    const prevNodeInfo = previous.get(currentStationId);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.to)) continue;

      // 환승 패널티: 이전 이동 노선과 현재 노선이 다르고, 시작점이 아닐 때 환승 시간(3분) 추가
      let transferPenalty = 0;
      if (prevNodeInfo && prevNodeInfo.line !== neighbor.line) {
        transferPenalty = 3;
      }

      const alt = shortestDist + neighbor.duration + transferPenalty;
      const currentNeighborDist = distances.get(neighbor.to) ?? Infinity;

      if (alt < currentNeighborDist) {
        distances.set(neighbor.to, alt);
        previous.set(neighbor.to, { stationId: currentStationId, line: neighbor.line });
      }
    }
  }

  return { distances, previous };
}

/**
 * 역 경로 역추적
 */
export function reconstructPath(
  targetId: string,
  previous: Map<string, { stationId: string; line: string } | null>
): { path: Station[]; lines: string[] } {
  const path: Station[] = [];
  const lines: string[] = [];

  let currentId: string | null = targetId;
  const currentStation = STATION_MAP.get(targetId);
  if (currentStation) path.unshift(currentStation);

  while (currentId) {
    const prevInfo = previous.get(currentId);
    if (!prevInfo) break;

    const prevStation = STATION_MAP.get(prevInfo.stationId);
    if (prevStation) {
      path.unshift(prevStation);
      if (!lines.includes(prevInfo.line)) {
        lines.unshift(prevInfo.line);
      }
    }
    currentId = prevInfo.stationId;
  }

  return { path, lines };
}

/**
 * Minimax 기반 최적 중간역 찾기
 * @param originStationIds 출발역 ID 리스트 (2~10명)
 * @returns 상위 3개 추천 역 및 상세 정보
 */
export function findBestMeetingStations(originStationIds: string[]): CandidateResult[] {
  if (originStationIds.length < 2) return [];

  // 각 출발역별 최단 경로 및 거리 계산
  const allOriginsData = originStationIds.map((originId) => ({
    originId,
    originStation: STATION_MAP.get(originId)!,
    ...calculateShortestPaths(originId),
  }));

  const candidateScores: {
    station: Station;
    maxTime: number;
    totalTime: number;
    avgTime: number;
    timeVariance: number;
    times: number[];
    details: CandidateResult['details'];
  }[] = [];

  // 모든 후보 역에 대해 점수 계산
  STATIONS.forEach((candidate) => {
    let maxTime = 0;
    let totalTime = 0;
    const times: number[] = [];
    const details: CandidateResult['details'] = [];

    let isReachable = true;

    for (let i = 0; i < allOriginsData.length; i++) {
      const { originStation, distances, previous } = allOriginsData[i];
      const time = distances.get(candidate.id) ?? Infinity;

      if (time === Infinity) {
        isReachable = false;
        break;
      }

      const { path, lines } = reconstructPath(candidate.id, previous);

      times.push(time);
      totalTime += time;
      if (time > maxTime) {
        maxTime = time;
      }

      details.push({
        originIndex: i,
        originStation,
        time,
        path,
        lines,
      });
    }

    if (isReachable) {
      const avgTime = totalTime / originStationIds.length;
      const variance =
        times.reduce((acc, t) => acc + Math.pow(t - avgTime, 2), 0) /
        originStationIds.length;

      candidateScores.push({
        station: candidate,
        maxTime,
        totalTime,
        avgTime: Math.round(avgTime * 10) / 10,
        timeVariance: Math.round(variance * 10) / 10,
        times,
        details,
      });
    }
  });

  // 정렬 기준:
  // 1순위: maxTime 오름차순 (가장 오래 걸리는 사람의 이동시간 최소화)
  // 2순위: totalTime 오름차순 (전체 이동시간 합 최소화)
  // 3순위: timeVariance 오름차순 (인원 간 시간 편차 최소화)
  candidateScores.sort((a, b) => {
    if (a.maxTime !== b.maxTime) {
      return a.maxTime - b.maxTime;
    }
    if (a.totalTime !== b.totalTime) {
      return a.totalTime - b.totalTime;
    }
    return a.timeVariance - b.timeVariance;
  });

  // 상위 3개 결과 반환 (랭킹 부여)
  return candidateScores.slice(0, 3).map((res, index) => ({
    station: res.station,
    rank: index + 1,
    maxTime: res.maxTime,
    totalTime: res.totalTime,
    avgTime: res.avgTime,
    timeVariance: res.timeVariance,
    details: res.details,
  }));
}
