import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { signFileUrl, listInfluencers } from "@/lib/admin.functions";
import {
  Tag, Image as ImageIcon, Video, Users, Download, ExternalLink, Search, X, ChevronDown, ChevronUp, Link as LinkIcon,
} from "lucide-react";
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
  reception_month: string | null;
  social_network: string | null;
  post_link: string | null;
  contact_admin: string | null;
  submission_files: { id: string; file_path: string; file_type: string; mime_type: string | null }[];
};
type Profile = { id: string; full_name: string | null; instagram_handle: string | null };
type Influencer = { id: string; full_name: string | null; instagram_handle: string | null; email: string; created_at: string };

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const REDES = ["Instagram", "TikTok"];
const STATUSES = ["pendente", "publicado"];

function AdminHome() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRede, setFilterRede] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const sign = useServerFn(signFileUrl);
  const listInf = useServerFn(listInfluencers);

  const refresh = async () => {
    setLoading(true);
    const [{ data }, infRes] = await Promise.all([
      supabase.from("submissions").select("*, submission_files(*)").order("created_at", { ascending: false }),
      listInf({}),
    ]);
    const list = (data as Sub[]) ?? [];
    setSubs(list);
    const infs = (infRes.data as Influencer[]) ?? [];
    setInfluencers(infs);
    const map: Record<string, Profile> = {};
    infs.forEach((i) => { map[i.id] = { id: i.id, full_name: i.full_name, instagram_handle: i.instagram_handle }; });
    const missing = Array.from(new Set(list.map((s) => s.influencer_id))).filter((id) => !map[id]);
    if (missing.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name, instagram_handle").in("id", missing);
      (p as Profile[] ?? []).forEach((x) => { map[x.id] = x; });
    }
    setProfiles(map);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const filteredInfluencers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return influencers;
    return influencers.filter((i) =>
      (i.full_name ?? "").toLowerCase().includes(q) ||
      (i.instagram_handle ?? "").toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q),
    );
  }, [influencers, search]);

  const submissionsCount = useMemo(() => {
    const m: Record<string, number> = {};
    subs.forEach((s) => { m[s.influencer_id] = (m[s.influencer_id] ?? 0) + 1; });
    return m;
  }, [subs]);

  const visibleSubs = useMemo(() => {
    if (!selectedId) return [];
    return subs
      .filter((s) => s.influencer_id === selectedId)
      .filter((s) => filterMonth === "all" || s.reception_month === filterMonth)
      .filter((s) => filterStatus === "all" || s.status === filterStatus)
      .filter((s) => filterRede === "all" || s.social_network === filterRede);
  }, [subs, selectedId, filterMonth, filterStatus, filterRede]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("submissions").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); refresh(); }
  };

  const selectedInf = selectedId ? influencers.find((i) => i.id === selectedId) : null;

  return (
    <AppShell title="Painel Administrativo">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Envios das influencers</h1>
          <p className="text-sm text-muted-foreground">Visualize, baixe e marque como publicado.</p>
        </div>
        <Link to="/admin/influencers"><Button variant="outline"><Users className="mr-2 h-4 w-4" /> Gerenciar Influencers</Button></Link>
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar influencer por nome, @instagram ou e-mail..."
            className="pl-9"
          />
        </div>
        {loading ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">Carregando influencers...</p>
        ) : filteredInfluencers.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">Nenhuma influencer encontrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredInfluencers.map((i) => {
              const active = selectedId === i.id;
              const count = submissionsCount[i.id] ?? 0;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setSelectedId(active ? null : i.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40"}`}
                >
                  <span className="font-medium">{i.full_name ?? i.email}</span>
                  {i.instagram_handle && <span className={active ? "opacity-80" : "text-muted-foreground"}>@{i.instagram_handle}</span>}
                  <Badge variant={active ? "secondary" : "outline"} className="ml-1">{count}</Badge>
                </button>
              );
            })}
          </div>
        )}
        {selectedInf && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span>Mostrando envios de <strong>{selectedInf.full_name ?? selectedInf.email}</strong></span>
            <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}><X className="mr-1 h-3 w-3" /> Limpar</Button>
          </div>
        )}
      </div>

      {!selectedId ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          Selecione uma influencer acima para ver os envios.
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Mês</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {MESES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Rede social</label>
              <Select value={filterRede} onValueChange={setFilterRede}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {REDES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : visibleSubs.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              Nenhum envio para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSubs.map((s) => {
                const isOpen = !!expanded[s.id];
                const fotos = s.submission_files.filter((f) => f.file_type === "foto").length;
                const videos = s.submission_files.filter((f) => f.file_type === "video").length;
                const etiquetas = s.submission_files.filter((f) => f.file_type === "etiqueta").length;
                return (
                  <article key={s.id} className="rounded-2xl border bg-card shadow-sm">
                    <header className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold">{s.reception_month ?? s.title}</h2>
                          {s.social_network && <Badge variant="outline">{s.social_network}</Badge>}
                          <Badge variant={s.status === "publicado" ? "default" : "secondary"}>{s.status}</Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{fotos} foto(s) · {videos} vídeo(s) · {etiquetas} etiqueta(s)</span>
                          {s.contact_admin && <span>Contato: {s.contact_admin}</span>}
                          <span>{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                        </p>
                        {s.post_link && (
                          <a href={s.post_link} target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <LinkIcon className="h-3 w-3" /> {s.post_link}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {s.status !== "publicado" ? (
                          <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "publicado")}>Marcar publicado</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "pendente")}>Reabrir</Button>
                        )}
                        <Button size="sm" onClick={() => setExpanded((e) => ({ ...e, [s.id]: !isOpen }))}>
                          {isOpen ? <><ChevronUp className="mr-1 h-4 w-4" /> Ocultar</> : <><ChevronDown className="mr-1 h-4 w-4" /> Ver detalhes</>}
                        </Button>
                      </div>
                    </header>

                    {isOpen && (
                      <div className="border-t p-4">
                        {s.description && <p className="mb-3 whitespace-pre-line text-sm text-foreground">{s.description}</p>}
                        <FileGrid title="Etiqueta" icon={<Tag className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "etiqueta")} sign={sign} />
                        <FileGrid title="Fotos" icon={<ImageIcon className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "foto")} sign={sign} />
                        <FileGrid title="Vídeos" icon={<Video className="h-4 w-4" />} files={s.submission_files.filter((f) => f.file_type === "video")} sign={sign} isVideo />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function FileGrid({
  title, icon, files, sign, isVideo,
}: {
  title: string;
  icon: React.ReactNode;
  files: { id: string; file_path: string; mime_type: string | null }[];
  sign: (args: { data: { path: string } }) => Promise<{ url: string | null; error: string | null }>;
  isVideo?: boolean;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        files.map(async (f) => {
          if (urls[f.id]) return [f.id, urls[f.id]] as const;
          const r = await sign({ data: { path: f.file_path } });
          return [f.id, r.url ?? ""] as const;
        }),
      );
      if (!cancelled) {
        const map: Record<string, string> = {};
        entries.forEach(([id, u]) => { if (u) map[id] = u; });
        setUrls((prev) => ({ ...prev, ...map }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map((f) => f.id).join(",")]);

  if (files.length === 0) return null;
  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title} ({files.length})</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f) => {
          const url = urls[f.id];
          return (
            <a
              key={f.id}
              href={url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {url ? (
                isVideo ? (
                  <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={url} alt={f.file_path.split("/").pop()} className="h-full w-full object-cover" loading="lazy" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  {isVideo ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
                </div>
              )}
              {isVideo && url && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/60 p-2"><Video className="h-5 w-5 text-white" /></div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
                <span className="truncate">{f.file_path.split("/").pop()}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" /><ExternalLink className="h-3 w-3" /></span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
