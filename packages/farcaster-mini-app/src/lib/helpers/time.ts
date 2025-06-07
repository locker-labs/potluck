export function timeFromNow(secondsSinceEpoch: number): string {
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  let diff = secondsSinceEpoch - now;

  const isPast = diff < 0;
  diff = Math.abs(diff);

  const days = Math.floor(diff / (60 * 60 * 24));
  diff %= 60 * 60 * 24;

  const hours = Math.floor(diff / (60 * 60));
  diff %= 60 * 60;

  const minutes = Math.floor(diff / 60);

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}hr`);
  if (minutes || parts.length === 0) parts.push(`${minutes}min`);

  return (isPast ? "- " : "") + parts.join(" ");
}
