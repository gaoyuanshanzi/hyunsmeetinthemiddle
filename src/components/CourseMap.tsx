import { useEffect } from 'react';
import type { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Station } from '../data/subwayData';
import type { CandidateResult } from '../utils/calculator';
import { openDirections } from '../utils/mapUtils';
import type { Participant } from './Sidebar';
import { Clock } from 'lucide-react';

// Leaflet 기본 마커 아이콘 버그 수정
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 지도 뷰포트 자동 맞춤 헬퍼 컴포넌트
const AutoFitBounds: FC<{
  markers: { lat: number; lng: number }[];
}> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      // 기본 서울 중심
      map.setView([37.545, 126.985], 11);
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 14,
      animate: true,
      duration: 0.8,
    });
  }, [markers, map]);

  return null;
};

// 출발역 커스텀 마커 아이콘 생성
const createOriginIcon = (index: number, name: string) => {
  return L.divIcon({
    className: 'custom-origin-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: #1e293b;
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
          margin-bottom: 2px;
          border: 1px solid rgba(255,255,255,0.4);
        ">
          ${name}
        </div>
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          color: white;
          font-weight: 800;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.5);
        ">
          ${index + 1}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #3b82f6;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

// 중간역 커스텀 마커 아이콘 생성
const createMeetingIcon = (rank: number, stationName: string, isSelected: boolean) => {
  const isFirst = rank === 1;
  const bgColor = isFirst ? '#2563eb' : rank === 2 ? '#475569' : '#64748b';
  const scale = isSelected ? '1.15' : '1.0';

  return L.divIcon({
    className: 'custom-meeting-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%) scale(${scale});
        transition: transform 0.2s ease;
      ">
        ${
          isFirst
            ? `<div style="
                position: absolute;
                top: 10px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(37, 99, 235, 0.4);
                animation: custom-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ''
        }
        <div style="
          background: ${bgColor};
          color: white;
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          margin-bottom: 2px;
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}</span>
          <span>${stationName}역</span>
        </div>
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${bgColor};
          border: 3px solid white;
          color: white;
          font-weight: 900;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
          z-index: 10;
        ">
          ${rank}위
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid ${bgColor};
          margin-top: -1px;
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
};

interface CourseMapProps {
  participants: Participant[];
  results: CandidateResult[];
  selectedResultIndex: number;
  onSelectResult: (idx: number) => void;
}

export const CourseMap: FC<CourseMapProps> = ({
  participants,
  results,
  selectedResultIndex,
  onSelectResult,
}) => {
  // 유효한 출발역 정보 추출
  const validOrigins: { participant: Participant; station: Station; index: number }[] = [];
  const selectedResult = results[selectedResultIndex] || results[0];

  // 계산된 결과의 detail에서 출발역 좌표 매핑
  if (selectedResult) {
    selectedResult.details.forEach((detail, idx) => {
      validOrigins.push({
        participant: participants[idx] || { id: `${idx}`, name: `인원 ${idx + 1}`, stationName: detail.originStation.name },
        station: detail.originStation,
        index: idx,
      });
    });
  }

  // bounds 계산용 모든 마커 좌표
  const allMarkerPositions: { lat: number; lng: number }[] = [];

  validOrigins.forEach((o) => {
    allMarkerPositions.push({ lat: o.station.lat, lng: o.station.lng });
  });

  results.forEach((r) => {
    allMarkerPositions.push({ lat: r.station.lat, lng: r.station.lng });
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[37.545, 126.985]}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <AutoFitBounds markers={allMarkerPositions} />

        {/* 선택된 중간역과 각 출발역 사이의 점선 경로(Polyline) */}
        {selectedResult &&
          validOrigins.map((orig) => {
            const positions: [number, number][] = [
              [orig.station.lat, orig.station.lng],
              [selectedResult.station.lat, selectedResult.station.lng],
            ];
            return (
              <Polyline
                key={`line-${orig.index}-${selectedResult.station.id}`}
                positions={positions}
                pathOptions={{
                  color: selectedResult.rank === 1 ? '#2563eb' : '#64748b',
                  weight: 3,
                  dashArray: '6, 8',
                  opacity: 0.85,
                }}
              />
            );
          })}

        {/* 출발역 마커들 */}
        {validOrigins.map((orig) => (
          <Marker
            key={`orig-${orig.index}-${orig.station.id}`}
            position={[orig.station.lat, orig.station.lng]}
            icon={createOriginIcon(orig.index, orig.participant.name || `인원 ${orig.index + 1}`)}
          >
            <Popup className="custom-popup">
              <div className="p-3 bg-white text-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                    {orig.index + 1}
                  </span>
                  <span>{orig.participant.name || `인원 ${orig.index + 1}`}의 출발역</span>
                </div>
                <div className="mt-2 text-xs">
                  <div className="font-semibold text-slate-700">{orig.station.name}역</div>
                  <div className="flex items-center gap-1 mt-1">
                    {orig.station.lines.map((l) => (
                      <span
                        key={l}
                        className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 추천 중간역 마커들 (1~3위) */}
        {results.map((res, idx) => (
          <Marker
            key={`meeting-${res.station.id}`}
            position={[res.station.lat, res.station.lng]}
            icon={createMeetingIcon(res.rank, res.station.name, selectedResultIndex === idx)}
            eventHandlers={{
              click: () => onSelectResult(idx),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-3.5 bg-white text-slate-800 min-w-[220px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${
                      res.rank === 1 ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    {res.rank}위 추천역
                  </span>
                  <div className="flex items-center gap-1">
                    {res.station.lines.map((l) => (
                      <span key={l} className="text-[10px] font-bold text-slate-500">
                        {l.replace('호선', '')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="my-2.5">
                  <div className="text-base font-extrabold text-slate-900">{res.station.name}역</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                    <Clock size={13} className="text-blue-500" />
                    <span>최대 소요: <strong className="text-blue-600 font-bold">{res.maxTime}분</strong></span>
                    <span>(평균 {res.avgTime}분)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openDirections('kakao', res.station)}
                    className="py-1.5 px-2 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-semibold text-[11px] rounded-lg transition-colors text-center"
                  >
                    카카오맵
                  </button>
                  <button
                    type="button"
                    onClick={() => openDirections('naver', res.station)}
                    className="py-1.5 px-2 bg-[#03C75A] hover:bg-[#02b351] text-white font-semibold text-[11px] rounded-lg transition-colors text-center"
                  >
                    네이버지도
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 지도 위 플로팅 안내 툴팁 */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-soft text-xs text-slate-700 hidden sm:flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
        <span>
          {results.length > 0
            ? `선택된 중간역: ${selectedResult ? selectedResult.station.name + '역' : ''}`
            : 'OpenStreetMap 기반 수도권 지하철'}
        </span>
      </div>
    </div>
  );
};
