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
} from "lucide-react";
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description: string; estimatedPrice?: string }[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [newTaskGiftId, setNewTaskGiftId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const ideas = person.gifts.filter((g) => g.isIdea);
  const pastGifts = person.gifts.filter((g) => !g.isIdea);

  const [year] = person.birthday.split("-").map(Number);
  const now = new Date();
  const age = now.getFullYear() - year;

  async function handleDelete() {
    if (confirm(`Delete ${person.name} and all their gifts?`)) {
      await deletePerson(person.id);
      router.push("/persons");
    }
  }

  async function handleQuickAdd(formData: FormData) {
    formData.set("personId", String(person.id));
    formData.set("isIdea", "true");
    await createGift(formData);
    setShowQuickAdd(false);
    router.refresh();
  }

  async function handleConvert(giftId: number, formData: FormData) {
    const occasionId = formData.get("occasionId") ? parseInt(formData.get("occasionId") as string) : null;
    const giftDate = (formData.get("giftDate") as string) || new Date().toISOString().split("T")[0];
    await convertIdeaToGift(giftId, occasionId, giftDate);
    setConvertingId(null);
    router.refresh();
  }

  async function handleShare() {
    const result = await generateShareToken(person.id);
    if (result.token) {
      const url = `${window.location.origin}/share/${result.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
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
        toast({ title: "Error", description: data.error || "Failed to generate suggestions", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate suggestions. Check your API key.", variant: "destructive" });
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
    await createGift(formData);
    setAiSuggestions((prev) => prev.filter((s) => s.title !== title));
    router.refresh();
    toast({ title: "Added!", description: `"${title}" added to ideas` });
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

  function renderGiftCard(gift: GiftType) {
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
                {gift.isPurchased && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Purchased
                  </Badge>
                )}
                {gift.isIdea && (
                  <Badge variant="secondary" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Idea
                  </Badge>
                )}
              </div>
              {gift.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {gift.description}
                </p>
              )}
              {gift.link && (
                <a
                  href={gift.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  {gift.link.length > 50
                    ? gift.link.substring(0, 50) + "..."
                    : gift.link}
                </a>
              )}
              {gift.imagePath && (
                <div className="mt-2">
                  <img
                    src={gift.imagePath}
                    alt={gift.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              {gift.giftDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Date: {gift.giftDate}
                </p>
              )}

              {gift.tasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ListTodo className="w-3 h-3" />
                    Tasks ({gift.tasks.filter((t) => t.isDone).length}/
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
                    placeholder="New task..."
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
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewTaskGiftId(null);
                      setNewTaskTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setNewTaskGiftId(gift.id)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add task
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {gift.isIdea && (
                <>
                  {convertingId === gift.id ? (
                    <form
                      action={(formData) => handleConvert(gift.id, formData)}
                      className="space-y-2 p-3 bg-accent rounded-lg"
                    >
                      <Select name="occasionId">
                        <SelectTrigger className="h-8 text-xs w-40">
                          <SelectValue placeholder="Occasion" />
                        </SelectTrigger>
                        <SelectContent>
                          {occasions.map((occ) => (
                            <SelectItem key={occ.id} value={String(occ.id)}>
                              {occ.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        name="giftDate"
                        type="date"
                        className="h-8 text-xs"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                      <div className="flex gap-1">
                        <Button type="submit" size="sm" className="text-xs h-7">
                          Convert
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => setConvertingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setConvertingId(gift.id)}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Make Gift
                    </Button>
                  )}
                </>
              )}
              {!gift.isIdea && (
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
                  {gift.isPurchased ? "Unpurchase" : "Purchased"}
                </Button>
              )}
              <Link href={`/gifts/${gift.id}`}>
                <Button size="sm" variant="ghost" className="text-xs w-full">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive"
                onClick={() => {
                  if (confirm("Delete this gift?")) {
                    deleteGift(gift.id);
                    router.refresh();
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
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
              <Textarea name="notes" defaultValue={person.notes || ""} placeholder="Notes..." rows={2} />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cake className="w-4 h-4" />
                  {person.birthday} (Age: {age})
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
            Share
          </Button>
          {!isEditing && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
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
                  toast({ title: "Copied!" });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setShowQuickAdd(!showQuickAdd)}>
          <Plus className="w-4 h-4 mr-2" />
          Quick Add Idea
        </Button>
        <Button variant="outline" onClick={handleAiSuggest} disabled={loadingAi}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loadingAi ? "Generating..." : "AI Suggestions"}
        </Button>
      </div>

      {showQuickAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Add Idea</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleQuickAdd} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Gift idea..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input id="link" name="link" type="url" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Note (optional)</Label>
                  <Input id="description" name="description" placeholder="Size, color, etc." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Idea
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowQuickAdd(false)}>
                  Cancel
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
              AI Suggestions
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
                    Add
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
            All ({person.gifts.length})
          </TabsTrigger>
          <TabsTrigger value="ideas">
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Ideas ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="gifts">
            <Gift className="w-3.5 h-3.5 mr-1" />
            Gifts ({pastGifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {person.gifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No gifts or ideas yet. Add your first idea above!
            </p>
          ) : (
            person.gifts.map(renderGiftCard)
          )}
        </TabsContent>

        <TabsContent value="ideas" className="space-y-3 mt-4">
          {ideas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ideas yet.</p>
          ) : (
            ideas.map(renderGiftCard)
          )}
        </TabsContent>

        <TabsContent value="gifts" className="space-y-3 mt-4">
          {pastGifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No gifts yet.</p>
          ) : (
            pastGifts.map(renderGiftCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
