import type { FC, Dispatch, SetStateAction } from 'react';
import { StationAutocomplete } from './StationAutocomplete';
import { ResultCard } from './ResultCard';
import type { CandidateResult } from '../utils/calculator';
import { Users, Plus, Trash2, Search, RotateCcw, Sparkles, AlertCircle, Map } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface Participant {
  id: string;
  name: string;
  stationName: string;
}

interface SidebarProps {
  participants: Participant[];
  setParticipants: Dispatch<SetStateAction<Participant[]>>;
  onCalculate: () => void;
  onReset: () => void;
  results: CandidateResult[];
  selectedResultIndex: number;
  setSelectedResultIndex: (idx: number) => void;
  isCalculating: boolean;
  errorMessage: string | null;
  mobileViewMode?: 'all' | 'input' | 'result';
  onNavigateToMap?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  participants,
  setParticipants,
  onCalculate,
  onReset,
  results,
  selectedResultIndex,
  setSelectedResultIndex,
  isCalculating,
  errorMessage,
  mobileViewMode = 'all',
  onNavigateToMap,
}) => {
  // 인원 추가 (최대 10명)
  const handleAddParticipant = () => {
    if (participants.length >= 10) return;
    setParticipants((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.random()}`,
        name: `인원 ${prev.length + 1}`,
        stationName: '',
      },
    ]);
  };

  // 인원 삭제 (최소 2명 유지)
  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // 역 이름 변경
  const handleStationChange = (id: string, stationName: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stationName } : p))
    );
  };

  // 이름 변경
  const handleNameChange = (id: string, name: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  // 예시 프리셋 불러오기
  const handleLoadPreset = (type: 'gangnam_hongik_jongno' | '4people') => {
    if (type === 'gangnam_hongik_jongno') {
      setParticipants([
        { id: '1', name: '현식', stationName: '강남' },
        { id: '2', name: '민우', stationName: '홍대입구' },
        { id: '3', name: '지은', stationName: '노원' },
      ]);
    } else if (type === '4people') {
      setParticipants([
        { id: '1', name: '철수', stationName: '수원' },
        { id: '2', name: '영희', stationName: '일산(대화)' },
        { id: '3', name: '민수', stationName: '잠실' },
        { id: '4', name: '지혜', stationName: '신도림' },
      ]);
    }
  };

  // 제출 핸들러 (축하 효과 포함)
  const handleFind = () => {
    onCalculate();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  // 입력 UI 영역
  const inputSection = (
    <div className={`p-4 lg:p-5 space-y-4 ${mobileViewMode === 'result' ? 'hidden lg:block' : ''} ${mobileViewMode === 'all' ? 'border-b border-slate-100 overflow-y-auto max-h-[48vh] lg:max-h-[50vh]' : 'flex-1 overflow-y-auto'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">
            모임 인원 설정 ({participants.length}명 / 최대 10명)
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RotateCcw size={12} />
          <span>초기화</span>
        </button>
      </div>

      {/* 빠른 예시 버튼 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium mr-1">추천 예시:</span>
        <button
          type="button"
          onClick={() => handleLoadPreset('gangnam_hongik_jongno')}
          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
        >
          강남·홍대·노원 (3명)
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('4people')}
          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
        >
          수원·일산·잠실·신도림 (4명)
        </button>
      </div>

      {/* 출발역 목록 입력 리스트 */}
      <div className="space-y-2.5">
        {participants.map((p, idx) => (
          <div
            key={p.id}
            className="flex items-center gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all"
          >
            {/* 인원 번호 & 이름 */}
            <div className="w-20 shrink-0">
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleNameChange(p.id, e.target.value)}
                placeholder={`인원 ${idx + 1}`}
                className="w-full text-xs font-semibold bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
            </div>

            {/* 지하철역 자동완성 인풋 */}
            <div className="flex-1 min-w-0">
              <StationAutocomplete
                value={p.stationName}
                onChange={(stationName) => handleStationChange(p.id, stationName)}
                placeholder="출발역 검색 (예: 강남, 사당, 화정)"
              />
            </div>

            {/* 삭제 버튼 */}
            {participants.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveParticipant(p.id)}
                title="삭제"
                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 인원 추가 버튼 */}
      {participants.length < 10 && (
        <button
          type="button"
          onClick={handleAddParticipant}
          className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-white hover:bg-blue-50/30"
        >
          <Plus size={15} />
          <span>인원 추가하기 ({participants.length}/10)</span>
        </button>
      )}

      {/* 오류 메시지 */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 최적의 중간역 찾기 액션 버튼 */}
      <button
        type="button"
        onClick={handleFind}
        disabled={isCalculating}
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
      >
        <Sparkles size={17} />
        <span>{isCalculating ? '계산 중...' : '최적의 중간역 찾기'}</span>
      </button>
    </div>
  );

  // 결과 UI 영역
  const resultSection = (
    <div className={`p-4 lg:p-5 space-y-4 bg-slate-50/50 ${mobileViewMode === 'input' ? 'hidden lg:block' : ''} flex-1 overflow-y-auto`}>
      {results.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              추천 중간 모임역 Top {results.length}
            </h3>
            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className="lg:hidden flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <Map size={13} />
                <span>지도에서 보기</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {results.map((res, idx) => (
              <ResultCard
                key={res.station.id}
                result={res}
                isSelected={selectedResultIndex === idx}
                onSelect={() => setSelectedResultIndex(idx)}
                userNames={participants.map((p, pIdx) => p.name || `인원 ${pIdx + 1}`)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">아직 계산된 결과가 없습니다</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              '1. 입력' 탭에서 출발역을 입력 후 '최적의 중간역 찾기'를 눌러주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <aside className="w-full lg:w-[440px] xl:w-[480px] bg-white border-r border-slate-200 h-full flex flex-col shrink-0 shadow-sm overflow-hidden z-20">
      {mobileViewMode === 'all' ? (
        <>
          {inputSection}
          {resultSection}
        </>
      ) : mobileViewMode === 'input' ? (
        inputSection
      ) : (
        resultSection
      )}
    </aside>
  );
};
