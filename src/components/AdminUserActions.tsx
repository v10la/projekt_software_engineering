"use client";

import { setUserRole } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface AdminUserActionsProps {
  userId: number;
  role: string;
}

export function AdminUserActions({ userId, role }: AdminUserActionsProps) {
  const { toast } = useToast();
  const router = useRouter();

  async function handleSetRole(newRole: "admin" | "user") {
    const result = await setUserRole(userId, newRole);
    if (result.error) {
      toast({
        title: "Fehler",
        description: result.error,
        variant: "destructive",
      });
    } else {
      router.refresh();
      toast({
        title: newRole === "admin" ? "Zum Admin gemacht" : "Zum Nutzer gemacht",
      });
    }
  }

  if (role === "admin") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => handleSetRole("user")}
      >
        Zum Nutzer machen
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="h-7 text-xs"
      onClick={() => handleSetRole("admin")}
    >
      Zum Admin machen
    </Button>
  );
}
