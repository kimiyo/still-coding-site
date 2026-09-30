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

export function noteUpdatedAt(note: Note): Date {
  return note.data.updatedDate ?? note.data.pubDate;
}
