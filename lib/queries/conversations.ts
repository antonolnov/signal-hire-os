import { cache } from "react";
import { getConversationSessionsView, getConversationSummary } from "../store";

export const getConversationSessions = cache(async () => getConversationSessionsView());

export const getConversationSummaryMetrics = cache(async () => getConversationSummary());
