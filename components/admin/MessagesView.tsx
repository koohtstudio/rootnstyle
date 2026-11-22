"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { formatStamp } from "@/lib/domain/time";
import { useSentLog } from "@/lib/hooks/data";
import { PageHead } from "./AdminUI";
import styles from "./Manage.module.css";

const KIND: Record<string, string> = {
  "request-received": "Request received",
  "owner-alert": "Alert to you",
  confirmation: "Confirmation",
  suggestion: "Other time suggested",
  decline: "Declined",
  cancellation: "Cancelled",
  move: "Time changed",
  other: "Message",
};

export function MessagesView() {
  const log = useSentLog();
  const [channel, setChannel] = useState<"all" | "sms" | "email">("all");

  if (log.error) return <><PageHead title="Sent messages" /><ErrorState onRetry={log.refetch} /></>;
  if (log.loading || !log.data) return <><PageHead title="Sent messages" /><div role="status" className={styles.stack}><span className="sr-only">Loading messages</span>{[0, 1, 2].map((i) => <Skeleton key={i} h={88} r={20} />)}</div></>;

  const list = log.data.filter((m) => channel === "all" || m.channel === channel);
  return (
    <>
      <PageHead title="Sent messages">In this demo nothing is really sent. Every text and email the system would send is written here instead. In live mode texts go through a text provider and emails through an email provider.</PageHead>
      <div className="chip-row" role="group" aria-label="Filter by type">
        {([["all", "All"], ["sms", "Texts"], ["email", "Emails"]] as const).map(([id, label]) => (
          <button key={id} type="button" className="chip" aria-pressed={channel === id} onClick={() => setChannel(id)}>{label}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon="message" title="No messages yet">When you confirm a request or someone books online, the messages show up here.</EmptyState>
      ) : (
        <ul className={styles.msgs}>
          {list.map((m) => (
            <li key={m.id} className={styles.msg} data-testid="sent-message">
              <span className={styles.mIcon}><Icon name={m.channel === "sms" ? "phone" : "mail"} size={18} /></span>
              <div className={styles.mBody}>
                <p className={styles.mHead}><strong>{m.channel === "sms" ? "Text" : "Email"} to {m.toLabel}</strong><span className="tag">{KIND[m.kind] ?? "Message"}</span></p>
                {m.subject ? <p className={styles.subject}>{m.subject}</p> : null}
                <p className={styles.text}>{m.body}</p>
                <p className={styles.time}>{formatStamp(m.createdAt)}. Not actually sent.</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
