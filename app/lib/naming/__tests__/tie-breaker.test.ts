import { describe, it, expect } from 'vitest';
import { tieBreakSort, generateStableId, type TieBreakable } from '../utils/tie-breaker';

type Candidate = TieBreakable & {
  name: string;
};

function mk(
  name: string,
  score: number,
  nf: number,
  uf: number,
  strokes: number | null,
  id: string
): Candidate {
  return {
    name,
    totalScore: score,
    nameFrequency: nf,
    usageFrequency: uf,
    strokeCount: strokes,
    stableId: id,
  };
}

describe('tieBreakSort', () => {
  it('sorts by totalScore desc first', () => {
    const arr = [
      mk('서연', 89.0, 100, 10, 16, 'a1'),
      mk('지우', 90.0, 90, 12, 10, 'a2'),
      mk('민준', 88.5, 120, 11, 14, 'a3'),
    ];
    const out = tieBreakSort(arr);
    expect(out.map((x) => x.name)).toEqual(['지우', '서연', '민준']);
  });

  it('uses nameFrequency when scores equal', () => {
    const arr = [
      mk('서연', 89.0, 120, 10, 16, 'a1'),
      mk('지우', 89.0, 90, 12, 10, 'a2'),
      mk('민준', 89.0, 150, 11, 14, 'a3'),
    ];
    const out = tieBreakSort(arr);
    // nameFrequency: 민준(150) > 서연(120) > 지우(90)
    expect(out.map((x) => x.name)).toEqual(['민준', '서연', '지우']);
  });

  it('falls back to usageFrequency when nameFrequency equal', () => {
    const arr = [
      mk('서연', 89.0, 100, 12, 16, 'a1'),
      mk('지우', 89.0, 100, 15, 10, 'a2'),
      mk('민준', 89.0, 100, 10, 14, 'a3'),
    ];
    const out = tieBreakSort(arr);
    // usageFrequency: 지우(15) > 서연(12) > 민준(10)
    expect(out.map((x) => x.name)).toEqual(['지우', '서연', '민준']);
  });

  it('uses strokeShorterFirst when freq equal', () => {
    const arr = [
      mk('서연', 89.0, 100, 10, 16, 'a1'),
      mk('지우', 89.0, 100, 10, 10, 'a2'),
      mk('민준', 89.0, 100, 10, 14, 'a3'),
    ];
    const out = tieBreakSort(arr);
    // shorter stroke first: 지우(10) < 민준(14) < 서연(16)
    expect(out.map((x) => x.name)).toEqual(['지우', '민준', '서연']);
  });

  it('uses stableId as deterministic final key', () => {
    const arr = [
      mk('AAA', 89.0, 100, 10, null, 'id_002'),
      mk('BBB', 89.0, 100, 10, null, 'id_001'),
      mk('CCC', 89.0, 100, 10, null, 'id_003'),
    ];
    const out = tieBreakSort(arr);
    // stableId ascending: id_001, id_002, id_003
    expect(out.map((x) => x.name)).toEqual(['BBB', 'AAA', 'CCC']);
  });

  it('handles null values properly', () => {
    const arr = [
      mk('A', 89.0, null, null, null, 'id_1'),
      mk('B', 89.0, 50, null, null, 'id_2'),
      mk('C', 89.0, null, 20, null, 'id_3'),
    ];
    const out = tieBreakSort(arr);
    // B has nameFreq → first
    // C has usageFreq → second
    // A has neither → last
    expect(out.map((x) => x.name)).toEqual(['B', 'C', 'A']);
  });

  it('complex multi-tier sorting', () => {
    const arr = [
      mk('E', 90.0, 100, 10, 12, 'id_5'),
      mk('D', 90.0, 100, 10, 10, 'id_4'),
      mk('C', 90.0, 100, 15, 15, 'id_3'),
      mk('B', 90.0, 120, 8, 14, 'id_2'),
      mk('A', 90.0, 120, 10, 16, 'id_1'),
    ];
    const out = tieBreakSort(arr);
    // All 90.0
    // nameFreq: A,B (120) > C,D,E (100)
    //   → Within A,B: usageFreq A(10) > B(8) → A first, B second
    //   → Within C,D,E: usageFreq C(15) > D,E(10)
    //     → Within D,E: stroke D(10) < E(12) → D before E
    expect(out.map((x) => x.name)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('generateStableId', () => {
  it('generates consistent IDs', () => {
    const id1 = generateStableId(123, 456);
    const id2 = generateStableId(123, 456);
    expect(id1).toBe(id2);
    expect(id1).toBe('123_456');
  });

  it('generates different IDs for different inputs', () => {
    const id1 = generateStableId(123, 456);
    const id2 = generateStableId(456, 123);
    expect(id1).not.toBe(id2);
  });
});
