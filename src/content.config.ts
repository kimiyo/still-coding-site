import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const notes = defineCollection({
  // Notes live in one folder per app (src/content/notes/<app-id>/), but the entry id, and so the URL,
  // is just the file name. File names must therefore be unique across folders.
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/notes",
    generateId: ({ entry }) => entry.replace(/^.*\//, "").replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    app: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
