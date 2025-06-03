/**
 * Converts a cryptocurrency amount from its smallest unit (e.g., wei, satoshi) to a normalized value
 * with 9 decimal places of precision.
 *
 * This function handles the denomination of cryptocurrency amounts by converting from the
 * blockchain's native smallest units (like wei for Ethereum which is 10^-18 ETH, or satoshi for Bitcoin
 * which is 10^-8 BTC) to a standardized format with 9 decimal places for consistent handling across
 * different cryptocurrencies.
 *
 * @param {string} amountAsString - The amount in the cryptocurrency's smallest unit (e.g., wei, satoshi)
 *                                  represented as a string to handle large numbers
 * @param {number} decimals - The number of decimal places used by the cryptocurrency
 *                           (e.g., 18 for Ethereum, 8 for Bitcoin)
 * @returns {number} The converted amount with 9 decimal places of precision
 *
 * @example
 * // Convert 1 ETH in wei (1000000000000000000) to normalized format
 * denoteAmount("1000000000000000000", 18)
 *
 * @example
 * // Convert 1 BTC in satoshi (100000000) to normalized format
 * denoteAmount("100000000", 8)
 */
export default function denoteAmount(amountAsString: string, decimals: number) {
  if (decimals <= 9) return BigInt(amountAsString); // No conversion needed if decimals are 9 or less
  const exponent = BigInt(decimals) - 9n;
  const amount = BigInt(amountAsString);
  return amount / 10n ** exponent; // Denote to 9 decimals
}
