import { getCollection, type CollectionEntry } from "astro:content";
import { apps, type PortfolioApp } from "../data/apps";

export type Note = CollectionEntry<"notes">;

const appIds = new Set(apps.map(app => app.id));

// Drafts are visible in `astro dev` so they can be edited in place, and never reach a production build.
const showDrafts = import.meta.env.DEV;

/** Newest first. Fails the build when a note points at an app that does not exist. */
export async function getSortedNotes(): Promise<Note[]> {
  const all = await getCollection("notes");
  for (const note of all) {
    if (note.data.app && !appIds.has(note.data.app)) {
      throw new Error(`Note "${note.id}" has app "${note.data.app}", which is not in src/data/apps.ts.`);
    }
  }
  for (const note of all) {
    // Keep the folder layout honest: notes/<app-id>/ for an app, notes/portal/ for the rest.
    const folder = note.filePath?.replace(/\\/g, "/").split("/notes/")[1]?.split("/")[0];
    const expected = note.data.app ?? "portal";
    if (folder !== expected) {
      throw new Error(`Note "${note.id}" is in folder "${folder}" but belongs in src/content/notes/${expected}/.`);
    }
  }
  for (const note of all) {
    // Draft notes carry <!-- TODO(사용자) --> prompts for the author; they must not reach a published page.
    if (!note.data.draft && note.body?.includes("TODO(사용자)")) {
      throw new Error(`Note "${note.id}" is published but still has a TODO(사용자) comment. Resolve it or keep draft: true.`);
    }
  }
  return all
    .filter(note => showDrafts || !note.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getNotesByApp(appId: string): Promise<Note[]> {
  return (await getSortedNotes()).filter(note => note.data.app === appId);
}

export async function getNoteCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const note of await getSortedNotes()) {
    if (note.data.app) counts[note.data.app] = (counts[note.data.app] ?? 0) + 1;
  }
  return counts;
}

/** Public apps that have at least one note, in the order they appear on the portal. */
export async function getAppsWithNotes(): Promise<{ app: PortfolioApp; notes: Note[] }[]> {
  const notes = await getSortedNotes();
  return apps
    .filter(app => app.status === "public")
    .sort((a, b) => a.order - b.order)
    .map(app => ({ app, notes: notes.filter(note => note.data.app === app.id) }))
    .filter(group => group.notes.length > 0);
}

/** URL segment for a tag; keeps letters of any script so Korean tags stay readable. */
export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

/** Tags used by at least two notes, most used first. Single-note tags would only make thin pages. */
export async function getTagGroups(): Promise<{ tag: string; slug: string; notes: Note[] }[]> {
  const byTag = new Map<string, Note[]>();
  for (const note of await getSortedNotes()) {
    for (const tag of note.data.tags) byTag.set(tag, [...(byTag.get(tag) ?? []), note]);
  }
  const groups = [...byTag].filter(([, notes]) => notes.length >= 2).map(([tag, notes]) => ({ tag, slug: tagSlug(tag), notes }));
  const slugs = new Set(groups.map(group => group.slug));
  if (slugs.size !== groups.length) throw new Error("Two note tags map to the same URL slug; rename one of them.");
  return groups.sort((a, b) => b.notes.length - a.notes.length || a.tag.localeCompare(b.tag));
}

export function noteUpdatedAt(note: Note): Date {
  return note.data.updatedDate ?? note.data.pubDate;
}
