import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, url }) {
  const db = await getDb()
  if (method === 'GET') {
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ orders })
  }
  if (method === 'PATCH') {
    const id = url.searchParams.get('id')
    const body = await request.json()
    await db.collection('orders').updateOne({ _id: id }, { $set: body })
    return NextResponse.json({ ok: true })
  }
  return null
}
