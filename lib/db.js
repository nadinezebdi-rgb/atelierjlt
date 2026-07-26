import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'ginette'

let cached = global.__ginetteMongo
if (!cached) cached = global.__ginetteMongo = { client: null, db: null }

export async function getDb() {
  if (cached.db) return cached.db
  const client = new MongoClient(uri)
  await client.connect()
  cached.client = client
  cached.db = client.db(dbName)
  return cached.db
}
