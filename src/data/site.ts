export const site = {
  name: "Still Coding",
  url: "https://still-coding.cc",
  operator: "JH Kim",
  contactEmail: "still.coding.cc@gmail.com",
  githubUrl: "https://github.com/kimiyo",
  issuesUrl: "https://github.com/kimiyo/still-coding-site/issues/new",
} as const;

// AdSense publisher ID in the "ca-pub-XXXXXXXXXXXXXXXX" form. Leave it unset until the
// account issues a real ID; the verification tag and ads.txt stay empty without it.
const rawAdsenseClient = (import.meta.env.PUBLIC_ADSENSE_CLIENT ?? "").trim();
export const adsenseClient = /^ca-pub-\d{16}$/.test(rawAdsenseClient) ? rawAdsenseClient : "";
export const adsensePublisherId = adsenseClient.replace(/^ca-/, "");
