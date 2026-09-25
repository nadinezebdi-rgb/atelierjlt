/**
 * Applique une commande proposée par l'IA (mode admin) sur la base MongoDB.
 * Chaque exécution est journalisée dans la collection `chat_actions`
 * (avant/après) pour permettre l'Undo en un clic.
 */
import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

/** Types autorisés + fonction d'exécution correspondante. */
const HANDLERS = {
  update_hero: applyUpdateHero,
  update_hero_slide: applyUpdateHeroSlide,
  update_product: applyUpdateProduct,
  toggle_section: applyToggleSection,
  reorder_sections: applyReorderSections,
  create_blog_post: applyCreateBlogPost,
  update_settings: applyUpdateSettings,
}

/**
 * Applique une commande. Si `sessionId` est fourni, journalise l'action
 * pour permettre son annulation ultérieure via /api/chat/undo/[actionId].
 */
export async function executeCommand(cmd, sessionId = null) {
  if (!cmd || typeof cmd !== 'object') return { ok: false, error: 'Commande invalide' }
  const fn = HANDLERS[cmd.type]
  if (!fn) return { ok: false, error: `Type de commande inconnu : ${cmd.type}` }
  try {
    const result = await fn(cmd)
    if (result.ok) {
      // Journalisation pour Undo
      const db = await getDb()
      const actionId = uuid()
      await db.collection('chat_actions').insertOne({
        _id: actionId,
        sessionId,
        type: cmd.type,
        targetId: cmd.targetId ?? null,
        label: cmd.label || cmd.type,
        severity: cmd.severity || 'light',
        before: result.before ?? null,
        after: result.after ?? null,
        patch: cmd.patch || {},
        appliedAt: new Date(),
        undone: false,
      })
      result.actionId = actionId
    }
    return result
  } catch (e) {
    console.error('executeCommand error', cmd.type, e)
    return { ok: false, error: e.message || 'Erreur lors de l\'application' }
  }
}

/**
 * Annule une action précédemment appliquée.
 * Retourne { ok, message } — laisse la collection intacte mais marque undone=true.
 */
export async function undoAction(actionId) {
  const db = await getDb()
  const action = await db.collection('chat_actions').findOne({ _id: actionId })
  if (!action) return { ok: false, error: 'Action introuvable' }
  if (action.undone) return { ok: false, error: 'Cette action est déjà annulée' }

  try {
    await reverseAction(action)
    await db.collection('chat_actions').updateOne(
      { _id: actionId },
      { $set: { undone: true, undoneAt: new Date() } }
    )
    return { ok: true, message: `Action « ${action.label} » annulée` }
  } catch (e) {
    console.error('undoAction error', e)
    return { ok: false, error: e.message || 'Impossible d\'annuler' }
  }
}

/**
 * Renvoie l'état à `before` — chaque type a sa logique de restauration.
 */
async function reverseAction(action) {
  const db = await getDb()
  switch (action.type) {
    case 'update_hero': {
      await db.collection('site_content').updateOne(
        { _id: 'home' },
        { $set: { 'content.hero': action.before || {} } },
        { upsert: true }
      )
      break
    }
    case 'update_hero_slide': {
      const idx = Number(action.targetId)
      const doc = await db.collection('site_content').findOne({ _id: 'home' })
      const slides = [...(doc?.content?.heroSlides || [])]
      if (slides[idx]) {
        slides[idx] = action.before
        await db.collection('site_content').updateOne(
          { _id: 'home' },
          { $set: { 'content.heroSlides': slides } }
        )
      }
      break
    }
    case 'update_product': {
      const slug = action.targetId
      if (!slug) throw new Error('Slug manquant')
      const before = action.before || {}
      if (Object.keys(before).length === 0) {
        // Il n'y avait pas d'override → supprime celui qu'on avait créé
        await db.collection('product_overrides').deleteOne({ slug })
      } else {
        await db.collection('product_overrides').updateOne(
          { slug },
          { $set: { slug, data: before, updatedAt: new Date() } },
          { upsert: true }
        )
      }
      break
    }
    case 'toggle_section': {
      const id = action.targetId
      const doc = await db.collection('site_content').findOne({ _id: 'home' })
      const sections = [...(doc?.content?.sections || [])]
      const idx = sections.findIndex((s) => s.id === id)
      if (idx >= 0 && action.before) {
        sections[idx] = action.before
        await db.collection('site_content').updateOne(
          { _id: 'home' },
          { $set: { 'content.sections': sections } }
        )
      }
      break
    }
    case 'reorder_sections': {
      // Restaure l'ordre précédent si stocké
      if (Array.isArray(action.before)) {
        const doc = await db.collection('site_content').findOne({ _id: 'home' })
        const sections = doc?.content?.sections || []
        const byId = new Map(sections.map((s) => [s.id, s]))
        const restored = action.before.map((id) => byId.get(id)).filter(Boolean).map((s, i) => ({ ...s, order: i }))
        await db.collection('site_content').updateOne(
          { _id: 'home' },
          { $set: { 'content.sections': restored } }
        )
      }
      break
    }
    case 'create_blog_post': {
      // On supprime le brouillon créé
      const id = action.after?.id
      if (id) await db.collection('blog_posts').deleteOne({ _id: id })
      break
    }
    case 'update_settings': {
      await db.collection('site_content').updateOne(
        { _id: 'home' },
        { $set: { 'content.settings': action.before || {} } },
        { upsert: true }
      )
      break
    }
    default:
      throw new Error(`Undo non supporté pour ${action.type}`)
  }
}

/* ============ HERO ============ */

async function applyUpdateHero(cmd) {
  const patch = cmd.patch || {}
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  const currentHero = doc?.content?.hero || {}
  const nextHero = mergeDeep(currentHero, patch)
  await db.collection('site_content').updateOne(
    { _id: 'home' },
    { $set: { 'content.hero': nextHero } },
    { upsert: true }
  )
  return { ok: true, message: 'Bannière mise à jour', before: currentHero, after: nextHero }
}

async function applyUpdateHeroSlide(cmd) {
  const patch = cmd.patch || {}
  const idx = Number(cmd.targetId)
  if (!Number.isInteger(idx) || idx < 0) return { ok: false, error: 'Index de slide invalide' }
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  const slides = [...(doc?.content?.heroSlides || [])]
  if (!slides[idx]) return { ok: false, error: 'Slide introuvable' }
  const before = slides[idx]
  slides[idx] = mergeDeep(before, patch)
  await db.collection('site_content').updateOne(
    { _id: 'home' },
    { $set: { 'content.heroSlides': slides } },
    { upsert: true }
  )
  return { ok: true, message: `Slide #${idx + 1} mise à jour`, before, after: slides[idx] }
}

/* ============ PRODUITS ============ */

async function applyUpdateProduct(cmd) {
  const slug = cmd.targetId
  const patch = cmd.patch || {}
  if (!slug) return { ok: false, error: 'Slug produit manquant' }
  if (patch.price != null) {
    const n = Number(patch.price)
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: 'Prix invalide' }
    patch.price = n
  }
  const db = await getDb()
  const existing = await db.collection('product_overrides').findOne({ slug })
  const before = existing?.data || {}
  const nextData = mergeDeep(before, patch)
  await db.collection('product_overrides').updateOne(
    { slug },
    { $set: { slug, data: nextData, updatedAt: new Date() } },
    { upsert: true }
  )
  return { ok: true, message: `Produit ${slug} mis à jour`, before, after: nextData }
}

/* ============ SECTIONS ============ */

async function applyToggleSection(cmd) {
  const id = cmd.targetId
  const patch = cmd.patch || {}
  if (!id) return { ok: false, error: 'ID section manquant' }
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  const sections = [...(doc?.content?.sections || [])]
  const idx = sections.findIndex((s) => s.id === id)
  if (idx < 0) return { ok: false, error: 'Section introuvable' }
  const before = sections[idx]
  sections[idx] = { ...before, ...patch }
  await db.collection('site_content').updateOne(
    { _id: 'home' },
    { $set: { 'content.sections': sections } },
    { upsert: true }
  )
  return { ok: true, message: `Section ${id} : ${patch.visible === false ? 'masquée' : 'visible'}`, before, after: sections[idx] }
}

async function applyReorderSections(cmd) {
  const order = cmd.patch?.order
  if (!Array.isArray(order)) return { ok: false, error: 'Ordre invalide' }
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  const sections = doc?.content?.sections || []
  const beforeOrder = sections.map((s) => s.id)
  const byId = new Map(sections.map((s) => [s.id, s]))
  const reordered = order.map((id) => byId.get(id)).filter(Boolean).map((s, i) => ({ ...s, order: i }))
  const missing = sections.filter((s) => !order.includes(s.id))
  const final = [...reordered, ...missing]
  await db.collection('site_content').updateOne(
    { _id: 'home' },
    { $set: { 'content.sections': final } },
    { upsert: true }
  )
  return { ok: true, message: 'Sections réordonnées', before: beforeOrder, after: final.map((s) => s.id) }
}

/* ============ BLOG ============ */

async function applyCreateBlogPost(cmd) {
  const data = cmd.patch || {}
  if (!data.title || !data.slug || !data.content) {
    return { ok: false, error: 'Titre, slug et contenu obligatoires' }
  }
  const slug = String(data.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  const db = await getDb()
  const exists = await db.collection('blog_posts').findOne({ slug })
  if (exists) return { ok: false, error: `Un article avec le slug « ${slug} » existe déjà` }
  const doc = {
    _id: uuid(),
    slug,
    title: data.title,
    excerpt: data.excerpt || '',
    content: data.content,
    category: data.category || 'Éditorial',
    coverImage: data.coverImage || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'IA (brouillon)',
  }
  await db.collection('blog_posts').insertOne(doc)
  return { ok: true, message: `Brouillon d'article « ${data.title} » créé`, before: null, after: { slug, id: doc._id } }
}

/* ============ PARAMS ============ */

async function applyUpdateSettings(cmd) {
  const patch = cmd.patch || {}
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  const before = doc?.content?.settings || {}
  const next = mergeDeep(before, patch)
  await db.collection('site_content').updateOne(
    { _id: 'home' },
    { $set: { 'content.settings': next } },
    { upsert: true }
  )
  return { ok: true, message: 'Paramètres mis à jour', before, after: next }
}

/* ============ HELPERS ============ */

function mergeDeep(target, source) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) return source
  const out = { ...(target || {}) }
  for (const k of Object.keys(source)) {
    const v = source[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = mergeDeep(target?.[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}
