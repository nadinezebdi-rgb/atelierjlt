import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/sessions       → liste les sessions récentes de l'utilisateur/admin
 *                                (le mode 'admin' n'expose que les sessions admin)
 * GET /api/chat/sessions?sid=X → renvoie les messages d'une session donnée
 *
 * Pour le MVP, on filtre les sessions par mode : un utilisateur non-admin ne voit
 * que les sessions 'client' — un admin voit ses sessions 'admin'.
 */
export async function GET(request) {
  const db = await getDb()
  const url = new URL(request.url)
  const sid = url.searchParams.get('sid')
  const admin = isAdmin(request)

  // Cas 1 : messages d'une session précise
  if (sid) {
    // Sécurité : un client ne peut pas lire une session admin
    const first = await db.collection('chat_messages').findOne({ session_id: sid })
    if (!first) return NextResponse.json({ messages: [] })
    if (first.mode === 'admin' && !admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const messages = await db.collection('chat_messages')
      .find({ session_id: sid })
      .sort({ createdAt: 1 })
      .toArray()
    return NextResponse.json({ session_id: sid, messages })
  }

  // Cas 2 : liste des sessions
  const modeFilter = admin ? {} : { mode: 'client' }
  const pipeline = [
    { $match: modeFilter },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$session_id',
        mode: { $first: '$mode' },
        lastAt: { $first: '$createdAt' },
        firstAt: { $last: '$createdAt' },
        count: { $sum: 1 },
        lastMessage: { $first: '$content' },
        firstUserMsg: { $push: { role: '$role', content: '$content', createdAt: '$createdAt' } },
      },
    },
    { $sort: { lastAt: -1 } },
    { $limit: 30 },
  ]
  const sessions = await db.collection('chat_messages').aggregate(pipeline).toArray()

  // Formate un titre par session : premier message user
  const formatted = sessions.map((s) => {
    const firstUser = s.firstUserMsg.reverse().find((m) => m.role === 'user')
    const title = firstUser
      ? firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? '…' : '')
      : (s.lastMessage || '').slice(0, 60)
    return {
      session_id: s._id,
      mode: s.mode,
      lastAt: s.lastAt,
      firstAt: s.firstAt,
      count: s.count,
      title,
    }
  })
  return NextResponse.json({ sessions: formatted })
}
