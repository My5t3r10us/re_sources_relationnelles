import { describe, it, expect } from "vitest";
import {
  REPORT_REASON_LABELS,
  REPORT_REASON_VALUES,
  REPORT_TARGET_VALUES,
} from "@/lib/report-labels";

describe("report-labels", () => {
  it("REPORT_REASON_VALUES is non-empty and unique", () => {
    expect(REPORT_REASON_VALUES.length).toBeGreaterThan(0);
    expect(new Set(REPORT_REASON_VALUES).size).toBe(REPORT_REASON_VALUES.length);
  });

  it("every value has a French label", () => {
    for (const v of REPORT_REASON_VALUES) {
      expect(REPORT_REASON_LABELS[v]).toMatch(/.+/);
    }
  });

  it("includes harassment, spam, misinformation, inappropriate, other", () => {
    expect(REPORT_REASON_VALUES).toEqual(
      expect.arrayContaining(["harassment", "spam", "misinformation", "inappropriate", "other"]),
    );
  });

  it("REPORT_TARGET_VALUES is resource and comment", () => {
    expect(REPORT_TARGET_VALUES).toEqual(["resource", "comment"]);
  });
});
