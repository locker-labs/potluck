export function truncateNumberString(str: string): string {
  const num: number = Number(str);
  if (Number.isNaN(num)) {
    return str; // Return original string if it's not a valid number
  }
  return `${Math.trunc(100 * num) / 100}`;
}
