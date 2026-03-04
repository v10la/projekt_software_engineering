import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, persons, gifts } from "@/lib/db/schema";
import { Shield, Users, UserCircle, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminUserActions } from "@/components/AdminUserActions";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Nicht eingeloggt.</p>
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive font-medium">
          Zugriff verweigert. Nur Admins können diese Seite sehen.
        </p>
      </div>
    );
  }

  const allUsers = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .all();

  const totalUsers = allUsers.length;
  const totalPersons = db.select().from(persons).all().length;
  const totalGifts = db.select().from(gifts).all().length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Bereich</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Nutzer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <UserCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPersons}</p>
                <p className="text-xs text-muted-foreground">Personen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGifts}</p>
                <p className="text-xs text-muted-foreground">Geschenke</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Nutzer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Eingeloggt als {session.user.email}
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">ID</th>
                  <th className="h-10 px-4 text-left font-medium">Name</th>
                  <th className="h-10 px-4 text-left font-medium">Email</th>
                  <th className="h-10 px-4 text-left font-medium">Rolle</th>
                  <th className="h-10 px-4 text-left font-medium">Erstellt</th>
                  <th className="h-10 px-4 text-left font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                      >
                        {u.role === "admin" ? "Admin" : "Nutzer"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("de-DE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions userId={u.id} role={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
