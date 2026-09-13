import { SiteHeader } from "@/components/wcc/site-header";
import { Hero } from "@/components/wcc/hero";
import { Difference } from "@/components/wcc/difference";
import { Packages } from "@/components/wcc/packages";
import { CeramicUpsell } from "@/components/wcc/ceramic-upsell";
import { CeramicTiers } from "@/components/wcc/ceramic-tiers";
import { InteriorOnly } from "@/components/wcc/interior-only";
import { Testimonials } from "@/components/wcc/testimonials";
import { Faq } from "@/components/wcc/faq";
import { FinalCta } from "@/components/wcc/final-cta";
import { SiteFooter } from "@/components/wcc/site-footer";
import { BookingDialog } from "@/components/wcc/booking-dialog";
import { QuestionDialog } from "@/components/wcc/question-dialog";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Difference />
        <Packages />
        <CeramicUpsell />
        <CeramicTiers />
        <InteriorOnly />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <BookingDialog />
      <QuestionDialog />
    </div>
  );
}
