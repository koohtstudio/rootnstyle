import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { StickyBook } from "@/components/site/StickyBook";
import { UtilityBar } from "@/components/site/UtilityBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UtilityBar />
      <Nav />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <StickyBook />
    </>
  );
}
