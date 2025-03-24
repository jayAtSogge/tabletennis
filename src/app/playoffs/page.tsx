import { PlayoffBracket } from "@/components/playoff-bracket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generatePlayoffs } from "@/lib/actions"

export default function PlayoffsPage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Slutspel</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generera Slutspel</CardTitle>
            <CardDescription>Skapa slutspelsträd av de 2 bästa spelarna i varje grupp</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generatePlayoffs}>
              <Button type="submit" variant="outline">Generera slutspelsträd</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slutspelsträd</CardTitle>
            <CardDescription>Direkt utslagsspel</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayoffBracket />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
