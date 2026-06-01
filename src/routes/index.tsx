import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2, Camera, Tag, Video } from "lucide-react";
import logo from "@/assets/logo-avance.webp";

export const Route = createFileRoute("/")({ component: Index });

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
    <div className="min-h-screen bg-background">
      <div className="bg-brand-black py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-brand-black-foreground">
        Portal de Influencers · Avance Modas
      </div>

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src={logo} alt="Avance Modas" className="h-10 w-auto" />
          <Link
            to="/login"
            className="rounded-md bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-black-foreground transition hover:bg-primary"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Exclusivo para parceiras</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground sm:text-6xl">
          Envie seu conteudo para a <span className="text-primary">Avance Modas</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Anexe a etiqueta da embalagem que voce recebeu, suas fotos e videos
          com as pecas. Tudo organizado num so lugar para a equipe publicar nas
          redes sociais.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            to="/login"
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Acessar minha conta
          </Link>
        </div>
      </section>

      <section className="border-t bg-secondary">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
          <Feature icon={<Tag className="h-5 w-5" />} title="Etiqueta da embalagem" desc="Comprovacao do recebimento das pecas em poucos cliques." />
          <Feature icon={<Camera className="h-5 w-5" />} title="Fotos com as pecas" desc="Envie quantas imagens quiser, em alta qualidade." />
          <Feature icon={<Video className="h-5 w-5" />} title="Videos" desc="Reels, stories e bastidores prontos para publicar." />
        </div>
      </section>

      <footer className="bg-brand-black py-8 text-center text-xs uppercase tracking-[0.3em] text-brand-black-foreground/70">
        Avance Modas · Acesso restrito
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-black text-brand-black-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
