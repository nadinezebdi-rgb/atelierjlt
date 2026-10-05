/**
 * Réinitialise TOUTES les photos d'un produit (galerie + variants)
 * aux valeurs par défaut du catalogue.
 *
 * POST /api/admin/reset-product-photos
 * Body : { slug: "plaid-sylvestre" }
 *
 * L'action est journalisée dans `chat_actions` pour permettre l'undo.
 */
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { executeCommand } from '@/lib/ai/commands'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const slug = body?.slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ ok: false, error: 'slug requis' }, { status: 400 })
    }

    const result = await executeCommand(
      {
        type: 'reset_product_photos',
        targetId: slug,
        label: `Réinitialiser les photos de « ${slug} »`,
        severity: 'sensitive',
      },
      body?.sessionId || null
    )

    if (!result.ok) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  } catch (e) {
    console.error('reset-product-photos error', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
