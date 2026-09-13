"use client";

import { useState } from "react";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";
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
import { BUSINESS } from "@/data/wcc/content";
import { useWccDialogs } from "@/lib/wcc/booking-store";

export function QuestionDialog() {
  const open = useWccDialogs((s) => s.questionOpen);
  const close = useWccDialogs((s) => s.closeQuestion);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", question: "" });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const valid =
    form.name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) &&
    form.question.trim().length >= 10;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company: "" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError(`Network error — please check your connection or call ${BUSINESS.phone}.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) return;
        close();
        // Reset for next open once the close animation finishes.
        setTimeout(() => {
          setSent(false);
          setError(null);
          setForm({ name: "", email: "", phone: "", question: "" });
        }, 250);
      }}
    >
      <DialogContent className="w-[min(30rem,95vw)] border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-[0.08em]">
            <MessageCircleQuestion className="h-5 w-5 text-primary" aria-hidden="true" />
            Ask A Question
          </DialogTitle>
          <DialogDescription>
            Not sure which package fits, or what your paint needs? Ask — we answer fast.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-3 text-center">
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
              Got it — thanks!
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We&apos;ll get back to you shortly. For anything urgent, call{" "}
              <a href={BUSINESS.phoneHref} className="font-semibold text-primary hover:underline">
                {BUSINESS.phone}
              </a>
              .
            </p>
            <Button
              onClick={close}
              className="shine mt-6 h-11 bg-primary px-7 font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="q-name">Name</Label>
                <Input
                  id="q-name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Chris M."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-phone">Phone (optional)</Label>
                <Input
                  id="q-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(508) 555-0123"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-email">Email</Label>
              <Input
                id="q-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-body">Your question</Label>
              <Textarea
                id="q-body"
                value={form.question}
                onChange={(e) => set("question", e.target.value)}
                placeholder="I have a 2019 CR-V with two kids and a golden retriever — what do you recommend?"
                rows={4}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                {error}
              </p>
            )}
            <Button
              onClick={submit}
              disabled={submitting || !valid}
              className="shine h-12 w-full bg-primary font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? "Sending..." : "Send Question"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
