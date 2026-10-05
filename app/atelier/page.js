import { redirect } from 'next/navigation'

// Redirection permanente de l'ancienne page /atelier vers /a-propos.
// Préserve les liens entrants, l'historique utilisateur et le SEO.
export default function AtelierRedirect() {
  redirect('/a-propos')
}
