export type Person = { id: string; name: string };
export type Expense = { id: string; title: string; amount: number; payer: string; participants: string[]; category: string; date: string };
export type Payment = { id: string; from: string; to: string; amount: number };
export type Trip = { id: string; name: string; people: Person[]; expenses: Expense[]; payments: Payment[] };
export function balances(trip: Trip) {
  const result: Record<string, number> = Object.fromEntries(trip.people.map(p => [p.id, 0]));
  for (const e of trip.expenses) {
    result[e.payer] += e.amount;
    const share = Math.floor(e.amount / e.participants.length);
    const remainder = e.amount % e.participants.length;
    e.participants.forEach((id, index) => { result[id] -= share + (index < remainder ? 1 : 0); });
  }
  for (const p of trip.payments) { result[p.from] += p.amount; result[p.to] -= p.amount; }
  return result;
}
export function settlements(trip: Trip) {
  const b = balances(trip);
  const debtors = trip.people.filter(p => b[p.id] < 0).map(p => ({id:p.id, amount:-b[p.id]}));
  const creditors = trip.people.filter(p => b[p.id] > 0).map(p => ({id:p.id, amount:b[p.id]}));
  const result: Omit<Payment, 'id'>[] = [];
  let i=0, j=0;
  while (i<debtors.length && j<creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    result.push({from:debtors[i].id, to:creditors[j].id, amount});
    debtors[i].amount -= amount; creditors[j].amount -= amount;
    if (!debtors[i].amount) i++; if (!creditors[j].amount) j++;
  }
  return result;
}
export function parseAmount(value: string) {
  const normalized = value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,،٬\s]/g, '');
  return /^\d+$/.test(normalized) ? Number(normalized) : NaN;
}
