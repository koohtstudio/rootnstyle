import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { Visit } from "@/components/site/Visit";

export const metadata: Metadata = { title: "Visit", description: "Hours, address and directions for Roots n Style on Goreway Dr, Brampton." };

export default function VisitPage() {
  return (
    <>
      <PageHeader eyebrow="Visit" title={<>Come see <em>us.</em></>} />
      <Visit heading={false} />
    </>
  );
}
