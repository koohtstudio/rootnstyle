import type { Booking, GalleryPhoto, Hours, MockState, SentMessage, Service, ServiceCategory, Settings } from "@/lib/domain/schemas";
import { formatStartHuman, addDays, dayOfWeek, makeStart, type DateKey, type SalonNow } from "@/lib/domain/time";
import { imageMeta } from "@/lib/generated/image-meta";

// Everything here is SAMPLE DATA unless CONTENT.md says otherwise.
// Service names come from CONTENT.md. Descriptions, photo titles and tags are sample copy.
// Prices and durations are null on purpose: the salon has not published them.

export const CATEGORIES: ServiceCategory[] = [
  { id: "hair", label: "Hair", sort: 10 },
  { id: "skin", label: "Skin", sort: 20 },
  { id: "brows", label: "Brows and waxing", sort: 30 },
  { id: "makeup", label: "Makeup", sort: 40 },
];

type S = Pick<Service, "id" | "category" | "name" | "description">;
const SERVICE_ROWS: S[] = [
  { id: "haircuts", category: "hair", name: "Haircuts", description: "A cut shaped around your hair and your day." },
  { id: "styling-blowouts", category: "hair", name: "Styling and blowouts", description: "Smooth, curled or sleek, styled for the occasion." },
  { id: "colour-root-touchups", category: "hair", name: "Colour and root touch-ups", description: "Fresh colour and tidy roots, matched to your tone." },
  { id: "highlights-balayage", category: "hair", name: "Highlights and balayage", description: "Soft, sun-kissed dimension painted in by hand." },
  { id: "keratin-hair-botox", category: "hair", name: "Keratin and hair botox", description: "Smoothing treatments for frizzy or tired hair." },
  { id: "facials", category: "skin", name: "Facials", description: "A calming facial that leaves skin fresh and comfortable." },
  { id: "hydrafacial", category: "skin", name: "Hydrafacial", description: "A deep clean and hydrating treatment for a clear finish." },
  { id: "microneedling", category: "skin", name: "Microneedling", description: "A skin treatment focused on texture and tone." },
  { id: "microdermabrasion", category: "skin", name: "Microdermabrasion", description: "Gentle exfoliation for smoother looking skin." },
  { id: "peels-dermaplaning", category: "skin", name: "Chemical peels and dermaplaning", description: "Peels and dermaplaning to brighten and smooth." },
  { id: "eyebrow-threading", category: "brows", name: "Eyebrow threading", description: "Clean, defined brows shaped with thread." },
  { id: "waxing", category: "brows", name: "Waxing", description: "Quick, careful waxing for smooth results." },
  { id: "event-party-bridal-makeup", category: "makeup", name: "Event, party and bridal makeup", description: "Makeup for weddings, parties and special days. Groups welcome." },
];

export function seedServices(): Service[] {
  return SERVICE_ROWS.map((s, i) => ({ ...s, price: null, durationMin: null, visible: true, sort: (i + 1) * 10 }));
}

function photo(file: string, p: Omit<GalleryPhoto, "src" | "blur" | "sort" | "visible">, sort: number): GalleryPhoto {
  return { ...p, src: `/images/${file}`, blur: imageMeta[file]?.blur, visible: true, sort };
}

export function seedGallery(): GalleryPhoto[] {
  return [
    photo("work-waves.jpg", { id: "ph_waves", title: "Soft brown curls", tag: "styling", alt: "Shoulder length brown curls with soft caramel highlights, seen from behind" }, 10),
    photo("work-copper.jpg", { id: "ph_copper", title: "Copper caramel waves", tag: "colour", alt: "Long copper and caramel waves falling past the shoulders, seen from behind" }, 20),
    photo("work-red.jpg", { id: "ph_red", title: "Rich red layers", tag: "cuts", alt: "Long layered hair in a deep, rich red with gentle movement, seen from behind" }, 30),
    photo("work-highlights.jpg", { id: "ph_highlights", title: "Soft brown highlights", tag: "colour", alt: "Straight brown hair with soft, light highlights running through, seen from behind" }, 40),
  ];
}

export function seedHours(): Hours[] {
  const row = (day: number, open: string, close: string, closed = false): Hours => ({ day, open, close, closed });
  return [
    row(0, "10:00", "18:00"),
    row(1, "10:00", "19:00", true),
    row(2, "10:00", "19:00"),
    row(3, "10:00", "19:00"),
    row(4, "10:00", "19:00"),
    row(5, "10:00", "19:00"),
    row(6, "10:00", "19:00"),
  ];
}

export function seedSettings(): Settings {
  return {
    acceptOnline: true,
    notifyOwner: true,
    autoConfirm: false,
    contact: {
      phone: "905 794 3373",
      email: "rootsnstyle@gmail.com",
      address: "10940 Goreway Dr, Brampton, ON L6P 4N4",
      instagram: "@rootsnstyle",
    },
  };
}

/** Static pieces the public site can render on the server before the store loads. */
export const PUBLIC_SEED = {
  categories: CATEGORIES,
  services: seedServices(),
  gallery: seedGallery(),
  hours: seedHours(),
  settings: seedSettings(),
};

// ---------- bookings (relative to today) ----------

interface Tpl {
  off: number;
  time: string;
  service: string;
  name: string;
  phone: string;
  status: Booking["status"];
  note?: string;
  email?: string;
}

const TEMPLATES: Tpl[] = [
  // finished visits, so Clients and the dashboard have history
  { off: -12, time: "11:00", service: "haircuts", name: "Maya R.", phone: "9055550111", status: "done" },
  { off: -10, time: "13:30", service: "highlights-balayage", name: "Priya S.", phone: "9055550112", status: "done", note: "Wants it a little lighter next time" },
  { off: -8, time: "15:00", service: "facials", name: "Nadia A.", phone: "9055550113", status: "done" },
  { off: -5, time: "12:00", service: "eyebrow-threading", name: "Leah W.", phone: "9055550114", status: "done" },
  { off: -3, time: "16:00", service: "styling-blowouts", name: "Priya S.", phone: "9055550112", status: "done" },
  // already booked, so some times show as taken
  { off: 1, time: "10:00", service: "haircuts", name: "Amrit K.", phone: "9055550121", status: "confirmed" },
  { off: 1, time: "14:00", service: "colour-root-touchups", name: "Taylor B.", phone: "9055550122", status: "confirmed", note: "Bringing a photo" },
  { off: 2, time: "11:30", service: "hydrafacial", name: "Simran G.", phone: "9055550123", status: "confirmed" },
  { off: 2, time: "15:30", service: "waxing", name: "Chloe D.", phone: "9055550124", status: "confirmed" },
  { off: 3, time: "10:30", service: "event-party-bridal-makeup", name: "Harpreet K.", phone: "9055550125", status: "confirmed", note: "Wedding trial" },
  { off: 4, time: "13:00", service: "keratin-hair-botox", name: "Maya R.", phone: "9055550111", status: "confirmed" },
  { off: 5, time: "12:00", service: "haircuts", name: "Jordan M.", phone: "9055550126", status: "confirmed" },
  { off: 6, time: "14:30", service: "facials", name: "Leah W.", phone: "9055550114", status: "confirmed" },
  // waiting for the owner
  { off: 2, time: "13:00", service: "highlights-balayage", name: "Zara H.", phone: "9055550131", status: "new", note: "First time here, a bit nervous about going lighter", email: "zara.sample@example.com" },
  { off: 3, time: "16:00", service: "eyebrow-threading", name: "Devon L.", phone: "9055550132", status: "new" },
  { off: 4, time: "11:00", service: "styling-blowouts", name: "Anika P.", phone: "9055550133", status: "new", note: "Blowout for a dinner" },
];

function nearestOpenDay(k: DateKey, hours: Hours[], dir: 1 | -1): DateKey {
  let out = k;
  for (let i = 0; i < 7; i++) {
    const h = hours.find((x) => x.day === dayOfWeek(out));
    if (h && !h.closed) return out;
    out = addDays(out, dir);
  }
  return k;
}

export function buildSeed(now: SalonNow): MockState {
  const hours = seedHours();
  const settings = seedSettings();
  const services = seedServices();
  const nameOf = (id: string) => services.find((s) => s.id === id)?.name ?? "appointment";
  const stamp = (offDays: number) => `${addDays(now.dateKey, offDays)}T16:00:00.000Z`;

  const bookings: Booking[] = TEMPLATES.map((t, i) => {
    const day = nearestOpenDay(addDays(now.dateKey, t.off), hours, t.off < 0 ? -1 : 1);
    const b: Booking = {
      id: `bk_seed_${i + 1}`,
      serviceId: t.service,
      start: makeStart(day, t.time),
      name: t.name,
      phone: t.phone,
      marketingOptIn: false,
      status: t.status,
      createdAt: stamp(t.off - 2),
    };
    if (t.note) b.note = t.note;
    if (t.email) b.email = t.email;
    return b;
  });

  const sent: SentMessage[] = bookings
    .filter((b) => b.status === "confirmed")
    .slice(0, 3)
    .map((b, i) => ({
      id: `msg_seed_${i + 1}`,
      channel: "sms" as const,
      kind: "confirmation" as const,
      to: b.phone,
      toLabel: b.name,
      body: `You are booked in, ${b.name.split(" ")[0]}. ${nameOf(b.serviceId)} on ${formatStartHuman(b.start)}. See you then.`,
      bookingId: b.id,
      createdAt: stamp(-1),
    }));

  return {
    version: 1,
    rev: 0,
    seededOn: now.dateKey,
    categories: CATEGORIES,
    services,
    bookings,
    gallery: seedGallery(),
    hours,
    settings,
    sent,
  };
}
