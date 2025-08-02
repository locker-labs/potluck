export function timeRemaining(secondsSinceEpoch: number): string | null {
  const { isPast, time } = getTimeFromNow(secondsSinceEpoch);

  if (isPast) {
    return null;
  }
  return time;
}

export function timeFromNow(targetSeconds: number): string {
  const { isPast, time } = getTimeFromNow(targetSeconds);
  return (isPast ? '- ' : '') + time;
}

function getTimeFromNow(secondsSinceEpoch: number): { isPast: boolean; time: string } {
  const now = new Date(); // current time
  const target = new Date(secondsSinceEpoch * 1000);

  const diff = target.getTime() - now.getTime();
  const isPast = diff <= 0;

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  const days = Math.floor(diff / dayMs);
  const hours = Math.floor((diff % dayMs) / hourMs);
  const minutes = Math.floor((diff % hourMs) / minuteMs);

  const parts: string[] = [];
  // if (months > 0 && parts.length < 2) parts.push(`${months}mo`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}hr`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);

  return { isPast, time: parts.slice(0, 2).join(' ') };
}