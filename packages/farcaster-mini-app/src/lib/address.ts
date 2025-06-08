import type { Address } from 'viem';

/**
 * Format an Ethereum address to a shortened version
 * @param {string} address - The full Ethereum address
 * @param {number} chars - Number of characters to show at beginning and end
 * @returns {string} Shortened address with ellipsis
 */
export function formatAddress(address: Address, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}
