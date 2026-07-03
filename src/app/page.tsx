import { generatedAsset } from "@/lib/assets";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import {
  Problem,
  Features,
  How,
  Advantages,
  Roadmap,
} from "@/components/landing/Sections";
import { Memory } from "@/components/landing/Memory";
import { RecallDemo } from "@/components/landing/RecallDemo";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const heroArt = generatedAsset("hero");

  return (
    <>
      <div className="spine" aria-hidden />
      <Nav />
      <main>
        <Hero art={heroArt} />
        <Problem />
        <Memory />
        <RecallDemo />
        <Features />
        <How />
        <Advantages />
        <Roadmap />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
