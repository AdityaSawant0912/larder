import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/db/connection";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

// Better Auth owns the "user" collection directly via its Mongo adapter
// (mapKeysTransformOutput: { _id: "id" } — _id is a real ObjectId on disk,
// exposed as its hex string everywhere else in the app), so this reads it
// straight rather than going through lib/db/collections.ts.
export async function getUsersByIds(ids: string[]): Promise<UserSummary[]> {
  if (ids.length === 0) return [];
  const client = await getMongoClient();
  const docs = await client
    .db()
    .collection<{ _id: ObjectId; name: string; email: string }>("user")
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .toArray();
  return docs.map((d) => ({ id: d._id.toHexString(), name: d.name, email: d.email }));
}
