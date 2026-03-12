import type { ImportBundle } from "@openbook/core";
import { importFromBundle } from "@openbook/importer";
import { cacheJob, serializeJob } from "../../../../lib/server-job-cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const bundle = (await request.json()) as ImportBundle;
  const job = await importFromBundle(bundle);
  cacheJob(job);
  return Response.json(serializeJob(job));
}
