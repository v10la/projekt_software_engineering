import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-6">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link
          href="/impressum"
          className="hover:text-foreground transition-colors"
        >
          Impressum
        </Link>
        <Link
          href="/datenschutz"
          className="hover:text-foreground transition-colors"
        >
          Datenschutzerklärung
        </Link>
      </div>
    </footer>
  );
}
