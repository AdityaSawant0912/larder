// Atlas Search index definitions for globalItems.name and userItems.name —
// fuzzy + autocomplete, per docs/02-database-schema.md. Applied by
// scripts/setup-search-indexes.ts once MONGODB_URI points at a real Atlas
// cluster (Atlas Search isn't available on a local/non-Atlas mongod).
export const nameSearchIndexDefinition = {
  name: "default",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        name: [{ type: "string" }, { type: "autocomplete" }],
        userId: { type: "objectId" },
      },
    },
  },
};

export const SEARCH_INDEXED_COLLECTIONS = ["globalItems", "userItems"] as const;
