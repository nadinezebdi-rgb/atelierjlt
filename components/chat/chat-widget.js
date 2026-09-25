'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Check, AlertTriangle, Sparkles, Shield,
  ArrowRight, Loader2, History, Undo2, Plus, ChevronLeft, Lightbulb,
  Package, Image as ImageIcon, Edit3, Eye, BookOpen, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * Assistant IA — Juliette (V3)
 * Fonctionnalités :
 *  - Mode client & admin détectés automatiquement
 *  - Historique des conversations (panel latéral)
 *  - Undo admin : annuler la dernière action en un clic
 *  - Insights proactifs pour l'admin (photos manquantes, stock bas, brouillons…)
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('chat')  // 'chat' | 'history'
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [applying, setApplying] = useState(null)
  const [confirmCmd, setConfirmCmd] = useState(null)

  // Historique
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Undo
  const [lastAction, setLastAction] = useState(null)   // action MongoDB la plus récente
  const [undoing, setUndoing] = useState(false)

  // Insights proactifs
  const [insights, setInsights] = useState([])
  const [insightsLoaded, setInsightsLoaded] = useState(false)
  const [insightsDismissed, setInsightsDismissed] = useState(false)

  const listRef = useRef(null)
  const greetedRef = useRef(false)

  /* ============ INIT ============ */
  useEffect(() => {
    const sid = localStorage.getItem('jlt_chat_sid')
    if (sid) setSessionId(sid)
  }, [])

  // Re-vérifie le statut admin à l'ouverture du widget
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/auth/admin-status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setIsAdmin(!!d.isAdmin) })
      .catch(() => { if (!cancelled) setIsAdmin(false) })
      .finally(() => { if (!cancelled) setAdminChecked(true) })
    return () => { cancelled = true }
  }, [open])

  // Charge la dernière action admin (pour Undo global)
  const refreshLastAction = useCallback(async () => {
    if (!isAdmin) return
    try {
      const r = await fetch('/api/chat/actions?limit=1', { cache: 'no-store' })
      if (!r.ok) return
      const d = await r.json()
      const a = (d.actions || []).find((x) => !x.undone)
      setLastAction(a || null)
    } catch { /* silent */ }
  }, [isAdmin])

  useEffect(() => {
    if (open && isAdmin) refreshLastAction()
  }, [open, isAdmin, refreshLastAction])

  // Charge les insights à l'ouverture admin
  useEffect(() => {
    if (!open || !isAdmin || insightsLoaded) return
    fetch('/api/chat/insights', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : { insights: [] })
      .then((d) => { setInsights(d.insights || []); setInsightsLoaded(true) })
      .catch(() => setInsightsLoaded(true))
  }, [open, isAdmin, insightsLoaded])

  // Message d'accueil
  useEffect(() => {
    if (!open || !adminChecked || greetedRef.current) return
    greetedRef.current = true
    setMessages([{
      role: 'assistant',
      content: isAdmin
        ? 'Bonjour ! Je suis Juliette, ton assistante IA. En mode admin, tu peux me demander de modifier le site : « change le titre du hero en… », « masque la section newsletter », « crée un article sur… »'
        : 'Bonjour ! Je suis Juliette, l\'assistante d\'Atelier JLT. Une question sur nos produits, les matières, l\'entretien ou la livraison ? Je suis là pour vous aider.',
    }])
  }, [open, isAdmin, adminChecked])

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, busy])

  /* ============ ACTIONS ============ */

  const send = async (e, presetText) => {
    e?.preventDefault?.()
    const text = (presetText || input).trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setBusy(true)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      if (data.session_id) {
        setSessionId(data.session_id)
        localStorage.setItem('jlt_chat_sid', data.session_id)
      }
      setMessages((m) => [...m, {
        role: 'assistant',
        content: data.reply,
        commands: data.commands || [],
      }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Désolée, une erreur est survenue. Réessaie dans un instant.' }])
    } finally {
      setBusy(false)
    }
  }

  const applyCommand = async (cmd, force = false) => {
    if (!force && cmd.severity === 'sensitive') {
      setConfirmCmd(cmd)
      return
    }
    setApplying(cmd.id)
    try {
      const r = await fetch('/api/chat/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, session_id: sessionId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Échec')
      toast.success(data.message || 'Modification appliquée')
      setMessages((prev) => prev.map((m) => m.commands ? {
        ...m,
        commands: m.commands.map((c) => c.id === cmd.id ? { ...c, applied: true, actionId: data.actionId } : c),
      } : m))
      // Recharge la dernière action pour la barre Undo
      refreshLastAction()
      // Rafraîchit les insights (le stock/photo a pu changer)
      setInsightsLoaded(false)
    } catch (err) {
      toast.error(err.message || 'Impossible d\'appliquer')
    } finally {
      setApplying(null)
      setConfirmCmd(null)
    }
  }

  const undoLast = async () => {
    if (!lastAction) return
    setUndoing(true)
    try {
      const r = await fetch('/api/chat/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: lastAction._id }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Échec')
      toast.success(data.message || 'Action annulée')
      setLastAction(null)
      refreshLastAction()
      setInsightsLoaded(false)
    } catch (err) {
      toast.error(err.message || 'Impossible d\'annuler')
    } finally {
      setUndoing(false)
    }
  }

  const loadHistory = async () => {
    setView('history')
    setSessionsLoading(true)
    try {
      const r = await fetch('/api/chat/sessions', { cache: 'no-store' })
      const data = await r.json()
      setSessions(data.sessions || [])
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  const openSession = async (sid) => {
    setBusy(true)
    try {
      const r = await fetch(`/api/chat/sessions?sid=${encodeURIComponent(sid)}`, { cache: 'no-store' })
      const data = await r.json()
      const msgs = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        commands: (m.commands || []).map((c) => ({ ...c, applied: false })),
      }))
      setMessages(msgs)
      setSessionId(sid)
      localStorage.setItem('jlt_chat_sid', sid)
      setView('chat')
    } catch (err) {
      toast.error('Impossible de charger la conversation')
    } finally {
      setBusy(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setSessionId(null)
    localStorage.removeItem('jlt_chat_sid')
    greetedRef.current = false
    setView('chat')
    setInsightsDismissed(false)
  }

  /* ============ RENDER ============ */

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 right-5 z-40 flex items-center justify-center gap-2 h-14 pl-5 pr-6 rounded-full shadow-2xl transition-all ${
          open ? 'bg-ink text-ivory' : 'bg-emerald text-ivory hover:bg-emeraldDark'
        }`}
        aria-label={open ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
      >
        {open ? <X className="h-5 w-5" strokeWidth={1.6} /> : <MessageCircle className="h-5 w-5" strokeWidth={1.6} />}
        <span className="text-[11px] uppercase tracking-[0.24em] hidden sm:inline">
          {open ? 'Fermer' : isAdmin ? 'Assistant Admin' : 'Une question ?'}
        </span>
      </motion.button>

      {/* Panneau */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-[440px] h-[min(680px,calc(100vh-8rem))] bg-ivory border border-linen shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="bg-emerald text-ivory px-5 py-3.5 flex items-center gap-3 shrink-0">
              {view === 'history' ? (
                <button onClick={() => setView('chat')} className="p-1 -ml-1 hover:bg-ivory/10 rounded" aria-label="Retour">
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-full bg-ivory/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{view === 'history' ? 'Historique' : 'Juliette · Assistante IA'}</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-ivory/70 flex items-center gap-1.5">
                  {isAdmin ? (<><Shield className="h-3 w-3" /> Mode Admin</>) : 'Mode Client'}
                </div>
              </div>
              {view === 'chat' && (
                <>
                  <button
                    onClick={loadHistory}
                    className="p-1.5 hover:bg-ivory/10 rounded transition"
                    aria-label="Historique des conversations"
                    title="Historique"
                  >
                    <History className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                  <button
                    onClick={startNewChat}
                    className="p-1.5 hover:bg-ivory/10 rounded transition"
                    aria-label="Nouvelle conversation"
                    title="Nouvelle conversation"
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </>
              )}
            </header>

            {/* Barre Undo (admin uniquement) */}
            {view === 'chat' && isAdmin && lastAction && (
              <UndoBar action={lastAction} undoing={undoing} onUndo={undoLast} />
            )}

            {/* Insights proactifs (admin, chat view, non-dismissed) */}
            {view === 'chat' && isAdmin && insights.length > 0 && !insightsDismissed && messages.length <= 1 && (
              <InsightsPanel
                insights={insights}
                onClose={() => setInsightsDismissed(true)}
                onAsk={(prompt) => { setInsightsDismissed(true); send(null, prompt) }}
              />
            )}

            {/* Vue chat */}
            {view === 'chat' && (
              <>
                <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream/30">
                  {messages.map((m, i) => (
                    <MessageBubble
                      key={i}
                      m={m}
                      isAdmin={isAdmin}
                      applying={applying}
                      onApply={applyCommand}
                    />
                  ))}
                  {busy && (
                    <div className="flex items-center gap-2 text-xs text-ink/50 pl-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Juliette réfléchit…
                    </div>
                  )}
                </div>

                <form onSubmit={send} className="border-t border-linen p-3 flex items-center gap-2 shrink-0 bg-ivory">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isAdmin ? 'Ex : change le titre du hero en...' : 'Une question sur nos produits ?'}
                    disabled={busy}
                    className="flex-1 bg-transparent border-b border-ink/15 focus:border-emerald outline-none py-2 px-1 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="bg-emerald text-ivory p-2.5 hover:bg-emeraldDark disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="Envoyer"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </form>
              </>
            )}

            {/* Vue historique */}
            {view === 'history' && (
              <HistoryList sessions={sessions} loading={sessionsLoading} onOpen={openSession} activeSid={sessionId} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale de confirmation */}
      <AnimatePresence>
        {confirmCmd && (
          <ConfirmModal
            cmd={confirmCmd}
            applying={applying === confirmCmd.id}
            onCancel={() => setConfirmCmd(null)}
            onConfirm={() => applyCommand(confirmCmd, true)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ============ SOUS-COMPOSANTS ============ */

function UndoBar({ action, undoing, onUndo }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-emerald/5 border-b border-emerald/20 px-4 py-2.5 flex items-center gap-3 shrink-0"
    >
      <Check className="h-3.5 w-3.5 text-emerald shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald">Dernière action</p>
        <p className="text-xs text-ink truncate">{action.label}</p>
      </div>
      <button
        onClick={onUndo}
        disabled={undoing}
        className="inline-flex items-center gap-1.5 border border-emerald text-emerald px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:bg-emerald hover:text-ivory transition disabled:opacity-50"
      >
        {undoing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
        Annuler
      </button>
    </motion.div>
  )
}

const INSIGHT_ICONS = {
  package: Package,
  image: ImageIcon,
  edit: Edit3,
  eye: Eye,
  bookOpen: BookOpen,
  alertTriangle: AlertTriangle,
}

function InsightsPanel({ insights, onClose, onAsk }) {
  const critical = insights.filter((i) => i.severity === 'critical').length
  const warning = insights.filter((i) => i.severity === 'warning').length
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-linen bg-amber-50/50 shrink-0 max-h-[45%] overflow-y-auto"
    >
      <div className="px-4 py-2.5 flex items-center justify-between sticky top-0 bg-amber-50/95 backdrop-blur border-b border-amber-100 z-10">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" strokeWidth={1.6} />
          <p className="text-[10px] uppercase tracking-[0.24em] text-amber-800">
            {insights.length} suggestion{insights.length > 1 ? 's' : ''}
            {critical > 0 && <span className="text-red-600 ml-1.5">· {critical} urgente{critical > 1 ? 's' : ''}</span>}
            {warning > 0 && <span className="text-amber-700 ml-1.5">· {warning} à surveiller</span>}
          </p>
        </div>
        <button onClick={onClose} className="text-ink/40 hover:text-ink" aria-label="Masquer">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        {insights.map((i) => {
          const Icon = INSIGHT_ICONS[i.icon] || Lightbulb
          const sevColor = i.severity === 'critical' ? 'border-red-300 bg-red-50' :
                          i.severity === 'warning' ? 'border-amber-300 bg-ivory' : 'border-linen bg-ivory'
          return (
            <button
              key={i.id}
              onClick={() => onAsk(i.prompt)}
              className={`w-full text-left p-2.5 border ${sevColor} hover:border-emerald hover:shadow-sm transition group`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                  i.severity === 'critical' ? 'text-red-600' :
                  i.severity === 'warning' ? 'text-amber-600' : 'text-ink/50'
                }`} strokeWidth={1.6} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{i.title}</p>
                  <p className="text-[10px] text-ink/50 mt-0.5 line-clamp-2">{i.hint}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-ink/30 group-hover:text-emerald mt-1 shrink-0" strokeWidth={1.5} />
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

function HistoryList({ sessions, loading, onOpen, activeSid }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink/50">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }
  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-ink/50 text-sm px-8 text-center">
        <History className="h-8 w-8 mb-3 opacity-50" strokeWidth={1.3} />
        <p>Aucune conversation encore.</p>
        <p className="text-xs mt-1">Tes échanges avec Juliette apparaîtront ici.</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-cream/30">
      {sessions.map((s) => (
        <button
          key={s.session_id}
          onClick={() => onOpen(s.session_id)}
          className={`w-full text-left p-3 border ${
            s.session_id === activeSid ? 'border-emerald bg-emerald/5' : 'border-linen bg-ivory hover:border-emerald/40'
          } transition group`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`text-[9px] uppercase tracking-[0.24em] ${
              s.mode === 'admin' ? 'text-emerald' : 'text-ink/50'
            }`}>
              {s.mode === 'admin' ? '⚡ Admin' : 'Client'}
            </span>
            <span className="text-[10px] text-ink/40">{formatRelative(s.lastAt)}</span>
          </div>
          <p className="text-xs text-ink line-clamp-2">{s.title || '(conversation)'}</p>
          <p className="text-[10px] text-ink/40 mt-1">{s.count} message{s.count > 1 ? 's' : ''}</p>
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ m, isAdmin, applying, onApply }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
        isUser ? 'bg-emerald text-ivory rounded-br-sm' : 'bg-ivory text-ink border border-linen rounded-bl-sm'
      }`}>
        <div className="whitespace-pre-wrap">{m.content}</div>
        {!isUser && isAdmin && m.commands && m.commands.length > 0 && (
          <div className="mt-3 pt-3 border-t border-linen space-y-2">
            {m.commands.map((cmd) => (
              <CommandCard key={cmd.id} cmd={cmd} applying={applying === cmd.id} onApply={() => onApply(cmd)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommandCard({ cmd, applying, onApply }) {
  const isSensitive = cmd.severity === 'sensitive'
  const applied = cmd.applied
  return (
    <div className={`border ${applied ? 'border-emerald/40 bg-emerald/5' : isSensitive ? 'border-amber-500/30 bg-amber-50/30' : 'border-linen bg-cream/40'} p-3 rounded-lg`}>
      <div className="flex items-start gap-2 mb-2">
        {applied ? <Check className="h-3.5 w-3.5 text-emerald mt-0.5 shrink-0" /> :
          isSensitive ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" /> :
          <Sparkles className="h-3.5 w-3.5 text-emerald mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mb-1">
            {cmd.type.replace(/_/g, ' ')} {isSensitive && !applied ? '· sensible' : ''}
          </p>
          <p className="text-xs text-ink">{cmd.label}</p>
          {cmd.patch && Object.keys(cmd.patch).length > 0 && !applied && (
            <details className="mt-1.5">
              <summary className="text-[10px] text-ink/50 cursor-pointer hover:text-emerald">Voir le détail</summary>
              <pre className="mt-1 text-[10px] bg-ivory/60 border border-linen p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(cmd.patch, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      {!applied ? (
        <button
          onClick={onApply}
          disabled={applying}
          className={`w-full inline-flex items-center justify-center gap-2 py-1.5 text-[11px] uppercase tracking-[0.24em] transition ${
            isSensitive
              ? 'border border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-ivory'
              : 'bg-emerald text-ivory hover:bg-emeraldDark'
          } disabled:opacity-60`}
        >
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
            <>
              {isSensitive ? 'Confirmer' : 'Appliquer'}
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald text-center py-1.5">✓ Appliqué</p>
      )}
    </div>
  )
}

function ConfirmModal({ cmd, applying, onCancel, onConfirm }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-ivory p-6 max-w-md w-full border border-linen"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Modification sensible</h3>
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Confirmation requise</p>
          </div>
        </div>
        <p className="text-sm text-ink mb-3">{cmd.label}</p>
        {cmd.patch && Object.keys(cmd.patch).length > 0 && (
          <pre className="text-[11px] bg-cream/60 border border-linen p-3 rounded max-h-48 overflow-auto whitespace-pre-wrap font-mono mb-4">
            {JSON.stringify(cmd.patch, null, 2)}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-ink/20 text-ink py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-ink hover:text-ivory transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={applying}
            className="flex-1 bg-amber-600 text-ivory py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-amber-700 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============ HELPERS ============ */

function formatRelative(dateStr) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
