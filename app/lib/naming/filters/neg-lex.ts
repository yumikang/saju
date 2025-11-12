// 정규식 기반 부정 의미 필터 (행동/감정/범죄 등)
// DB 의미 형태: "훔칠", "속일", "죽일" 등 (~ㄹ 형태)
export const NEG_PATTERNS: RegExp[] = [
  // 엿봄/사찰/도청
  /(염|정|간)탐|엿보|몰래\s*보|도청|사찰/,
  // 절도/사기/기만
  /훔칠|도둑질|절도|절취|편취|사기|기만|기망/,
  // 살상/해침
  /살인|살해|학살|참살|주살|죽일|죽임|해칠/,
  // 폭력/괴롭힘/학대
  /폭행|구타|가학|학대|괴롭힐|폄훼|^가할$/,
  // 다툼/분쟁
  /싸울|분쟁|다툴|쟁투|투쟁|시비/,
  // 거짓/허위/속임
  /거짓|허위|위계|위조|속일|기만|기망|사기/,
  // 부정 감정
  /증오|질투|시기|원망|분노|혐오|비난|수치|미워할|싫어할/,
];

export function isNegativeByRegex(rawMeaning: string): boolean {
  if (!rawMeaning) return false;
  const m = rawMeaning.replace(/\s+/g, "");
  return NEG_PATTERNS.some((re) => re.test(m));
}

// '~하다/~함/~ㄹ' 형태(행동/상태 명사)를 만나면 가중
// DB 의미는 "훔칠", "속일", "죽일" 등 (~ㄹ 형태)로 저장됨
export function looksLikeVerbish(rawMeaning: string): boolean {
  return /다\b|함\b|[^을]ㄹ$|칠$|일$|할$/.test(rawMeaning);
}
