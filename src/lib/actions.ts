"use server"

import { v4 as uuidv4 } from "uuid"
import { db, type Player, type Group, type Match, type Score, DB } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { neon } from "@neondatabase/serverless";

export async function getData(): Promise<DB> {
    const sql = neon(process.env.DATABASE_URL || '');
    const data = {
        players: await sql`SELECT * FROM players`,
        groups: await sql`SELECT * FROM groups`,
        playerGroups: await sql`SELECT * FROM player_groups`,
        matches: await sql`SELECT * FROM matches`,
        scores: await sql`SELECT * FROM scores`,
    };
    return data as DB;
}

const data = getData()

// Player actions
export async function getPlayers(): Promise<Player[]> {
  const resolvedData = await data;
  return resolvedData.players;
}

export async function addPlayer(data: { name: string; email: string }): Promise<Player> {
  const newPlayer: Player = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    createdAt: new Date(),
  }

  data.players.push(newPlayer)
  revalidatePath("/players")
  return newPlayer
}

export async function removePlayer(id: string): Promise<void> {
  data.players = data.players.filter((player) => player.id !== id)

  // Also remove player from groups
  data.playerGroups = data.playerGroups.filter((pg) => pg.playerId !== id)

  // Remove matches involving this player
  data.matches = data.matches.filter((match) => match.player1Id !== id && match.player2Id !== id)

  revalidatePath("/players")
  revalidatePath("/groups")
  revalidatePath("/schedule")
  revalidatePath("/matches")
  revalidatePath("/standings")
}

// Group actions
export async function getGroups(): Promise<Group[]> {
  return data.groups
}

export async function getGroupPlayers(groupId: string): Promise<Player[]> {
  const playerIds = data.playerGroups.filter((pg) => pg.groupId === groupId).map((pg) => pg.playerId)

  return data.players.filter((player) => playerIds.includes(player.id))
}

export async function createRandomGroups(numGroups: number): Promise<void> {
  // Clear existing groups
  data.groups = []
  data.playerGroups = []

  // Create new groups
  for (let i = 1; i <= numGroups; i++) {
    const newGroup: Group = {
      id: uuidv4(),
      name: `Group ${i}`,
      createdAt: new Date(),
    }
    data.groups.push(newGroup)
  }

  // Shuffle players and assign to groups
  const shuffledPlayers = [...data.players].sort(() => Math.random() - 0.5)

  shuffledPlayers.forEach((player, index) => {
    const groupIndex = index % numGroups
    const groupId = data.groups[groupIndex].id

    data.playerGroups.push({
      playerId: player.id,
      groupId: groupId,
    })
  })

  revalidatePath("/groups")
}

// Match actions
export async function generateGroupMatches(): Promise<void> {
  // Clear existing group matches
  data.matches = data.matches.filter((match) => match.isPlayoff)
  data.scores = data.scores.filter((score) => {
    const match = data.matches.find((m) => m.id === score.matchId)
    return match && match.isPlayoff
  })

  // Generate round-robin matches for each group
  for (const group of data.groups) {
    const players = await getGroupPlayers(group.id)

    // Generate all possible pairs of players
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const newMatch: Match = {
          id: uuidv4(),
          player1Id: players[i].id,
          player2Id: players[j].id,
          groupId: group.id,
          round: 1, // All group matches are round 1
          scheduledTime: null,
          completed: false,
          isPlayoff: false,
        }

        data.matches.push(newMatch)
      }
    }
  }

  revalidatePath("/schedule")
  revalidatePath("/matches")
}

export async function getMatches(): Promise<Match[]> {
  return data.matches
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  return data.matches.find((match) => match.id === id)
}

export async function getMatchScore(matchId: string): Promise<Score | undefined> {
  return data.scores.find((score) => score.matchId === matchId)
}

export async function recordMatchScore(matchId: string, player1Score: number, player2Score: number): Promise<void> {
  const match = data.matches.find((m) => m.id === matchId)

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

  // Check if score already exists
  const existingScoreIndex = data.scores.findIndex((s) => s.matchId === matchId)

  if (existingScoreIndex >= 0) {
    // Update existing score
    data.scores[existingScoreIndex] = {
      matchId,
      player1Score,
      player2Score,
      winnerId,
    }
  } else {
    // Create new score
    data.scores.push({
      matchId,
      player1Score,
      player2Score,
      winnerId,
    })
  }

  // Mark match as completed
  const matchIndex = data.matches.findIndex((m) => m.id === matchId)
  if (matchIndex >= 0) {
    data.matches[matchIndex].completed = true
  }

  revalidatePath("/matches")
  revalidatePath("/standings")
}

// Standings actions
export async function getGroupStandings(groupId: string): Promise<any[]> {
  const players = await getGroupPlayers(groupId)
  const groupMatches = data.matches.filter((match) => match.groupId === groupId)

  const standings = players.map((player) => {
    // Initialize player stats
    const stats = {
      player,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
    }

    // Calculate stats from completed matches
    groupMatches.forEach((match) => {
      const score = data.scores.find((s) => s.matchId === match.id)

      if (score && match.completed) {
        if (match.player1Id === player.id || match.player2Id === player.id) {
          stats.played++

          if (score.winnerId === player.id) {
            stats.won++
            stats.points += 2 // 2 points for a win
          } else if (score.winnerId !== null) {
            stats.lost++
            stats.points += 0 // 0 points for a loss
          } else {
            stats.points += 1 // 1 point for a draw
          }
        }
      }
    })

    return stats
  })

  // Sort by points (descending), then by wins (descending)
  return standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.won - a.won
  })
}

// Playoff actions
export async function generatePlayoffs(): Promise<void> {
  // Clear existing playoff matches
  data.matches = data.matches.filter((match) => !match.isPlayoff)
  data.scores = data.scores.filter((score) => {
    const match = data.matches.find((m) => m.id === score.matchId)
    return match && !match.isPlayoff
  })

  // Get top 2 players from each group
  const playoffPlayers: Player[] = []

  for (const group of data.groups) {
    const standings = await getGroupStandings(group.id)
    const topTwo = standings.slice(0, 2).map((s) => s.player)
    playoffPlayers.push(...topTwo)
  }

  // Generate playoff matches (single elimination)
  // This is a simplified version - in a real app, you'd want to seed the bracket

  // Shuffle players to create random matchups
  const shuffledPlayers = [...playoffPlayers].sort(() => Math.random() - 0.5)

  // Create first round matches
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 < shuffledPlayers.length) {
      const newMatch: Match = {
        id: uuidv4(),
        player1Id: shuffledPlayers[i].id,
        player2Id: shuffledPlayers[i + 1].id,
        groupId: null, // Playoff matches don't belong to a group
        round: 1,
        scheduledTime: null,
        completed: false,
        isPlayoff: true,
      }

      data.matches.push(newMatch)
    }
  }

  revalidatePath("/playoffs")
}

export async function getPlayoffMatches(): Promise<Match[]> {
  return data.matches.filter((match) => match.isPlayoff)
}
