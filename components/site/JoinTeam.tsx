"use client";

import { Confirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { useSettings } from "@/lib/hooks/data";
import styles from "./JoinTeam.module.css";

export function JoinTeam() {
  const { data: settings } = useSettings();
  const email = settings?.contact.email ?? "rootsnstyle@gmail.com";
  return (
    <section id="join" className={`${styles.section} on-dark`} aria-labelledby="join-title">
      <div className={`container ${styles.inner}`}>
        <div>
          <span className="eyebrow">Join the team</span>
          <h2 id="join-title" className={styles.title}>
            Love hair, skin or brows? <em>Come work with us.</em>
          </h2>
          <p className={styles.body}>
            We are always glad to meet kind, skilled people. Send us a note and a few photos of your work.
            <Confirm what="whether there are open roles" />
          </p>
        </div>
        <a className="btn btn-light" href={`mailto:${email}?subject=Joining%20the%20team`}>
          <Icon name="mail" size={18} /> Email us
        </a>
      </div>
    </section>
  );
}
