import LegalPage from '@/components/legal/legal-page'
import TrackForm from '@/components/legal/track-form'
import { loadLegalPage } from '@/lib/api/handlers/site-pages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Suivi de commande — Atelier JLT' }

export default async function Page() {
  return (
    <LegalPage page={await loadLegalPage('suivi')}>
      <TrackForm />
    </LegalPage>
  )
}
