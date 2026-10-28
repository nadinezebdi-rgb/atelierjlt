import crypto from 'node:crypto'
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'
import { runCartReminders } from '@/lib/cart-reminders'

function authorized(request) {
  const secret = process.env.WEBHOOK_CRON_SECRET || ''
  const h = request.headers.get('authorization') || ''
  if (!secret || !h.startsWith('Bearer ')) return false
  const a = Buffer.from(h.slice(7)), b = Buffer.from(secret)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// POST /api/cron/cart-reminders — appelé par le planificateur Emergent toutes les 15 min.
export async function handle({ request, method, sub }) {
  // Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
  if (sub !== 'cart-reminders' || !['POST', 'PUT'].includes(method)) return null
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const envelope = await request.json().catch(() => null)
  if (!envelope || typeof envelope !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const runId = request.headers.get('x-webhook-id') || envelope.run_id || `manual-${Date.now()}`
  const db = await getDb()
  try {
    await db.collection('cron_runs').insertOne({ _id: runId, name: 'cart-reminders', startedAt: new Date() })
  } catch (e) {
    if (e?.code === 11000) return NextResponse.json({ ok: true, duplicate: true }, { status: 202 })
    return NextResponse.json({ error: 'Could not record run' }, { status: 500 })
  }
  // Travail en arrière-plan : on répond tout de suite.
  runCartReminders()
    .then((r) => db.collection('cron_runs').updateOne({ _id: runId }, { $set: { finishedAt: new Date(), result: r } }))
    .catch((e) => db.collection('cron_runs').updateOne({ _id: runId }, { $set: { finishedAt: new Date(), error: String(e?.message || e) } }))
  return NextResponse.json({ ok: true, accepted: true, runId }, { status: 202 })
}
