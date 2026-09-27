import type { APIRoute } from "astro";
import { adsensePublisherId } from "../data/site";

// Never publish a placeholder publisher ID. The line appears only when PUBLIC_ADSENSE_CLIENT
// holds the real "ca-pub-" value issued by the AdSense account.
export const GET: APIRoute = () => {
  const body = adsensePublisherId
    ? `google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Still Coding ads.txt — no authorized sellers are configured yet.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
