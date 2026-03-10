import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { Features } from "./feature";
import { Pricing } from "./pricing";
import { Footer } from "./footer";

import type { PlanWithFeatures } from "@/src/adapters/subscription-adapter";

interface LandingModuleProps {
  plans: PlanWithFeatures[];
}

export function LandingModule({ plans }: LandingModuleProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing plans={plans} />
      </main>
      <Footer />
    </div>
  );
}
