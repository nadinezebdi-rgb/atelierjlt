'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Check, AlertTriangle, Sparkles, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Assistant IA — Juliette
 * - Mode CLIENT : Q&A produit (partout)
 * - Mode ADMIN  : propositions de modifs applicables (uniquement si cookie admin)
 * Détecte automatiquement le mode via /api/auth/admin-status.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const [messages, setMessages] = useState([])   // [{role, content, commands?}]
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [applying, setApplying] = useState(null)
  const [confirmCmd, setConfirmCmd] = useState(null)
  const listRef = useRef(null)
  const greetedRef = useRef(false)

  // Détecte admin + charge session persistée
  useEffect(() => {
    const sid = localStorage.getItem('jlt_chat_sid')
    if (sid) setSessionId(sid)
  }, [])

  // Re-vérifie le statut admin à l'ouverture du widget (au cas où l'utilisateur
  // s'est connecté entre-temps sans recharger la page).
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

  // Message d'accueil — attend d'avoir déterminé le mode
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

  const send = async (e) => {
    e?.preventDefault?.()
    const text = input.trim()
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
        body: JSON.stringify({ command: cmd }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Échec')
      toast.success(data.message || 'Modification appliquée')
      // Marque la commande comme appliquée
      setMessages((prev) => prev.map((m) => m.commands ? {
        ...m,
        commands: m.commands.map((c) => c.id === cmd.id ? { ...c, applied: true } : c),
      } : m))
    } catch (err) {
      toast.error(err.message || 'Impossible d\'appliquer')
    } finally {
      setApplying(null)
      setConfirmCmd(null)
    }
  }

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
            className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-[420px] h-[min(640px,calc(100vh-8rem))] bg-ivory border border-linen shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="bg-emerald text-ivory px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-ivory/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Juliette · Assistante IA</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-ivory/70 flex items-center gap-1.5">
                  {isAdmin ? (<><Shield className="h-3 w-3" /> Mode Admin</>) : 'Mode Client'}
                </div>
              </div>
            </header>

            {/* Messages */}
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

            {/* Input */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale de confirmation sensitive */}
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

/* ============ MESSAGE BUBBLE ============ */
function MessageBubble({ m, isAdmin, applying, onApply }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
        isUser ? 'bg-emerald text-ivory rounded-br-sm' : 'bg-ivory text-ink border border-linen rounded-bl-sm'
      }`}>
        <div className="whitespace-pre-wrap">{m.content}</div>
        {/* Commandes IA (mode admin) */}
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

/* ============ COMMAND CARD ============ */
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
          {/* aperçu du patch */}
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

/* ============ CONFIRM MODAL ============ */
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
