// 한글 초성 분리 및 검색 유틸리티
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 초성 추출
 */
export function getChosung(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code >= 0 && code <= 11171) {
      result += CHOSUNG[Math.floor(code / 588)];
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}

/**
 * 검색어 매칭 검사 (초성 검색 및 일반 텍스트 포함 검사)
 */
export function matchStation(stationName: string, query: string): boolean {
  if (!query.trim()) return true;
  const cleanQuery = query.trim().replace(/\s+/g, '').toLowerCase();
  const cleanName = stationName.trim().replace(/\s+/g, '').toLowerCase();

  if (cleanName.includes(cleanQuery)) return true;

  // 초성 검색 검사
  const nameChosung = getChosung(cleanName);
  const queryChosung = getChosung(cleanQuery);

  return nameChosung.includes(queryChosung) || nameChosung.includes(cleanQuery);
}
