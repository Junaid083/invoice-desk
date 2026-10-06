import { describe, expect, it } from "vitest";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats integer cents as dollars", () => {
    expect(formatMoney(891_575)).toBe("$8,915.75");
    expect(formatMoney(0)).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("formats in UTC so a date never shifts by timezone", () => {
    expect(formatDate("2026-10-08T00:00:00.000Z")).toBe("Oct 8, 2026");
  });
});

describe("daysUntil", () => {
  const now = new Date("2026-10-06T15:30:00Z");

  it("counts whole days from today", () => {
    expect(daysUntil("2026-10-08T00:00:00Z", now)).toBe(2);
    expect(daysUntil("2026-10-06T00:00:00Z", now)).toBe(0);
  });

  it("is negative for past dates", () => {
    expect(daysUntil("2026-10-03T00:00:00Z", now)).toBe(-3);
  });
});
