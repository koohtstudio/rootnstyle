import type { Metadata } from "next";
import { Gallery } from "@/components/site/Gallery";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = { title: "Our work", description: "Colour, styling and cuts from the Roots n Style chair." };

export default function WorkPage() {
  return (
    <>
      <PageHeader eyebrow="Our work" title={<>Real results, <em>real clients.</em></>}>
        A look at recent colour, styling and cuts. Tap any photo to see it larger.
      </PageHeader>
      <Gallery heading={false} />
    </>
  );
}
