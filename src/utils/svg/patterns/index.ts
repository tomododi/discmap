// ============ PATTERN ID GENERATOR ============

let patternIdCounter = 0;
export function uniqueId(base: string): string {
  return `${base}_${++patternIdCounter}`;
}

export function resetPatternIds(): void {
  patternIdCounter = 0;
}

// ============ SEEDED RANDOM FOR CONSISTENT PATTERNS ============

export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}
