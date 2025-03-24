"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getMatches, getPlayers, getGroups, getMatchScore, recordMatchScore } from "@/lib/actions"
import type { Match, Player, Group, Score } from "@/lib/db"

export function MatchList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [groups, setGroups] = useState<Record<string, Group>>({})
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [player1Score, setPlayer1Score] = useState<number>(0)
  const [player2Score, setPlayer2Score] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedMatches, fetchedPlayers, fetchedGroups] = await Promise.all([
          getMatches(),
          getPlayers(),
          getGroups(),
        ])

        setMatches(fetchedMatches)

        // Convert players array to record for easy lookup
        const playersRecord: Record<string, Player> = {}
        fetchedPlayers.forEach((player) => {
          playersRecord[player.id] = player
        })
        setPlayers(playersRecord)

        // Convert groups array to record for easy lookup
        const groupsRecord: Record<string, Group> = {}
        fetchedGroups.forEach((group) => {
          groupsRecord[group.id] = group
        })
        setGroups(groupsRecord)

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
          description: "Failed to load matches",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleRecordScore = async () => {
    if (!selectedMatch) return

    setIsSubmitting(true)
    try {
      await recordMatchScore(selectedMatch.id, player1Score, player2Score)

      // Update local state
      setMatches(matches.map((match) => (match.id === selectedMatch.id ? { ...match, completed: true } : match)))

      setScores({
        ...scores,
        [selectedMatch.id]: {
          matchId: selectedMatch.id,
          player1Score,
          player2Score,
          winnerId:
            player1Score > player2Score
              ? selectedMatch.player1Id
              : player2Score > player1Score
                ? selectedMatch.player2Id
                : null,
        },
      })

      toast({
        title: "Success",
        description: "Match score recorded successfully",
      })

      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record match score",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openScoreDialog = (match: Match) => {
    setSelectedMatch(match)

    // Set initial scores if they exist
    const existingScore = scores[match.id]
    if (existingScore) {
      setPlayer1Score(existingScore.player1Score)
      setPlayer2Score(existingScore.player2Score)
    } else {
      setPlayer1Score(0)
      setPlayer2Score(0)
    }

    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading matches...</div>
  }

  if (matches.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No matches scheduled yet</div>
  }

  return (
    <div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player 1</TableHead>
              <TableHead>Player 2</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>{players[match.player1Id]?.name || "Unknown Player"}</TableCell>
                <TableCell>{players[match.player2Id]?.name || "Unknown Player"}</TableCell>
                <TableCell>
                  {match.isPlayoff ? (
                    <Badge variant="secondary">Playoff</Badge>
                  ) : (
                    groups[match.groupId || ""]?.name || "Unknown Group"
                  )}
                </TableCell>
                <TableCell>
                  {scores[match.id] ? `${scores[match.id].player1Score} - ${scores[match.id].player2Score}` : "-"}
                </TableCell>
                <TableCell>
                  {match.completed ? (
                    <Badge variant="default">Completed</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openScoreDialog(match)}>
                    {match.completed ? "Edit Score" : "Record Score"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Match Score</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player1Score">{selectedMatch && players[selectedMatch.player1Id]?.name}</Label>
                <Input
                  id="player1Score"
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(Number.parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player2Score">{selectedMatch && players[selectedMatch.player2Id]?.name}</Label>
                <Input
                  id="player2Score"
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleRecordScore} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
