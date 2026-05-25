// Base44 serverless function: POST /api/submitRun
// Validates a gameplay run and updates player + leaderboard records.
//
// Request body:
//   { playerId: string, distance: number, coins: number,
//     topSpeed: number, durationSec: number, endedReason: string }
//
// Response:
//   { ok: true, newBest: boolean, player: Player, leaderboardRank?: number }

export default async function handler(req, ctx) {
  if (req.method !== 'POST') {
    return ctx.json({ error: 'Method not allowed' }, 405)
  }

  const { playerId, distance, coins, topSpeed, durationSec, endedReason } = req.body || {}

  // --- Basic validation ---
  if (!playerId || typeof distance !== 'number' || typeof coins !== 'number') {
    return ctx.json({ error: 'Invalid payload' }, 400)
  }
  if (distance < 0 || coins < 0 || topSpeed < 0 || durationSec < 0) {
    return ctx.json({ error: 'Negative values rejected' }, 400)
  }

  // --- Anti-cheat sanity bounds ---
  // Max realistic: top speed ~240 km/h, so distance/durationSec
  // converted to km/h shouldn't drastically exceed that.
  if (durationSec > 0) {
    const avgKmh = (distance / 1000) / (durationSec / 3600)
    if (avgKmh > 260) {
      return ctx.json({ error: 'Run rejected (sanity check)' }, 400)
    }
  }

  const player = await ctx.db.Player.findById(playerId)
  if (!player) return ctx.json({ error: 'Player not found' }, 404)

  // --- Record the Run ---
  await ctx.db.Run.create({
    playerId,
    distance: Math.floor(distance),
    coins: Math.floor(coins),
    topSpeed: Math.floor(topSpeed),
    durationSec: Math.floor(durationSec),
    endedReason: endedReason || 'crash',
  })

  // --- Update Player aggregates ---
  const newBest = distance > (player.bestDistance || 0)
  await ctx.db.Player.update(playerId, {
    totalCoins: (player.totalCoins || 0) + Math.floor(coins),
    totalDistance: (player.totalDistance || 0) + Math.floor(distance),
    bestDistance: newBest ? Math.floor(distance) : player.bestDistance,
    topSpeed: Math.max(player.topSpeed || 0, Math.floor(topSpeed)),
  })

  // --- Update leaderboard if new personal best ---
  if (newBest) {
    await ctx.db.LeaderboardEntry.upsert(
      { playerId },
      {
        playerId,
        displayName: player.displayName,
        bestDistance: Math.floor(distance),
        totalCoins: (player.totalCoins || 0) + Math.floor(coins),
      }
    )
  }

  return ctx.json({ ok: true, newBest })
}
