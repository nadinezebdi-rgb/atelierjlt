import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import * as stats from './stats'
import * as products from './products'
import * as orders from './orders'
import * as coupons from './coupons'
import * as blog from './blog'
import * as site from './site'
import * as files from './files'
import * as upload from './upload'

async function listSimple(ctx, collection, options = {}) {
  if (ctx.method !== 'GET') return null
  const db = await getDb()
  const query = db.collection(collection).find({}, options.projection ? { projection: options.projection } : undefined)
    .sort({ createdAt: -1 })
    .limit(options.limit || 500)
  const list = await query.toArray()
  return NextResponse.json({ list })
}

export async function handle(ctx) {
  if (!isAdmin(ctx.request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { sub } = ctx

  switch (sub) {
    case 'stats':       return stats.handle(ctx)
    case 'products':    return products.handle(ctx)
    case 'orders':      return orders.handle(ctx)
    case 'coupons':     return coupons.handle(ctx)
    case 'newsletters': return listSimple(ctx, 'newsletter')
    case 'contacts':    return listSimple(ctx, 'contacts')
    case 'users':       return listSimple(ctx, 'users', { projection: { passwordHash: 0 } })
    case 'gift-cards': {
      if (ctx.method !== 'GET') return null
      const db = await getDb()
      const list = await db.collection('gift_cards').find({}).sort({ createdAt: -1 }).toArray()
      return NextResponse.json({ list })
    }
    case 'blog':         return blog.handle(ctx)
    case 'site-content': return site.handleContent(ctx)
    case 'settings':     return site.handleSettings(ctx)
    case 'files':        return files.handle(ctx)
    case 'upload':       return upload.handle(ctx)
    default: return null
  }
}
