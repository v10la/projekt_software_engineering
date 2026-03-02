import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Shield } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Not logged in.</p>
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive font-medium">
          Forbidden: Admins only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Area</h1>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-2">
        <p className="text-sm text-muted-foreground">
          Signed in as:{" "}
          <span className="font-medium text-foreground">
            {session.user.email}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Role:{" "}
          <span className="font-medium text-foreground">
            {session.user.role}
          </span>
        </p>
      </div>
    </div>
  );
}
