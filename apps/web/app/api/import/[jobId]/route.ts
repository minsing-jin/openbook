import { getJob, serializeJob } from "../../../../lib/server-job-cache";

export async function GET(_request: Request, context: { params: { jobId: string } }) {
  const job = getJob(context.params.jobId);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json(serializeJob(job));
}
