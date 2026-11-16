export function isPublishedProduct(product) {
  return product.published !== false
}

export function publicationErrors(product) {
  const errors = []
  if (typeof product.name !== 'string' || !product.name.trim() || /^nouvelle cr[ée]ation$/i.test(product.name.trim())) errors.push('Choisissez un nom pour le produit.')
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push('Le prix doit être supérieur à 0 €.')
  if (!Array.isArray(product.images) || !product.images.some((image) => typeof image === 'string' && image.trim())) errors.push('Ajoutez au moins une photo.')
  if (!Number.isInteger(product.stock) || product.stock < 0) errors.push('Le stock doit être un nombre entier positif ou nul.')
  if (!['intemporels', 'pe-2026-2027'].includes(product.category)) errors.push('Choisissez une collection.')
  return errors
}
