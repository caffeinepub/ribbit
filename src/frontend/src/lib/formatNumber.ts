/**
 * Format large numbers with shortened notation
 * Examples: 1234 -> 1.2k, 1500000 -> 1.5M
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    const thousands = num / 1000;
    // Round to 1 decimal place, remove trailing .0
    const formatted = (Math.floor(thousands * 10) / 10).toString();
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  
  if (num < 1000000000) {
    const millions = num / 1000000;
    const formatted = (Math.floor(millions * 10) / 10).toString();
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
  }
  
  const billions = num / 1000000000;
  const formatted = (Math.floor(billions * 10) / 10).toString();
  return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B';
}
