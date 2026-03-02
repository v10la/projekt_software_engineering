"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deletePerson, updatePerson } from "@/lib/actions/persons";
import { createGift, deleteGift, togglePurchased, convertIdeaToGift } from "@/lib/actions/gifts";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";
import { generateShareToken } from "@/lib/actions/share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cake,
  Edit,
  Trash2,
  Lightbulb,
  Gift,
  Plus,
  Share2,
  Sparkles,
  Check,
  ShoppingCart,
  ArrowRight,
  Link as LinkIcon,
  ListTodo,
  Copy,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";

type GiftType = {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  imagePath: string | null;
  giftDate: string | null;
  isIdea: boolean;
  isPurchased: boolean;
  createdAt: string;
  occasionId: number | null;
  occasionName: string | null;
  links: string[];
  images: string[];
  tasks: { id: number; title: string; isDone: boolean; giftId: number }[];
};

type PersonType = {
  id: number;
  name: string;
  birthday: string;
  notes: string | null;
  gifts: GiftType[];
};

type OccasionType = {
  id: number;
  name: string;
  isDefault: boolean | null;
};

export default function PersonDetail({
  person,
  occasions,
}: {
  person: PersonType;
  occasions: OccasionType[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description: string; estimatedPrice?: string }[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [newTaskGiftId, setNewTaskGiftId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Add form state for multiple links and images
  const [addLinks, setAddLinks] = useState<string[]>([""]);
  const [addImages, setAddImages] = useState<string[]>([]);
  const [addIsIdea, setAddIsIdea] = useState(true);
  const [addIsPurchased, setAddIsPurchased] = useState(false);
  const [uploadingAdd, setUploadingAdd] = useState(false);
  const [addOccasionId, setAddOccasionId] = useState<string | undefined>(undefined);
  const [addDate, setAddDate] = useState("");
  const [convertOccasionId, setConvertOccasionId] = useState<string | undefined>(undefined);
  const [convertDate, setConvertDate] = useState("");

  const ideas = person.gifts.filter((g) => g.isIdea);
  const pastGifts = person.gifts.filter((g) => !g.isIdea);

  const [year] = person.birthday.split("-").map(Number);
  const now = new Date();
  const age = now.getFullYear() - year;

  async function handleDelete() {
    if (confirm(`${person.name} und alle Geschenke löschen?`)) {
      await deletePerson(person.id);
      router.push("/persons");
    }
  }

  async function handleAddGift(formData: FormData) {
    formData.set("personId", String(person.id));
    formData.set("isIdea", String(addIsIdea));
    formData.set("isPurchased", String(addIsPurchased));
    formData.set("links", JSON.stringify(addLinks.filter(Boolean)));
    formData.set("images", JSON.stringify(addImages.filter(Boolean)));
    if (addOccasionId && addOccasionId !== "__none__") {
      formData.set("occasionId", addOccasionId);
    } else {
      formData.delete("occasionId");
    }
    if (addDate) {
      formData.set("giftDate", addDate);
    } else {
      formData.delete("giftDate");
    }
    await createGift(formData);
    setShowAddForm(false);
    setAddLinks([""]);
    setAddImages([]);
    setAddIsIdea(true);
    setAddIsPurchased(false);
    setAddOccasionId(undefined);
    setAddDate("");
    router.refresh();
  }

  async function handleAddImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAdd(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.path) {
          setAddImages((prev) => [...prev, data.path]);
        }
      }
    } finally {
      setUploadingAdd(false);
      e.target.value = "";
    }
  }

  async function handleConvert(giftId: number) {
    const occasionId =
      convertOccasionId && convertOccasionId !== "__none__"
        ? parseInt(convertOccasionId)
        : null;
    const giftDate = convertDate || null;
    await convertIdeaToGift(giftId, occasionId, giftDate);
    setConvertingId(null);
    setConvertOccasionId(undefined);
    setConvertDate("");
    router.refresh();
  }

  async function handleShare() {
    const result = await generateShareToken(person.id);
    if (result.token) {
      const url = `${window.location.origin}/share/${result.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "Link kopiert!", description: "Teil-Link in die Zwischenablage kopiert" });
    }
  }

  async function handleAiSuggest() {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
      } else {
        toast({ title: "Fehler", description: data.error || "Vorschläge konnten nicht generiert werden", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Vorschläge konnten nicht generiert werden. API-Schlüssel prüfen.", variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  }

  async function handleAdoptSuggestion(title: string, description: string) {
    const formData = new FormData();
    formData.set("personId", String(person.id));
    formData.set("title", title);
    formData.set("description", description);
    formData.set("isIdea", "true");
    formData.set("links", "[]");
    formData.set("images", "[]");
    await createGift(formData);
    setAiSuggestions((prev) => prev.filter((s) => s.title !== title));
    router.refresh();
    toast({ title: "Hinzugefügt!", description: `"${title}" zu Ideen hinzugefügt` });
  }

  async function handleAddTask(giftId: number) {
    if (!newTaskTitle.trim()) return;
    await createTask(giftId, newTaskTitle);
    setNewTaskTitle("");
    setNewTaskGiftId(null);
    router.refresh();
  }

  async function handleToggleTask(taskId: number) {
    await toggleTask(taskId);
    router.refresh();
  }

  async function handleDeleteTask(taskId: number) {
    await deleteTask(taskId);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    await updatePerson(person.id, formData);
    setIsEditing(false);
    router.refresh();
  }

  function getGiftLinks(gift: GiftType): string[] {
    if (gift.links && gift.links.length > 0) return gift.links;
    if (gift.link) return [gift.link];
    return [];
  }

  function getGiftImages(gift: GiftType): string[] {
    if (gift.images && gift.images.length > 0) return gift.images;
    if (gift.imagePath) return [gift.imagePath];
    return [];
  }

  function renderGiftCard(gift: GiftType) {
    const links = getGiftLinks(gift);
    const images = getGiftImages(gift);

    return (
      <Card key={gift.id} className="relative">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{gift.title}</h3>
                {gift.occasionName && (
                  <Badge variant="outline" className="text-xs">
                    {gift.occasionName}
                  </Badge>
                )}
                {gift.isIdea ? (
                  <Badge variant="secondary" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Idee
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    <Gift className="w-3 h-3 mr-1" />
                    Geschenk
                  </Badge>
                )}
                {gift.isPurchased && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Gekauft
                  </Badge>
                )}
              </div>
              {gift.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {gift.description}
                </p>
              )}
              {links.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {links.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      {url.length > 50 ? url.substring(0, 50) + "..." : url}
                    </a>
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((imgPath, i) => (
                    <img
                      key={i}
                      src={imgPath}
                      alt={`${gift.title} ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
              {gift.giftDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Datum: {gift.giftDate}
                </p>
              )}

              {gift.tasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ListTodo className="w-3 h-3" />
                    Aufgaben ({gift.tasks.filter((t) => t.isDone).length}/
                    {gift.tasks.length})
                  </p>
                  {gift.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={task.isDone}
                        onCheckedChange={() => handleToggleTask(task.id)}
                      />
                      <span
                        className={`text-sm ${task.isDone ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newTaskGiftId === gift.id ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Neue Aufgabe..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTask(gift.id);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTask(gift.id)}
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewTaskGiftId(null);
                      setNewTaskTitle("");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setNewTaskGiftId(gift.id)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Aufgabe hinzufügen
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant={gift.isPurchased ? "secondary" : "outline"}
                className="text-xs"
                onClick={() => {
                  togglePurchased(gift.id);
                  router.refresh();
                }}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {gift.isPurchased ? "Nicht gekauft" : "Gekauft"}
              </Button>
              {gift.isIdea && (
                <>
                  {convertingId === gift.id ? (
                    <div className="space-y-2 p-3 bg-accent rounded-lg">
                      <Select
                        value={convertOccasionId}
                        onValueChange={setConvertOccasionId}
                      >
                        <SelectTrigger className="h-8 text-xs w-40">
                          <SelectValue placeholder="Anlass" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Kein Anlass</SelectItem>
                          {occasions.map((occ) => (
                            <SelectItem key={occ.id} value={String(occ.id)}>
                              {occ.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DatePicker
                        value={convertDate}
                        onChange={setConvertDate}
                        small
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleConvert(gift.id)}
                        >
                          Umwandeln
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => {
                            setConvertingId(null);
                            setConvertOccasionId(undefined);
                            setConvertDate("");
                          }}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setConvertingId(gift.id);
                        setConvertOccasionId(undefined);
                        setConvertDate("");
                      }}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Zu Geschenk machen
                    </Button>
                  )}
                </>
              )}
              <Link href={`/gifts/${gift.id}`}>
                <Button size="sm" variant="ghost" className="text-xs w-full">
                  <Edit className="w-3 h-3 mr-1" />
                  Bearbeiten
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive"
                onClick={() => {
                  if (confirm("Dieses Geschenk löschen?")) {
                    deleteGift(gift.id);
                    router.refresh();
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Löschen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          {isEditing ? (
            <form action={handleUpdate} className="space-y-3">
              <Input name="name" defaultValue={person.name} className="text-2xl font-bold h-12" />
              <Input name="birthday" type="date" defaultValue={person.birthday} />
              <Textarea name="notes" defaultValue={person.notes || ""} placeholder="Notizen..." rows={2} />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Speichern</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Abbrechen</Button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cake className="w-4 h-4" />
                  {person.birthday} (Alter: {age})
                </span>
              </div>
              {person.notes && (
                <p className="text-muted-foreground mt-2">{person.notes}</p>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Teilen
          </Button>
          {!isEditing && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-1" />
              Bearbeiten
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Löschen
          </Button>
        </div>
      </div>

      {shareUrl && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="text-sm" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast({ title: "Kopiert!" });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Geschenk / Idee hinzufügen
        </Button>
        <Button variant="outline" onClick={handleAiSuggest} disabled={loadingAi}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loadingAi ? "Wird generiert..." : "KI-Vorschläge"}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geschenk / Idee hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleAddGift} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-title">Titel *</Label>
                <Input id="add-title" name="title" required placeholder="Geschenkidee..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Beschreibung (optional)</Label>
                <Textarea
                  id="add-description"
                  name="description"
                  placeholder="Größe, Farbe, Details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum (optional)</Label>
                  <DatePicker value={addDate} onChange={setAddDate} />
                </div>
                <div className="space-y-2">
                  <Label>Anlass (optional)</Label>
                  <Select
                    value={addOccasionId}
                    onValueChange={setAddOccasionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anlass auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Kein Anlass</SelectItem>
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
                <Label>Links (optional)</Label>
                {addLinks.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => {
                        const updated = [...addLinks];
                        updated[i] = e.target.value;
                        setAddLinks(updated);
                      }}
                    />
                    {addLinks.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddLinks(addLinks.filter((_, j) => j !== i))}
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
                  onClick={() => setAddLinks([...addLinks, ""])}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Weiteren Link hinzufügen
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Bilder (optional)</Label>
                {addImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {addImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img}
                          alt={`Upload ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setAddImages(addImages.filter((_, j) => j !== i))}
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
                    onChange={handleAddImageUpload}
                    disabled={uploadingAdd}
                  />
                  {uploadingAdd && (
                    <span className="text-sm text-muted-foreground">Wird hochgeladen...</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-isIdea"
                    checked={addIsIdea}
                    onCheckedChange={(v) => setAddIsIdea(!!v)}
                  />
                  <Label htmlFor="add-isIdea">Ist eine Idee (noch kein Geschenk)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="add-isPurchased"
                    checked={addIsPurchased}
                    onCheckedChange={(v) => setAddIsPurchased(!!v)}
                  />
                  <Label htmlFor="add-isPurchased">Bereits gekauft</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddLinks([""]);
                    setAddImages([]);
                    setAddIsIdea(true);
                    setAddIsPurchased(false);
                    setAddOccasionId(undefined);
                    setAddDate("");
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              KI-Vorschläge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSuggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                    {suggestion.estimatedPrice && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        ~{suggestion.estimatedPrice}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAdoptSuggestion(
                        suggestion.title,
                        suggestion.description
                      )
                    }
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Alle ({person.gifts.length})
          </TabsTrigger>
          <TabsTrigger value="ideas">
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Ideen ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="gifts">
            <Gift className="w-3.5 h-3.5 mr-1" />
            Geschenke ({pastGifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {person.gifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch keine Geschenke oder Ideen. Füge oben deine erste Idee hinzu!
            </p>
          ) : (
            person.gifts.map(renderGiftCard)
          )}
        </TabsContent>

        <TabsContent value="ideas" className="space-y-3 mt-4">
          {ideas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Ideen.</p>
          ) : (
            ideas.map(renderGiftCard)
          )}
        </TabsContent>

        <TabsContent value="gifts" className="space-y-3 mt-4">
          {pastGifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Geschenke.</p>
          ) : (
            pastGifts.map(renderGiftCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
