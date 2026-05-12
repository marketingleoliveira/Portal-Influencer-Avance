import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-avance.webp";

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { signOut, user, role } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-black py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-brand-black-foreground">
        Portal de Influencers · Avance Modas
      </div>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Avance Modas" className="h-10 w-auto" />
            <span className="hidden border-l pl-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              {title}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium text-foreground">{user?.email}</div>
              <div className="capitalize text-primary">{role ?? ""}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await signOut(); nav({ to: "/login" }); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
