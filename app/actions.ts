"use server";

import { createJob as createJobMutation } from "../lib/actions/jobs";

export async function createJob(formData: FormData) {
  const title = String(formData.get("title") || "").trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  await createJobMutation(formData);
}
