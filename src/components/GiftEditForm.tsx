"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGift } from "@/lib/actions/gifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GiftEditFormProps {
  gift: {
    id: number;
    personId: number;
    title: string;
    description: string | null;
    link: string | null;
    imagePath: string | null;
    giftDate: string | null;
    isIdea: boolean;
    isPurchased: boolean;
    occasionId: number | null;
  };
  occasions: { id: number; name: string; isDefault: boolean | null }[];
}

export default function GiftEditForm({ gift, occasions }: GiftEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isIdea, setIsIdea] = useState(gift.isIdea);
  const [isPurchased, setIsPurchased] = useState(gift.isPurchased);
  const [imagePath, setImagePath] = useState(gift.imagePath || "");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("isIdea", String(isIdea));
    formData.set("isPurchased", String(isPurchased));
    formData.set("imagePath", imagePath);
    try {
      const result = await updateGift(gift.id, formData);
      if (result.success) {
        router.push(`/persons/${gift.personId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.path) {
      setImagePath(data.path);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={gift.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={gift.description || ""}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                name="link"
                type="url"
                defaultValue={gift.link || ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="giftDate">Datum</Label>
              <Input
                id="giftDate"
                name="giftDate"
                type="date"
                defaultValue={gift.giftDate || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anlass</Label>
            <Select
              name="occasionId"
              defaultValue={gift.occasionId ? String(gift.occasionId) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Anlass auswählen" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((occ) => (
                  <SelectItem key={occ.id} value={String(occ.id)}>
                    {occ.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bild</Label>
            {imagePath && (
              <div className="mb-2">
                <img
                  src={imagePath}
                  alt="Gift"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isIdea"
                checked={isIdea}
                onCheckedChange={(v) => setIsIdea(!!v)}
              />
              <Label htmlFor="isIdea">Ist eine Idee (noch kein Geschenk)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPurchased"
                checked={isPurchased}
                onCheckedChange={(v) => setIsPurchased(!!v)}
              />
              <Label htmlFor="isPurchased">Bereits gekauft</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Änderungen speichern"}
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
