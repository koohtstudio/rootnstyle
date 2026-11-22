"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { formatPhone, telHref } from "@/lib/domain/phone";
import { formatStartHuman } from "@/lib/domain/time";
import { useClients } from "@/lib/hooks/data";
import { PageHead } from "./AdminUI";
import styles from "./Manage.module.css";

export function ClientsView() {
  const clients = useClients();
  const [q, setQ] = useState("");

  if (clients.error) return <><PageHead title="Clients" /><ErrorState onRetry={clients.refetch} /></>;
  if (clients.loading || !clients.data) return <><PageHead title="Clients" /><div role="status" className={styles.stack}><span className="sr-only">Loading clients</span>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={56} r={16} />)}</div></>;

  const needle = q.trim().toLowerCase();
  const list = clients.data.filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.phone.includes(needle.replace(/\D/g, "") || "~"));

  return (
    <>
      <PageHead title="Clients">Built from booking requests and matched by phone number. Nothing to maintain by hand.</PageHead>
      <div className={styles.search}>
        <Icon name="search" size={18} />
        <label htmlFor="client-q" className="sr-only">Search clients</label>
        <input id="client-q" className="input" type="search" placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <EmptyState icon="users" title={clients.data.length === 0 ? "No clients yet" : "No one matches that"}>
          {clients.data.length === 0 ? "Clients appear here after their first booking request." : "Try a different name or part of a phone number."}
        </EmptyState>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Name</th><th scope="col">Phone</th><th scope="col">Visits</th><th scope="col">Last visit</th><th scope="col">Notes</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.name}{c.email ? <small>{c.email}</small> : null}</th>
                  <td><a href={telHref(c.phone)}>{formatPhone(c.phone)}</a></td>
                  <td>{c.visits}</td>
                  <td>{c.lastVisit ? formatStartHuman(c.lastVisit) : <span className={styles.dim}>None yet</span>}</td>
                  <td>{c.notes.length ? c.notes.join(" / ") : <span className={styles.dim}>No notes</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
