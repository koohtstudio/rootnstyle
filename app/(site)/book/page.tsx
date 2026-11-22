import type { Metadata } from "next";
import { BookingWidget } from "@/components/site/BookingWidget";
import { PageHeader } from "@/components/site/PageHeader";
import { COPY } from "@/lib/domain/content";

export const metadata: Metadata = { title: "Book online", description: "Choose a service, a day and a time. Roots n Style will confirm by text or email." };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const { service } = await searchParams;
  const id = Array.isArray(service) ? service[0] : service;
  return (
    <>
      <PageHeader eyebrow="Book online" title={<>Your chair is <em>waiting.</em></>}>
        {COPY.bookingIntro}
      </PageHeader>
      <div className="container" style={{ paddingBottom: "clamp(40px, 8vw, 96px)", maxWidth: 860 }}>
        <BookingWidget key={id ?? "none"} initialServiceId={id ?? null} variant="page" />
      </div>
    </>
  );
}
