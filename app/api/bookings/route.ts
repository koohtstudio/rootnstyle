import { NextResponse } from "next/server";
import { APP_MODE } from "@/lib/config";
import { bookingRequestSchema, MIN_SUBMIT_MS } from "@/lib/domain/schemas";
import { isRepoError } from "@/lib/repo/errors";
import { createNeonRepo } from "@/lib/repo/neon";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/**
 * Thin handler: guard, validate, hand to the repo. Nothing personal is logged.
 * Mock mode: the browser keeps the booking, so this route only checks and approves it.
 * Live mode: this route is where the booking is written, using the app database role.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(`bookings:${ip}`);
  if (!limit.ok) {
    return json({ code: "RATE_LIMITED", message: "Too many requests. Please wait a minute and try again." }, 429, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 8_192) return json({ code: "VALIDATION", message: "That request is too large." }, 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ code: "VALIDATION", message: "That request could not be read." }, 400);
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issues: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const key = i.path.length ? String(i.path[0]) : "form";
      issues[key] ??= i.message;
    }
    return json({ code: "VALIDATION", message: Object.values(issues)[0] ?? "Please check the form.", issues }, 422);
  }

  if (parsed.data.website && parsed.data.website.trim() !== "") return json({ ok: true, ignored: true });
  if (parsed.data.elapsedMs < MIN_SUBMIT_MS) {
    return json({ code: "TOO_FAST", message: "That was quick. Please check your details and send again." }, 400);
  }

  if (APP_MODE === "live") {
    try {
      const booking = await createNeonRepo().bookings.create(parsed.data);
      return json({ ok: true, id: booking.id }, 201);
    } catch (e) {
      if (isRepoError(e)) {
        const status = e.code === "SLOT_TAKEN" ? 409 : e.code === "NOT_IMPLEMENTED" ? 501 : 400;
        return json({ code: e.code, message: e.message, issues: e.issues }, status);
      }
      return json({ code: "NETWORK", message: "Something went wrong. Please try again." }, 500);
    }
  }

  return json({ ok: true, mode: "mock" });
}
