// This is a simple in-memory database for demonstration purposes
// In a real application, you would use a proper database like PostgreSQL, MySQL, or MongoDB

export type Player = {
  id: string
  name: string
  email: string
  createdAt: Date
}

export type Group = {
  id: string
  name: string
  createdAt: Date
}

export type PlayerGroup = {
  playerId: string
  groupId: string
}

export type Match = {
  id: string
  player1Id: string
  player2Id: string
  groupId: string | null
  round: number
  scheduledTime: Date | null
  completed: boolean
  isPlayoff: boolean
}

export type Score = {
  matchId: string
  player1Score: number
  player2Score: number
  winnerId: string | null
}

export type DB = {
  players: Player[]
  groups: Group[]
  playerGroups: PlayerGroup[]
  matches: Match[]
  scores: Score[]
}

// Initialize the database with empty arrays
const db: DB = {
  players: [],
  groups: [],
  playerGroups: [],
  matches: [],
  scores: [],
}

// Export the database
export { db }
