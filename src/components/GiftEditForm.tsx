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
import { Plus, X } from "lucide-react";

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
    links?: string[];
    images?: string[];
  };
  occasions: { id: number; name: string; isDefault: boolean | null }[];
}

export default function GiftEditForm({ gift, occasions }: GiftEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isIdea, setIsIdea] = useState(gift.isIdea);
  const [isPurchased, setIsPurchased] = useState(gift.isPurchased);

  const initialLinks = gift.links && gift.links.length > 0
    ? gift.links
    : gift.link
      ? [gift.link]
      : [""];
  const initialImages = gift.images && gift.images.length > 0
    ? gift.images
    : gift.imagePath
      ? [gift.imagePath]
      : [];

  const [links, setLinks] = useState<string[]>(initialLinks.length > 0 ? initialLinks : [""]);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("isIdea", String(isIdea));
    formData.set("isPurchased", String(isPurchased));
    formData.set("links", JSON.stringify(links.filter(Boolean)));
    formData.set("images", JSON.stringify(images.filter(Boolean)));
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.path) {
          setImages((prev) => [...prev, data.path]);
        }
      }
    } finally {
      setUploading(false);
      e.target.value = "";
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
              <Label htmlFor="giftDate">Datum</Label>
              <Input
                id="giftDate"
                name="giftDate"
                type="date"
                defaultValue={gift.giftDate || ""}
              />
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
          </div>

          <div className="space-y-2">
            <Label>Links</Label>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[i] = e.target.value;
                    setLinks(updated);
                  }}
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLinks([...links, ""])}
            >
              <Plus className="w-3 h-3 mr-1" />
              Weiteren Link hinzufügen
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Bilder</Label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`Bild ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && (
                <span className="text-sm text-muted-foreground">Wird hochgeladen...</span>
              )}
            </div>
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
