import { MongoClient, ObjectId, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  }

  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = new MongoClient(uri).connect().catch((err) => {
      globalForMongo.mongoClientPromise = undefined; // allow a retry on the next request
      throw err;
    });
  }
  return globalForMongo.mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB ?? "invoice_desk");
}

export async function closeDb() {
  if (!globalForMongo.mongoClientPromise) return;
  const client = await globalForMongo.mongoClientPromise;
  await client.close();
  globalForMongo.mongoClientPromise = undefined;
}

export function toObjectId(id: string): ObjectId | null {
  return /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null;
}
