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

export default function PersonForm({ person }: PersonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (person) {
        const result = await updatePerson(person.id, formData);
        if (result.success) {
          router.push(`/persons/${person.id}`);
        }
      } else {
        const result = await createPerson(formData);
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
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              required
              defaultValue={person?.birthday || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={person?.notes || ""}
              placeholder="Interests, preferences, sizes, etc."
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : person ? "Update" : "Add Person"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
