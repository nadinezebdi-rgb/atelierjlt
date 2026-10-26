'use client'

/**
 * « Ajouter une section » — bibliothèque de modèles PARTAGÉE entre
 * le mode édition visuel (/?edit=1) et l'admin (/admin → Éditeur de l'accueil).
 *   - Carrousels de produits prêts à l'emploi (cadeaux, nouveautés, chambre…)
 *   - Bannières éditoriales prêtes à l'emploi (promo, storytelling…)
 *   - Départ d'une page blanche
 */
import { createPortal } from 'react-dom'
import { X, Sparkles, Plus, Images, ShoppingBag, Gift, Bed, Sofa, Heart, Flower, Megaphone, BookOpen, Star, LayoutTemplate } from 'lucide-react'
import { BANNER_TEMPLATES } from '@/lib/homepage-sections'

const CAROUSEL_TEMPLATES = [
  {
    key: 'gift', icon: Gift, accent: 'bg-terracotta', title: 'Idées cadeau', tagline: 'À offrir',
    description: 'Une sélection pour offrir — plaids, bougies, petits objets.',
    type: 'product-carousel',
    overrides: {
      label: 'Idées cadeau',
      content: { eyebrow: 'À offrir', title: 'Idées cadeau.', description: 'Nos pièces les plus douces à glisser sous le sapin ou dans un panier.', viewAllHref: '/collections', selectionMode: 'manual', filter: 'all', limit: 6, hideBadges: false, pickedProducts: [] },
    },
  },
  {
    key: 'new-season', icon: Sparkles, accent: 'bg-emerald', title: 'Nouveau de la saison', tagline: 'Nouveautés',
    description: "Fraîchement sortis de l'atelier — vos dernières arrivées.",
    type: 'product-carousel',
    overrides: {
      label: 'Nouveau de la saison',
      content: { eyebrow: 'Nouveautés', title: "Fraîchement sortis de l'atelier.", description: "Les pièces qui viennent d'être terminées — à découvrir en premier.", viewAllHref: '/collections?cat=nouveautes', selectionMode: 'auto', filter: 'new', limit: 8, hideBadges: false, pickedProducts: [] },
    },
  },
  {
    key: 'bedroom', icon: Bed, accent: 'bg-plantes', title: 'Pour la chambre', tagline: 'La chambre',
    description: 'Plaids crochet, coussins doux, textures apaisantes.',
    type: 'product-carousel',
    overrides: {
      label: 'Pour la chambre',
      content: { eyebrow: 'La chambre', title: 'Douceur sur le lit.', description: 'Plaids crochet et coussins pour habiller la chambre.', viewAllHref: '/collections', selectionMode: 'auto', filter: 'classiques', limit: 6, hideBadges: false, pickedProducts: [] },
    },
  },
  {
    key: 'living', icon: Sofa, accent: 'bg-brique', title: 'Pour le salon', tagline: 'Le salon',
    description: 'Tapis, macramés et plaids pour une pièce chaleureuse.',
    type: 'product-carousel',
    overrides: {
      label: 'Pour le salon',
      content: { eyebrow: 'Le salon', title: "L'atmosphère du salon.", description: 'Tapis, macramés et plaids pour une pièce chaleureuse.', viewAllHref: '/collections?cat=intemporels', selectionMode: 'auto', filter: 'intemporels', limit: 8, hideBadges: false, pickedProducts: [] },
    },
  },
  {
    key: 'favorites', icon: Heart, accent: 'bg-ink', title: 'Coups de cœur', tagline: 'Sélection manuelle',
    description: 'Vous choisissez vous-même les produits à mettre en avant.',
    type: 'product-carousel',
    overrides: {
      label: 'Coups de cœur',
      content: { eyebrow: 'Mes favoris', title: 'Les pièces du moment.', description: '', viewAllHref: '/collections', selectionMode: 'manual', filter: 'all', limit: 6, hideBadges: false, pickedProducts: [] },
    },
  },
  {
    key: 'spring', icon: Flower, accent: 'bg-plantes', title: 'Collection saisonnière', tagline: 'Printemps / Été',
    description: 'Mettez en avant la collection de la saison.',
    type: 'product-carousel',
    overrides: {
      label: 'Collection PE 26-27',
      content: { eyebrow: 'Printemps / Été 2026-2027', title: 'La collection de la saison.', description: 'Pastels, lin et douceur florale pour la nouvelle saison.', viewAllHref: '/collection/printemps-ete-2026-2027', selectionMode: 'auto', filter: 'pe-2026-2027', limit: 6, hideBadges: false, pickedProducts: [] },
    },
  },
]

const BANNER_ICONS = { promo: Megaphone, storytelling: BookOpen, featured: Star, collection: LayoutTemplate }
const BANNER_ACCENTS = { terracotta: 'bg-terracotta', emerald: 'bg-emerald', sable: 'bg-sable', brique: 'bg-brique', ink: 'bg-ink' }

const BANNER_OPTIONS = BANNER_TEMPLATES.filter((t) => t.key !== 'blank').map((t) => ({
  key: `banner-${t.key}`,
  icon: BANNER_ICONS[t.key] || Images,
  accent: BANNER_ACCENTS[t.accent] || 'bg-ink',
  title: t.name,
  tagline: 'Bannière',
  description: t.tagline,
  image: t.preset.image,
  type: 'editorial-banner',
  overrides: { label: `Bannière — ${t.name}`, content: { ...t.preset } },
}))

const BLANK_OPTIONS = [
  { key: 'blank-carousel', icon: ShoppingBag, title: 'Carrousel vierge', description: 'Partez de zéro : sélection automatique ou vos produits choisis à la main.', type: 'product-carousel', overrides: null },
  { key: 'blank-banner', icon: Images, title: 'Bannière éditoriale', description: 'Une grande image avec titre et un bouton. Pour les ambiances.', type: 'editorial-banner', overrides: null },
]

const PRESETS = {
  'product-carousel': {
    label: 'Nouveau carrousel',
    content: { eyebrow: 'La sélection', title: 'Vitrine personnalisée', description: '', viewAllHref: '/collections', selectionMode: 'auto', filter: 'all', limit: 8, hideBadges: false, pickedProducts: [] },
  },
  'editorial-banner': {
    label: 'Nouvelle bannière',
    content: { eyebrow: '', title: 'Nouveau titre', image: '', ctaLabel: '', ctaHref: '', align: 'left', overlay: 'dark', height: 'md' },
  },
}

/** Construit une nouvelle section personnalisée à partir d'un type + modèle. */
export function createSection(type, overrides = {}) {
  const o = overrides || {}
  const unique = Math.random().toString(36).slice(2, 8)
  const preset = PRESETS[type] || PRESETS['editorial-banner']
  return {
    id: o.id || `custom-${type}-${unique}`,
    type,
    custom: true,
    enabled: true,
    label: preset.label,
    ...o,
    content: { ...preset.content, ...(o.content || {}) },
  }
}

export default function AddSectionModal({ onClose, onPick }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-stretch md:items-center justify-center bg-ink/60 p-0 md:p-6" data-testid="add-section-modal">
      <div
        className="bg-ivory w-full md:max-w-3xl md:rounded-sm shadow-2xl flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: '100dvh' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-linen">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Nouvelle section</div>
            <div className="font-display text-xl md:text-2xl">Choisissez un modèle</div>
          </div>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm" aria-label="Fermer">
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <GroupTitle icon={ShoppingBag}>Carrousels de produits</GroupTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {CAROUSEL_TEMPLATES.map((t) => (
              <TemplateButton key={t.key} t={t} onPick={onPick} />
            ))}
          </div>

          <GroupTitle icon={Images}>Bannières éditoriales</GroupTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {BANNER_OPTIONS.map((t) => (
              <TemplateButton key={t.key} t={t} onPick={onPick} />
            ))}
          </div>

          <GroupTitle icon={Plus}>Partir d'une page blanche</GroupTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLANK_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => onPick(o.type, o.overrides)}
                data-testid={`template-${o.key}`}
                className="text-left flex items-start gap-3 p-4 border border-dashed border-ink/20 hover:border-ink hover:bg-ink/5 transition rounded-sm group"
              >
                <div className="h-11 w-11 flex-none flex items-center justify-center bg-ink/10 text-ink rounded-sm group-hover:bg-ink group-hover:text-ivory transition">
                  <o.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base md:text-lg leading-tight">{o.title}</div>
                  <div className="text-xs text-ink/60 mt-1 leading-relaxed">{o.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-linen bg-cream/30">
          <p className="text-[10px] text-ink/60 uppercase tracking-[0.22em] text-center">
            La nouvelle section apparaît en bas de la page. Vous pouvez la personnaliser et la déplacer ensuite.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GroupTitle({ icon: Icon, children }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-3 flex items-center gap-2">
      <Icon className="h-3 w-3 text-emerald" strokeWidth={1.8} />
      {children}
    </div>
  )
}

function TemplateButton({ t, onPick }) {
  return (
    <button
      onClick={() => onPick(t.type, t.overrides)}
      data-testid={`template-${t.key}`}
      className="text-left flex items-start gap-3 p-4 border border-linen hover:border-emerald hover:bg-cream/40 transition rounded-sm group"
    >
      {t.image ? (
        <div className="h-11 w-11 flex-none overflow-hidden rounded-sm bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.image} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`h-11 w-11 flex-none flex items-center justify-center ${t.accent} text-ivory rounded-sm group-hover:scale-105 transition`}>
          <t.icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.22em] text-emerald mb-0.5">{t.tagline}</div>
        <div className="font-display text-base md:text-lg leading-tight">{t.title}</div>
        <div className="text-xs text-ink/60 mt-1 leading-relaxed">{t.description}</div>
      </div>
    </button>
  )
}
