export function formatUGX(amount: number | { toNumber: () => number }): string {
  const num = typeof amount === "number" ? amount : amount.toNumber();
  return `UGX ${num.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export function formatUGXShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
