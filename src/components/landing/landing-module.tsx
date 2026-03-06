import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { Features } from "./feature";
import { Pricing } from "./pricing";
import { Footer } from "./footer";

export function LandingModule() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
