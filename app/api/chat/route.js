import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { LlmChat, UserMessage } from 'emergentintegrations'
import { getDb } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { buildClientContext, buildAdminContext } from '@/lib/ai/context'
import { clientSystemPrompt, adminSystemPrompt, safeParseJSON } from '@/lib/ai/prompts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_MESSAGE = 4000
const MAX_HISTORY = 12  // multi-tour : 12 tours max côté prompt

/**
 * POST /api/chat
 * Body : { session_id?, message, mode? }  // mode = 'auto' | 'client' | 'admin'
 * Retour :
 *   - client mode  → { session_id, reply }
 *   - admin mode   → { session_id, reply, commands: [] }
 */
export async function POST(request) {
  try {
    if (!process.env.EMERGENT_LLM_KEY) {
      return NextResponse.json({ error: 'Configuration manquante (EMERGENT_LLM_KEY)' }, { status: 500 })
    }
    const body = await request.json().catch(() => ({}))
    const message = (body.message || '').trim()
    if (!message) return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    if (message.length > MAX_MESSAGE) return NextResponse.json({ error: 'Message trop long' }, { status: 400 })

    const admin = isAdmin(request)
    // Le mode est validé côté serveur : impossible pour un client de forcer le mode admin
    const wantAdmin = admin && (body.mode !== 'client')
    const mode = wantAdmin ? 'admin' : 'client'
    const session_id = body.session_id || uuid()

    // Contexte
    const context = mode === 'admin' ? await buildAdminContext() : await buildClientContext()
    const systemMessage = mode === 'admin' ? adminSystemPrompt(context) : clientSystemPrompt(context)

    // Historique multi-tour (persisté en Mongo)
    const db = await getDb()
    const priorMessages = await db.collection('chat_messages')
      .find({ session_id })
      .sort({ createdAt: 1 })
      .limit(MAX_HISTORY * 2)
      .toArray()

    // On donne l'historique en tant qu'initialMessages (format Anthropic)
    // ⚠️ La lib emergentintegrations ne prépend PAS le system message si
    // `initialMessages` est fourni → on le prépend nous-même.
    const historyMessages = priorMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))
    const initialMessages = historyMessages.length > 0
      ? [{ role: 'system', content: systemMessage }, ...historyMessages]
      : undefined  // undefined → la lib injectera le system message d'elle-même

    const chat = new LlmChat(
      process.env.EMERGENT_LLM_KEY,
      session_id,
      systemMessage,
      initialMessages,
    )
      .withModel('anthropic', 'claude-sonnet-4-5-20250929')
      .withParams({
        temperature: mode === 'admin' ? 0.15 : 0.4,
        max_tokens: mode === 'admin' ? 1400 : 700,
      })

    const raw = await chat.sendMessage(new UserMessage({ text: message }))
    const rawText = typeof raw === 'string' ? raw.trim() : String(raw || '')

    // Parsing selon mode
    let reply = rawText
    let commands = []
    if (mode === 'admin') {
      const parsed = safeParseJSON(rawText)
      if (parsed && typeof parsed === 'object') {
        reply = String(parsed.message || '').trim() || 'Voici ce que je propose :'
        commands = Array.isArray(parsed.commands) ? parsed.commands : []
        // Sanitize : chaque commande doit avoir un type + label
        commands = commands
          .filter((c) => c && typeof c === 'object' && typeof c.type === 'string' && typeof c.label === 'string')
          .map((c) => ({
            id: uuid(),
            type: c.type,
            label: c.label,
            severity: c.severity === 'sensitive' ? 'sensitive' : 'light',
            patch: c.patch && typeof c.patch === 'object' ? c.patch : {},
            targetId: c.targetId ?? null,
          }))
          .slice(0, 8)  // safety cap
      } else {
        // fallback : traiter comme texte pur
        reply = rawText || 'Désolée, je n\'ai pas bien compris. Peux-tu reformuler ?'
      }
    }

    // Persistance
    await db.collection('chat_messages').insertMany([
      { session_id, role: 'user', content: message, mode, createdAt: new Date() },
      { session_id, role: 'assistant', content: reply, mode, commands, createdAt: new Date() },
    ])

    return NextResponse.json({ session_id, reply, commands, mode })
  } catch (e) {
    console.error('POST /api/chat error', e)
    return NextResponse.json({ error: 'Service indisponible pour le moment' }, { status: 502 })
  }
}
