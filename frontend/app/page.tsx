import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { LogoCloud } from "@/components/landing/LogoCloud";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SplitFeature } from "@/components/landing/SplitFeature";
import { Stats } from "@/components/landing/Stats";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero area with grid background */}
      <div
        className="bg-surface"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.72 0.02 258 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.72 0.02 258 / 0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <Navbar />
        <Hero />
      </div>

      {/* Main content sections */}
      <main>
        <LogoCloud />
        <Features />
        <HowItWorks />
        <SplitFeature />
        <Stats />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
