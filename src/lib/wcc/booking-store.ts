"use client";

import { create } from "zustand";

interface OpenBookingOptions {
  /** Preselect the 1-Year Ceramic add-on (used by "Smart Add-On" CTAs). */
  addOnCeramic?: boolean;
}

interface WccDialogState {
  bookingOpen: boolean;
  presetService: string | null;
  presetAddOnCeramic: boolean | null;
  questionOpen: boolean;
  openBooking: (serviceKey?: string, options?: OpenBookingOptions) => void;
  closeBooking: () => void;
  openQuestion: () => void;
  closeQuestion: () => void;
}

export const useWccDialogs = create<WccDialogState>((set) => ({
  bookingOpen: false,
  presetService: null,
  presetAddOnCeramic: null,
  questionOpen: false,
  openBooking: (serviceKey, options) =>
    set({
      bookingOpen: true,
      presetService: serviceKey ?? null,
      presetAddOnCeramic: options?.addOnCeramic ?? null,
    }),
  closeBooking: () =>
    set({ bookingOpen: false, presetService: null, presetAddOnCeramic: null }),
  openQuestion: () => set({ questionOpen: true }),
  closeQuestion: () => set({ questionOpen: false }),
}));
