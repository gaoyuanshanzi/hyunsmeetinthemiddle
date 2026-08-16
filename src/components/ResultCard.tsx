import { useState, Fragment } from 'react';
import type { FC } from 'react';
import type { CandidateResult } from '../utils/calculator';
import { LINE_COLORS } from '../data/subwayData';
import { openDirections } from '../utils/mapUtils';
import { Trophy, Clock, Users, ChevronDown, ChevronUp, Navigation, ExternalLink, ArrowRight } from 'lucide-react';

interface ResultCardProps {
  result: CandidateResult;
  isSelected: boolean;
  onSelect: () => void;
  userNames: string[];
}

export const ResultCard: FC<ResultCardProps> = ({
  result,
  isSelected,
  onSelect,
  userNames,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isFirst = result.rank === 1;

  const rankBadgeConfig = {
    1: { label: '1위 추천 (최적)', bg: 'bg-blue-600', text: 'text-white', icon: Trophy },
    2: { label: '2위 후보', bg: 'bg-slate-700', text: 'text-white', icon: Trophy },
    3: { label: '3위 후보', bg: 'bg-slate-500', text: 'text-white', icon: Trophy },
  }[result.rank] || { label: `${result.rank}위`, bg: 'bg-slate-400', text: 'text-white', icon: Trophy };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? isFirst
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
            : 'border-slate-800 ring-2 ring-slate-400/20 bg-white shadow-md'
          : isFirst
          ? 'border-blue-200 hover:border-blue-400 bg-white shadow-sm'
          : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'
      }`}
    >
      {/* 카드 헤더 */}
      <div className={`p-4 ${isFirst ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-b border-blue-100' : 'border-b border-slate-100'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${rankBadgeConfig.bg} ${rankBadgeConfig.text}`}
            >
              <rankBadgeConfig.icon size={12} />
              {rankBadgeConfig.label}
            </span>
            {isFirst && (
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                Minimax 최단
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {result.station.lines.map((line) => {
              const style = LINE_COLORS[line] || { bg: 'bg-slate-500', text: 'text-white' };
              return (
                <span
                  key={line}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                >
                  {line.replace('호선', '')}
                </span>
              );
            })}
          </div>
        </div>

        {/* 역 이름 & 주요 메트릭 */}
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {result.station.name}역
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">최대 소요시간</div>
            <div className="text-lg font-black text-blue-600">
              {result.maxTime}
              <span className="text-xs font-normal text-slate-600 ml-0.5">분</span>
            </div>
          </div>
        </div>

        {/* 핵심 통계 배지 */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span>평균</span>
            <span className="font-bold text-slate-800">{result.avgTime}분</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 justify-end">
            <Users size={13} className="text-slate-400 shrink-0" />
            <span>총 소요합</span>
            <span className="font-bold text-slate-800">{result.totalTime}분</span>
          </div>
        </div>
      </div>

      {/* 출발지별 소요시간 요약 바 */}
      <div className="p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>인원별 이동시간 요약</span>
          <span className="text-[11px] text-slate-400 font-normal">
            최대 {result.maxTime}분
          </span>
        </div>

        <div className="space-y-1.5">
          {result.details.map((detail, idx) => {
            const userName = userNames[idx] || `인원 ${idx + 1}`;
            const percentage = Math.min(100, Math.round((detail.time / Math.max(result.maxTime, 1)) * 100));

            return (
              <div key={idx} className="bg-slate-50 rounded-lg p-2 text-xs border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-700 truncate">{userName}</span>
                    <span className="text-slate-400 text-[11px]">({detail.originStation.name}역)</span>
                  </div>
                  <div className="font-bold text-slate-900 shrink-0">
                    {detail.time}분
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      detail.time === result.maxTime ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 상세 경로 펼치기 토글 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors pt-1"
        >
          <span>{showDetails ? '경로 접기' : '경로 상세 보기'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            {result.details.map((detail, idx) => (
              <div key={idx} className="p-2 bg-slate-50/80 rounded-md border border-slate-200/60">
                <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>{userNames[idx] || `인원 ${idx + 1}`} ({detail.originStation.name}역 출발)</span>
                  <span className="text-blue-600 font-bold">{detail.time}분</span>
                </div>
                <div className="flex items-center flex-wrap gap-1 text-[11px] text-slate-600">
                  {detail.path.map((st, sIdx) => (
                    <Fragment key={st.id}>
                      <span className={sIdx === detail.path.length - 1 ? 'font-bold text-blue-700' : ''}>
                        {st.name}
                      </span>
                      {sIdx < detail.path.length - 1 && (
                        <ArrowRight size={10} className="text-slate-400" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 길찾기 외부 연동 버튼 (카카오맵 / 네이버지도) */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDirections('kakao', result.station);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium text-xs rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Navigation size={13} />
            <span>카카오맵 길찾기</span>
            <ExternalLink size={11} className="opacity-60" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDirections('naver', result.station);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#03C75A] hover:bg-[#02b351] text-white font-medium text-xs rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Navigation size={13} />
            <span>네이버지도 길찾기</span>
            <ExternalLink size={11} className="opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
};
