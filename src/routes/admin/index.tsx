import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { signFileUrl, listInfluencers } from "@/lib/admin.functions";
import { Tag, Image as ImageIcon, Video, Users, Download, ExternalLink, Search, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: () => <RequireRole role="admin"><AdminHome /></RequireRole>,
});

type Sub = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  influencer_id: string;
  submission_files: { id: string; file_path: string; file_type: string; mime_type: string | null }[];
};
type Profile = { id: string; full_name: string | null; instagram_handle: string | null };

function AdminHome() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const sign = useServerFn(signFileUrl);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("submissions")
      .select("*, submission_files(*)")
      .order("created_at", { ascending: false });
    const list = (data as Sub[]) ?? [];
    setSubs(list);
    const ids = Array.from(new Set(list.map((s) => s.influencer_id)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("*").in("id", ids);
      const map: Record<string, Profile> = {};
      (p as Profile[] ?? []).forEach((x) => { map[x.id] = x; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const open = async (path: string) => {
    const r = await sign({ data: { path } });
    if (r.url) window.open(r.url, "_blank");
    else toast.error(r.error ?? "Erro");
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("submissions").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); refresh(); }
  };

  return (
    <AppShell title="Painel Administrativo">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Envios das influencers</h1>
          <p className="text-sm text-muted-foreground">Visualize, baixe e marque como publicado.</p>
        </div>
        <Link to="/admin/influencers"><Button variant="outline"><Users className="mr-2 h-4 w-4" /> Influencers</Button></Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          Nenhum envio ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((s) => {
            const p = profiles[s.influencer_id];
            return (
              <article key={s.id} className="rounded-2xl border bg-card p-6 shadow-sm">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{s.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {p?.full_name ?? "—"}
                      {p?.instagram_handle ? <> · <span className="text-primary">@{p.instagram_handle}</span></> : null}
                      {" · "}
                      {new Date(s.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "publicado" ? "default" : "secondary"}>{s.status}</Badge>
                    {s.status !== "publicado" ? (
                      <Button size="sm" onClick={() => setStatus(s.id, "publicado")}>Marcar publicado</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "pendente")}>Reabrir</Button>
                    )}
                  </div>
                </header>

                {s.description && <p className="mt-3 text-sm text-foreground">{s.description}</p>}

                <FileGrid title="Etiquetas" icon={<Tag className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "etiqueta")} onOpen={open} />
                <FileGrid title="Fotos" icon={<ImageIcon className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "foto")} onOpen={open} />
                <FileGrid title="Videos" icon={<Video className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "video")} onOpen={open} isVideo />
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function FileGrid({
  title, icon, files, onOpen, isVideo,
}: {
  title: string;
  icon: React.ReactNode;
  files: { id: string; file_path: string; mime_type: string | null }[];
  onOpen: (p: string) => void;
  isVideo?: boolean;
}) {
  if (files.length === 0) return null;
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title} ({files.length})</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onOpen(f.file_path)}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted text-left"
          >
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {isVideo ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <span className="truncate">{f.file_path.split("/").pop()}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" /><ExternalLink className="h-3 w-3" /></span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
