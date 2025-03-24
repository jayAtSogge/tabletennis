import { MatchList } from "@/components/match-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MatchesPage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Matcher</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrera poäng</CardTitle>
          <CardDescription>Ange resultat för färdiga matcher</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchList />
        </CardContent>
      </Card>
    </div>
  )
}
