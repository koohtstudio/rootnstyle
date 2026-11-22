import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title={<>Your details, <em>kept simple.</em></>}>
        A plain-language summary. The salon will replace this with its final policy before launch.
      </PageHeader>
      <div className="container" style={{ maxWidth: 760, paddingBottom: 80, display: "grid", gap: 18 }}>
        <h2 style={{ fontSize: "1.8rem" }}>What we collect</h2>
        <p>When you ask for a booking we collect your name, phone number, the service and time you chose, and optionally an email and a note.</p>
        <h2 style={{ fontSize: "1.8rem" }}>How we use it</h2>
        <p>We use it to confirm and manage your appointment. Booking messages are not marketing. We only send offers if you tick the box that says so, and you can say stop at any time.</p>
        <h2 style={{ fontSize: "1.8rem" }}>What we do not do</h2>
        <p>This website has no analytics, no advertising trackers and no third-party scripts. We do not sell your details.</p>
        <h2 style={{ fontSize: "1.8rem" }}>This preview</h2>
        <p>This is a design preview. Bookings made here stay in your own browser and nothing is sent to the salon.</p>
        <p><Link href="/book" className="btn btn-primary">Book online</Link></p>
      </div>
    </>
  );
}
