export function formatMoney({
  cents,
  currency = "CAD",
}: {
  cents: number;
  currency?: string;
}) {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
