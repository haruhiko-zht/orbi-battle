import jobsData from "../../data/jobs.json";
import type { JobDefinition } from "../../types/content";

const jobMap = new Map<string, JobDefinition>();

for (const job of jobsData as JobDefinition[]) {
  jobMap.set(job.id, job);
}

export function getJobDefinition(jobId?: string): JobDefinition | undefined {
  if (!jobId) return undefined;
  return jobMap.get(jobId);
}

export function getAllJobs(): JobDefinition[] {
  return Array.from(jobMap.values());
}
