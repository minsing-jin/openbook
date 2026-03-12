import { importFromUrl } from "@openbook/importer";
import { cacheJob, serializeJob } from "../../../../lib/server-job-cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };
  if (!body.url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  const job = await importFromUrl(body.url);
  cacheJob(job);
  return Response.json(serializeJob(job));
}
