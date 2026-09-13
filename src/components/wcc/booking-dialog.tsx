"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Car,
  Truck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildDayOptions,
  findService,
  quoteFor,
  usd,
  type DayOption,
} from "@/lib/wcc/booking";
import { useWccDialogs } from "@/lib/wcc/booking-store";
import {
  BOOKABLE_SERVICES,
  BUSINESS,
  SERVICE_MODES,
  TIME_SLOTS,
  type VehicleType,
} from "@/data/wcc/content";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;
const SERVICE_MODE_KEYS = ["mobile", "shop", "pickup"] as const;
type ServiceMode = (typeof SERVICE_MODE_KEYS)[number];

interface FormState {
  serviceKey: string;
  vehicleType: VehicleType;
  serviceMode: ServiceMode;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  addOnCeramic: boolean;
}

const SERVICE_GROUPS = [
  { key: "detail", label: "Full Details" },
  { key: "ceramic", label: "Ceramic Coating" },
  { key: "interior", label: "Interior Only" },
] as const;

export function BookingDialog() {
  const open = useWccDialogs((s) => s.bookingOpen);
  const preset = useWccDialogs((s) => s.presetService);
  const close = useWccDialogs((s) => s.closeBooking);

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    serviceKey: "premium-full",
    vehicleType: "sedan",
    serviceMode: "mobile",
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
    addOnCeramic: false,
  });

  const days: DayOption[] = useMemo(() => (open ? buildDayOptions(new Date(), 14) : []), [open]);
  const service = findService(form.serviceKey);
  const quote = quoteFor(form.serviceKey, form.vehicleType, form.addOnCeramic);

  // Reset per-open state.
  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmation(null);
      setSubmitError(null);
      if (preset) setForm((f) => ({ ...f, serviceKey: preset }));
    }
  }, [open, preset]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const step1Valid = Boolean(form.serviceKey);
  const step2Valid = Boolean(form.date && form.time);
  const step3Valid =
    form.name.trim().length >= 2 &&
    /^\+?[\d\s().-]{7,20}$/.test(form.phone.trim()) &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
    (form.serviceMode === "shop" || form.address.trim().length >= 5);

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company: "" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        confirmation?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again or call us.");
        return;
      }
      setConfirmation(data.confirmation ?? "WCC");
      toast.success("Booking request received", {
        description: "We'll confirm by text or email shortly.",
      });
    } catch {
      setSubmitError("Network error — please check your connection or call (508) 290-7476.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDay = days.find((d) => d.iso === form.date);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent className="max-h-[92svh] w-[min(44rem,95vw)] overflow-y-auto border-border bg-background p-0 sm:rounded-lg [&>button]:z-10">
        {/* header */}
        <div className="border-b border-border bg-card/60 px-6 pb-5 pt-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2.5 font-display text-xl font-semibold uppercase tracking-[0.08em]">
              <CalendarCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              Book Your Detail
            </DialogTitle>
            <DialogDescription>
              {confirmation
                ? "Your request is in."
                : "Select your service and pick a time that works for you."}
            </DialogDescription>
          </DialogHeader>

          {/* progress */}
          {!confirmation && (
            <ol className="mt-5 flex items-center gap-2" aria-label={`Step ${step} of 4`}>
              {(["Service", "Date & Time", "You", "Confirm"] as const).map((label, i) => {
                const n = (i + 1) as Step;
                const done = step > n;
                const current = step === n;
                return (
                  <li key={label} className="flex flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-display text-xs font-semibold",
                        done && "border-primary bg-primary text-primary-foreground",
                        current && "border-primary text-primary",
                        !done && !current && "border-border text-muted-foreground",
                      )}
                      aria-current={current ? "step" : undefined}
                    >
                      {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : n}
                    </span>
                    <span
                      className={cn(
                        "hidden text-xs font-semibold uppercase tracking-[0.14em] sm:block",
                        current ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {i < 3 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="px-6 py-6">
          {/* STEP 1 — service */}
          {step === 1 && !confirmation && (
            <div className="space-y-5">
              {/* vehicle */}
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Vehicle type
                </legend>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { key: "sedan", label: "Sedan / Coupe", icon: Car },
                      { key: "suv", label: "SUV / Truck / Van", icon: Truck },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      aria-pressed={form.vehicleType === v.key}
                      onClick={() => set("vehicleType", v.key)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md border px-4 py-3 text-sm font-semibold transition-colors",
                        form.vehicleType === v.key
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      <v.icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                      {v.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {SERVICE_GROUPS.map((group) => {
                const items = BOOKABLE_SERVICES.filter((s) => s.group === group.key);
                if (!items.length) return null;
                return (
                  <fieldset key={group.key}>
                    <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group.label}
                    </legend>
                    <div className="mt-2.5 space-y-2.5">
                      {items.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          aria-pressed={form.serviceKey === s.key}
                          onClick={() => {
                            set("serviceKey", s.key);
                            if (!s.allowCeramicAddOn) set("addOnCeramic", false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3.5 text-left transition-colors",
                            form.serviceKey === s.key
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-foreground">{s.name}</span>
                            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {s.durationHours}
                            </span>
                          </span>
                          <span className="font-display text-lg font-semibold text-primary">
                            {usd(s.prices[form.vehicleType])}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              {/* ceramic add-on */}
              {service?.allowCeramicAddOn && (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.addOnCeramic}
                    onChange={(e) => set("addOnCeramic", e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 accent-[#f2a61c]"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                      Add 1-Year Ceramic — {usd(200)}{" "}
                      <span className="text-xs font-normal text-muted-foreground line-through">
                        {usd(299)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      Applied during your detail — no extra appointment needed.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex items-center justify-between rounded-md bg-secondary/50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Estimated total
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  {quote !== null ? usd(quote) : "—"}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2 — date & time */}
          {step === 2 && !confirmation && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Pick a day
                </h3>
                <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      disabled={d.closed}
                      aria-pressed={form.date === d.iso}
                      onClick={() => set("date", d.iso)}
                      className={cn(
                        "flex flex-col items-center rounded-md border px-1 py-2.5 transition-colors",
                        d.closed && "cursor-not-allowed opacity-30",
                        form.date === d.iso
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                        {d.weekday}
                      </span>
                      <span className="font-display text-lg font-semibold leading-tight">{d.day}</span>
                      <span className="text-[10px] uppercase tracking-[0.08em] opacity-70">{d.month}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  We&apos;re closed Sundays. Need a day further out? Call {BUSINESS.phone}.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Pick a start time
                </h3>
                <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={form.time === t}
                      onClick={() => set("time", t)}
                      className={cn(
                        "rounded-md border px-2 py-2.5 font-display text-sm font-semibold tracking-wide transition-colors",
                        form.time === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {form.date && (
                <p className="rounded-md bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                  <Clock className="mr-1.5 inline h-4 w-4 text-primary" aria-hidden="true" />
                  {selectedDay
                    ? `${selectedDay.weekday}, ${selectedDay.month} ${selectedDay.day} at ${form.time || "— pick a time"}`
                    : ""}
                  {service ? ` · ${service.durationHours}` : ""}
                </p>
              )}
            </div>
          )}

          {/* STEP 3 — contact + mode */}
          {step === 3 && !confirmation && (
            <div className="space-y-5">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  How should we do the work?
                </legend>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                  {SERVICE_MODES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      aria-pressed={form.serviceMode === m.key}
                      onClick={() => set("serviceMode", m.key)}
                      className={cn(
                        "rounded-md border px-4 py-3 text-left transition-colors",
                        form.serviceMode === m.key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        {m.label}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bk-name">Name</Label>
                  <Input
                    id="bk-name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Chris M."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bk-phone">Phone</Label>
                  <Input
                    id="bk-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(508) 555-0123"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-email">Email</Label>
                <Input
                  id="bk-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Mobile and pickup &amp; delivery need an address. Shop drop-off is at {BUSINESS.address}.
              </p>
              {form.serviceMode !== "shop" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="bk-address">Address</Label>
                    <Input
                      id="bk-address"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="12 Maple St"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bk-city">Town</Label>
                    <Input
                      id="bk-city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Natick"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="bk-notes">Vehicle &amp; notes (optional)</Label>
                <Textarea
                  id="bk-notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="2021 Subaru Outback — dog hair in the back, sap on the hood."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* STEP 4 — confirm */}
          {step === 4 && !confirmation && (
            <div className="space-y-4">
              <dl className="divide-y divide-border rounded-md border border-border">
                {[
                  { term: "Service", desc: service?.name ?? "" },
                  {
                    term: "Vehicle",
                    desc: form.vehicleType === "sedan" ? "Sedan / Coupe" : "SUV / Truck / Van",
                  },
                  {
                    term: "When",
                    desc: selectedDay
                      ? `${selectedDay.weekday}, ${selectedDay.month} ${selectedDay.day} · ${form.time}`
                      : "",
                  },
                  {
                    term: "Mode",
                    desc: SERVICE_MODES.find((m) => m.key === form.serviceMode)?.label ?? "",
                  },
                  { term: "Name", desc: form.name },
                  { term: "Phone", desc: form.phone },
                  { term: "Email", desc: form.email },
                  ...(form.serviceMode !== "shop"
                    ? [{ term: "Address", desc: [form.address, form.city].filter(Boolean).join(", ") }]
                    : []),
                  ...(form.addOnCeramic && service?.allowCeramicAddOn
                    ? [{ term: "Add-on", desc: "1-Year Ceramic Coating (+$200)" }]
                    : []),
                  ...(form.notes ? [{ term: "Notes", desc: form.notes }] : []),
                ].map((row) => (
                  <div key={row.term} className="flex items-start justify-between gap-6 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {row.term}
                    </dt>
                    <dd className="max-w-[65%] text-right text-sm text-foreground">{row.desc}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between rounded-md bg-primary/10 px-4 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Estimated total
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  {quote !== null ? usd(quote) : "—"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This is a request — we&apos;ll confirm your window by text or email before locking
                it in. Final pricing is confirmed at drop-off based on vehicle condition.
              </p>
              {submitError && (
                <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {confirmation && (
            <div className="py-4 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-8 w-8 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold uppercase tracking-wide">
                You&apos;re on the schedule board
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Request received{selectedDay ? ` for ${selectedDay.weekday}, ${selectedDay.month} ${selectedDay.day} at ${form.time}` : ""}.
                We&apos;ll text or email to confirm your window. Confirmation{" "}
                <span className="font-semibold text-foreground">{confirmation}</span>.
              </p>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 text-primary" aria-hidden="true" />
                Need to change something? Call {BUSINESS.phone}.
              </p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                5.0 · 7,500+ vehicles detailed
              </p>
              <Button
                onClick={close}
                className="shine mt-7 h-12 bg-primary px-8 font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {/* footer nav */}
        {!confirmation && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card/60 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1 || submitting}
              className="font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Prefer to talk? {BUSINESS.phone}
            </span>
            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => ((s + 1) as Step))}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)}
                className="h-11 bg-primary font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
              >
                Continue
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting || !step3Valid}
                className="shine h-11 bg-primary font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
                {submitting ? "Sending..." : "Request Booking"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
