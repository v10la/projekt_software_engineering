"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPerson, updatePerson } from "@/lib/actions/persons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface PersonFormProps {
  person?: {
    id: number;
    name: string;
    birthday: string;
    notes: string | null;
  };
}

function validateBirthday(birthday: string): string | null {
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return "Ungültiges Datum";
  const today = new Date();
  if (birthDate > today) return "Geburtstag darf nicht in der Zukunft liegen";
  const ageDiffMs = today.getTime() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age > 120) return "Alter darf 120 Jahre nicht überschreiten";
  return null;
}

export default function PersonForm({ person }: PersonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const birthday = formData.get("birthday") as string;
    const birthdayError = validateBirthday(birthday);
    if (birthdayError) {
      setError(birthdayError);
      return;
    }

    setLoading(true);
    try {
      if (person) {
        const result = await updatePerson(person.id, formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.success) {
          router.push(`/persons/${person.id}`);
        }
      } else {
        const result = await createPerson(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.success) {
          router.push("/persons");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={person?.name || ""}
              placeholder="e.g. Anna Schmidt"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Geburtstag</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              required
              defaultValue={person?.birthday || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={person?.notes || ""}
              placeholder="Interessen, Vorlieben, Größen, etc."
              rows={3}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Wird gespeichert..." : person ? "Aktualisieren" : "Person hinzufügen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
