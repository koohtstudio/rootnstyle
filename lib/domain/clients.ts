import type { Booking, Client } from "./schemas";

/**
 * Clients are not stored. They are built from bookings, matched on phone number.
 * Declined and cancelled bookings do not count as visits.
 */
export function deriveClients(bookings: Booking[], todayKey: string): Client[] {
  const byPhone = new Map<string, Booking[]>();
  for (const b of bookings) {
    const list = byPhone.get(b.phone) ?? [];
    list.push(b);
    byPhone.set(b.phone, list);
  }
  const clients: Client[] = [];
  for (const [phone, list] of byPhone) {
    const sorted = [...list].sort((a, b) => (a.start < b.start ? 1 : -1));
    const latest = sorted[0];
    if (!latest) continue;
    const counted = sorted.filter((b) => b.status === "done" || (b.status === "confirmed" && b.start.slice(0, 10) < todayKey));
    const withEmail = sorted.find((b) => b.email);
    clients.push({
      id: `cl_${phone}`,
      name: latest.name,
      phone,
      email: withEmail?.email,
      visits: counted.length,
      lastVisit: counted[0]?.start,
      notes: sorted.map((b) => b.note).filter((n): n is string => !!n).slice(0, 3),
    });
  }
  return clients.sort((a, b) => a.name.localeCompare(b.name));
}
