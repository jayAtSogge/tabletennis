"use server"

import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { neon, NeonQueryInTransaction, type NeonQueryFunction } from "@neondatabase/serverless"
import type { Player, Group, Match, Score, DB } from "@/lib/db"

// Initialize database connection
let sql: NeonQueryFunction<any, any> | null = null
let cachedData: DB | null = null

// Function to get SQL client
function getSqlClient() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  const sql = getSqlClient()

  // Create tables if they don't exist
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS player_groups (
      "playerId" TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      "groupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY ("playerId", "groupId")
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      "player1Id" TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      "player2Id" TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      "groupId" TEXT REFERENCES groups(id) ON DELETE CASCADE,
      round INTEGER NOT NULL,
      "scheduledTime" TIMESTAMP,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      "isPlayoff" BOOLEAN NOT NULL DEFAULT FALSE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      "matchId" TEXT PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
      "player1Score" INTEGER NOT NULL,
      "player2Score" INTEGER NOT NULL,
      "winnerId" TEXT REFERENCES players(id) ON DELETE SET NULL
    )
  `
}

// Function to get all data from database
export async function getData(): Promise<DB> {
  if (cachedData) {
    return cachedData
  }

  const sql = getSqlClient()

  try {
    // Ensure tables exist
    await initializeDatabase()

    // Fetch all data
    const [players, groups, playerGroups, matches, scores] = await Promise.all([
      sql`SELECT * FROM players`,
      sql`SELECT * FROM groups`,
      sql`SELECT * FROM player_groups`,
      sql`SELECT * FROM matches`,
      sql`SELECT * FROM scores`,
    ])

    // Convert date strings to Date objects
    const processedPlayers = (players as Record<string, any>[]).map((player: any) => ({
      ...player,
      createdAt: new Date(player.createdAt),
    }))

    const processedGroups = (groups as Record<string, any>[]).map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
    }))

    const processedMatches = Array.isArray(matches)
      ? matches.map((match: any) => ({
          ...match,
          scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : null,
        }))
      : []

      const processedPlayerGroups = (playerGroups as Record<string, any>[]).map((playerGroup: any) => ({
        playerId: playerGroup.playerId,
        groupId: playerGroup.groupId,
      }))

      const processedScores = (scores as Record<string, any>[]).map((score: any) => ({
        matchId: score.matchId,
        player1Score: score.player1Score,
        player2Score: score.player2Score,
        winnerId: score.winnerId,
      }))

    cachedData = {
      players: processedPlayers,
      groups: processedGroups,
      playerGroups: processedPlayerGroups,
      matches: processedMatches,
      scores: processedScores,
    }

    return cachedData
  } catch (error) {
    console.error("Error fetching data from database:", error)
    throw error
  }
}

// Function to invalidate cache
function invalidateCache() {
  cachedData = null
}

// Player actions
export async function getPlayers(): Promise<Player[]> {
  const data = await getData()
  return data.players
}

export async function addPlayer(playerData: { name: string; email: string }): Promise<Player> {
  const sql = getSqlClient()
  const now = new Date()

  await sql`
    INSERT INTO players (name, email, "createdAt")
    VALUES (${playerData.name}, ${playerData.email}, ${now})
  `

  invalidateCache()
  revalidatePath("/players")

  return {
    id: uuidv4(),
    name: playerData.name,
    email: playerData.email,
    createdAt: now,
  }
}

export async function removePlayer(id: string): Promise<void> {
  const sql = getSqlClient()

  // The foreign key constraints with ON DELETE CASCADE will handle
  // removing related records in player_groups, matches, and scores
  await sql`DELETE FROM players WHERE id = ${id}`

  invalidateCache()
  revalidatePath("/players")
  revalidatePath("/groups")
  revalidatePath("/schedule")
  revalidatePath("/matches")
  revalidatePath("/standings")
}

// Group actions
export async function getGroups(): Promise<Group[]> {
  const data = await getData()
  return data.groups
}

export async function getGroupPlayers(groupId: string): Promise<Player[]> {
  const sql = getSqlClient()

  const players = await sql`
    SELECT p.* FROM players p
    JOIN player_groups pg ON p.id = pg."playerId"
    WHERE pg."groupId" = ${groupId}
  `

  if (Array.isArray(players)) {
    return players.map((player: any) => ({
      ...player,
      createdAt: new Date(player.createdAt),
    }))
  }
  throw new Error("Unexpected data format for players")
}

export async function createRandomGroups(numGroups: number): Promise<void> {
  const sql = getSqlClient()
  const data = await getData()

  // Start a transaction
  const tx = sql.transaction((tx) => {
    const queries: NeonQueryInTransaction[] = []

    // Delete existing groups and player_groups
    queries.push(tx`DELETE FROM player_groups`)
    queries.push(tx`DELETE FROM groups`)

    // Create new groups
    const groups: Group[] = []
    for (let i = 1; i <= numGroups; i++) {
      const id: string = uuidv4()
      const name: string = `Group ${i}`
      const now: Date = new Date()

      queries.push(tx`
        INSERT INTO groups (id, name, "createdAt")
        VALUES (${id}, ${name}, ${now})
      `)

      groups.push({ id, name, createdAt: now })
    }

    // Shuffle players and assign to groups
    const shuffledPlayers = [...data.players].sort(() => Math.random() - 0.5)

    for (let i = 0; i < shuffledPlayers.length; i++) {
      const groupIndex = i % numGroups
      const groupId = groups[groupIndex].id
      const playerId = shuffledPlayers[i].id

      queries.push(tx`
        INSERT INTO player_groups ("playerId", "groupId")
        VALUES (${playerId}, ${groupId})
      `)
    }

    return queries
  })

      invalidateCache()
      revalidatePath("/groups")
  }

// Match actions
export async function generateGroupMatches(): Promise<void> {
  const sql = getSqlClient()
  const data = await getData()

  // Start a transaction
  sql.transaction((tx) => {
    const queries: NeonQueryInTransaction[] = []

    // Delete existing non-playoff matches and their scores
    queries.push(tx`
      DELETE FROM scores
      WHERE "matchId" IN (
        SELECT id FROM matches WHERE "isPlayoff" = false
      )
    `)
    queries.push(tx`DELETE FROM matches WHERE "isPlayoff" = false`)

    // Generate round-robin matches for each group
    data.groups.forEach((group) => {
      const players = getGroupPlayers(group.id)

      players.then((resolvedPlayers) => {
        for (let i = 0; i < resolvedPlayers.length; i++) {
          for (let j = i + 1; j < resolvedPlayers.length; j++) {
            const id = uuidv4()

            queries.push(tx`
              INSERT INTO matches (id, "player1Id", "player2Id", "groupId", round, completed, "isPlayoff")
              VALUES (${id}, ${resolvedPlayers[i].id}, ${resolvedPlayers[j].id}, ${group.id}, 1, false, false)
            `)
          }
        }
      })
    })

    return queries
  })

  invalidateCache()
  revalidatePath("/schedule")
  revalidatePath("/matches")
}

export async function getMatches(): Promise<Match[]> {
  const data = await getData()
  return data.matches
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  const data = await getData()
  return data.matches.find((match) => match.id === id)
}

export async function getMatchScore(matchId: string): Promise<Score | undefined> {
  const data = await getData()
  return data.scores.find((score) => score.matchId === matchId)
}

export async function recordMatchScore(matchId: string, player1Score: number, player2Score: number): Promise<void> {
  const sql = getSqlClient()
  const match = await getMatchById(matchId)

  if (!match) {
    throw new Error("Match not found")
  }

  // Determine winner
  let winnerId: string | null = null
  if (player1Score > player2Score) {
    winnerId = match.player1Id
  } else if (player2Score > player1Score) {
    winnerId = match.player2Id
  }

  // Start a transaction
  await sql.transaction((tx) => {
    const queries: NeonQueryInTransaction[] = []

    queries.push(
      tx`
        DELETE FROM scores WHERE "matchId" = ${matchId}
      `
    )

    queries.push(
      tx`
        INSERT INTO scores ("matchId", "player1Score", "player2Score", "winnerId")
        VALUES (${matchId}, ${player1Score}, ${player2Score}, ${winnerId})
      `
    )

    queries.push(
      tx`
        UPDATE matches
        SET completed = true
        WHERE id = ${matchId}
      `
    )

    return queries
  })

  invalidateCache()
  revalidatePath("/matches")
  revalidatePath("/standings")
}

// Standings actions
export async function getGroupStandings(groupId: string): Promise<any[]> {
  const sql = getSqlClient()

  // Get all players in the group
  const players = await getGroupPlayers(groupId)

  // Get all matches for the group
  const matches = await sql`
    SELECT m.*, s."player1Score", s."player2Score", s."winnerId"
    FROM matches m
    LEFT JOIN scores s ON m.id = s."matchId"
    WHERE m."groupId" = ${groupId}
  `

  const standings: any[] = players.map((player: Player) => {
    // Initialize player stats
    const stats = {
      player,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
    }

    if (Array.isArray(matches)) {
      matches.forEach((match: any) => {
        if (match.completed) {
          if (match.player1Id === player.id || match.player2Id === player.id) {
            stats.played++

            if (match.winnerId === player.id) {
              stats.won++
              stats.points += 2 // 2 points for a win
            } else if (match.winnerId !== null) {
              stats.lost++
              stats.points += 0 // 0 points for a loss
            } else {
              stats.points += 1 // 1 point for a draw
            }
          }
        }
      })
    }

    return stats
  })

  // Sort by points (descending), then by wins (descending)
  return standings.sort((a: { points: number; won: number }, b: { points: number; won: number }) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.won - a.won
  })
}

// Playoff actions
export async function generatePlayoffs(): Promise<void> {
  const sql = getSqlClient()

  // Start a transaction
  await sql.transaction((tx) => {
    const queries: NeonQueryInTransaction[] = []

    // Delete existing playoff matches and their scores
    queries.push(tx`
      DELETE FROM scores
      WHERE "matchId" IN (
        SELECT id FROM matches WHERE "isPlayoff" = true
      )
    `)
    queries.push(tx`DELETE FROM matches WHERE "isPlayoff" = true`)

    // Get all groups
    const groups = getGroups()

    // Get top 2 players from each group
    const playoffPlayers: Player[] = []

    groups.then((groupList) => {
      groupList.forEach(async (group) => {
        const standings = await getGroupStandings(group.id)
        const topTwo = standings.slice(0, 2).map((s) => s.player)
        playoffPlayers.push(...topTwo)
      })
    })

    // Shuffle players to create random matchups
    const shuffledPlayers = [...playoffPlayers].sort(() => Math.random() - 0.5)

    // Create first round matches
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        const id = uuidv4()

        queries.push(tx`
          INSERT INTO matches (id, "player1Id", "player2Id", "groupId", round, completed, "isPlayoff")
          VALUES (${id}, ${shuffledPlayers[i].id}, ${shuffledPlayers[i + 1].id}, NULL, 1, false, true)
        `)
      }
    }

    return queries
  })

  invalidateCache()
  revalidatePath("/playoffs")
}

export async function getPlayoffMatches(): Promise<Match[]> {
  const data = await getData()
  return data.matches.filter((match) => match.isPlayoff)
}
