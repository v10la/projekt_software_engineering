import { Gift } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Geschenke</h1>
          <p className="text-xs text-muted-foreground">Manager</p>
        </div>
      </Link>
      {children}
    </div>
  );
}
