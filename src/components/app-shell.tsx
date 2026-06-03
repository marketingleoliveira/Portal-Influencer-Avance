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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src={logo} alt="Avance Modas" className="h-8 w-auto sm:h-10" />
            <span className="hidden border-l pl-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              {title}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium text-foreground">{user?.email}</div>
              <div className="capitalize text-primary">{role ?? ""}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => { await signOut(); nav({ to: "/login" }); }}
            >
              <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="border-t bg-card mt-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            © Avance Modas
          </span>
          <Link
            to="/admin"
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            Painel Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
