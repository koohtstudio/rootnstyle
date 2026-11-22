"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Sample } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/States";
import type { CategoryId } from "@/lib/domain/schemas";
import { COPY, CATEGORY_BLURBS } from "@/lib/domain/content";
import { useCategories, usePublicServices, useSettings } from "@/lib/hooks/data";
import { telHref } from "@/lib/domain/phone";
import { DurationLabel, PriceLabel } from "./Labels";
import styles from "./ServicesSection.module.css";

interface Props {
  /** Where "Book this" goes: the widget on the home page, or the /book page. */
  bookTarget: "home" | "page";
  initialCategory?: CategoryId;
  /** Keep ?cat= in the address bar (the /services page). */
  syncUrl?: boolean;
  heading?: boolean;
}

export function ServicesSection({ bookTarget, initialCategory, syncUrl, heading = true }: Props) {
  const bookHref = (id: string) => (bookTarget === "home" ? `/?service=${id}#book` : `/book?service=${id}`);
  const router = useRouter();
  const { data: cats = [] } = useCategories();
  const { data: services = [] } = usePublicServices();
  const { data: settings } = useSettings();
  const [picked, setPicked] = useState<CategoryId>(initialCategory ?? "hair");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const visibleCats = cats.filter((c) => services.some((s) => s.category === c.id));
  const active = visibleCats.find((c) => c.id === picked)?.id ?? visibleCats[0]?.id;
  const list = services.filter((s) => s.category === active);

  const choose = (id: CategoryId) => {
    setPicked(id);
    if (syncUrl) router.replace(`/services?cat=${id}`, { scroll: false });
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = visibleCats[(i + dir + visibleCats.length) % visibleCats.length];
    if (next) {
      choose(next.id);
      tabRefs.current[next.id]?.focus();
    }
  };

  return (
    <section className={styles.section} aria-labelledby={heading ? "services-title" : undefined} aria-label={heading ? undefined : "Services"}>
      <div className="container">
        {heading ? (
          <div className={styles.head}>
            <span className="eyebrow">Services</span>
            <h2 id="services-title" className={styles.title}>
              Beautiful results, <em>personal care.</em>
            </h2>
            <p className={styles.intro}>{COPY.specials}</p>
          </div>
        ) : (
          <>
            <h2 className="sr-only">Our services</h2>
            <p className={styles.intro}>{COPY.specials}</p>
          </>
        )}

        {visibleCats.length === 0 ? (
          <EmptyState icon="tag" title="Our menu is being updated">
            Call us and we will help you choose.
            {settings ? <> <a href={telHref(settings.contact.phone)}>{settings.contact.phone}</a></> : null}
          </EmptyState>
        ) : (
          <>
            <div className="chip-row" role="tablist" aria-label="Service categories">
              {visibleCats.map((c, i) => (
                <button
                  key={c.id}
                  ref={(el) => {
                    tabRefs.current[c.id] = el;
                  }}
                  id={`tab-${c.id}`}
                  role="tab"
                  type="button"
                  className="chip"
                  aria-selected={active === c.id}
                  aria-controls="services-panel"
                  tabIndex={active === c.id ? 0 : -1}
                  onClick={() => choose(c.id)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div id="services-panel" role="tabpanel" aria-labelledby={active ? `tab-${active}` : undefined} className={styles.panel}>
              {active && CATEGORY_BLURBS[active] ? <p className={styles.blurb}>{CATEGORY_BLURBS[active]}</p> : null}
              <ul className={styles.grid}>
                {list.map((s) => (
                  <li key={s.id} className={styles.card}>
                    <h3 className={styles.name}>{s.name}</h3>
                    <p className={styles.desc}>
                      {s.description}
                      <Sample what="description" />
                    </p>
                    <p className={styles.meta}>
                      <span className={styles.price}><PriceLabel price={s.price} /></span>
                      <span className={styles.dur}><DurationLabel min={s.durationMin} /></span>
                    </p>
                    <Link href={bookHref(s.id)} className="btn btn-ghost btn-sm">
                      Book this<span className="sr-only"> {s.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
