import type { FC } from 'react';
import { Compass, Users, ShieldCheck } from 'lucide-react';

export const Header: FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg lg:text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
              hyunsmeetinthemiddle
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-200/60">
                수도권
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            N명의 출발역 입력 시 가장 소요시간이 적은 최적의 중간 모임역을 계산합니다
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>API Key 무료 내장 데이터</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
          <Users className="w-3.5 h-3.5" />
          <span>최대 10명</span>
        </div>
      </div>
    </header>
  );
};
