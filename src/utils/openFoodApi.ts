/*
 * API Open Food Facts
 * Helpers pour requêtes réseau
 */

const BASE_URL = 'https://world.openfoodfacts.org';

 // Recherche produits par texte
export async function searchProducts(query: string) {
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=25`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

 // Récupérer un produit par code-barres
export async function getProductByCode(code: string) {
  const url = `${BASE_URL}/api/v0/product/${code}.json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Product fetch failed');
  return res.json();
}