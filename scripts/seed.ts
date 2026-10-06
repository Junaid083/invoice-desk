import { closeDb, getDb } from "../lib/mongodb";
import { INVOICES } from "../lib/collections";
import { seedDatabase } from "../lib/seed";

async function main() {
  const count = await seedDatabase(await getDb());
  console.log(`Seeded ${count} invoices into "${INVOICES}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
