import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TableIcon as TableTennis, Users, Grid3X3, Calendar, Trophy, Medal } from "lucide-react"

export default function Home() {
  return (
    <div className="container py-10 mx-auto">
      <div className="flex flex-col items-center text-center mb-10">
        <TableTennis className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Table Tennis Tournament</h1>
        <p className="text-xl text-muted-foreground mt-2">Manage your office table tennis tournament with ease</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/players">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Players</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage tournament players</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/groups">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Groups</CardTitle>
              <Grid3X3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Create and manage player groups</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/schedule">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Schedule</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>View and manage match schedule</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/matches">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Matches</CardTitle>
              <TableTennis className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Record match scores</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/standings">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Standings</CardTitle>
              <Medal className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>View group standings</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/playoffs">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">Playoffs</CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Manage playoff brackets</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
