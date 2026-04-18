import { cache } from "react";
import { getCandidateSummary, getCandidatesView } from "../store";

export const getCandidates = cache(async () => getCandidatesView());

export const getCandidateSummaryMetrics = cache(async () => getCandidateSummary());
