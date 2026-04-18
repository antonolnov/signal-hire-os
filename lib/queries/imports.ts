import { cache } from "react";
import { getImportSourcesView, getImportSummary } from "../store";

export const getImportSources = cache(async () => getImportSourcesView());

export const getImportSummaryMetrics = cache(async () => getImportSummary());
