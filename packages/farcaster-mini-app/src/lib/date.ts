/**
 * Format a timestamp to a readable date
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
export function formatDateFromTimestamp(timestamp: number): string {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatInterval(seconds: bigint): string {
  const num = Number(seconds);
  if (num % 604800 === 0)
    return `${num / 604800 > 1 ? `${num / 604800} ` : ''}week${num / 604800 > 1 ? 's' : ''}`;
  if (num % 86400 === 0)
    return `${num / 86400 > 1 ? `${num / 86400} ` : ''}day${num / 86400 > 1 ? 's' : ''}`;
  if (num % 3600 === 0)
    return `${num / 3600 > 1 ? `${num / 3600} ` : ''}hour${num / 3600 > 1 ? 's' : ''}`;
  return `${num} seconds`;
}
