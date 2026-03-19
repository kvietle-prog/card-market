const BASE = "https://api.justtcg.com/v1";

async function jtFetch(path, apiKey) {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { "x-api-key": apiKey, "Accept": "application/json" },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`JustTCG ${resp.status}: ${txt}`);
  }
  return resp.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.JUSTTCG_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "JUSTTCG_API_KEY not configured" });

  const { action, game, setId, cardId, q, orderBy, order, limit, printing, minPrice } = req.body;

  try {
    // Get all sets for a game
    if (action === "sets") {
      const data = await jtFetch(`/sets?game=${encodeURIComponent(game)}`, apiKey);
      return res.status(200).json({ sets: data.data || [] });
    }

    // Get top N cards in a set ordered by price
    if (action === "top_cards") {
      const setParam = setId ? `&set=${encodeURIComponent(setId)}` : "";
      const gameParam = game ? `&game=${encodeURIComponent(game)}` : "";
      const orderByParam = `&orderBy=${orderBy || "price"}&order=${order || "desc"}`;
      const limitParam = `&limit=${limit || 10}`;
      const printingParam = printing ? `&printing=${encodeURIComponent(printing)}` : "";
      const minParam = minPrice ? `&min_price=${minPrice}` : "&min_price=1.00";
      const data = await jtFetch(`/cards?${gameParam}${setParam}${orderByParam}${limitParam}${printingParam}${minParam}&include_price_history=false`, apiKey);
      return res.status(200).json({ cards: data.data || [], pagination: data.pagination });
    }

    // Get full card with price history
    if (action === "card") {
      const data = await jtFetch(`/cards?cardId=${encodeURIComponent(cardId)}&include_price_history=true`, apiKey);
      return res.status(200).json({ card: (data.data || [])[0] || null });
    }

    // Search by name
    if (action === "search") {
      const gameParam = game ? `&game=${encodeURIComponent(game)}` : "";
      const setParam = setId ? `&set=${encodeURIComponent(setId)}` : "";
      const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
      const data = await jtFetch(`/cards?limit=10${gameParam}${setParam}${qParam}&include_price_history=false&min_price=1.00`, apiKey);
      return res.status(200).json({ cards: data.data || [] });
    }

    // Scanner: top movers (24h or 7d)
    if (action === "movers") {
      const gameParam = game ? `&game=${encodeURIComponent(game)}` : "";
      const period = orderBy || "7d";
      const data = await jtFetch(`/cards?${gameParam}&orderBy=${period}&order=desc&limit=20&min_price=1.00&include_price_history=false`, apiKey);
      return res.status(200).json({ cards: data.data || [] });
    }

    // Scanner: biggest drops / deals
    if (action === "deals") {
      const gameParam = game ? `&game=${encodeURIComponent(game)}` : "";
      const period = orderBy || "7d";
      const data = await jtFetch(`/cards?${gameParam}&orderBy=${period}&order=asc&limit=20&min_price=1.00&include_price_history=false`, apiKey);
      return res.status(200).json({ cards: data.data || [] });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("JustTCG error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
