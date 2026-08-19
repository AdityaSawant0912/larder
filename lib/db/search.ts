import { ObjectId } from "mongodb";

// Builds the $search stage shared by globalItems/userItems name search —
// fuzzy + autocomplete per docs/02-database-schema.md. Requires the Atlas
// Search index named "default" to exist on the collection (see
// lib/db/searchIndexes.ts for the index definitions).
export function nameSearchStage(query: string, opts?: { userId?: ObjectId }) {
  const compoundShould = [
    {
      autocomplete: {
        query,
        path: "name",
        fuzzy: { maxEdits: 1 },
      },
    },
    {
      text: {
        query,
        path: "name",
        fuzzy: { maxEdits: 1 },
      },
    },
  ];

  const filter = opts?.userId
    ? [{ equals: { path: "userId", value: opts.userId } }]
    : undefined;

  return {
    $search: {
      index: "default",
      compound: {
        should: compoundShould,
        minimumShouldMatch: 1,
        ...(filter ? { filter } : {}),
      },
    },
  };
}
