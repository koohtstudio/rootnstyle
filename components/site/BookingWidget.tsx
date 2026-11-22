"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Confirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { COPY } from "@/lib/domain/content";
import { formatPhone, telHref } from "@/lib/domain/phone";
import { bookingInputSchema, type Booking } from "@/lib/domain/schemas";
import { formatDayLong, formatDayShort, formatStartHuman, formatTime12 } from "@/lib/domain/time";
import { useCategories, useOpenDays, usePublicServices, useRepo, useSettings, useSlots } from "@/lib/hooks/data";
import { useSessionFlag } from "@/lib/hooks/session";
import { errorMessage, isRepoError } from "@/lib/repo/errors";
import { DurationLabel, PriceLabel } from "./Labels";
import styles from "./BookingWidget.module.css";

interface Props {
  initialServiceId?: string | null;
  /** section: sits inside the home page. page: the full /book page. */
  variant?: "section" | "page";
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  note: string;
  optIn: boolean;
  website: string;
}

const EMPTY: FormState = { name: "", phone: "", email: "", note: "", optIn: false, website: "" };
const FIELD_ORDER = ["serviceId", "start", "name", "phone", "email", "note"] as const;

export function BookingWidget({ initialServiceId = null, variant = "page" }: Props) {
  const uid = useId();
  const repo = useRepo();
  const { data: services = [] } = usePublicServices();
  const { data: cats = [] } = useCategories();
  const { data: settings } = useSettings();

  const validInitial = initialServiceId && services.some((s) => s.id === initialServiceId) ? initialServiceId : "";
  const [rawServiceId, setServiceId] = useState<string>(validInitial);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [rawStart, setStart] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const [demoDismissed, dismissDemo] = useSessionFlag("rns-demo-note-dismissed");
  const shownAt = useRef<number | null>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  // If the chosen service is hidden in admin (even from another tab), it stops being chosen.
  const serviceId = rawServiceId && services.some((s) => s.id === rawServiceId) ? rawServiceId : "";
  const service = services.find((s) => s.id === serviceId) ?? null;
  const days = useOpenDays(serviceId || null, !!serviceId);
  const slots = useSlots(serviceId || null, dateKey);
  // A time that gets taken while we look at it stops being chosen.
  const start = rawStart && !(slots.data && slots.data.find((s) => s.start === rawStart)?.state !== "open") ? rawStart : null;

  useEffect(() => {
    if (done) doneHeading.current?.focus();
  }, [done]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const { [k]: _gone, ...rest } = e;
      return rest;
    });
  };

  const grouped = useMemo(
    () => cats.map((c) => ({ cat: c, items: services.filter((s) => s.category === c.id) })).filter((g) => g.items.length > 0),
    [cats, services],
  );

  const pickTime = (t: string, ev: React.MouseEvent) => {
    // Event timestamps share the performance.now() clock, so this stays pure.
    if (shownAt.current === null) shownAt.current = ev.timeStamp;
    setStart(t);
    setErrors((e) => {
      const { start: _s, ...rest } = e;
      return rest;
    });
  };

  const focusFirst = (errs: Record<string, string>) => {
    const key = FIELD_ORDER.find((k) => errs[k]);
    if (key) document.getElementById(`${uid}-${key}`)?.focus();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const submittedAt = e.timeStamp;
    setFormError(null);
    const payload = {
      serviceId,
      start: start ?? "",
      name: form.name,
      phone: form.phone,
      email: form.email,
      note: form.note,
      marketingOptIn: form.optIn,
    };
    const check = bookingInputSchema.safeParse(payload);
    if (!check.success) {
      const errs: Record<string, string> = {};
      for (const i of check.error.issues) {
        const k = i.path.length ? String(i.path[0]) : "form";
        errs[k] ??= i.message;
      }
      if (!serviceId) errs.serviceId = "Choose a service";
      if (!start) errs.start = "Pick a day and a time";
      setErrors(errs);
      focusFirst(errs);
      return;
    }
    setSubmitting(true);
    try {
      const booking = await repo.bookings.create({
        ...payload,
        website: form.website,
        elapsedMs: Math.round(submittedAt - (shownAt.current ?? submittedAt)),
      });
      setDone(booking);
    } catch (err) {
      if (isRepoError(err)) {
        setErrors(err.issues);
        if (err.code === "SLOT_TAKEN") setStart(null);
        setFormError(err.message);
        if (Object.keys(err.issues).length) focusFirst(err.issues);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    shownAt.current = null;
    setDone(null);
    setServiceId("");
    setDateKey(null);
    setStart(null);
    setForm(EMPTY);
    setErrors({});
    setFormError(null);
  }

  const Heading = variant === "section" ? "h3" : "h2";
  const err = (k: string) => (errors[k] ? `${uid}-${k}-err` : undefined);

  // ----- paused -----
  if (settings && !settings.acceptOnline) {
    return (
      <div className={styles.card} id="booking-widget">
        <Heading className={styles.title}>Online requests are paused</Heading>
        <p className={styles.lead}>We are not taking online requests right now. Please call and we will find you a time.</p>
        <a className="btn btn-primary" href={telHref(settings.contact.phone)}>
          <Icon name="phone" size={18} /> Call {settings.contact.phone}
        </a>
      </div>
    );
  }

  // ----- confirmation -----
  if (done) {
    const first = done.name.trim().split(/\s+/)[0];
    const booked = done.status === "confirmed";
    const svc = services.find((s) => s.id === done.serviceId);
    return (
      <div className={styles.card} id="booking-widget" data-testid="booking-confirmation">
        <span className={styles.tick} aria-hidden="true"><Icon name="check" size={30} /></span>
        <Heading ref={doneHeading} tabIndex={-1} className={styles.title}>
          {booked ? `You are booked in, ${first}.` : `You are on the book, ${first}.`}
        </Heading>
        <p className={styles.lead}>We will text {formatPhone(done.phone)} to confirm.</p>
        <dl className={styles.summary}>
          <div><dt>Service</dt><dd>{svc?.name ?? "Your service"}</dd></div>
          <div><dt>When</dt><dd>{formatStartHuman(done.start)}</dd></div>
          <div><dt>Where</dt><dd>{settings?.contact.address} <Confirm what="unit number" /></dd></div>
          <div><dt>Status</dt><dd>{booked ? "Confirmed" : "Waiting for the salon to confirm"}</dd></div>
        </dl>
        {!demoDismissed ? (
          <p className={styles.demo} role="note">
            <Icon name="info" size={18} />
            <span>This is a demo, nothing was sent.</span>
            <button type="button" className={styles.dismiss} onClick={() => dismissDemo(true)} aria-label="Dismiss demo note">
              <Icon name="close" size={16} />
            </button>
          </p>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Book another time
          </button>
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const noServices = services.length === 0;

  return (
    <div className={styles.card} id="booking-widget">
      <Heading className={styles.title}>Book a time</Heading>
      <p className={styles.lead}>{COPY.bookingIntro}</p>

      {noServices ? (
        <p className={styles.empty}>
          Nothing is open for online booking right now. {settings ? <>Call <a href={telHref(settings.contact.phone)}>{settings.contact.phone}</a> and we will help.</> : null}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className={styles.form} aria-label="Booking request">
          {/* 1 service */}
          <fieldset className={styles.step}>
            <legend><span className={styles.num}>1</span> Service</legend>
            <div className="field">
              <label htmlFor={`${uid}-serviceId`} className="sr-only">Service</label>
              <select
                id={`${uid}-serviceId`}
                className="select"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setStart(null);
                  setErrors((x) => ({ ...x, serviceId: "" }));
                }}
                aria-invalid={!!errors.serviceId || undefined}
                aria-describedby={err("serviceId")}
                name="service"
              >
                <option value="" disabled>
                  Choose a service
                </option>
                {grouped.map((g) => (
                  <optgroup key={g.cat.id} label={g.cat.label}>
                    {g.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.serviceId ? <span id={err("serviceId")} className="error">{errors.serviceId}</span> : null}
              {service ? (
                <p className="hint">
                  <PriceLabel price={service.price} />
                  {service.durationMin !== null ? <>, <DurationLabel min={service.durationMin} /></> : <> <DurationLabel min={null} /></>}
                </p>
              ) : null}
            </div>
          </fieldset>

          {/* 2 day */}
          <fieldset className={styles.step} disabled={!serviceId}>
            <legend><span className={styles.num}>2</span> Day</legend>
            {!serviceId ? (
              <p className="hint">Choose a service first.</p>
            ) : days.error ? (
              <ErrorState title="We could not load the days" onRetry={days.refetch} />
            ) : days.loading ? (
              <div className={styles.skels} role="status"><span className="sr-only">Loading days</span>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={76} w={68} r={18} />)}</div>
            ) : (days.data ?? []).length === 0 ? (
              <p className={styles.empty}>No open days in the next two weeks. Please call us.</p>
            ) : (
              <div className="chip-row" role="group" aria-label="Choose a day">
                {days.data!.map((d) => {
                  const f = formatDayShort(d.dateKey);
                  const full = d.free === 0;
                  return (
                    <button
                      key={d.dateKey}
                      type="button"
                      className={styles.day}
                      aria-pressed={dateKey === d.dateKey}
                      disabled={full}
                      onClick={() => {
                        setDateKey(d.dateKey);
                        setStart(null);
                      }}
                    >
                      <span className={styles.dow}>{f.weekday}</span>
                      <span className={styles.dnum}>{f.day}</span>
                      <span className={styles.mon}>{f.month}</span>
                      {full ? <span className="sr-only">, fully booked</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* 3 time */}
          <fieldset className={styles.step} disabled={!dateKey}>
            <legend><span className={styles.num}>3</span> Time</legend>
            {!dateKey ? (
              <p className="hint">Pick a day to see times.</p>
            ) : slots.error ? (
              <ErrorState title="We could not load the times" onRetry={slots.refetch} />
            ) : slots.loading ? (
              <div className={styles.skels} role="status"><span className="sr-only">Loading times</span>{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} h={44} w={88} r={999} />)}</div>
            ) : (
              <div role="group" aria-label={`Times on ${formatDayLong(dateKey)}`} className={styles.times} aria-live="polite">
                {(slots.data ?? []).filter((s) => s.state !== "past").length === 0 ? (
                  <p className={styles.empty}>No times left on this day. Try another day.</p>
                ) : (
                  (slots.data ?? [])
                    .filter((s) => s.state !== "past")
                    .map((s) => {
                      const label = formatTime12(s.time);
                      const taken = s.state !== "open";
                      return (
                        <button
                          key={s.start}
                          type="button"
                          className={styles.time}
                          aria-pressed={start === s.start}
                          disabled={taken}
                          aria-label={taken ? `${label}, taken` : label}
                          onClick={(ev) => pickTime(s.start, ev)}
                        >
                          {label}
                        </button>
                      );
                    })
                )}
              </div>
            )}
            {errors.start ? <span id={err("start")} className="error" role="alert">{errors.start}</span> : null}
            <span id={`${uid}-start`} tabIndex={-1} />
          </fieldset>

          {/* 4 details */}
          <fieldset className={styles.step} disabled={!start}>
            <legend><span className={styles.num}>4</span> Your details</legend>
            {start && service ? (
              <p className={styles.pick} data-testid="booking-summary">
                {service.name}, {formatStartHuman(start)}
              </p>
            ) : (
              <p className="hint">Pick a time to continue.</p>
            )}
            <div className={styles.fields}>
              <div className="field">
                <label htmlFor={`${uid}-name`}>Name</label>
                <input id={`${uid}-name`} className="input" name="name" autoComplete="name" value={form.name} onChange={(e) => setField("name", e.target.value)} aria-invalid={!!errors.name || undefined} aria-describedby={err("name")} />
                {errors.name ? <span id={err("name")} className="error">{errors.name}</span> : null}
              </div>
              <div className="field">
                <label htmlFor={`${uid}-phone`}>Phone</label>
                <input id={`${uid}-phone`} className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} aria-invalid={!!errors.phone || undefined} aria-describedby={err("phone") ?? `${uid}-phone-hint`} />
                {errors.phone ? <span id={err("phone")} className="error">{errors.phone}</span> : <span id={`${uid}-phone-hint`} className="hint">10 digits. We text this number to confirm.</span>}
              </div>
              <div className="field">
                <label htmlFor={`${uid}-email`}>Email <span className="hint">(optional)</span></label>
                <input id={`${uid}-email`} className="input" name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setField("email", e.target.value)} aria-invalid={!!errors.email || undefined} aria-describedby={err("email")} />
                {errors.email ? <span id={err("email")} className="error">{errors.email}</span> : null}
              </div>
              <div className="field">
                <label htmlFor={`${uid}-note`}>Note <span className="hint">(optional)</span></label>
                <textarea id={`${uid}-note`} className="textarea" name="note" rows={3} value={form.note} onChange={(e) => setField("note", e.target.value)} aria-invalid={!!errors.note || undefined} aria-describedby={err("note")} />
                {errors.note ? <span id={err("note")} className="error">{errors.note}</span> : null}
              </div>
              {/* Honeypot. Real visitors never see or reach this. */}
              <div className={styles.trap} aria-hidden="true">
                <label htmlFor={`${uid}-website`}>Website</label>
                <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField("website", e.target.value)} />
              </div>
              <label className="check">
                <input type="checkbox" checked={form.optIn} onChange={(e) => setField("optIn", e.target.checked)} />
                <span>
                  Send me occasional offers by text or email. <span className="hint">Optional. Booking messages are sent either way, and you can say stop at any time.</span>
                </span>
              </label>
            </div>
            {formError ? (
              <p className={styles.formError} role="alert">
                <Icon name="alert" size={18} /> {formError}
              </p>
            ) : null}
            <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting || !start}>
              {submitting ? "Sending your request" : "Request this time"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
