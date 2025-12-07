/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @param amount 금액 (센트 단위)
 * @returns 포맷팅된 문자열 (예: "10,000원")
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/**
 * ISO 날짜 문자열을 한국 로케일 형식으로 포맷팅
 * @param iso ISO 형식 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * 날짜를 간단한 형식으로 포맷팅 (월/일 시:분)
 * @param dateStr 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 수량 문자열을 정수로 변환하여 표시
 * @param val 숫자 또는 문자열
 * @returns 정수 형태의 문자열
 */
export function asInt(val: string | number): string {
  const str = String(val);
  // 정수 또는 .0, .00 으로만 끝나는 경우 소수부 제거
  if (/^-?\d+(?:\.0+)?$/.test(str)) return str.replace(/\.0+$/, '');
  const num = Number(val);
  return Number.isFinite(num) ? Math.round(num).toString() : str;
}
