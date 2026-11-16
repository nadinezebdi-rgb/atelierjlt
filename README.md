# atelierjlt
Site e-commerce et espace d’administration d’Atelier JLT, maison française de décoration artisanale. Boutique, collections, produits, journal et éditeur de contenu personnalisé.

## Administration

- Les nouveaux produits sont des brouillons privés. Renseignez le nom, un prix
  positif, au moins une photo, un stock entier et la collection avant de publier.
  Les produits existants restent publiés si aucun statut n'était enregistré.
- L'aperçu produit montre les modifications locales sans les rendre publiques.
  Les brouillons sont exclus du catalogue public, des fiches, du sitemap,
  du panier et du contexte de l'assistant client.
- Les formulaires signalent les changements non enregistrés avant de quitter
  l'espace ou de fermer la page. Le menu et les titres des pages du catalogue
  s'enregistrent séparément, avec leurs boutons dédiés.
- Enregistrer le contenu d'une page met à jour le site public. L'édition visuelle
  reste disponible ; il n'y a pas de brouillon global pour les pages du site.
- Les outils de stock, d'ordre d'affichage, de livraison et d'emails sont
  accessibles dans les rubriques repliables des produits et commandes.

Validation : `yarn test:admin` puis `yarn build` (Node.js 24).
