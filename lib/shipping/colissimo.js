// Colissimo — Web Service d'Affranchissement (SLS), étiquette PDF 10×15.
// Variables : COLISSIMO_CONTRACT_NUMBER, COLISSIMO_PASSWORD
// ⚠ Colissimo exige une adresse d'expéditeur complète (Réglages → Expédition).
const ENDPOINT = 'https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel'

export function colissimoConfigured() {
  return !!(process.env.COLISSIMO_CONTRACT_NUMBER && process.env.COLISSIMO_PASSWORD)
}

export async function createColissimoLabel({ order, sender, parcel, productCode = 'DOM' }) {
  if (!sender.senderAddress || !sender.senderZip || !sender.senderCity) {
    throw Object.assign(new Error('Colissimo demande une adresse d’expéditeur complète (Réglages → Expédition).'), { status: 400 })
  }
  const a = order.address || {}
  const today = new Date().toISOString().slice(0, 10)
  const body = {
    contractNumber: process.env.COLISSIMO_CONTRACT_NUMBER,
    password: process.env.COLISSIMO_PASSWORD,
    outputFormat: { x: 0, y: 0, outputPrintingType: 'PDF_10x15_300dpi' },
    letter: {
      service: { productCode, depositDate: today, orderNumber: order.orderNumber, commercialName: sender.senderName || 'Atelier JLT' },
      parcel: { weight: Number(parcel.weight) },
      sender: {
        senderParcelRef: order.orderNumber,
        address: {
          companyName: sender.senderName || 'Atelier JLT',
          line2: sender.senderAddress, line3: sender.senderAddress2 || '',
          countryCode: 'FR', city: sender.senderCity, zipCode: sender.senderZip,
          email: sender.senderEmail || undefined, phoneNumber: sender.senderPhone || undefined,
        },
      },
      addressee: {
        addresseeParcelRef: order.orderNumber,
        address: {
          lastName: a.lastName || a.name || '', firstName: a.firstName || '',
          line2: a.address || '', line3: a.apt || '',
          countryCode: 'FR', city: a.city || '', zipCode: a.zip || '',
          email: a.email || undefined, mobileNumber: a.phone || undefined,
        },
      },
    },
  }
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })
  // Réponse multipart : une partie JSON (numéro de colis) + une partie PDF (étiquette)
  const buf = Buffer.from(await r.arrayBuffer())
  const raw = buf.toString('latin1')
  const jsonMatch = raw.match(/\{[\s\S]*?"labelV2Response"[\s\S]*?\}\s*\}/) || raw.match(/\{[\s\S]*"messages"[\s\S]*?\]\s*\}/)
  let info = null
  try { info = jsonMatch ? JSON.parse(jsonMatch[0]) : null } catch {}
  const parcelNumber = info?.labelV2Response?.parcelNumber || ''
  const pdfStart = raw.indexOf('%PDF')
  const pdfEnd = raw.lastIndexOf('%%EOF')
  if (!r.ok || !parcelNumber || pdfStart < 0) {
    const msg = info?.messages?.map((m) => m.messageContent).filter(Boolean).join(' · ')
    throw Object.assign(new Error(msg || `Colissimo a refusé la demande (${r.status})`), { status: 502 })
  }
  const pdf = buf.subarray(pdfStart, pdfEnd > pdfStart ? pdfEnd + 5 : buf.length)
  return {
    provider: 'colissimo',
    trackingNumber: parcelNumber,
    trackingUrl: `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(parcelNumber)}`,
    pdfBase64: pdf.toString('base64'),
  }
}
