import type { ImportJob } from "@openbook/core";

const globalForJobs = globalThis as typeof globalThis & {
  __openbookJobs?: Map<string, ImportJob>;
};

const jobs = globalForJobs.__openbookJobs ?? new Map<string, ImportJob>();
globalForJobs.__openbookJobs = jobs;

export function cacheJob(job: ImportJob) {
  jobs.set(job.jobId, job);
}

export function getJob(jobId: string) {
  return jobs.get(jobId);
}

export function serializeJob(job: ImportJob): ImportJob {
  return JSON.parse(JSON.stringify(job)) as ImportJob;
}
