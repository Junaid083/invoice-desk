import { describe, expect, it } from "vitest";
import {
  STATUSES,
  canTransition,
  isFinal,
  isStatus,
  isTabKey,
  tabForStatus,
  type InvoiceStatus,
} from "@/lib/status";

describe("status rules", () => {
  const allowed: [InvoiceStatus, InvoiceStatus][] = [
    ["PROCESSING", "NEEDS_REVIEW"],
    ["PROCESSING", "APPROVED"],
    ["PROCESSING", "REJECTED"],
    ["NEEDS_REVIEW", "APPROVED"],
    ["NEEDS_REVIEW", "REJECTED"],
  ];

  it("allows only the documented transitions", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const expected = allowed.some(([f, t]) => f === from && t === to);
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(expected);
      }
    }
  });

  it("treats approved and rejected as final", () => {
    expect(STATUSES.filter(isFinal)).toEqual(["APPROVED", "REJECTED"]);
  });

  it("recognises valid statuses only", () => {
    expect(isStatus("NEEDS_REVIEW")).toBe(true);
    expect(isStatus("PAID")).toBe(false);
    expect(isStatus("approved")).toBe(false);
  });

  it("maps every status to its tab", () => {
    expect(tabForStatus("PROCESSING")).toBe("processing");
    expect(tabForStatus("NEEDS_REVIEW")).toBe("review");
    expect(tabForStatus("APPROVED")).toBe("decided");
    expect(tabForStatus("REJECTED")).toBe("decided");
  });

  it("validates tab keys from the URL", () => {
    expect(isTabKey("review")).toBe(true);
    expect(isTabKey("archive")).toBe(false);
    expect(isTabKey(null)).toBe(false);
  });
});
