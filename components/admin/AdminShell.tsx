"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/States";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/site/Logo";
import type { Role } from "@/lib/domain/schemas";
import { useBookings, useRepo } from "@/lib/hooks/data";
import { useSession, useSessionFlag } from "@/lib/hooks/session";
import { errorMessage } from "@/lib/repo/errors";
import styles from "./AdminShell.module.css";

interface Item {
  href: string;
  label: string;
  icon: IconName;
  roles: Role[];
}

const ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", icon: "home", roles: ["owner", "frontdesk"] },
  { href: "/admin/requests", label: "Booking requests", icon: "inbox", roles: ["owner", "frontdesk"] },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar", roles: ["owner", "frontdesk"] },
  { href: "/admin/services", label: "Services and prices", icon: "tag", roles: ["owner"] },
  { href: "/admin/gallery", label: "Gallery", icon: "image", roles: ["owner", "frontdesk"] },
  { href: "/admin/clients", label: "Clients", icon: "users", roles: ["owner", "frontdesk"] },
  { href: "/admin/messages", label: "Sent messages", icon: "message", roles: ["owner", "frontdesk"] },
  { href: "/admin/settings", label: "Settings", icon: "sliders", roles: ["owner"] },
];

function itemFor(path: string): Item | undefined {
  return [...ITEMS].reverse().find((i) => (i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(`${i.href}/`)));
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Guard>{children}</Guard>
    </ToastProvider>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (session === null) router.replace(`/admin/login?next=${encodeURIComponent(path)}`);
  }, [session, router, path]);

  if (!session) {
    return (
      <div className={styles.boot} role="status" aria-live="polite">
        <span className="sr-only">Checking your sign in</span>
        <Skeleton h={28} w={180} />
        <Skeleton h={120} w="100%" r={20} />
      </div>
    );
  }
  return <Frame role={session.role} name={session.name}>{children}</Frame>;
}

function Frame({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const repo = useRepo();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [bannerGone, dismissBanner] = useSessionFlag("rns-admin-banner");
  const { data: bookings } = useBookings();
  const newCount = bookings?.filter((b) => b.status === "new").length ?? 0;
  const current = itemFor(path);
  const allowed = !current || current.roles.includes(role);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  async function signOut() {
    await repo.auth.logout();
    router.replace("/admin/login");
  }

  async function reset() {
    setResetting(true);
    try {
      await repo.demo.reset();
      toast.show("Demo data reset. Everything is back to the starting sample.");
      setConfirmReset(false);
    } catch (e) {
      toast.show(errorMessage(e), "error");
    } finally {
      setResetting(false);
    }
  }

  const nav = (
    <nav aria-label="Admin" className={styles.nav}>
      <ul>
        {ITEMS.filter((i) => i.roles.includes(role)).map((i) => {
          const active = current?.href === i.href;
          return (
            <li key={i.href}>
              <Link href={i.href} className={styles.item} aria-current={active ? "page" : undefined} onClick={() => setMenu(false)}>
                <Icon name={i.icon} size={20} />
                <span>{i.label}</span>
                {i.href === "/admin/requests" && newCount > 0 ? (
                  <span className={styles.count} aria-label={`${newCount} new`}>{newCount}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const foot = (
    <div className={styles.foot}>
      <button type="button" className={styles.reset} onClick={() => setConfirmReset(true)}>
        <Icon name="refresh" size={18} /> Reset demo data
      </button>
      <Link href="/" className={styles.reset}>
        <Icon name="external" size={18} /> View website
      </Link>
      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">{name.charAt(0)}</span>
        <span className={styles.who}>{name}</span>
        <button type="button" className={styles.out} onClick={signOut} aria-label="Sign out">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.frame}>
      <aside className={`${styles.side} on-dark`}>
        <div className={styles.brand}><Logo size={48} light /><span className={styles.tag}>Admin</span></div>
        {nav}
        {foot}
      </aside>

      <div className={styles.mainCol}>
        <header className={`${styles.topbar} on-dark`}>
          <Logo size={40} light />
          <button type="button" className={styles.burger} aria-expanded={menu} aria-controls="admin-drawer" aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu((m) => !m)}>
            <Icon name={menu ? "close" : "menu"} size={24} />
          </button>
        </header>
        {menu ? (
          <div id="admin-drawer" className={`${styles.drawer} on-dark`}>
            {nav}
            {foot}
          </div>
        ) : null}

        {!bannerGone ? (
          <aside className={styles.banner} aria-label="Preview notice">
            <Icon name="info" size={18} />
            <span>Design preview. Sample data, nothing is real.</span>
            <button type="button" onClick={() => dismissBanner(true)} aria-label="Dismiss preview banner" className={styles.bannerX}>
              <Icon name="close" size={16} />
            </button>
          </aside>
        ) : null}

        <main id="main" tabIndex={-1} className={styles.content}>
          {allowed ? (
            children
          ) : (
            <div className={styles.denied}>
              <h1 className="display">That page is for the <em>owner.</em></h1>
              <p>You are signed in as front desk. Owner access is needed for services, prices and settings.</p>
              <Link href="/admin" className="btn btn-primary">Back to the dashboard</Link>
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Keep my changes</button>
            <button type="button" className="btn btn-primary" onClick={reset} disabled={resetting}>{resetting ? "Resetting" : "Yes, reset everything"}</button>
          </>
        }
      >
        <p>This puts the sample bookings, services, prices, photos, hours and sent messages back to how they started. Changes you made in this browser will be gone.</p>
      </Dialog>
    </div>
  );
}
