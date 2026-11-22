"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/site/Logo";
import type { Role } from "@/lib/domain/schemas";
import { useRepo } from "@/lib/hooks/data";
import { useSession } from "@/lib/hooks/session";
import { errorMessage } from "@/lib/repo/errors";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const repo = useRepo();
  const session = useSession();
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, router, next]);

  async function go(role: Role) {
    setBusy(role);
    setError(null);
    try {
      await repo.auth.login(role);
      router.replace(next);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  }

  return (
    <main id="main" className={styles.page}>
      <div className={styles.card}>
        <Logo size={72} />
        <h1 className={styles.title}>Owner <em>login</em></h1>
        <p className={styles.lead}>This is a demo login. There is no password. Pick a role to look around.</p>
        <div className={styles.roles}>
          <button type="button" className={styles.role} onClick={() => go("owner")} disabled={busy !== null}>
            <span className={styles.rIcon}><Icon name="sparkle" size={22} /></span>
            <span>
              <strong>{busy === "owner" ? "Signing in" : "Sign in as owner"}</strong>
              <small>Requests, calendar, services and prices, gallery, clients, settings</small>
            </span>
          </button>
          <button type="button" className={styles.role} onClick={() => go("frontdesk")} disabled={busy !== null}>
            <span className={styles.rIcon}><Icon name="users" size={22} /></span>
            <span>
              <strong>{busy === "frontdesk" ? "Signing in" : "Sign in as front desk"}</strong>
              <small>Requests, calendar, gallery, clients. No prices or settings</small>
            </span>
          </button>
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <p className={styles.note}>Design preview. Sample data, nothing is real.</p>
        <Link href="/" className={styles.back}>Back to the website</Link>
      </div>
    </main>
  );
}
