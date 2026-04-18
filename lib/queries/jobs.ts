import { cache } from "react";
import { getJobSummary, getJobsView } from "../store";

export const getJobs = cache(async () => getJobsView());

export const getJobSummaryMetrics = cache(async () => getJobSummary());
