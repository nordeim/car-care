/**
 * We Care Car Care — site content.
 *
 * Services, pricing, service areas, and business facts mirror the real
 * business (public information). Descriptive copy is written for this build.
 */

export type VehicleType = "sedan" | "suv";

export interface ServicePackage {
  key: string;
  name: string;
  tagline: string;
  description: string;
  prices: Record<VehicleType, number>;
  features: string[];
  popular?: boolean;
  durationHours: string;
}

export const PACKAGES: ServicePackage[] = [
  {
    key: "essential-full",
    name: "Essential Full Detail",
    tagline: "Full interior & exterior refresh",
    description:
      "A complete interior and exterior detail that keeps your car protected and refreshed — the right reset for a vehicle that's been waiting too long for real attention.",
    prices: { sedan: 240, suv: 295 },
    durationHours: "3–4 hrs",
    features: [
      "Full interior vacuuming, trunk included",
      "All interior hard surfaces cleaned",
      "Carpets & seats shampooed",
      "Floor mats deep cleaned",
      "UV protection for interior surfaces",
      "Exterior decontamination wash",
      "Wheel faces & tires cleaned",
      "2-month spray-on paint sealant",
      "Interior & exterior glass & mirrors",
    ],
  },
  {
    key: "premium-full",
    name: "Premium Full Detail",
    tagline: "Deep clean + machine polish",
    description:
      "Our most-chosen package — a comprehensive interior deep clean paired with exterior clay bar decontamination and a machine polish for real correction, deeper gloss, and longer-lasting protection.",
    prices: { sedan: 360, suv: 395 },
    durationHours: "5–6 hrs",
    popular: true,
    features: [
      "Everything in the Essential Full Detail",
      "Full sanitized steam treatment",
      "Exterior clay bar decontamination",
      "Machine polish with polish-grade correction",
      "Light scratch & swirl removal",
      "Higher gloss finish",
      "Longer-lasting protection",
    ],
  },
];

export interface CeramicTier {
  key: string;
  name: string;
  years: string;
  description: string;
  prices: Record<VehicleType, number>;
  features: string[];
  popular?: boolean;
}

export const CERAMIC_TIERS: CeramicTier[] = [
  {
    key: "ceramic-1yr",
    name: "1-Year Protection",
    years: "1 year",
    description:
      "Entry-level ceramic shield for daily drivers who want lasting gloss and easy maintenance without the long-term commitment.",
    prices: { sedan: 560, suv: 595 },
    features: [
      "Full Premium detail before application",
      "Single-layer ceramic coating",
      "High gloss enhancement",
      "Hydrophobic finish",
      "UV protection",
      "1-year durability",
    ],
  },
  {
    key: "ceramic-3yr",
    name: "3-Year Protection",
    years: "3 years",
    description:
      "Our most popular tier — paint correction, multi-layer ceramic, maximum gloss, and multi-year durability for a vehicle you plan to keep.",
    prices: { sedan: 795, suv: 995 },
    popular: true,
    features: [
      "Full Premium detail before application",
      "Paint correction (light polish)",
      "Multi-layer ceramic coating",
      "Enhanced hydrophobic finish",
      "Deep gloss enhancement",
      "3-year durability",
    ],
  },
  {
    key: "ceramic-5yr",
    name: "5-Year Protection",
    years: "5 years",
    description:
      "The ultimate in long-term paint protection for drivers who demand the best — multi-stage correction and a premium multi-layer coating.",
    prices: { sedan: 995, suv: 1295 },
    features: [
      "Full Premium detail before application",
      "Multi-stage paint correction",
      "Premium multi-layer coating",
      "Maximum hydrophobic protection",
      "Mirror-finish gloss",
      "5-year durability",
    ],
  },
];

export const INTERIOR_ONLY = {
  key: "interior-only",
  name: "Interior Detail",
  tagline: "Interior-only deep reset",
  description:
    "Not every vehicle needs a full detail. If the outside is fine but the inside has been through it — kids, dogs, winters, commutes — this is a deep interior reset on its own.",
  prices: { sedan: 195, suv: 240 },
  durationHours: "2–3 hrs",
  features: [
    "Complete interior deep clean",
    "Full vacuuming including trunk",
    "All hard surfaces cleaned & conditioned",
    "Carpets & seats deep cleaned",
    "Floor mats deep cleaned",
    "UV protection applied",
    "Interior glass cleaned & polished",
  ],
} satisfies ServicePackage;

export const CERAMIC_ADDON = {
  price: 200,
  regularPrice: 299,
  note: "Only $200 when added to any detail (normally $299). No extra appointment — we apply it during your detail.",
};

export const SERVICE_MODES = [
  {
    key: "mobile",
    label: "Mobile",
    description: "We come to your home or workplace",
  },
  {
    key: "shop",
    label: "Shop",
    description: "Drop off at our Framingham studio",
  },
  {
    key: "pickup",
    label: "Pickup & Delivery",
    description: "We pick the car up and bring it back",
  },
] as const;

export const CERAMIC_BENEFITS = [
  {
    title: "Stays Cleaner Longer",
    body: "Water, road film, and grime stop sticking the way they used to, so your vehicle stays cleaner between washes.",
  },
  {
    title: "Better Shine",
    body: "Ceramic helps your paint hold that deep, glossy look long after the detail is done — not just for the ride home.",
  },
  {
    title: "Easier Maintenance",
    body: "Washes go faster, drying is cleaner, and keeping the car looking great takes a fraction of the effort.",
  },
  {
    title: "Long-Term Protection",
    body: "A hard sacrificial layer against UV rays, tree sap, and everyday contaminants that slowly wear finishes down.",
  },
];

export interface Testimonial {
  name: string;
  date: string;
  text: string;
}

// Review copy written for this build in the spirit of the shop's public
// Google reviews (5.0 rating, 37 reviews).
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Lauren B. K.",
    date: "Mar 2026",
    text: "Chris was easy to communicate with and super responsive. He made my car look like it just came off the lot!",
  },
  {
    name: "Jim K.",
    date: "Nov 2025",
    text: "My SUV was full of grass, dirt, and sand from a whole summer of beach days. When the team was done, it looked like the day I drove it off the dealer's lot six years ago.",
  },
  {
    name: "Ed L.",
    date: "Oct 2025",
    text: "Three kids and a dog, no detailing in ten years — and the interior came back looking brand new. The exterior polish made it shine. We'll be back.",
  },
  {
    name: "Lisa W.",
    date: "Oct 2025",
    text: "We've trusted them with our vehicles for years. Two cars that spent the summer at the beach — sand everywhere, fur everywhere — came back looking brand new.",
  },
  {
    name: "Kimberly E.",
    date: "Aug 2025",
    text: "Always flexible, even picking up from my work location. With two kids our cars are never the cleanest, and the attention to detail is still incredible every single time.",
  },
  {
    name: "Gayle G.",
    date: "Aug 2025",
    text: "Sap, pollen, dirt, old leaves in the crevices — gone. They even coordinated pickup and return of the car. Sparkling inside and out.",
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "What's the difference between the Essential and Premium detail?",
    answer:
      "The Essential is a thorough full detail — everything cleaned and protected, inside and out, finished with a 2-month spray sealant. The Premium adds a sanitized steam treatment for the interior and, on the outside, clay bar decontamination plus a machine polish. That polish removes light scratches and swirls, leaves a noticeably deeper gloss, and extends protection well beyond the spray sealant. If your paint has swirls, dull spots, or years of wear, the Premium is the one that actually corrects them.",
  },
  {
    question: "How long will it take to detail my car?",
    answer:
      "An Essential Full Detail typically takes 3–4 hours. A Premium Full Detail runs 5–6 hours because of the steam treatment and machine polishing stages. Ceramic coating packages take longer — paint correction and multi-layer application add several hours, and some tiers are best scheduled across a day. We'll give you a realistic window when you book, and we text when the car is ready.",
  },
  {
    question: "How does mobile service work?",
    answer:
      "We bring everything to you — water, power, and supplies — and work in your driveway or parking area. Mobile service covers our standard MetroWest service radius around Framingham. All we need is reasonable access to the vehicle and space to work around it.",
  },
  {
    question: "How does your winter pickup and drop-off service work?",
    answer:
      "When the weather turns, you can stay home. We pick the vehicle up from your home or workplace, bring it to the shop, do the work, and return it — usually the same day. It's the same quality of work without you standing in a cold parking lot.",
  },
  {
    question: "How do I drop it off?",
    answer:
      "Our shop is at 874 Edgell Rd in Framingham. We'll confirm your drop-off window when you book, and you leave the keys with us. Pick the service option that fits — drop-off, mobile, or pickup & delivery — right in the booking flow.",
  },
  {
    question: "What if I have pet hair or tree sap?",
    answer:
      "Both are routine for us. Pet hair requires dedicated tools and additional time, and heavy accumulation may add to the quote — we'll always tell you before starting. Tree sap and pollen come off with proper decontamination, which is built into every exterior detail.",
  },
  {
    question: "How do I pay?",
    answer:
      "Cash, check, and all major cards. Payment is due when the work is complete and you've seen the result. No deposits for standard details.",
  },
  {
    question: "How should I care for my car after the detail?",
    answer:
      "Wash with a pH-neutral shampoo using the two-bucket method, and dry with a clean microfiber towel. Avoid automatic brush washes — they're the fastest way to put swirls back into fresh paint. If you have ceramic coating, plain water rinses and a gentle maintenance wash will keep the hydrophobic effect at its best.",
  },
  {
    question: "Are you insured?",
    answer:
      "Yes — fully insured for the vehicles we work on, on-site and in transit for pickup & delivery. We've been operating around MetroWest since 2010.",
  },
];

export const SERVICE_AREAS = [
  "Framingham",
  "Natick",
  "Sudbury",
  "Wayland",
  "Wellesley",
  "Weston",
  "Marlborough",
  "Maynard",
  "Southborough",
  "Ashland",
  "Dover",
  "Sherborn",
  "Holliston",
];

export const BUSINESS = {
  name: "We Care Car Care",
  phone: "(508) 290-7476",
  phoneHref: "tel:+15082907476",
  email: "info@WeCareCarCare.com",
  address: "874 Edgell Rd, Framingham, MA 01701",
  hours: "Mon–Sat · 8:00 AM – 6:00 PM",
  since: 2010,
  stats: {
    years: "16+",
    vehicles: "7,500+",
    rating: "5.0",
    reviewCount: 37,
  },
} as const;

// Booking slot labels presented in the booking flow.
export const TIME_SLOTS = [
  "08:00 AM",
  "09:30 AM",
  "11:00 AM",
  "12:30 PM",
  "02:00 PM",
  "03:30 PM",
] as const;

export interface BookableService {
  key: string;
  name: string;
  prices: Record<VehicleType, number>;
  durationHours: string;
  group: "detail" | "ceramic" | "interior";
  allowCeramicAddOn: boolean;
}

export const BOOKABLE_SERVICES: BookableService[] = [
  ...PACKAGES.map((p) => ({
    key: p.key,
    name: p.name,
    prices: p.prices,
    durationHours: p.durationHours,
    group: "detail" as const,
    allowCeramicAddOn: true,
  })),
  ...CERAMIC_TIERS.map((t) => ({
    key: t.key,
    name: `${t.name} — Ceramic`,
    prices: t.prices,
    durationHours: "Full day",
    group: "ceramic" as const,
    allowCeramicAddOn: false,
  })),
  {
    key: INTERIOR_ONLY.key,
    name: INTERIOR_ONLY.name,
    prices: INTERIOR_ONLY.prices,
    durationHours: INTERIOR_ONLY.durationHours,
    group: "interior" as const,
    allowCeramicAddOn: true,
  },
];
