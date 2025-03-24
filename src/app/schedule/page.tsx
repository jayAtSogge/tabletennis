import { ScheduleList } from "@/components/schedule-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SchedulePage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Matchschema</h1>

      <Card>
        <CardHeader>
          <CardTitle>Turneringsschema</CardTitle>
          <CardDescription>Se alla schemalagda matcher</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList />
        </CardContent>
      </Card>
    </div>
  )
}
