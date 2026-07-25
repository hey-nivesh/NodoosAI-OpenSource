import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SplitFeature } from "@/components/landing/SplitFeature";
import { Stats } from "@/components/landing/Stats";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nodoos AI — Autonomous Agents for Revenue Retention" },
      {
        name: "description",
        content:
          "Deploy autonomous AI agents that analyze real-time customer signals, prevent churn, and recover revenue. Powered by Snowflake Cortex & CoCo CLI.",
      },
      { property: "og:title", content: "Nodoos AI — Autonomous Agents for Revenue Retention" },
      {
        property: "og:description",
        content: "Autonomous AI agents that prevent churn and recover lost revenue for modern enterprises.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid-bg bg-surface">
        <Navbar />
        <Hero />
      </div>
      <main>
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
