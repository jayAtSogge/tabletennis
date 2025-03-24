import { GroupList } from "@/components/group-list"
import { GroupForm } from "@/components/group-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GroupsPage() {
  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grupper</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Grupplista</CardTitle>
            <CardDescription>Se och hantera grupper</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skapa grupper</CardTitle>
            <CardDescription>Generera grupper för turneringen</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
