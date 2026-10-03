// Dates shown at the top of the privacy policy and terms, shared by the Korean and English pages.
// Bump `updated` in the same commit that changes the policy text; `effective` stays the first date the document applied.
export const policyDates = {
  privacy: { effective: "2026-09-27", updated: "2026-10-03" },
  terms: { effective: "2026-09-27", updated: "2026-10-03" },
} as const;

export type PolicyName = keyof typeof policyDates;
