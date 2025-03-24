"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getGroups, getGroupPlayers, generateGroupMatches } from "@/lib/actions"
import type { Group, Player } from "@/lib/db"

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupPlayers, setGroupPlayers] = useState<Record<string, Player[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const fetchedGroups = await getGroups()
        setGroups(fetchedGroups)

        // Fetch players for each group
        const playersMap: Record<string, Player[]> = {}
        for (const group of fetchedGroups) {
          playersMap[group.id] = await getGroupPlayers(group.id)
        }
        setGroupPlayers(playersMap)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [toast])

  const handleGenerateMatches = async () => {
    setIsGeneratingMatches(true)
    try {
      await generateGroupMatches()
      toast({
        title: "Success",
        description: "Matches generated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate matches",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingMatches(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading groups...</div>
  }

  if (groups.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No groups created yet</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleGenerateMatches} disabled={isGeneratingMatches || groups.length === 0}>
          {isGeneratingMatches ? "Generating..." : "Generate Matches"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupPlayers[group.id]?.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.email}</TableCell>
                    </TableRow>
                  ))}
                  {!groupPlayers[group.id] || groupPlayers[group.id].length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No players in this group
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
