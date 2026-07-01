export function similarity(a: string, b: string): number {
  const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
  const rawA = norm(a);
  const rawB = norm(b);

  if (rawA === rawB) return 100;
  if (!rawA || !rawB) return 0;

  const lev = (s1: string, s2: string): number => {
    const maxLen = Math.max(s1.length, s2.length);
    const dist = Array.from({ length: s2.length + 1 }, (_, i) => i);
    for (let i = 1; i <= s1.length; i++) {
      let prev = dist[0]!;
      dist[0] = i;
      for (let j = 1; j <= s2.length; j++) {
        const temp = dist[j]!;
        dist[j] = s1[i - 1] === s2[j - 1]
          ? prev
          : 1 + Math.min(prev, dist[j]!, dist[j - 1]!);
        prev = temp;
      }
    }
    return Math.round((1 - dist[s2.length]! / maxLen) * 100);
  };

  const loA = rawA.toLowerCase();
  const loB = rawB.toLowerCase();

  const baseScore = lev(loA, loB);
  const fullScore = lev(rawA, rawB);

  return Math.max(50, Math.round(0.7 * baseScore + 0.3 * fullScore));
}
