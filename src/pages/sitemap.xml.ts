import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { apps } from "../data/apps";
import { site } from "../data/site";

// Built from the same data as the pages, so a new app or note cannot be left out.
export const GET: APIRoute = async () => {
  const publicApps = apps.filter(app => app.status === "public");
  const translated = ["/", "/about/", "/privacy/", "/terms/", "/contact/", ...publicApps.map(app => `/apps/${app.id}/`)];
  const notes = await getCollection("notes");
  const entries: { path: string; lastmod?: Date }[] = [
    ...translated.map(path => ({ path })),
    ...translated.map(path => ({ path: path === "/" ? "/en/" : `/en${path}` })),
    { path: "/notes/" },
    ...notes.map(note => ({ path: `/notes/${note.id}/`, lastmod: note.data.updatedDate ?? note.data.pubDate })),
  ];
  const body = entries
    .map(({ path, lastmod }) => `  <url><loc>${new URL(path, site.url)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`)
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
