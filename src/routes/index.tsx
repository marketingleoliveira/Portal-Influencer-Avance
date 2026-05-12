import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user && role === "admin") return <Navigate to="/admin" />;
  if (user && role === "influencer") return <Navigate to="/painel" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Avance Modas</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground sm:text-6xl">
          Portal de Influencers
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Envie as etiquetas das embalagens recebidas, suas fotos e videos com as
          pecas — tudo organizado num so lugar para a equipe Avance Modas publicar
          nas redes sociais.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Acessar minha conta
          </Link>
          <Link
            to="/setup"
            className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Configuracao inicial (admin)
          </Link>
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          Acesso restrito. Suas credenciais sao fornecidas pela equipe Avance Modas.
        </p>
      </div>
    </div>
  );
}
