"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getGroups, getGroupStandings } from "@/lib/actions"
import type { Group } from "@/lib/db"

type PlayerStanding = {
  player: {
    id: string
    name: string
    email: string
  }
  played: number
  won: number
  lost: number
  points: number
}

export function StandingsList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [standings, setStandings] = useState<Record<string, PlayerStanding[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedGroups = await getGroups()
        setGroups(fetchedGroups)

        // Fetch standings for each group
        const standingsRecord: Record<string, PlayerStanding[]> = {}
        for (const group of fetchedGroups) {
          standingsRecord[group.id] = await getGroupStandings(group.id)
        }
        setStandings(standingsRecord)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load standings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (isLoading) {
    return <div className="text-center py-4">Loading standings...</div>
  }

  if (groups.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No groups created yet</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Played</TableHead>
                  <TableHead className="text-center">Won</TableHead>
                  <TableHead className="text-center">Lost</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings[group.id]?.map((standing, index) => (
                  <TableRow
                    key={standing.player.id}
                    className={
                      index === 0
                        ? "bg-green-100 dark:bg-green-900/20"
                        : index === 1
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : ""
                    }
                  >
                    <TableCell className="font-medium">{standing.player.name}</TableCell>
                    <TableCell className="text-center">{standing.played}</TableCell>
                    <TableCell className="text-center">{standing.won}</TableCell>
                    <TableCell className="text-center">{standing.lost}</TableCell>
                    <TableCell className="text-center font-bold">{standing.points}</TableCell>
                  </TableRow>
                ))}
                {!standings[group.id] || standings[group.id].length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No standings data available
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
