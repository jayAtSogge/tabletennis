"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getMatches, getPlayers, getGroups } from "@/lib/actions"
import type { Match, Player, Group } from "@/lib/db"

export function ScheduleList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [groups, setGroups] = useState<Record<string, Group>>({})
  const [isLoading, setIsLoading] = useState(true)
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
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load schedule",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (isLoading) {
    return <div className="text-center py-4">Loading schedule...</div>
  }

  if (matches.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No matches scheduled yet</div>
  }

  // Group matches by group
  const matchesByGroup: Record<string, Match[]> = {}

  // Add group matches
  matches
    .filter((match) => !match.isPlayoff)
    .forEach((match) => {
      const groupId = match.groupId || "unknown"
      if (!matchesByGroup[groupId]) {
        matchesByGroup[groupId] = []
      }
      matchesByGroup[groupId].push(match)
    })

  // Add playoff matches
  const playoffMatches = matches.filter((match) => match.isPlayoff)
  if (playoffMatches.length > 0) {
    matchesByGroup["playoffs"] = playoffMatches
  }

  return (
    <div className="space-y-6">
      {Object.entries(matchesByGroup).map(([groupId, groupMatches]) => (
        <div key={groupId} className="space-y-2">
          <h3 className="text-lg font-semibold">
            {groupId === "playoffs" ? "Playoffs" : groups[groupId]?.name || "Unknown Group"}
          </h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player 1</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>{players[match.player1Id]?.name || "Unknown Player"}</TableCell>
                    <TableCell>{players[match.player2Id]?.name || "Unknown Player"}</TableCell>
                    <TableCell>
                      {match.completed ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
