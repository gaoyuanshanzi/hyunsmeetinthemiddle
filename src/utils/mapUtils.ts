import type { Station } from '../data/subwayData';

/**
 * 카카오맵 길찾기 URL 생성
 */
export function getKakaoMapUrl(station: Station): string {
  const encodedName = encodeURIComponent(`${station.name}역`);
  return `https://map.kakao.com/link/to/${encodedName},${station.lat},${station.lng}`;
}

/**
 * 네이버지도 길찾기 URL 생성
 */
export function getNaverMapUrl(station: Station): string {
  const encodedName = encodeURIComponent(`${station.name}역`);
  return `https://map.naver.com/v5/directions/-/-/${station.lng},${station.lat},${encodedName}/-/walk`;
}

/**
 * 길찾기 새 창으로 열기
 */
export function openDirections(service: 'kakao' | 'naver', station: Station): void {
  const url = service === 'kakao' ? getKakaoMapUrl(station) : getNaverMapUrl(station);
  window.open(url, '_blank', 'noopener,noreferrer');
}
