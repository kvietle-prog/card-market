let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const key = process.env.TCGPLAYER_API_KEY;
  if (!key) throw new Error("TCGPLAYER_API_KEY not set");
  const resp = await fetch("https://api.tcgplayer.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${key}&client_secret=${key}`,
  });
  if (!resp.ok) throw new Error(`Auth failed: ${resp.status}`);
  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchProduct(token, query, categoryId) {
  const params = new URLSearchParams({ q: query, limit: 5, offset: 0, ...(categoryId && { categoryId }) });
  const resp = await fetch(`https://api.tcgplayer.com/catalog/products?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`Search failed: ${resp.status}`);
  const data = await resp.json();
  return data.results || [];
}

async function getMarketPrice(token, productId) {
  const resp = await fetch(`https://api.tcgplayer.com/pricing/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`Pricing failed: ${resp.status}`);
  const data = await resp.json();
  return data.results || [];
}

const CATEGORY_MAP = { "Pokémon": 3, "Magic: The Gathering": 1, "One Piece": 68 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { action, query, productId, game } = req.body;
  try {
    const token = await getAccessToken();
    if (action === "search") {
      const categoryId = CATEGORY_MAP[game];
      const products = await searchProduct(token, query, categoryId);
      return res.status(200).json({ products });
    }
    if (action === "pricing") {
      const prices = await getMarketPrice(token, productId);
      return res.status(200).json({ prices });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}