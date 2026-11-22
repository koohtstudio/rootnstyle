// Facts and copy from CONTENT.md. Anything not in CONTENT.md must not live here.

export const BUSINESS = {
  name: "Roots n Style Salon & Spa",
  short: "Roots n Style",
  tagline: "We'll style, you'll smile.",
  city: "Brampton, Ontario",
} as const;

export const COPY = {
  heroSub:
    "Cuts, colour, facials and brows under one roof on Goreway Dr. Pick a time online in under a minute, or just drop in.",
  servicesIntro: "Beautiful results, personal care.",
  aboutQuote: "Beautiful hair that looks good and stays healthy.",
  aboutBody:
    "Roots n Style is a neighbourhood salon and spa in Brampton. Top-quality brands and treatments, a team that listens, an easy, friendly chair.",
  bookingIntro: "Pick a service and a time and we will confirm it by text or email.",
  specials: "Weddings, parties and groups? Tell us what you have in mind and we will plan it with you.",
} as const;

export const GOOGLE = {
  rating: 4.6,
  count: 359,
  url: "https://www.google.com/maps/search/?api=1&query=Roots%20n%20Style%20Salon%20%26%20Spa%20Brampton",
} as const;

export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=10940%20Goreway%20Dr%20Brampton%20ON%20L6P%204N4";

export const INSTAGRAM_URL = "https://www.instagram.com/rootsnstyle/";

export const CATEGORY_BLURBS: Record<string, string> = {
  hair: "Cuts, colour and smoothing treatments.",
  skin: "Facials and skin treatments.",
  brows: "Threading and waxing.",
  makeup: "For events, parties and brides.",
};

export const NAV = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Our work" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book online" },
  { href: "/visit", label: "Visit" },
] as const;
