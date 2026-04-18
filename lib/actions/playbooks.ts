"use server";

import { revalidatePath } from "next/cache";
import { createPlaybookRecord } from "../store";

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function createPlaybook(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const targetStageId = normalizeField(formData.get("targetStageId"));
  const channelType = normalizeField(formData.get("channelType"));
  const objective = normalizeField(formData.get("objective"));
  const instructions = normalizeField(formData.get("instructions"));
  const autonomyMode = normalizeField(formData.get("autonomyMode"));

  if (!workspaceSlug || !name) {
    throw new Error("workspaceSlug and name are required.");
  }

  await createPlaybookRecord({
    workspaceSlug,
    name,
    targetStageId,
    channelType,
    objective,
    instructions,
    autonomyMode,
  });

  revalidatePath("/");
  revalidatePath("/playbooks");
  revalidatePath("/conversations");
}
