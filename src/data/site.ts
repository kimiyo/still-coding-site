/** Root domain. Apps live at <app>.APP_DOMAIN and the portal at APP_DOMAIN itself. */
export const APP_DOMAIN = "still-coding.com";
/** Domain apps stay on until they move; remove this and `migratedApps` once every app has. */
const LEGACY_APP_DOMAIN = "still-coding.cc";
/** Subdomains already served from APP_DOMAIN. Add an app's name here when its migration goes live. */
const migratedApps = new Set<string>(["user-feedback"]);

/** Absolute URL of an app (or service) subdomain; `path` has no leading slash, e.g. "guide/". */
export function appUrl(app: string, path = ""): string {
  return `https://${app}.${migratedApps.has(app) ? APP_DOMAIN : LEGACY_APP_DOMAIN}/${path}`;
}

/** Origin without a trailing slash, for building `${origin}/some/path` strings. */
export function appOrigin(app: string): string {
  return appUrl(app).slice(0, -1);
}

export const site = {
  name: "Still Coding",
  url: `https://${APP_DOMAIN}`,
  operator: "JH Kim",
  contactEmail: "still.coding.com@gmail.com",
  githubUrl: "https://github.com/kimiyo",
  issuesUrl: "https://github.com/kimiyo/still-coding-site/issues/new",
} as const;

// AdSense publisher ID in the "ca-pub-XXXXXXXXXXXXXXXX" form. Leave it unset until the
// account issues a real ID; the verification tag and ads.txt stay empty without it.
const rawAdsenseClient = (import.meta.env.PUBLIC_ADSENSE_CLIENT ?? "").trim();
export const adsenseClient = /^ca-pub-\d{16}$/.test(rawAdsenseClient) ? rawAdsenseClient : "";
export const adsensePublisherId = adsenseClient.replace(/^ca-/, "");
