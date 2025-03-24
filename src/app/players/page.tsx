import { PlayerList } from "@/components/player-list"
import { PlayerForm } from "@/components/player-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlayersPage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Spelare</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Spelarlista</CardTitle>
            <CardDescription>Hantera medverkande i turneringen</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lägg till spelare</CardTitle>
            <CardDescription>Registrera ny spelare till turneringen</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
