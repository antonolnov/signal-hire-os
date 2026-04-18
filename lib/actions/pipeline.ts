"use server";

import { revalidatePath } from "next/cache";
import { advanceApplicationStageRecord } from "../store";

export async function advanceApplicationStage(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const nextStageId = String(formData.get("nextStageId") ?? "").trim();

  if (!applicationId || !nextStageId) {
    throw new Error("applicationId and nextStageId are required.");
  }

  await advanceApplicationStageRecord({ applicationId, nextStageId });

  revalidatePath("/pipeline");
  revalidatePath("/candidates");
  revalidatePath("/jobs");
}
