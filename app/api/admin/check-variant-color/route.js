import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { loadMedia } from '@/lib/media-storage'
import { extractDominantColor, hexToRgb, rgbToHex, labDistance } from '@/lib/color-analysis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  try {
    const { imageUrl, targetHex } = (await request.json()) || {}
    if (!imageUrl || !targetHex) return NextResponse.json({ error: 'imageUrl et targetHex obligatoires' }, { status: 400 })

    const filename = String(imageUrl).replace(/^\/api\/(img|file)\//, '')
    const media = await loadMedia(filename)
    if (!media) return NextResponse.json({ error: 'Image introuvable' }, { status: 404 })

    const dom = await extractDominantColor(media.buffer)
    const target = hexToRgb(targetHex)
    const distance = labDistance(dom, target)
    const match = distance < 30
    const dominantHex = rgbToHex(dom)
    const message = match
      ? `Couleur cohérente (ΔE ${distance.toFixed(1)})`
      : `Couleur ${dominantHex} détectée, très différente du hex cible ${targetHex} (ΔE ${distance.toFixed(1)}) — vérifier`
    return NextResponse.json({
      ok: true,
      match,
      dominant: { ...dom, hex: dominantHex },
      target: { ...target, hex: targetHex },
      distance: Number(distance.toFixed(2)),
      message,
    })
  } catch (e) {
    console.error('check-variant-color error', e)
    return NextResponse.json({ error: e.message || 'Échec analyse' }, { status: 500 })
  }
}
