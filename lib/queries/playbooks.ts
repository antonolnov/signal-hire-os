import { cache } from "react";
import { getPlaybookSummary, getPlaybooksView } from "../store";

export const getPlaybooks = cache(async () => getPlaybooksView());

export const getPlaybookSummaryMetrics = cache(async () => getPlaybookSummary());
