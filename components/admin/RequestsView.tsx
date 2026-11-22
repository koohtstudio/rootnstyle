"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { formatPhone, telHref } from "@/lib/domain/phone";
import type { Booking } from "@/lib/domain/schemas";
import { formatStamp, formatStartHuman, splitStart, startOfWeekMonday } from "@/lib/domain/time";
import { useAllServices, useBookings, useRepo } from "@/lib/hooks/data";
import { useMedia } from "@/lib/hooks/useMedia";
import { errorMessage } from "@/lib/repo/errors";
import { PageHead, StatusBadge } from "./AdminUI";
import { SlotPicker } from "./SlotPicker";
import styles from "./Requests.module.css";

type Tab = "all" | "new" | "confirmed" | "done";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "done", label: "Done" },
];

export function RequestsView() {
  const router = useRouter();
  const params = useSearchParams();
  const bookings = useBookings();
  const services = useAllServices();
  const wide = useMedia("(min-width: 1100px)");

  const tabParam = params.get("tab");
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "all";
  const selectedId = params.get("id");

  const go = (next: { tab?: Tab; id?: string | null }) => {
    const q = new URLSearchParams();
    const t = next.tab ?? tab;
    if (t !== "all") q.set("tab", t);
    const id = next.id === undefined ? selectedId : next.id;
    if (id) q.set("id", id);
    router.replace(`/admin/requests${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  if (bookings.error) return <><PageHead title="Booking requests" /><ErrorState onRetry={bookings.refetch} /></>;
  if (bookings.loading || !bookings.data) {
    return <><PageHead title="Booking requests" /><div role="status" className={styles.skels}><span className="sr-only">Loading requests</span>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={76} r={20} />)}</div></>;
  }

  const all = bookings.data;
  const svc = (id: string) => services.data?.find((s) => s.id === id);
  const count = (t: Tab) => (t === "all" ? all.length : all.filter((b) => b.status === t).length);
  const list = all
    .filter((b) => (tab === "all" ? true : b.status === tab))
    .sort((a, b) => {
      if (tab === "new" || tab === "all") {
        if (a.status === "new" && b.status !== "new") return -1;
        if (b.status === "new" && a.status !== "new") return 1;
      }
      return a.start < b.start ? -1 : 1;
    });
  const selected = all.find((b) => b.id === selectedId) ?? null;

  return (
    <>
      <PageHead title="Booking requests">Confirm a request and the client gets a text. Everything sent is kept in Sent messages.</PageHead>

      <div className="chip-row" role="tablist" aria-label="Request status">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="chip" aria-selected={tab === t.id} onClick={() => go({ tab: t.id, id: null })}>
            {t.label} <span className={styles.n}>{count(t.id)}</span>
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div role="tabpanel" aria-label={`${tab} requests`}>
          {list.length === 0 ? (
            <EmptyState icon="inbox" title={tab === "new" ? "No new requests" : "Nothing here yet"}>
              {tab === "new" ? "When someone books on the website, the request shows up here within a second." : "Bookings will appear here as they come in."}
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {list.map((b) => (
                <li key={b.id}>
                  <button type="button" className={`${styles.item} ${b.id === selectedId ? styles.on : ""}`} onClick={() => go({ id: b.id })} aria-current={b.id === selectedId ? "true" : undefined}>
                    <span className={styles.avatar} aria-hidden="true">{b.name.charAt(0)}</span>
                    <span className={styles.text}>
                      <strong>{b.name}</strong>
                      <small>{svc(b.serviceId)?.name ?? "Service"}</small>
                      <small>{formatStartHuman(b.start)}</small>
                    </span>
                    <StatusBadge status={b.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {wide ? (
          <aside className={styles.detail} aria-label="Request details">
            {selected ? <Detail key={selected.id} booking={selected} serviceName={svc(selected.serviceId)?.name} onClosed={() => go({ id: null })} /> : (
              <EmptyState icon="inbox" title="Pick a request">Choose one on the left to see the details and reply.</EmptyState>
            )}
          </aside>
        ) : (
          <Dialog open={!!selected} onClose={() => go({ id: null })} title={selected ? selected.name : "Request"} variant="sheet">
            {selected ? <Detail key={selected.id} booking={selected} serviceName={svc(selected.serviceId)?.name} onClosed={() => go({ id: null })} bare /> : null}
          </Dialog>
        )}
      </div>
    </>
  );
}

function Detail({ booking: b, serviceName, onClosed, bare }: { booking: Booking; serviceName?: string; onClosed: () => void; bare?: boolean }) {
  const repo = useRepo();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [pick, setPick] = useState<string | null>(null);

  async function act(name: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(name);
    setError(null);
    try {
      await fn();
      toast.show(ok);
      setSuggesting(false);
    } catch (e) {
      const m = errorMessage(e);
      setError(m);
      toast.show(m, "error");
    } finally {
      setBusy(null);
    }
  }

  const week = startOfWeekMonday(splitStart(b.start).dateKey);

  return (
    <div className={styles.card}>
      {!bare ? (
        <header className={styles.dhead}>
          <h2 className={styles.dname}>{b.name}</h2>
          <StatusBadge status={b.status} />
        </header>
      ) : <div className={styles.dhead}><StatusBadge status={b.status} /></div>}

      <dl className={styles.dl}>
        <div><dt>Service</dt><dd>{serviceName ?? "Service"}</dd></div>
        <div><dt>When</dt><dd>{formatStartHuman(b.start)}</dd></div>
        <div><dt>Phone</dt><dd><a href={telHref(b.phone)}>{formatPhone(b.phone)}</a></dd></div>
        {b.email ? <div><dt>Email</dt><dd><a href={`mailto:${b.email}`}>{b.email}</a></dd></div> : null}
        <div><dt>Note</dt><dd>{b.note ? b.note : <span className={styles.none}>No note</span>}</dd></div>
        <div><dt>Asked</dt><dd>{formatStamp(b.createdAt)}</dd></div>
        <div><dt>Offers</dt><dd>{b.marketingOptIn ? "OK to send offers" : "Booking messages only"}</dd></div>
        {b.suggestedStart ? <div><dt>Suggested</dt><dd>{formatStartHuman(b.suggestedStart)}, waiting for a reply</dd></div> : null}
      </dl>

      {error ? <p className={styles.err} role="alert"><Icon name="alert" size={18} /> {error}</p> : null}

      {b.status === "new" ? (
        <>
          <div className={styles.btns}>
            <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => act("confirm", () => repo.bookings.confirm(b.id), "Confirmed. The text is in Sent messages.")}>
              <Icon name="check" size={18} /> {busy === "confirm" ? "Confirming" : "Confirm and text"}
            </button>
            <button type="button" className="btn btn-ghost" disabled={!!busy} aria-expanded={suggesting} onClick={() => setSuggesting((s) => !s)}>
              Suggest another time
            </button>
            <button type="button" className="btn btn-danger" disabled={!!busy} onClick={() => act("decline", () => repo.bookings.decline(b.id), "Declined. The client was told by text.")}>
              Decline
            </button>
          </div>
          {suggesting ? (
            <div className={styles.suggest}>
              <h3>Pick a time to suggest</h3>
              <SlotPicker serviceId={b.serviceId} value={pick} onChange={setPick} />
              <button type="button" className="btn btn-primary" disabled={!pick || !!busy} onClick={() => pick && act("suggest", () => repo.bookings.suggest(b.id, pick), "Suggestion sent. It is in Sent messages.")}>
                {busy === "suggest" ? "Sending" : "Send suggestion"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {b.status === "confirmed" ? (
        <div className={styles.btns}>
          <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => act("done", () => repo.bookings.complete(b.id), "Marked done.")}>
            <Icon name="check" size={18} /> {busy === "done" ? "Saving" : "Mark done"}
          </button>
          <Link className="btn btn-ghost" href={`/admin/calendar?week=${week}`}>Move or cancel in calendar</Link>
        </div>
      ) : null}

      {!bare ? null : (
        <button type="button" className={`btn btn-ghost ${styles.closeBtn}`} onClick={onClosed}>Close</button>
      )}
    </div>
  );
}
