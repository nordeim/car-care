"use client";

import { create } from "zustand";

interface WccDialogState {
  bookingOpen: boolean;
  presetService: string | null;
  questionOpen: boolean;
  openBooking: (serviceKey?: string) => void;
  closeBooking: () => void;
  openQuestion: () => void;
  closeQuestion: () => void;
}

export const useWccDialogs = create<WccDialogState>((set) => ({
  bookingOpen: false,
  presetService: null,
  questionOpen: false,
  openBooking: (serviceKey) => set({ bookingOpen: true, presetService: serviceKey ?? null }),
  closeBooking: () => set({ bookingOpen: false, presetService: null }),
  openQuestion: () => set({ questionOpen: true }),
  closeQuestion: () => set({ questionOpen: false }),
}));
