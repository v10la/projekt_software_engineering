"use client";

import { useRouter } from "next/navigation";
import { createOccasion, deleteOccasion } from "@/lib/actions/occasions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OccasionsClientProps {
  occasions: {
    id: number;
    name: string;
    isDefault: boolean | null;
  }[];
}

export default function OccasionsClient({ occasions }: OccasionsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(formData: FormData) {
    const result = await createOccasion(formData);
    if (result.success) {
      router.refresh();
      toast({ title: "Occasion created" });
    }
  }

  async function handleDelete(id: number) {
    const result = await deleteOccasion(id);
    if (result.error) {
      toast({
        title: "Cannot delete",
        description: result.error,
        variant: "destructive",
      });
    } else {
      router.refresh();
      toast({ title: "Occasion deleted" });
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Occasions</h1>
        <p className="text-muted-foreground mt-1">
          Manage gift-giving occasions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Occasion</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="flex gap-2">
            <Input
              name="name"
              required
              placeholder="e.g. Hochzeit, Ostern..."
              className="flex-1"
            />
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {occasions.map((occasion) => (
          <Card key={occasion.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{occasion.name}</span>
                  {occasion.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                {!occasion.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(occasion.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
