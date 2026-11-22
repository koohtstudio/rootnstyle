"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { categoryIds, type CategoryId, type Service } from "@/lib/domain/schemas";
import { useAllServices, useCategories, useRepo } from "@/lib/hooks/data";
import { errorMessage, isRepoError } from "@/lib/repo/errors";
import { PageHead, Panel } from "./AdminUI";
import styles from "./Manage.module.css";

export function ServicesAdmin() {
  const services = useAllServices();
  const { data: cats = [] } = useCategories();
  const repo = useRepo();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  if (services.error) return <><PageHead title="Services and prices" /><ErrorState onRetry={services.refetch} /></>;
  if (services.loading || !services.data) return <><PageHead title="Services and prices" /><div role="status" className={styles.stack}><span className="sr-only">Loading services</span>{[0, 1, 2].map((i) => <Skeleton key={i} h={96} r={20} />)}</div></>;

  const list = services.data;
  return (
    <>
      <PageHead title="Services and prices" actions={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add a service</button>}>
        Change a price or time and press Enter, or click away. It saves straight away and shows on the website. Leave a price empty and the site says Price on request.
      </PageHead>

      <div className={styles.stack}>
        {cats.map((c) => {
          const rows = list.filter((s) => s.category === c.id);
          return (
            <Panel key={c.id} title={c.label}>
              {rows.length === 0 ? <EmptyState icon="tag" title="No services in this group">Add one with the button above.</EmptyState> : (
                <ul className={styles.rows}>
                  {rows.map((s, i) => (
                    <ServiceRow key={s.id} s={s} first={i === 0} last={i === rows.length - 1} />
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      <AddService open={adding} onClose={() => setAdding(false)} onSave={async (v) => {
        try {
          await repo.services.create(v);
          toast.show(`${v.name} added. It is on the website now.`);
          setAdding(false);
        } catch (e) { return isRepoError(e) ? e.issues : { form: errorMessage(e) }; }
      }} />
    </>
  );
}

function ServiceRow({ s, first, last }: { s: Service; first: boolean; last: boolean }) {
  const repo = useRepo();
  const toast = useToast();
  // A draft only exists while the owner is typing. Otherwise we show what is stored, so changes from another tab appear.
  const [priceDraft, setPriceDraft] = useState<string | null>(null);
  const [durDraft, setDurDraft] = useState<string | null>(null);
  const price = priceDraft ?? (s.price === null ? "" : String(s.price));
  const dur = durDraft ?? (s.durationMin === null ? "" : String(s.durationMin));
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(patch: Parameters<typeof repo.services.update>[1]) {
    setErr(null);
    try {
      await repo.services.update(s.id, patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      const m = errorMessage(e);
      setErr(m);
      toast.show(m, "error");
    }
  }

  const commitPrice = async () => {
    if (priceDraft === null) return;
    const v = priceDraft.trim() === "" ? null : Number(priceDraft);
    if (v !== null && Number.isNaN(v)) return setErr("Price must be a number");
    if (v !== s.price) await save({ price: v });
    setPriceDraft(null);
  };
  const commitDur = async () => {
    if (durDraft === null) return;
    const v = durDraft.trim() === "" ? null : Number(durDraft);
    if (v !== null && Number.isNaN(v)) return setErr("Time must be a number of minutes");
    if (v !== s.durationMin) await save({ durationMin: v });
    setDurDraft(null);
  };
  const enter = (fn: () => unknown) => (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); fn(); } };

  return (
    <li className={styles.row} data-testid={`service-${s.id}`}>
      <div className={styles.order}>
        <button type="button" aria-label={`Move ${s.name} up`} disabled={first} onClick={() => repo.services.move(s.id, "up")}><Icon name="up" size={16} /></button>
        <button type="button" aria-label={`Move ${s.name} down`} disabled={last} onClick={() => repo.services.move(s.id, "down")}><Icon name="down" size={16} /></button>
      </div>
      <div className={styles.name}>
        <strong>{s.name}</strong>
        <small>{s.description}</small>
        {err ? <span className="error" role="alert">{err}</span> : null}
      </div>
      <div className={styles.inputs}>
        <label className={styles.money}>
          <span>Price</span>
          <span className={styles.wrap}><i aria-hidden="true">$</i>
            <input className="input" inputMode="decimal" value={price} placeholder="Not set" aria-label={`${s.name} price`} onChange={(e) => setPriceDraft(e.target.value)} onBlur={commitPrice} onKeyDown={enter(commitPrice)} />
          </span>
        </label>
        <label className={styles.money}>
          <span>Minutes</span>
          <input className="input" inputMode="numeric" value={dur} placeholder="Not set" aria-label={`${s.name} duration in minutes`} onChange={(e) => setDurDraft(e.target.value)} onBlur={commitDur} onKeyDown={enter(commitDur)} />
        </label>
      </div>
      <div className={styles.show}>
        <Switch checked={s.visible} label={`Show ${s.name} on the website`} onChange={(v) => save({ visible: v })} />
        <span className={styles.showLabel}>{s.visible ? "On website" : "Hidden"}</span>
        <span className={styles.saved} role="status">{saved ? <><Icon name="check" size={14} /> Saved</> : null}</span>
      </div>
    </li>
  );
}

function AddService({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: { category: CategoryId; name: string; description: string; price: number | null; durationMin: number | null }) => Promise<Record<string, string> | void> }) {
  const [category, setCategory] = useState<CategoryId>("hair");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [dur, setDur] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { data: cats = [] } = useCategories();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await onSave({ category, name, description, price: price.trim() === "" ? null : Number(price), durationMin: dur.trim() === "" ? null : Number(dur) });
    setBusy(false);
    if (res) setErrors(res);
    else { setName(""); setDescription(""); setPrice(""); setDur(""); setErrors({}); }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add a service">
      <form onSubmit={submit} className={styles.form} noValidate>
        <div className="field">
          <label htmlFor="as-cat">Group</label>
          <select id="as-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {categoryIds.map((id) => <option key={id} value={id}>{cats.find((c) => c.id === id)?.label ?? id}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="as-name">Name</label>
          <input id="as-name" className="input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name || undefined} />
          {errors.name ? <span className="error">{errors.name}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="as-desc">Short description</label>
          <textarea id="as-desc" className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={styles.two}>
          <div className="field"><label htmlFor="as-price">Price ($)</label><input id="as-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />{errors.price ? <span className="error">{errors.price}</span> : null}</div>
          <div className="field"><label htmlFor="as-dur">Minutes</label><input id="as-dur" className="input" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} />{errors.durationMin ? <span className="error">{errors.durationMin}</span> : null}</div>
        </div>
        {errors.form ? <p className="error" role="alert">{errors.form}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Adding" : "Add service"}</button>
      </form>
    </Dialog>
  );
}
