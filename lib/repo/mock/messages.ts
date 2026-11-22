import type { Booking, SentMessageInput, Service, Settings } from "@/lib/domain/schemas";
import { formatPhone } from "@/lib/domain/phone";
import { formatStartHuman, type StartStr } from "@/lib/domain/time";

const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

interface Ctx {
  booking: Booking;
  service: Service | undefined;
  settings: Settings;
}

const svc = (c: Ctx) => c.service?.name ?? "your appointment";
const callUs = (c: Ctx) => `Questions? Call ${c.settings.contact.phone}.`;

/** Builds the text, and the email too when the client left an address. */
function both(c: Ctx, kind: SentMessageInput["kind"], subject: string, body: string): SentMessageInput[] {
  const out: SentMessageInput[] = [
    { channel: "sms", kind, to: c.booking.phone, toLabel: `${c.booking.name} (${formatPhone(c.booking.phone)})`, body, bookingId: c.booking.id },
  ];
  if (c.booking.email) {
    out.push({ channel: "email", kind, to: c.booking.email, toLabel: `${c.booking.name} (${c.booking.email})`, subject, body, bookingId: c.booking.id });
  }
  return out;
}

export const messages = {
  requestReceived: (c: Ctx) =>
    both(
      c,
      "request-received",
      "We got your booking request",
      `Hi ${first(c.booking.name)}, we got your request for ${svc(c)} on ${formatStartHuman(c.booking.start)}. We will text ${formatPhone(c.booking.phone)} to confirm. ${callUs(c)}`,
    ),
  confirmation: (c: Ctx) =>
    both(
      c,
      "confirmation",
      "You are booked in",
      `Hi ${first(c.booking.name)}, you are booked in for ${svc(c)} on ${formatStartHuman(c.booking.start)}. See you at Roots n Style. ${callUs(c)}`,
    ),
  suggestion: (c: Ctx, to: StartStr) =>
    both(
      c,
      "suggestion",
      "Another time for your booking?",
      `Hi ${first(c.booking.name)}, ${formatStartHuman(c.booking.start)} is not free for ${svc(c)}. Would ${formatStartHuman(to)} work instead? Reply YES to confirm or call ${c.settings.contact.phone}.`,
    ),
  decline: (c: Ctx) =>
    both(
      c,
      "decline",
      "About your booking request",
      `Hi ${first(c.booking.name)}, we cannot fit ${svc(c)} on ${formatStartHuman(c.booking.start)}. Please pick another time on our website or call ${c.settings.contact.phone}.`,
    ),
  cancellation: (c: Ctx) =>
    both(
      c,
      "cancellation",
      "Your booking was cancelled",
      `Hi ${first(c.booking.name)}, your ${svc(c)} booking on ${formatStartHuman(c.booking.start)} has been cancelled. Call ${c.settings.contact.phone} to rebook.`,
    ),
  moved: (c: Ctx) =>
    both(
      c,
      "move",
      "Your booking time changed",
      `Hi ${first(c.booking.name)}, your ${svc(c)} booking is now ${formatStartHuman(c.booking.start)}. ${callUs(c)}`,
    ),
  ownerAlert: (c: Ctx): SentMessageInput => ({
    channel: "sms",
    kind: "owner-alert",
    to: c.settings.contact.phone,
    toLabel: `Owner (${c.settings.contact.phone})`,
    body: `New booking request: ${c.booking.name}, ${svc(c)}, ${formatStartHuman(c.booking.start)}. Open the admin to confirm.`,
    bookingId: c.booking.id,
  }),
};
