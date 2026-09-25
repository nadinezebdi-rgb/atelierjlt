import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { executeCommand } from '@/lib/ai/commands'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/chat/apply
 * Body : { command: { type, label, severity, patch, targetId } }
 * Requiert le cookie admin.
 */
export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const cmd = body.command
  const sessionId = body.session_id || null
  if (!cmd) return NextResponse.json({ error: 'Commande manquante' }, { status: 400 })
  const result = await executeCommand(cmd, sessionId)
  if (!result.ok) return NextResponse.json({ error: result.error || 'Échec' }, { status: 400 })
  return NextResponse.json(result)
}
