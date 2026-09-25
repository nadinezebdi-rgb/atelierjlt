/**
 * Stockage persistant des médias uploadés.
 * -----------------------------------------
 * Le déploiement Emergent reconstruit le conteneur à chaque redémarrage :
 * tout ce qui n'est PAS dans git est perdu. Ce module stocke donc les
 * fichiers uploadés directement dans MongoDB pour garantir leur persistance.
 *
 * L'API reste identique à celle sur disque : on lit d'abord sur disque
 * (pour les images d'origine `jlt-*` versionnées) et on retombe sur MongoDB
 * en fallback.
 *
 * Collection : `media_files`
 *   { _id: "upload-XXX.jpg", contentType, size, data (Binary), createdAt, originalName }
 */

import { getDb } from '@/lib/db'
import fs from 'node:fs'
import path from 'node:path'

const DISK_DIRS = [
  path.join(process.cwd(), 'lib', 'product-images'),
  path.join(process.cwd(), 'public', 'products'),
]

const IMAGE_EXTS = ['jpeg', 'jpg', 'webp', 'png']
const ALL_EXTS = [...IMAGE_EXTS, 'mp4', 'webm', 'mov', 'pdf']

/** Encapsule le mime-type par extension. */
export function mimeFor(ext) {
  const e = String(ext || '').toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'webp') return 'image/webp'
  if (e === 'png') return 'image/png'
  if (e === 'mp4') return 'video/mp4'
  if (e === 'webm') return 'video/webm'
  if (e === 'mov') return 'video/quicktime'
  if (e === 'pdf') return 'application/pdf'
  return 'application/octet-stream'
}

/**
 * Enregistre un fichier dans MongoDB.
 * @returns {{ name: string, size: number }}
 */
export async function saveMedia({ filename, buffer, contentType, originalName }) {
  if (!filename || !buffer) throw new Error('filename et buffer requis')
  const db = await getDb()
  await db.collection('media_files').updateOne(
    { _id: filename },
    {
      $set: {
        _id: filename,
        contentType: contentType || 'application/octet-stream',
        size: buffer.length,
        data: buffer,           // Node driver → BSON Binary
        originalName: originalName || filename,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  )
  return { name: filename, size: buffer.length }
}

/**
 * Résout un média par nom (avec ou sans extension).
 * Ordre : disque local (images versionnées) → MongoDB (uploads).
 * @param  {string} rawName — ex: "upload-abc123" ou "upload-abc123.jpg"
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 */
export async function loadMedia(rawName) {
  const decoded = decodeURIComponent(rawName || '')
  if (!decoded) return null
  // Sécurité : pas de path traversal
  if (decoded.includes('..') || decoded.includes('/')) return null

  const key = decoded.replace(/\.(jpe?g|webp|png|mp4|webm|mov|pdf)$/i, '')
  const hintExt = (decoded.match(/\.(jpe?g|webp|png|mp4|webm|mov|pdf)$/i) || [])[1]?.toLowerCase()

  // 1) Disque : essayer chaque extension possible
  for (const dir of DISK_DIRS) {
    // Extension explicite d'abord
    if (hintExt) {
      const p = path.join(dir, `${key}.${hintExt}`)
      if (fs.existsSync(p)) {
        try {
          return { buffer: fs.readFileSync(p), contentType: mimeFor(hintExt) }
        } catch { /* ignore */ }
      }
    }
    for (const ext of ALL_EXTS) {
      const p = path.join(dir, `${key}.${ext}`)
      if (fs.existsSync(p)) {
        try {
          return { buffer: fs.readFileSync(p), contentType: mimeFor(ext) }
        } catch { /* ignore */ }
      }
    }
  }

  // 2) MongoDB — essayer toutes les combinaisons _id possibles
  try {
    const db = await getDb()
    const candidates = new Set([decoded, key])
    if (hintExt) candidates.add(`${key}.${hintExt}`)
    for (const ext of ALL_EXTS) candidates.add(`${key}.${ext}`)
    const doc = await db.collection('media_files').findOne({ _id: { $in: [...candidates] } })
    if (doc && doc.data) {
      const buffer = Buffer.isBuffer(doc.data)
        ? doc.data
        : Buffer.from(doc.data.buffer || doc.data)
      return { buffer, contentType: doc.contentType || 'application/octet-stream' }
    }
  } catch (e) {
    console.error('loadMedia mongo error', e)
  }

  return null
}

/**
 * Supprime un média (Mongo uniquement — jamais le disque, où sont les originaux).
 */
export async function deleteMedia(filename) {
  if (!filename) return false
  const db = await getDb()
  const r = await db.collection('media_files').deleteOne({ _id: filename })
  return r.deletedCount > 0
}

/**
 * Liste des médias stockés en Mongo.
 */
export async function listMedia() {
  const db = await getDb()
  return db.collection('media_files')
    .find({}, { projection: { data: 0 } })
    .sort({ createdAt: -1 })
    .toArray()
}
