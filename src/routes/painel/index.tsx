import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Image as ImageIcon, Video, Tag } from "lucide-react";

export const Route = createFileRoute("/painel/")({ component: () => <RequireRole role="influencer"><PainelHome /></RequireRole> });

type Sub = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  submission_files: { id: string; file_type: string }[];
};

function PainelHome() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("submissions")
      .select("id, title, description, status, created_at, submission_files(id, file_type)")
      .eq("influencer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSubs((data as Sub[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <AppShell title="Meu Painel">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seus conteúdos</h1>
          <p className="text-sm text-muted-foreground">Envie a etiqueta, fotos e vídeos das peças.</p>
        </div>
        <Link to="/painel/novo">
          <Button><Plus className="mr-2 h-4 w-4" /> Enviar Conteúdo</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <p className="text-muted-foreground">Voce ainda nao fez nenhum envio.</p>
          <Link to="/painel/novo"><Button className="mt-4">Criar primeiro envio</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subs.map((s) => {
            const c = (t: string) => s.submission_files.filter((f) => f.file_type === t).length;
            return (
              <div key={s.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{s.title}</h3>
                  <Badge variant={s.status === "publicado" ? "default" : "secondary"}>{s.status}</Badge>
                </div>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {c("etiqueta")}</span>
                  <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> {c("foto")}</span>
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {c("video")}</span>
                  <span className="ml-auto">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
