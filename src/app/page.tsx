import { db } from "@/lib/db";
import { persons, gifts, occasions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Cake, TreePine, Lightbulb, ShoppingBag } from "lucide-react";
import Link from "next/link";

function getUpcomingBirthdays() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const currentMonthStr = String(currentMonth).padStart(2, "0");
  const nextMonthStr = String(nextMonth).padStart(2, "0");

  const allPersons = db.select().from(persons).all();
  return allPersons
    .filter((p) => {
      const month = p.birthday.split("-")[1];
      return month === currentMonthStr || month === nextMonthStr;
    })
    .map((p) => {
      const [year, month, day] = p.birthday.split("-").map(Number);
      const thisYear = now.getFullYear();
      let nextBirthday = new Date(thisYear, month - 1, day);
      if (nextBirthday < now) {
        nextBirthday = new Date(thisYear + 1, month - 1, day);
      }
      const daysUntil = Math.ceil(
        (nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const age = nextBirthday.getFullYear() - year;
      return { ...p, daysUntil, age };
    })
    .filter((p) => p.daysUntil <= 60 && p.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

function getChristmasStatus() {
  const now = new Date();
  const christmas = new Date(now.getFullYear(), 11, 25);
  if (now > christmas) {
    christmas.setFullYear(christmas.getFullYear() + 1);
  }
  const daysUntil = Math.ceil(
    (christmas.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const christmasOccasion = db
    .select()
    .from(occasions)
    .where(eq(occasions.name, "Weihnachten"))
    .get();

  let christmasGifts: { personName: string; title: string; isPurchased: boolean; isIdea: boolean }[] = [];
  if (christmasOccasion) {
    const allGifts = db
      .select({
        title: gifts.title,
        isPurchased: gifts.isPurchased,
        isIdea: gifts.isIdea,
        personId: gifts.personId,
      })
      .from(gifts)
      .where(eq(gifts.occasionId, christmasOccasion.id))
      .all();

    christmasGifts = allGifts.map((g) => {
      const person = db
        .select()
        .from(persons)
        .where(eq(persons.id, g.personId))
        .get();
      return { ...g, personName: person?.name || "Unbekannt" };
    });
  }

  return { daysUntil, gifts: christmasGifts };
}

function getStats() {
  const totalPersons = db.select().from(persons).all().length;
  const allGifts = db.select().from(gifts).all();
  const totalIdeas = allGifts.filter((g) => g.isIdea).length;
  const totalGifts = allGifts.filter((g) => !g.isIdea).length;
  const purchased = allGifts.filter((g) => g.isPurchased).length;
  return { totalPersons, totalIdeas, totalGifts, purchased };
}

export default function DashboardPage() {
  const birthdays = getUpcomingBirthdays();
  const christmas = getChristmasStatus();
  const stats = getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Übersicht deiner Geschenkplanung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPersons}</p>
                <p className="text-xs text-muted-foreground">Personen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalIdeas}</p>
                <p className="text-xs text-muted-foreground">Ideen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalGifts}</p>
                <p className="text-xs text-muted-foreground">Geplante Geschenke</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.purchased}</p>
                <p className="text-xs text-muted-foreground">Gekauft</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-pink-500" />
              Bevorstehende Geburtstage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Geburtstage in den nächsten 60 Tagen
              </p>
            ) : (
              <div className="space-y-3">
                {birthdays.map((person) => (
                  <Link
                    key={person.id}
                    href={`/persons/${person.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Wird {person.age} — {person.birthday}
                      </p>
                    </div>
                    <Badge
                      variant={
                        person.daysUntil <= 7 ? "destructive" : "secondary"
                      }
                    >
                      {person.daysUntil === 0
                        ? "Heute!"
                        : person.daysUntil === 1
                          ? "Morgen"
                          : `${person.daysUntil} Tage`}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-green-600" />
              Weihnachtsstatus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant="outline" className="text-base px-3 py-1">
                {christmas.daysUntil} Tage bis Weihnachten
              </Badge>
            </div>
            {christmas.gifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Weihnachtsgeschenke geplant
              </p>
            ) : (
              <div className="space-y-2">
                {christmas.gifts.map((gift, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{gift.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        {gift.title}
                      </p>
                    </div>
                    <Badge
                      variant={
                        gift.isPurchased
                          ? "default"
                          : gift.isIdea
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {gift.isPurchased
                        ? "Gekauft"
                        : gift.isIdea
                          ? "Idee"
                          : "Geplant"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
