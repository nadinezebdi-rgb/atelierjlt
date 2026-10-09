import { v4 as uuid } from 'uuid'
import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, url }) {
  const db = await getDb()
  if (method === 'GET') {
    const items = await db.collection('coupons').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ coupons: items })
  }
  if (method === 'POST') {
    const body = await request.json()
    await db.collection('coupons').insertOne({
      _id: uuid(),
      code: (body.code || '').toUpperCase(),
      type: body.type || 'percent',
      value: Number(body.value) || 0,
      label: body.label || '',
      active: body.active !== false,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  }
  if (method === 'DELETE') {
    const id = url.searchParams.get('id')
    await db.collection('coupons').deleteOne({ _id: id })
    return NextResponse.json({ ok: true })
  }
  return null
}
