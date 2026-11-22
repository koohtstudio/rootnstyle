import { z } from "zod";
import { isValidPhone, normalizePhone } from "./phone";
import { DATE_RE, START_RE, TIME_RE } from "./time";

export const MIN_SUBMIT_MS = Number(process.env.NEXT_PUBLIC_MIN_SUBMIT_MS ?? 2000);

export const categoryIds = ["hair", "skin", "brows", "makeup"] as const;
export const isCategoryId = (v: string | undefined): v is (typeof categoryIds)[number] =>
  !!v && (categoryIds as readonly string[]).includes(v);
export const galleryTags = ["colour", "styling", "cuts"] as const;
export const bookingStatuses = ["new", "confirmed", "declined", "done", "cancelled"] as const;

const startStr = z.string().regex(START_RE, "Use a valid date and time");
const timeStr = z.string().regex(TIME_RE, "Use a time like 10:00");

export const serviceCategorySchema = z.strictObject({
  id: z.enum(categoryIds),
  label: z.string().min(1).max(40),
  sort: z.number().int(),
});

export const serviceSchema = z.strictObject({
  id: z.string().min(1).max(64),
  category: z.enum(categoryIds),
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(240),
  /** null means the owner has not set a price yet. */
  price: z.number().min(0).max(5000).nullable(),
  /** null means the owner has not set a time yet. */
  durationMin: z.number().int().min(15).max(600).nullable(),
  visible: z.boolean(),
  sort: z.number().int(),
});

export const serviceInputSchema = z.strictObject({
  category: z.enum(categoryIds),
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(240).default(""),
  price: z.number().min(0).max(5000).nullable().default(null),
  durationMin: z.number().int().min(15).max(600).nullable().default(null),
  visible: z.boolean().default(true),
});

export const servicePatchSchema = z.strictObject({
  category: z.enum(categoryIds).optional(),
  name: z.string().trim().min(2, "Name is too short").max(80).optional(),
  description: z.string().trim().max(240).optional(),
  price: z.number().min(0).max(5000).nullable().optional(),
  durationMin: z.number().int().min(15).max(600).nullable().optional(),
  visible: z.boolean().optional(),
});

export const bookingSchema = z.strictObject({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  start: startStr,
  name: z.string().trim().min(2).max(80),
  /** Stored as 10 digits. */
  phone: z.string().regex(/^\d{10}$/),
  email: z.string().email().max(120).optional(),
  note: z.string().max(500).optional(),
  marketingOptIn: z.boolean(),
  status: z.enum(bookingStatuses),
  createdAt: z.string().min(1),
  /** Set when the owner suggests another time and is waiting for a reply. */
  suggestedStart: startStr.optional(),
});

const emptyToUndefined = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

/** What a visitor sends. Unknown fields are rejected. */
export const bookingInputSchema = z.strictObject({
  serviceId: z.string().min(1, "Choose a service").max(64),
  start: startStr,
  name: z.string().trim().min(2, "Please enter your name").max(80, "That name is too long"),
  phone: z
    .string()
    .refine(isValidPhone, "Enter a 10 digit phone number, like 905 555 0123")
    .transform(normalizePhone),
  email: z
    .union([z.literal(""), z.string().trim().email("That email does not look right").max(120)])
    .optional()
    .transform((v) => emptyToUndefined(v)),
  note: z
    .string()
    .max(500, "Keep the note under 500 characters")
    .optional()
    .transform((v) => emptyToUndefined(v)),
  /** CASL: marketing is opt in only. Unchecked by default. */
  marketingOptIn: z.boolean().default(false),
});

/** Bot guards that travel with a public booking request. */
export const botGuardSchema = z.strictObject({
  /** Honeypot. Real people never see this field. */
  website: z.string().max(200).optional(),
  /** Milliseconds between the form appearing and submit. */
  elapsedMs: z.number().min(0),
});

export const bookingRequestSchema = bookingInputSchema.extend(botGuardSchema.shape);

export const galleryPhotoSchema = z.strictObject({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(80),
  tag: z.enum(galleryTags),
  src: z
    .string()
    .regex(/^(\/images\/[\w.-]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|blob:.+)$/, "Unsupported image source"),
  alt: z.string().trim().min(3, "Describe the photo for screen readers").max(200),
  visible: z.boolean(),
  sort: z.number().int(),
  blur: z.string().optional(),
});

export const galleryInputSchema = z.strictObject({
  title: z.string().trim().min(1, "Add a title").max(80),
  tag: z.enum(galleryTags),
  src: galleryPhotoSchema.shape.src,
  alt: z.string().trim().min(3, "Describe the photo for screen readers").max(200),
  visible: z.boolean().default(true),
});

export const galleryPatchSchema = z.strictObject({
  title: z.string().trim().min(1).max(80).optional(),
  tag: z.enum(galleryTags).optional(),
  alt: z.string().trim().min(3).max(200).optional(),
  visible: z.boolean().optional(),
});

export const hoursSchema = z
  .strictObject({
    day: z.number().int().min(0).max(6),
    open: timeStr,
    close: timeStr,
    closed: z.boolean(),
  })
  .refine((h) => h.closed || h.open < h.close, { message: "Closing time must be after opening time", path: ["close"] });

export const contactSchema = z.strictObject({
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(120),
  address: z.string().trim().min(5).max(200),
  instagram: z.string().trim().max(60),
});

export const settingsSchema = z.strictObject({
  acceptOnline: z.boolean(),
  notifyOwner: z.boolean(),
  autoConfirm: z.boolean(),
  contact: contactSchema,
});

export const settingsPatchSchema = z.strictObject({
  acceptOnline: z.boolean().optional(),
  notifyOwner: z.boolean().optional(),
  autoConfirm: z.boolean().optional(),
  contact: contactSchema.optional(),
});

export const sentMessageSchema = z.strictObject({
  id: z.string().min(1),
  channel: z.enum(["sms", "email"]),
  kind: z.enum(["request-received", "owner-alert", "confirmation", "suggestion", "decline", "cancellation", "move", "other"]),
  to: z.string().min(1),
  toLabel: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  bookingId: z.string().optional(),
  createdAt: z.string().min(1),
});

export const sentMessageInputSchema = sentMessageSchema.omit({ id: true, createdAt: true });

export const mockStateSchema = z.object({
  version: z.literal(1),
  rev: z.number().int().nonnegative(),
  seededOn: z.string().regex(DATE_RE),
  categories: z.array(serviceCategorySchema),
  services: z.array(serviceSchema),
  bookings: z.array(bookingSchema),
  gallery: z.array(galleryPhotoSchema),
  hours: z.array(hoursSchema).length(7),
  settings: settingsSchema,
  sent: z.array(sentMessageSchema),
});

export type CategoryId = (typeof categoryIds)[number];
export type GalleryTag = (typeof galleryTags)[number];
export type BookingStatus = (typeof bookingStatuses)[number];
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
export type Service = z.infer<typeof serviceSchema>;
export type ServiceInput = z.input<typeof serviceInputSchema>;
export type ServicePatch = z.infer<typeof servicePatchSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type BookingInput = z.input<typeof bookingInputSchema>;
export type BookingRequest = z.input<typeof bookingRequestSchema>;
export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>;
export type GalleryInput = z.input<typeof galleryInputSchema>;
export type GalleryPatch = z.infer<typeof galleryPatchSchema>;
export type Hours = z.infer<typeof hoursSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
export type SentMessage = z.infer<typeof sentMessageSchema>;
export type SentMessageInput = z.infer<typeof sentMessageInputSchema>;
export type MockState = z.infer<typeof mockStateSchema>;

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  lastVisit?: string;
  notes: string[];
}

export type Role = "owner" | "frontdesk";
export interface Session {
  role: Role;
  name: string;
  expiresAt: number;
}
