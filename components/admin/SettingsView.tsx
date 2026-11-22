"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import type { Contact, Hours } from "@/lib/domain/schemas";
import { formatTime12, fromMinutes, weekdayName } from "@/lib/domain/time";
import { useHours, useRepo, useSettings } from "@/lib/hooks/data";
import { errorMessage, isRepoError } from "@/lib/repo/errors";
import { PageHead, Panel } from "./AdminUI";
import styles from "./Manage.module.css";

const TIMES = Array.from({ length: 36 }, (_, i) => fromMinutes(6 * 60 + i * 30));
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SettingsView() {
  const repo = useRepo();
  const toast = useToast();
  const { data: settings } = useSettings();
  const { data: hours } = useHours();
  const [contactDraft, setContactDraft] = useState<Contact | null>(null);
  const [hoursDraft, setHoursDraft] = useState<Hours[] | null>(null);
  const [contactErr, setContactErr] = useState<Record<string, string>>({});
  const [hoursErr, setHoursErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!settings || !hours) return null;
  const contact = contactDraft ?? settings.contact;
  const hrs = hoursDraft ?? hours;

  async function toggle(key: "acceptOnline" | "notifyOwner" | "autoConfirm", value: boolean, msg: string) {
    try { await repo.settings.update({ [key]: value }); toast.show(msg); } catch (e) { toast.show(errorMessage(e), "error"); }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactDraft) return;
    try { await repo.settings.update({ contact: contactDraft }); setContactDraft(null); setContactErr({}); toast.show("Contact details saved. They show on the website."); }
    catch (err) { setContactErr(isRepoError(err) ? { ...err.issues, form: err.message } : { form: errorMessage(err) }); }
  }

  async function saveHours() {
    if (!hoursDraft) return;
    try { await repo.settings.setHours(hoursDraft); setHoursDraft(null); setHoursErr(null); toast.show("Hours saved. Booking times follow them."); }
    catch (err) { setHoursErr(errorMessage(err)); }
  }

  const setDay = (day: number, patch: Partial<Hours>) => setHoursDraft(hrs.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  const setC = (k: keyof Contact, v: string) => setContactDraft({ ...contact, [k]: v });

  async function reset() {
    setBusy(true);
    try { await repo.demo.reset(); toast.show("Demo data reset."); setConfirm(false); setContactDraft(null); setHoursDraft(null); }
    catch (e) { toast.show(errorMessage(e), "error"); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Settings">Opening hours, contact details and how online booking behaves.</PageHead>
      <div className={styles.stack}>
        <Panel title="Booking rules">
          <ul className={styles.rules}>
            <li>
              <div><strong>Accept online requests</strong><small>Turn off to pause booking on the website. Visitors are asked to call.</small></div>
              <Switch checked={settings.acceptOnline} label="Accept online requests" onChange={(v) => toggle("acceptOnline", v, v ? "Online requests are on." : "Online requests are paused.")} />
            </li>
            <li>
              <div><strong>Text me on new requests</strong><small>A text alert is added to Sent messages whenever someone asks for a time.</small></div>
              <Switch checked={settings.notifyOwner} label="Text me on new requests" onChange={(v) => toggle("notifyOwner", v, v ? "You will be texted on new requests." : "Alerts are off.")} />
            </li>
            <li>
              <div><strong>Auto-confirm open times</strong><small>Skip the approval step. Requests for open times are confirmed straight away.</small></div>
              <Switch checked={settings.autoConfirm} label="Auto-confirm open times" onChange={(v) => toggle("autoConfirm", v, v ? "New bookings are confirmed automatically." : "You approve each request again.")} />
            </li>
          </ul>
        </Panel>

        <Panel title="Opening hours" action={<button type="button" className="btn btn-primary btn-sm" disabled={!hoursDraft} onClick={saveHours}>Save hours</button>}>
          <ul className={styles.hours}>
            {ORDER.map((d) => {
              const h = hrs.find((x) => x.day === d)!;
              const name = weekdayName(d);
              return (
                <li key={d}>
                  <span className={styles.day}>{name}</span>
                  <span className={styles.closedSwitch}><Switch checked={!h.closed} label={`${name} open`} onChange={(open) => setDay(d, { closed: !open })} /><span>{h.closed ? "Closed" : "Open"}</span></span>
                  {h.closed ? <span className={styles.dim}>No bookings</span> : (
                    <span className={styles.times}>
                      <select className="select" aria-label={`${name} opens`} value={h.open} onChange={(e) => setDay(d, { open: e.target.value })}>{TIMES.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}</select>
                      <span>to</span>
                      <select className="select" aria-label={`${name} closes`} value={h.close} onChange={(e) => setDay(d, { close: e.target.value })}>{TIMES.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}</select>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {hoursErr ? <p className="error" role="alert">{hoursErr}</p> : null}
        </Panel>

        <Panel title="Contact details">
          <form onSubmit={saveContact} className={styles.form} noValidate>
            <div className={styles.two}>
              <div className="field"><label htmlFor="c-phone">Phone</label><input id="c-phone" className="input" value={contact.phone} onChange={(e) => setC("phone", e.target.value)} aria-invalid={!!contactErr.phone || undefined} />{contactErr.phone ? <span className="error">{contactErr.phone}</span> : null}</div>
              <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" value={contact.email} onChange={(e) => setC("email", e.target.value)} aria-invalid={!!contactErr.email || undefined} />{contactErr.email ? <span className="error">{contactErr.email}</span> : null}</div>
            </div>
            <div className="field"><label htmlFor="c-addr">Address</label><input id="c-addr" className="input" value={contact.address} onChange={(e) => setC("address", e.target.value)} aria-invalid={!!contactErr.address || undefined} />{contactErr.address ? <span className="error">{contactErr.address}</span> : null}</div>
            <div className="field"><label htmlFor="c-ig">Instagram</label><input id="c-ig" className="input" value={contact.instagram} onChange={(e) => setC("instagram", e.target.value)} /></div>
            {contactErr.form ? <p className="error" role="alert">{contactErr.form}</p> : null}
            <div><button type="submit" className="btn btn-primary" disabled={!contactDraft}>Save contact details</button></div>
          </form>
        </Panel>

        <Panel title="Demo data">
          <p className={styles.resetText}>Everything you change here is saved in this browser only. Reset puts the sample bookings, services, prices, photos and hours back to how they started.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}><Icon name="refresh" size={18} /> Reset demo data</button>
        </Panel>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" footer={<><button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep my changes</button><button type="button" className="btn btn-primary" onClick={reset} disabled={busy}>{busy ? "Resetting" : "Yes, reset everything"}</button></>}>
        <p>This restores the original sample data in this browser. It cannot be undone.</p>
      </Dialog>
    </>
  );
}
