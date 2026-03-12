import type { ImportJob, LibraryItem } from "@openbook/core";
import { createId, formatNow } from "@openbook/core";
import { cacheJob, serializeJob } from "../../../../lib/server-job-cache";

export async function POST(request: Request) {
  const body = (await request.json()) as { fileName?: string; dataUrl?: string };
  if (!body.fileName || !body.dataUrl) {
    return Response.json({ error: "Missing fileName or dataUrl" }, { status: 400 });
  }

  const now = formatNow();
  const item: LibraryItem = {
    id: createId("item"),
    kind: "pdf_book",
    title: body.fileName,
    sourceUrl: body.dataUrl,
    description: "Locally imported PDF ready for offline reading.",
    createdAt: now,
    lastOpenedAt: now,
    language: "und",
    tags: ["pdf", "local"],
    importStatus: "ready"
  };

  const job: ImportJob = {
    jobId: createId("job"),
    sourceUrl: body.fileName,
    sourceMode: "url",
    stage: "completed",
    progress: 100,
    detectedKind: "pdf_book",
    completeness: "full",
    createdAt: now,
    updatedAt: now,
    logs: [`Imported local PDF ${body.fileName}`],
    item
  };

  cacheJob(job);
  return Response.json(serializeJob(job));
}
