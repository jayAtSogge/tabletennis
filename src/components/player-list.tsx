"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPlayers, removePlayer } from "@/lib/actions"
import type { Player } from "@/lib/db"

export function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const fetchedPlayers = await getPlayers()
        setPlayers(fetchedPlayers)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load players",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [toast])

  const handleRemovePlayer = async (id: string) => {
    try {
      await removePlayer(id)
      setPlayers(players.filter((player) => player.id !== id))
      toast({
        title: "Success",
        description: "Player removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading players...</div>
  }

  if (players.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No players registered yet</div>
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.email}</TableCell>
              <TableCell>{new Date(player.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePlayer(player.id)}
                  aria-label="Remove player"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
