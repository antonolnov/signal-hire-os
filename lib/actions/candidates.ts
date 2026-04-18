"use server";

import { revalidatePath } from "next/cache";
import {
  createCandidateRecord,
  deleteCandidateRecord,
  updateCandidateRecord,
} from "../store";

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSkills(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const skills = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return skills.length > 0 ? skills : undefined;
}

export async function createCandidate(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!workspaceSlug || !fullName) {
    throw new Error("workspaceSlug and fullName are required.");
  }

  await createCandidateRecord({
    workspaceSlug,
    fullName,
    email: normalizeField(formData.get("email")),
    phone: normalizeField(formData.get("phone")),
    location: normalizeField(formData.get("location")),
    headline: normalizeField(formData.get("headline")),
    linkedinUrl: normalizeField(formData.get("linkedinUrl")),
    summary: normalizeField(formData.get("summary")),
    seniority: normalizeField(formData.get("seniority")),
    currentCompany: normalizeField(formData.get("currentCompany")),
    yearsExperience: parseOptionalNumber(formData.get("yearsExperience")),
    skills: parseSkills(formData.get("skills")),
    workPreference: normalizeField(formData.get("workPreference")),
    jobId: normalizeField(formData.get("jobId")),
    sourceId: normalizeField(formData.get("sourceId")),
    currentStageId: normalizeField(formData.get("currentStageId")),
    fitLevel: normalizeField(formData.get("fitLevel")),
    fitConfidence: normalizeField(formData.get("fitConfidence")),
    recommendedNextStep: normalizeField(formData.get("recommendedNextStep")),
  });

  revalidatePath("/");
  revalidatePath("/candidates");
  revalidatePath("/pipeline");
  revalidatePath("/imports");
}

export async function updateCandidate(formData: FormData) {
  const candidateId = String(formData.get("candidateId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!candidateId || !fullName) {
    throw new Error("candidateId and fullName are required.");
  }

  await updateCandidateRecord({
    candidateId,
    fullName,
    email: normalizeField(formData.get("email")),
    phone: normalizeField(formData.get("phone")),
    location: normalizeField(formData.get("location")),
    headline: normalizeField(formData.get("headline")),
    linkedinUrl: normalizeField(formData.get("linkedinUrl")),
    summary: normalizeField(formData.get("summary")),
    seniority: normalizeField(formData.get("seniority")),
    currentCompany: normalizeField(formData.get("currentCompany")),
    yearsExperience: parseOptionalNumber(formData.get("yearsExperience")),
    skills: parseSkills(formData.get("skills")),
    workPreference: normalizeField(formData.get("workPreference")),
  });

  revalidatePath("/");
  revalidatePath("/candidates");
  revalidatePath("/conversations");
}

export async function deleteCandidate(formData: FormData) {
  const candidateId = String(formData.get("candidateId") ?? "").trim();

  if (!candidateId) {
    throw new Error("candidateId is required.");
  }

  await deleteCandidateRecord(candidateId);

  revalidatePath("/");
  revalidatePath("/candidates");
  revalidatePath("/pipeline");
  revalidatePath("/conversations");
  revalidatePath("/imports");
}
