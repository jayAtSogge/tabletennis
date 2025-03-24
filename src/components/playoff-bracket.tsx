"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getPlayoffMatches, getPlayers, getMatchScore } from "@/lib/actions"
import type { Match, Player, Score } from "@/lib/db"

export function PlayoffBracket() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedMatches, fetchedPlayers] = await Promise.all([getPlayoffMatches(), getPlayers()])

        setMatches(fetchedMatches)

        // Convert players array to record for easy lookup
        const playersRecord: Record<string, Player> = {}
        fetchedPlayers.forEach((player) => {
          playersRecord[player.id] = player
        })
        setPlayers(playersRecord)

        // Fetch scores for all matches
        const scoresRecord: Record<string, Score> = {}
        for (const match of fetchedMatches) {
          const score = await getMatchScore(match.id)
          if (score) {
            scoresRecord[match.id] = score
          }
        }
        setScores(scoresRecord)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load playoff data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (isLoading) {
    return <div className="text-center py-4">Loading playoff bracket...</div>
  }

  if (matches.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No playoff matches generated yet</div>
  }

  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {}
  matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = []
    }
    matchesByRound[match.round].push(match)
  })

  // Sort rounds
  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-[600px]">
        {rounds.map((round) => (
          <div key={round} className="flex-1 space-y-4">
            <h3 className="text-center font-semibold">
              {round === 1 ? "First Round" : round === 2 ? "Semi-Finals" : round === 3 ? "Finals" : `Round ${round}`}
            </h3>
            <div className="space-y-4">
              {matchesByRound[round].map((match) => (
                <Card key={match.id} className="border-primary/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{players[match.player1Id]?.name || "TBD"}</div>
                      <div className="font-bold">{scores[match.id]?.player1Score ?? "-"}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{players[match.player2Id]?.name || "TBD"}</div>
                      <div className="font-bold">{scores[match.id]?.player2Score ?? "-"}</div>
                    </div>
                    {match.completed && scores[match.id]?.winnerId && (
                      <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                        Winner: {scores[match.id]?.winnerId && players[scores[match.id]?.winnerId ?? ""] ? players[scores[match.id]?.winnerId ?? ""]?.name : "Unknown"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
