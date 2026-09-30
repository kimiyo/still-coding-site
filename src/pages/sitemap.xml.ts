import type { APIRoute } from "astro";
import { apps } from "../data/apps";
import { site } from "../data/site";
import { getAppsWithNotes, getSortedNotes, noteUpdatedAt } from "../lib/notes";

// Built from the same data as the pages, so a new app or note cannot be left out.
export const GET: APIRoute = async () => {
  const publicApps = apps.filter(app => app.status === "public");
  const translated = ["/", "/about/", "/privacy/", "/terms/", "/contact/", ...publicApps.map(app => `/apps/${app.id}/`)];
  const notes = await getSortedNotes();
  const groups = await getAppsWithNotes();
  const latest = (list: typeof notes) => list.map(noteUpdatedAt).sort((a, b) => b.valueOf() - a.valueOf())[0];
  const entries: { path: string; lastmod?: Date }[] = [
    ...translated.map(path => ({ path })),
    ...translated.map(path => ({ path: path === "/" ? "/en/" : `/en${path}` })),
    { path: "/notes/", lastmod: notes.length ? latest(notes) : undefined },
    ...groups.map(({ app, notes: appNotes }) => ({ path: `/notes/app/${app.id}/`, lastmod: latest(appNotes) })),
    ...notes.map(note => ({ path: `/notes/${note.id}/`, lastmod: noteUpdatedAt(note) })),
  ];
  const body = entries
    .map(({ path, lastmod }) => `  <url><loc>${new URL(path, site.url)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`)
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
