import LegalPage from '@/components/legal/legal-page'
import { loadLegalPage } from '@/lib/api/handlers/site-pages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Politique de confidentialité (RGPD) — Atelier JLT' }

export default async function Page() {
  return <LegalPage page={await loadLegalPage('confidentialite')} />
}
