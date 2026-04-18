import { cache } from "react";
import { getPipelineBoardView, getPipelineSummary } from "../store";

export const getPipelineBoard = cache(async () => getPipelineBoardView());

export const getPipelineSummaryMetrics = cache(async () => getPipelineSummary());
