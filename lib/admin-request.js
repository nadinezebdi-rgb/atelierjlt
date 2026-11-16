export async function adminRequest(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || (response.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : 'Opération impossible. Réessayez.'))
  }
  return data
}
