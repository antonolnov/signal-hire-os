import { ensureStoreSeeded } from "./store";

export async function ensureSeedData() {
  await ensureStoreSeeded();
}

export async function ensureConversationDemoData() {
  await ensureStoreSeeded();
}
