"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Switch } from "@/components/ui/Switch";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { galleryTags, type GalleryTag } from "@/lib/domain/schemas";
import { useAllGallery, useRepo } from "@/lib/hooks/data";
import { errorMessage, isRepoError } from "@/lib/repo/errors";
import { PageHead } from "./AdminUI";
import styles from "./Manage.module.css";

const LABEL: Record<GalleryTag, string> = { colour: "Colour", styling: "Styling", cuts: "Cuts" };

export function GalleryAdmin() {
  const gallery = useAllGallery();
  const repo = useRepo();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  if (gallery.error) return <><PageHead title="Gallery" /><ErrorState onRetry={gallery.refetch} /></>;
  if (gallery.loading || !gallery.data) return <><PageHead title="Gallery" /><div role="status" className={styles.photoGrid}><span className="sr-only">Loading photos</span>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={320} r={24} />)}</div></>;

  const list = gallery.data;
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast.show(ok); } catch (e) { toast.show(errorMessage(e), "error"); }
  };

  return (
    <>
      <PageHead title="Gallery" actions={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add a photo</button>}>
        Show or hide photos on the website and choose which filter they appear under.
      </PageHead>
      <p className={styles.consent} role="note"><Icon name="info" size={18} /> Only upload photos the client has agreed to share.</p>

      {list.length === 0 ? (
        <EmptyState icon="image" title="No photos yet" action={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>Add your first photo</button>}>
          Photos you add show up on the Our work page.
        </EmptyState>
      ) : (
        <ul className={styles.photoGrid}>
          {list.map((p, i) => (
            <li key={p.id} className={`${styles.photo} ${p.visible ? "" : styles.hidden}`} data-testid={`photo-${p.id}`}>
              <div className={styles.thumb}>
                <Photo src={p.src} alt={p.alt} blur={p.blur} fill sizes="(max-width: 700px) 90vw, 260px" quality={60} />
                {!p.visible ? <span className={styles.hiddenTag}><Icon name="eyeOff" size={14} /> Hidden</span> : null}
              </div>
              <div className={styles.pbody}>
                <strong>{p.title}</strong>
                <div className="field">
                  <label htmlFor={`tag-${p.id}`} className="sr-only">Filter tag for {p.title}</label>
                  <select id={`tag-${p.id}`} className="select" value={p.tag} onChange={(e) => run(() => repo.gallery.update(p.id, { tag: e.target.value as GalleryTag }), "Filter updated.")}>
                    {galleryTags.map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}
                  </select>
                </div>
                <div className={styles.prow}>
                  <span className={styles.showWrap}>
                    <Switch checked={p.visible} label={`Show ${p.title} on the website`} onChange={(v) => run(() => repo.gallery.update(p.id, { visible: v }))} />
                    {p.visible ? "On website" : "Hidden"}
                  </span>
                  <span className={styles.order}>
                    <button type="button" aria-label={`Move ${p.title} earlier`} disabled={i === 0} onClick={() => run(() => repo.gallery.move(p.id, "up"))}><Icon name="left" size={16} /></button>
                    <button type="button" aria-label={`Move ${p.title} later`} disabled={i === list.length - 1} onClick={() => run(() => repo.gallery.move(p.id, "down"))}><Icon name="right" size={16} /></button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddPhoto open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function AddPhoto({ open, onClose }: { open: boolean; onClose: () => void }) {
  const repo = useRepo();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [tag, setTag] = useState<GalleryTag>("colour");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setSrc(null); setTitle(""); setAlt(""); setTag("colour"); setAgreed(false); setErrors({}); if (fileRef.current) fileRef.current.value = ""; };

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErrors({});
    try { setSrc((await repo.storage.upload(file)).src); } catch (e) { setErrors({ file: errorMessage(e) }); } finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!src) errs.file = "Choose a photo";
    if (!agreed) errs.agreed = "Please confirm the client agreed to share this photo";
    if (Object.keys(errs).length) return setErrors(errs);
    setBusy(true);
    try {
      await repo.gallery.add({ title, alt, tag, src: src! });
      toast.show("Photo added. It is on the website now.");
      reset();
      onClose();
    } catch (err) { setErrors(isRepoError(err) ? { ...err.issues, form: err.message } : { form: errorMessage(err) }); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); }} title="Add a photo">
      <form onSubmit={submit} className={styles.form} noValidate>
        <p className={styles.consent}><Icon name="info" size={18} /> Only upload photos the client has agreed to share.</p>
        <div className="field">
          <label htmlFor="ap-file">Photo (JPG, PNG or WebP, up to 8 MB)</label>
          <input ref={fileRef} id="ap-file" type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => pick(e.target.files?.[0])} aria-invalid={!!errors.file || undefined} />
          <span className="hint">{repo.storage.note}</span>
          {errors.file ? <span className="error" role="alert">{errors.file}</span> : null}
        </div>
        {src ? <div className={styles.preview}><Photo src={src} alt="Preview of the photo you chose" fill sizes="240px" /></div> : null}
        <div className="field">
          <label htmlFor="ap-title">Title</label>
          <input id="ap-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title || undefined} />
          {errors.title ? <span className="error">{errors.title}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="ap-alt">Describe the photo <span className="hint">(for screen readers)</span></label>
          <input id="ap-alt" className="input" value={alt} onChange={(e) => setAlt(e.target.value)} aria-invalid={!!errors.alt || undefined} />
          {errors.alt ? <span className="error">{errors.alt}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="ap-tag">Filter</label>
          <select id="ap-tag" className="select" value={tag} onChange={(e) => setTag(e.target.value as GalleryTag)}>
            {galleryTags.map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>The client in this photo agreed to share it on our website.</span>
        </label>
        {errors.agreed ? <span className="error" role="alert">{errors.agreed}</span> : null}
        {errors.form ? <span className="error" role="alert">{errors.form}</span> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Working" : "Add photo"}</button>
      </form>
    </Dialog>
  );
}
