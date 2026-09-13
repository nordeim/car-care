import { describe, it, expect, beforeEach } from "vitest";

// B5 — dialog store supports ceramic add-on preselection (API under construction).
import { useWccDialogs } from "@/lib/wcc/booking-store";

const reset = () => {
  useWccDialogs.setState({
    bookingOpen: false,
    presetService: null,
    presetAddOnCeramic: null,
    questionOpen: false,
  });
};

describe("useWccDialogs store", () => {
  beforeEach(reset);

  it("opens booking without a preset", () => {
    useWccDialogs.getState().openBooking();
    const s = useWccDialogs.getState();
    expect(s.bookingOpen).toBe(true);
    expect(s.presetService).toBeNull();
    expect(s.presetAddOnCeramic).toBeNull();
  });

  it("opens booking with a service preset", () => {
    useWccDialogs.getState().openBooking("interior-only");
    const s = useWccDialogs.getState();
    expect(s.bookingOpen).toBe(true);
    expect(s.presetService).toBe("interior-only");
  });

  it("opens booking with the ceramic add-on preselected", () => {
    useWccDialogs.getState().openBooking("premium-full", { addOnCeramic: true });
    const s = useWccDialogs.getState();
    expect(s.bookingOpen).toBe(true);
    expect(s.presetService).toBe("premium-full");
    expect(s.presetAddOnCeramic).toBe(true);
  });

  it("clears presets on close", () => {
    useWccDialogs.getState().openBooking("premium-full", { addOnCeramic: true });
    useWccDialogs.getState().closeBooking();
    const s = useWccDialogs.getState();
    expect(s.bookingOpen).toBe(false);
    expect(s.presetService).toBeNull();
    expect(s.presetAddOnCeramic).toBeNull();
  });

  it("opens and closes the question dialog", () => {
    useWccDialogs.getState().openQuestion();
    expect(useWccDialogs.getState().questionOpen).toBe(true);
    useWccDialogs.getState().closeQuestion();
    expect(useWccDialogs.getState().questionOpen).toBe(false);
  });
});
