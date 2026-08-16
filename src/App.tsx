import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { Participant } from './components/Sidebar';
import { CourseMap } from './components/CourseMap';
import { STATIONS } from './data/subwayData';
import type { Station } from './data/subwayData';
import { findBestMeetingStations } from './utils/calculator';
import type { CandidateResult } from './utils/calculator';
import { Map, List } from 'lucide-react';

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: '1', name: '현식', stationName: '강남' },
  { id: '2', name: '민우', stationName: '홍대입구' },
  { id: '3', name: '지은', stationName: '노원' },
];

export function App() {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 모바일 전용 뷰 토글 ('input' | 'map')
  const [mobileTab, setMobileTab] = useState<'input' | 'map'>('input');

  // 역 이름으로 Station 찾기 (공백 제거 후 매칭 지원)
  const findStationByName = (name: string): Station | undefined => {
    const clean = name.trim().replace(/역$/, '').toLowerCase();
    return STATIONS.find(
      (s) => s.name.toLowerCase() === clean || s.name.toLowerCase() === name.trim().toLowerCase()
    );
  };

  // 중간역 계산 실행
  const handleCalculate = () => {
    setErrorMessage(null);

    // 유효성 검사: 2명 이상인지
    if (participants.length < 2) {
      setErrorMessage('최소 2명 이상의 출발역을 입력해주세요.');
      return;
    }

    // 빈 역명이 있는지
    const emptyIdx = participants.findIndex((p) => !p.stationName.trim());
    if (emptyIdx !== -1) {
      setErrorMessage(`${participants[emptyIdx].name || `인원 ${emptyIdx + 1}`}의 출발역을 입력해주세요.`);
      return;
    }

    // 모든 역이 실제 데이터에 존재하는지 확인
    const originStationIds: string[] = [];
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const station = findStationByName(p.stationName);
      if (!station) {
        setErrorMessage(`'${p.stationName}' 역을 찾을 수 없습니다. 자동완성 목록에서 선택해주세요.`);
        return;
      }
      originStationIds.push(station.id);
    }

    setIsCalculating(true);

    try {
      const bestStations = findBestMeetingStations(originStationIds);
      if (bestStations.length === 0) {
        setErrorMessage('모든 인원이 도달할 수 있는 중간역을 찾지 못했습니다.');
      } else {
        setResults(bestStations);
        setSelectedResultIndex(0);
        // 모바일에서는 계산 후 지도 탭으로 전환
        if (window.innerWidth < 1024) {
          setMobileTab('map');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('중간역 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 리셋
  const handleReset = () => {
    setParticipants([
      { id: '1', name: '인원 1', stationName: '' },
      { id: '2', name: '인원 2', stationName: '' },
    ]);
    setResults([]);
    setSelectedResultIndex(0);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* 헤더 */}
      <Header />

      {/* 모바일 뷰 전환 탭바 (lg 미만 화면) */}
      <div className="lg:hidden flex items-center border-b border-slate-200 bg-slate-50 px-2 py-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('input')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'input'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <List size={15} />
          <span>입력 및 결과 ({results.length > 0 ? `${results.length}개 추천` : `${participants.length}명`})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'map'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map size={15} />
          <span>지도 화면</span>
        </button>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 좌측 사이드바 (데스크톱 항상 노출, 모바일에서는 탭 선택 시 노출) */}
        <div
          className={`h-full ${
            mobileTab === 'input' ? 'flex flex-col w-full' : 'hidden'
          } lg:flex lg:w-auto shrink-0`}
        >
          <Sidebar
            participants={participants}
            setParticipants={setParticipants}
            onCalculate={handleCalculate}
            onReset={handleReset}
            results={results}
            selectedResultIndex={selectedResultIndex}
            setSelectedResultIndex={setSelectedResultIndex}
            isCalculating={isCalculating}
            errorMessage={errorMessage}
          />
        </div>

        {/* 우측 지도 영역 (데스크톱 항상 노출, 모바일에서는 탭 선택 시 노출) */}
        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'block w-full' : 'hidden'
          } lg:block`}
        >
          <CourseMap
            participants={participants}
            results={results}
            selectedResultIndex={selectedResultIndex}
            onSelectResult={(idx) => setSelectedResultIndex(idx)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
