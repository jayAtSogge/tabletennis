import { StandingsList } from "@/components/standings-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StandingsPage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grupp Poängställning</h1>

      <Card>
        <CardHeader>
          <CardTitle>Turnerings tabell</CardTitle>
          <CardDescription>Nuvarande poängställning för varje grupp</CardDescription>
        </CardHeader>
        <CardContent>
          <StandingsList />
        </CardContent>
      </Card>
    </div>
  )
}
