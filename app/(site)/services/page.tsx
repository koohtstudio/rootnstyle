import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { ServicesSection } from "@/components/site/ServicesSection";
import { isCategoryId } from "@/lib/domain/schemas";

export const metadata: Metadata = { title: "Services", description: "Hair, skin, brows and waxing, and makeup at Roots n Style in Brampton." };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ cat?: string | string[] }> }) {
  const { cat } = await searchParams;
  const c = Array.isArray(cat) ? cat[0] : cat;
  return (
    <>
      <PageHeader eyebrow="Services" title={<>Beautiful results, <em>personal care.</em></>}>
        Hair, skin, brows and makeup under one roof. Pick what you need and book a time that suits you.
      </PageHeader>
      <ServicesSection heading={false} syncUrl bookTarget="page" initialCategory={isCategoryId(c) ? c : undefined} />
    </>
  );
}
