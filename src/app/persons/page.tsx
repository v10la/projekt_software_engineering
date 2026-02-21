import { getPersons } from "@/lib/actions/persons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Cake } from "lucide-react";
import Link from "next/link";

export default async function PersonsPage() {
  const personsList = await getPersons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Persons</h1>
          <p className="text-muted-foreground mt-1">
            Manage the people you give gifts to
          </p>
        </div>
        <Link href="/persons/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </Link>
      </div>

      {personsList.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No persons added yet. Add your first person to start planning
              gifts!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personsList.map((person) => {
            const [, month, day] = person.birthday.split("-").map(Number);
            const now = new Date();
            let nextBirthday = new Date(now.getFullYear(), month - 1, day);
            if (nextBirthday < now) {
              nextBirthday = new Date(now.getFullYear() + 1, month - 1, day);
            }
            const daysUntil = Math.ceil(
              (nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Link key={person.id} href={`/persons/${person.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{person.name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Cake className="w-3.5 h-3.5" />
                          <span>{person.birthday}</span>
                        </div>
                        {person.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {person.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          Birthday in
                        </span>
                        <p className="font-bold text-lg">
                          {daysUntil}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            days
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
