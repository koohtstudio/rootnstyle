import type { Metadata } from "next";
import { About } from "@/components/site/About";
import { JoinTeam } from "@/components/site/JoinTeam";
import { PageHeader } from "@/components/site/PageHeader";
import { Reviews } from "@/components/site/Reviews";

export const metadata: Metadata = { title: "About", description: "A neighbourhood salon and spa in Brampton with a team that listens." };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About us" title={<>A neighbourhood salon, <em>made for you.</em></>} />
      <About heading={false} />
      <Reviews />
      <JoinTeam />
    </>
  );
}
