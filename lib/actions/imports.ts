"use server";

import { revalidatePath } from "next/cache";
import {
  createCandidateSourceRecord,
  createIngestionRecord,
  deleteCandidateSourceRecord,
  deleteIngestionRecord,
  updateCandidateSourceRecord,
  updateIngestionRecord,
} from "../store";

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function createImportSource(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();

  if (!workspaceSlug || !label || !type) {
    throw new Error("workspaceSlug, label and type are required.");
  }

  await createCandidateSourceRecord({ workspaceSlug, label, type });

  revalidatePath("/");
  revalidatePath("/imports");
  revalidatePath("/candidates");
}

export async function updateImportSource(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();

  if (!sourceId || !label || !type) {
    throw new Error("sourceId, label and type are required.");
  }

  await updateCandidateSourceRecord({ sourceId, label, type });

  revalidatePath("/");
  revalidatePath("/imports");
  revalidatePath("/candidates");
}

export async function deleteImportSource(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();

  if (!sourceId) {
    throw new Error("sourceId is required.");
  }

  await deleteCandidateSourceRecord(sourceId);

  revalidatePath("/");
  revalidatePath("/imports");
  revalidatePath("/candidates");
}

export async function createImportRecord(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const payloadType = String(formData.get("payloadType") ?? "").trim();

  if (!workspaceSlug || !status || !payloadType) {
    throw new Error("workspaceSlug, status and payloadType are required.");
  }

  await createIngestionRecord({
    workspaceSlug,
    sourceId: normalizeField(formData.get("sourceId")),
    jobId: normalizeField(formData.get("jobId")),
    candidateId: normalizeField(formData.get("candidateId")),
    status,
    payloadType,
  });

  revalidatePath("/");
  revalidatePath("/imports");
}

export async function updateImportRecord(formData: FormData) {
  const ingestionId = String(formData.get("ingestionId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const payloadType = String(formData.get("payloadType") ?? "").trim();

  if (!ingestionId || !status || !payloadType) {
    throw new Error("ingestionId, status and payloadType are required.");
  }

  await updateIngestionRecord({ ingestionId, status, payloadType });

  revalidatePath("/");
  revalidatePath("/imports");
}

export async function deleteImportRecord(formData: FormData) {
  const ingestionId = String(formData.get("ingestionId") ?? "").trim();

  if (!ingestionId) {
    throw new Error("ingestionId is required.");
  }

  await deleteIngestionRecord(ingestionId);

  revalidatePath("/");
  revalidatePath("/imports");
}
