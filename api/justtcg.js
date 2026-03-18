// JustTCG API proxy - supports Pokemon, One Piece, Dragon Ball Z
// Docs: https://justtcg.com/docs

const BASE_URL = "https://api.justtcg.com/v1";

async function justFetch(path, apiKey) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`JustTCG ${path} failed ${resp.status}: ${txt}`);
  }
  return resp.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.JUSTTCG_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "JUSTTCG_API_KEY not configured" });

  const { action, gameId, setId, cardName, cardId } = req.body;

  try {
    // Get all sets for a game (Pokemon, OnePiece, DragonBallZ)
    if (action === "sets") {
      const data = await justFetch(`/sets?gameId=${encodeURIComponent(gameId)}`, apiKey);
      return res.status(200).json({ sets: data.sets || data.results || data || [] });
    }

    // Search cards within a set
    if (action === "cards") {
      const query = cardName ? `&name=${encodeURIComponent(cardName)}` : "";
      const setParam = setId ? `&setId=${encodeURIComponent(setId)}` : "";
      const data = await justFetch(`/cards?gameId=${encodeURIComponent(gameId)}${setParam}${query}&limit=20`, apiKey);
      return res.status(200).json({ cards: data.cards || data.results || data || [] });
    }

    // Get pricing for a specific card
    if (action === "pricing") {
      const data = await justFetch(`/cards/${cardId}/prices`, apiKey);
      return res.status(200).json({ pricing: data.prices || data.results || data || {} });
    }

    // Get market data / last sold for a card
    if (action === "lastsold") {
      const data = await justFetch(`/cards/${cardId}/sales`, apiKey);
      return res.status(200).json({ sales: data.sales || data.results || data || [] });
    }

    // Search across all cards by name
    if (action === "search") {
      const gameParam = gameId ? `&gameId=${encodeURIComponent(gameId)}` : "";
      const data = await justFetch(`/cards?name=${encodeURIComponent(cardName)}${gameParam}&limit=10`, apiKey);
      return res.status(200).json({ cards: data.cards || data.results || data || [] });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("JustTCG error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
