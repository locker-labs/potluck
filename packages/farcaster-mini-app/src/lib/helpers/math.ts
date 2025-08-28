export function truncateNumberString(str: string): string {
  const num: number = Number(str);
  if (Number.isNaN(num)) {
    return str; // Return original string if it's not a valid number
  }
  return `${Math.trunc(100 * num) / 100}`;
}

export function truncateDecimals(num: string, decimals = 0): string {
  if (Number.isNaN(Number(num))) {
    return "0";
  }

  const parts = num.split('.');

  const hasDecimals = parts.length > 1;

  if (!hasDecimals) {
    return num;
  }

  const decimalPart = parts[1].slice(0, decimals);

  if (Number(decimalPart) === 0) {
    return parts[0];
  }

  return `${parts[0]}.${decimalPart}`;
}