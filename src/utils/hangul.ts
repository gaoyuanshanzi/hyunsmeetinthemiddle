// 한글 초성 분리 및 고도화된 검색 유틸리티
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
 * 문자열이 오직 자음(초성)으로만 구성되어 있는지 확인
 */
export function isOnlyChosung(str: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(str.trim());
}

/**
 * 검색어와 역명 간의 매칭 점수 계산 (높을수록 우선순위)
 * 0점이면 매칭되지 않음
 */
export function getMatchScore(stationName: string, query: string): number {
  if (!query.trim()) return 1;

  // 검색어 및 역명 정규화 (공백 제거, 끝의 '역' 제거)
  const cleanQuery = query.trim().replace(/\s+/g, '').replace(/역$/, '').toLowerCase();
  const cleanName = stationName.trim().replace(/\s+/g, '').replace(/역$/, '').toLowerCase();

  if (!cleanQuery) return 1;

  // 1. 정확히 일치 (최우선)
  if (cleanName === cleanQuery) {
    return 1000;
  }

  // 2. 접두사 일치 (예: '사' -> '사당', '사평')
  if (cleanName.startsWith(cleanQuery)) {
    return 500 - cleanName.length; // 길이가 짧을수록 우선
  }

  // 3. 일반 텍스트 포함 (예: '대' -> '홍대입구', '교대')
  if (cleanName.includes(cleanQuery)) {
    return 200 - cleanName.indexOf(cleanQuery) * 10;
  }

  // 4. 초성 검색: 사용자가 오직 초성만 입력했을 때만 허용 (예: 'ㅅㄷ' -> '사당', '신당')
  if (isOnlyChosung(cleanQuery)) {
    const nameChosung = getChosung(cleanName);
    if (nameChosung === cleanQuery) {
      return 150;
    }
    if (nameChosung.startsWith(cleanQuery)) {
      return 100;
    }
    if (nameChosung.includes(cleanQuery)) {
      return 50;
    }
  }

  return 0;
}

/**
 * 검색어 매칭 검사
 */
export function matchStation(stationName: string, query: string): boolean {
  return getMatchScore(stationName, query) > 0;
}
