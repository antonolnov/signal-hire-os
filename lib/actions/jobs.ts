"use server";

import { revalidatePath } from "next/cache";
import { createJobRecord } from "../store";

type CreateJobInput = {
  workspaceSlug: string;
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  descriptionRaw?: string;
};

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function createJob(formData: FormData) {
  const input: CreateJobInput = {
    workspaceSlug: String(formData.get("workspaceSlug") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    department: normalizeField(formData.get("department")),
    location: normalizeField(formData.get("location")),
    employmentType: normalizeField(formData.get("employmentType")),
    descriptionRaw: normalizeField(formData.get("descriptionRaw")),
  };

  if (!input.workspaceSlug || !input.title) {
    throw new Error("workspaceSlug and title are required.");
  }

  await createJobRecord(input);

  revalidatePath("/");
  revalidatePath("/jobs");
}
