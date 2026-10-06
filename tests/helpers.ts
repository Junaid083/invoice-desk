import { afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { closeDb, getDb } from "@/lib/mongodb";
import { seedDatabase } from "@/lib/seed";
import { GET as listInvoices } from "@/app/api/invoices/route";
import { GET as getInvoice } from "@/app/api/invoices/[id]/route";
import { PATCH as patchStatus } from "@/app/api/invoices/[id]/status/route";

/** Reseeds the test database before each test and closes the client at the end. */
export function setupSeededDb() {
  beforeEach(async () => {
    await seedDatabase(await getDb());
  });
  afterAll(() => closeDb());
}

const BASE = "http://localhost/api/invoices";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function json(res: Response) {
  return { status: res.status, body: await res.json() };
}

export const api = {
  list: (query = "") => listInvoices(new NextRequest(`${BASE}${query}`)).then(json),
  get: (id: string) => getInvoice(new NextRequest(`${BASE}/${id}`), ctx(id)).then(json),
  patch: (id: string, body: unknown) =>
    patchStatus(
      new NextRequest(`${BASE}/${id}/status`, {
        method: "PATCH",
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
      ctx(id)
    ).then(json),
};
