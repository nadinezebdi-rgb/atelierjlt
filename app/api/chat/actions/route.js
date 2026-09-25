import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { undoAction } from '@/lib/ai/commands'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET  /api/chat/actions               → 15 dernières actions (admin)
 * POST /api/chat/actions               → { actionId } → undo
 */
export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const db = await getDb()
  const url = new URL(request.url)
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 15))
  const actions = await db.collection('chat_actions')
    .find({})
    .sort({ appliedAt: -1 })
    .limit(limit)
    .toArray()
  return NextResponse.json({ actions })
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const actionId = body.actionId
  if (!actionId) return NextResponse.json({ error: 'actionId manquant' }, { status: 400 })
  const result = await undoAction(actionId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
