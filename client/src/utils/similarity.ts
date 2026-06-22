export function similarity(a: string, b: string): number {
  const sa = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sb = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (sa === sb) return 100;
  if (!sa || !sb) return 0;
  const maxLen = Math.max(sa.length, sb.length);
  const dist = Array.from({ length: sb.length + 1 }, (_, i) => i);
  for (let i = 1; i <= sa.length; i++) {
    let prev = dist[0]!;
    dist[0] = i;
    for (let j = 1; j <= sb.length; j++) {
      const temp = dist[j]!;
      dist[j] = sa[i - 1] === sb[j - 1]
        ? prev
        : 1 + Math.min(prev, dist[j]!, dist[j - 1]!);
      prev = temp;
    }
  }
  return Math.round((1 - dist[sb.length]! / maxLen) * 100);
}