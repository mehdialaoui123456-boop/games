// Base44 serverless function: GET /api/getLeaderboard?limit=20
// Returns the top N entries by bestDistance.

export default async function handler(req, ctx) {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100)

  const entries = await ctx.db.LeaderboardEntry
    .query()
    .orderBy('bestDistance', 'desc')
    .limit(limit)
    .get()

  return ctx.json({
    leaderboard: entries.map((e, idx) => ({
      rank: idx + 1,
      playerId: e.playerId,
      displayName: e.displayName,
      bestDistance: e.bestDistance,
      totalCoins: e.totalCoins,
      country: e.country || null,
    })),
    generatedAt: new Date().toISOString(),
  })
}
