import { useState, useRef, useEffect } from 'react';
import type { FC, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { STATIONS, LINE_COLORS } from '../data/subwayData';
import type { Station } from '../data/subwayData';
import { matchStation } from '../utils/hangul';
import { MapPin, Search, X } from 'lucide-react';

interface StationAutocompleteProps {
  value: string;
  onChange: (stationName: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const StationAutocomplete: FC<StationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '역명을 입력하세요 (예: 강남, 홍대, ㄱㄴ)',
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal(value);
  }, [value]);

  useEffect(() => {
    if (inputVal.trim() === '') {
      setFilteredStations(STATIONS.slice(0, 8));
    } else {
      const results = STATIONS.filter((s) => matchStation(s.name, inputVal));
      setFilteredStations(results.slice(0, 10));
    }
    setHighlightedIndex(0);
  }, [inputVal]);

  // Click outside to close (DOM native MouseEvent)
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (station: Station) => {
    setInputVal(station.name);
    onChange(station.name);
    setIsOpen(false);
  };

  const handleClear = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setInputVal('');
    onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredStations.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStations[highlightedIndex]) {
        handleSelect(filteredStations[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          autoFocus={autoFocus}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputVal(e.target.value);
            setIsOpen(true);
            const exact = STATIONS.find((s) => s.name === e.target.value);
            if (exact) {
              onChange(exact.name);
            } else if (e.target.value === '') {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
        />
        {inputVal && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && filteredStations.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-dropdown max-h-64 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100">
            {inputVal ? `'${inputVal}' 검색 결과` : '주요 역 목록'}
          </div>
          {filteredStations.map((station, idx) => (
            <div
              key={station.id}
              onClick={() => handleSelect(station)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors ${
                highlightedIndex === idx ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={15} className={highlightedIndex === idx ? 'text-blue-500' : 'text-slate-400'} />
                <span className="font-semibold text-sm">{station.name}역</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {station.lines.map((line) => {
                  const style = LINE_COLORS[line] || { bg: 'bg-slate-500', text: 'text-white' };
                  return (
                    <span
                      key={line}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}
                    >
                      {line.replace('호선', '')}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
