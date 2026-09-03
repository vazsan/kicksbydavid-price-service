import { Hero } from "@/components/hero/Hero";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Heritage } from "@/components/sections/Heritage";
import { Craft } from "@/components/sections/Craft";
import { Gallery } from "@/components/sections/Gallery";
import { Configurator } from "@/components/sections/Configurator";
import { SocialProof } from "@/components/sections/SocialProof";
import { FAQ } from "@/components/sections/FAQ";
import { StickyPurchaseBar } from "@/components/sections/StickyPurchaseBar";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Heritage />
      <Craft />
      <Gallery />
      <Configurator />
      <SocialProof />
      <FAQ />
      <Footer />
      <StickyPurchaseBar />
    </main>
  );
}
