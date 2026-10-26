import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'

/** Texte simple : lignes « - » = liste à puces, ligne vide = nouveau paragraphe. */
export function RichText({ text }) {
  const blocks = []
  let list = null
  let para = []
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', lines: para }); para = [] } }
  const flushList = () => { if (list) { blocks.push({ t: 'ul', items: list }); list = null } }
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trimEnd()
    if (/^\s*[-•]\s+/.test(line)) {
      flushPara()
      list = list || []
      list.push(line.replace(/^\s*[-•]\s+/, ''))
    } else if (!line.trim()) {
      flushPara(); flushList()
    } else {
      flushList()
      para.push(line)
    }
  }
  flushPara(); flushList()
  return blocks.map((b, i) =>
    b.t === 'ul' ? (
      <ul key={i} className="list-disc pl-5 space-y-1.5 my-3">
        {b.items.map((it, j) => <li key={j}>{it}</li>)}
      </ul>
    ) : (
      <p key={i} className="my-3">
        {b.lines.map((l, j) => <span key={j}>{l}{j < b.lines.length - 1 && <br />}</span>)}
      </p>
    )
  )
}

export default function LegalPage({ page, children }) {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-ivory text-ink pt-32 md:pt-40 pb-20" data-testid={`legal-page-${page.slug}`}>
        <article className="container max-w-3xl">
          <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-4">Informations</span>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">{page.title}</h1>
          {page.intro && <p className="mt-6 text-base md:text-lg text-ink/70 leading-relaxed">{page.intro}</p>}
          {children}
          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-ink/80">
            {(page.sections || []).map((s, i) => (
              <section key={i}>
                {s.title && <h2 className="font-display text-2xl text-ink mb-2">{s.title}</h2>}
                <RichText text={s.text} />
              </section>
            ))}
          </div>
          {page.updatedAt && (
            <p className="mt-14 text-[11px] uppercase tracking-[0.24em] text-ink/45">
              Mise à jour le {new Date(page.updatedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </article>
      </main>
      <Footer />
    </>
  )
}
