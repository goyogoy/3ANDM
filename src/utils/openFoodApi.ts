/*
 * openFoodApi.ts — Appels API Open Food Facts
 * Header User-Agent obligatoire selon le sujet (section 2)
 */

const BASE_URL = 'https://world.openfoodfacts.org';

// Header d'identification obligatoire — exigé par Open Food Facts
const HEADERS = {
  'User-Agent': 'NutriScanSUPINFO/1.0 (contact@supinfo.com)',
};

/**
 * Recherche textuelle de produits par nom ou marque
 * Utilise le endpoint CGI (seule option full-text)
 */
export async function searchProducts(query: string) {
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error('Erreur lors de la recherche');
  return res.json();
}

/**
 * Récupère un produit complet par son code-barres
 * Retourne toutes les données nutritionnelles, allergènes, Nutri-Score, NOVA, Eco-Score
 */
export async function getProductByCode(code: string) {
  const url = `${BASE_URL}/api/v2/product/${code}.json`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error('Produit introuvable');
  return res.json();
}
