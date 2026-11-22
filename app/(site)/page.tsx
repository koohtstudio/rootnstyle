import { About } from "@/components/site/About";
import { BookingSection } from "@/components/site/BookingSection";
import { Gallery } from "@/components/site/Gallery";
import { Hero } from "@/components/site/Hero";
import { JoinTeam } from "@/components/site/JoinTeam";
import { Marquee } from "@/components/site/Marquee";
import { Reviews } from "@/components/site/Reviews";
import { ServicesSection } from "@/components/site/ServicesSection";
import { Visit } from "@/components/site/Visit";
import { isCategoryId } from "@/lib/domain/schemas";

type Search = Promise<{ [key: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const service = one(sp.service) ?? null;
  const cat = one(sp.cat);
  return (
    <>
      <Hero />
      <Marquee />
      <div id="services">
        <ServicesSection bookTarget="home" initialCategory={isCategoryId(cat) ? cat : undefined} />
      </div>
      <div id="work">
        <Gallery />
      </div>
      <div id="about">
        <About />
      </div>
      <Reviews />
      <BookingSection initialServiceId={service} />
      <Visit />
      <JoinTeam />
    </>
  );
}
