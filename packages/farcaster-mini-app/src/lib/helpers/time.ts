import {monthDays, weekDays} from "@/lib/helpers/contract";

export function timeRemaining(secondsSinceEpoch: number, periodFormat?: 'days' | 'weeks' | 'months'): string | null {
  const { isPast, time } = getTimeFromNow(secondsSinceEpoch, periodFormat);

  if (isPast) {
    return null;
  }
  return time;
}

export function timeFromNow(targetSeconds: number, periodFormat?: 'days' | 'weeks' | 'months'): string {
  const { isPast, time } = getTimeFromNow(targetSeconds, periodFormat);
  return (isPast ? '- ' : '') + time;
}

function getTimeFromNow(secondsSinceEpoch: number, periodFormat?: 'days' | 'weeks' | 'months'): { isPast: boolean; time: string } {
  const now = new Date(); // current time
  const target = new Date(secondsSinceEpoch * 1000);

  const diff = target.getTime() - now.getTime();
  const isPast = diff <= 0;

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const weekMs = weekDays * dayMs;
  const monthMs = monthDays * dayMs;

  const months = Math.floor(diff / monthMs);
  const weeks = Math.floor(diff / weekMs);
  const days = Math.floor(diff / dayMs);
  const hours = Math.floor((diff % dayMs) / hourMs);
  const minutes = Math.floor((diff % hourMs) / minuteMs);

  const parts: string[] = [];

  if (periodFormat) {
    switch (periodFormat) {
      case 'months':
        // add months and days
        if (months > 0) {
          parts.push(`${months}mo`);
        }
        if (days > 0) {
          const daysLeft = Math.floor(days % monthDays);
          if (daysLeft > 0) {
            parts.push(`${daysLeft}d`);
          }
        }
        break;
      case 'weeks':
        // add weeks and days
        if (weeks > 0) {
          parts.push(`${weeks}w`);
        }
        if (days > 0) {
          const daysLeft = Math.floor(days % weekDays);
          if (daysLeft > 0) {
            parts.push(`${daysLeft}d`);
          }
        }
        break;
      case 'days':
        // add days
        if (days > 0) {
          parts.push(`${days}d`);
        }
        break;
    }
  } else {
    if (days > 0) parts.push(`${days}d`);
  }

  if (hours > 0) parts.push(`${hours}hr`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);

  return { isPast, time: parts.slice(0, 2).join(' ') };
}