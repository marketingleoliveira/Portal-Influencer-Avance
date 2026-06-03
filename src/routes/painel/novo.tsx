import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tag, Image as ImageIcon, Video, X } from "lucide-react";

export const Route = createFileRoute("/painel/novo")({
  component: () => <RequireRole role="influencer"><NovoEnvio /></RequireRole>,
});

type Kind = "etiqueta" | "foto" | "video";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ADMINS = ["Leonardo", "Gabriela"];
const REDES = ["Instagram", "TikTok"];

function NovoEnvio() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mesRecebimento, setMesRecebimento] = useState("");
  const [contato, setContato] = useState("");
  const [redeSocial, setRedeSocial] = useState("");
  const [linkPostagem, setLinkPostagem] = useState("");
  const [files, setFiles] = useState<{ file: File; kind: Kind }[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (kind: Kind, list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).map((file) => ({ file, kind }));
    setFiles((prev) => [...prev, ...arr]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!mesRecebimento) { toast.error("Selecione o mês de recebimento."); return; }
    if (!contato) { toast.error("Selecione o administrador responsável pelo contato."); return; }
    if (!redeSocial) { toast.error("Selecione a rede social onde publicou."); return; }
    if (!linkPostagem.trim()) { toast.error("Informe o link da postagem."); return; }
    if (files.length === 0) { toast.error("Anexe pelo menos um arquivo."); return; }

    if (files.filter((f) => f.kind === "etiqueta").length > 1) {
      toast.error("A etiqueta deve ser enviada apenas uma vez.");
      return;
    }

    setBusy(true);
    try {
      const title = `Recebimento - ${mesRecebimento}`;
      const description = [
        `Contato de envio: ${contato}`,
        `Rede social: ${redeSocial}`,
        `Link(s) da postagem: ${linkPostagem.trim()}`,
      ].join("\n");

      const { data: sub, error: sErr } = await supabase
        .from("submissions")
        .insert({
          influencer_id: user.id,
          title,
          description,
          reception_month: mesRecebimento,
          contact_admin: contato,
          social_network: redeSocial,
          post_link: linkPostagem.trim(),
        })
        .select()
        .single();
      if (sErr || !sub) throw sErr ?? new Error("erro");

      for (const { file, kind } of files) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${user.id}/${sub.id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("influencer-uploads")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        await supabase
          .from("submission_files")
          .insert({ submission_id: sub.id, file_path: path, file_type: kind, mime_type: file.type });
      }
      toast.success("Envio criado!");
      nav({ to: "/painel" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const grouped = (k: Kind) => files.map((f, i) => ({ ...f, i })).filter((f) => f.kind === k);

  return (
    <AppShell title="Enviar Conteúdo">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Enviar Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Inclua a etiqueta da embalagem (uma única vez) e o conteúdo produzido com as peças.</p>
        </div>

        <div>
          <Label htmlFor="mes">Mês de recebimento da peça</Label>
          <Select value={mesRecebimento} onValueChange={setMesRecebimento}>
            <SelectTrigger id="mes"><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
            <SelectContent>
              {MESES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contato">Quem fez o contato de envio?</Label>
          <Select value={contato} onValueChange={setContato}>
            <SelectTrigger id="contato"><SelectValue placeholder="Selecione o administrador" /></SelectTrigger>
            <SelectContent>
              {ADMINS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rede">Rede social onde publicou</Label>
            <Select value={redeSocial} onValueChange={setRedeSocial}>
              <SelectTrigger id="rede"><SelectValue placeholder="Selecione a rede" /></SelectTrigger>
              <SelectContent>
                {REDES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="link">Link da(s) postagem(ns)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              value={linkPostagem}
              onChange={(e) => setLinkPostagem(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <FileSection
          title="Etiqueta da embalagem"
          icon={<Tag className="h-4 w-4" />}
          accept="image/*"
          single
          hint="Envie apenas uma imagem da etiqueta."
          files={grouped("etiqueta")}
          onAdd={(l) => {
            // Substitui qualquer etiqueta existente para garantir apenas uma
            setFiles((p) => p.filter((f) => f.kind !== "etiqueta"));
            addFiles("etiqueta", l);
          }}
          onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))}
        />
        <FileSection
          title="Fotos com as peças"
          icon={<ImageIcon className="h-4 w-4" />}
          accept="image/*"
          files={grouped("foto")}
          onAdd={(l) => addFiles("foto", l)}
          onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))}
        />
        <FileSection
          title="Vídeos"
          icon={<Video className="h-4 w-4" />}
          accept="video/*"
          files={grouped("video")}
          onAdd={(l) => addFiles("video", l)}
          onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav({ to: "/painel" })}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar"}</Button>
        </div>
      </form>
    </AppShell>
  );
}

function FileSection({
  title, icon, accept, files, onAdd, onRemove, single, hint,
}: {
  title: string;
  icon: React.ReactNode;
  accept: string;
  files: { file: File; kind: Kind; i: number }[];
  onAdd: (l: FileList | null) => void;
  onRemove: (i: number) => void;
  single?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      <p className="mb-3 text-xs text-muted-foreground">
        {hint ?? "Você pode selecionar vários arquivos de uma vez."}
      </p>
      <Input
        type="file"
        accept={accept}
        multiple={!single}
        onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }}
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {files.map((f) => (
            <li key={f.i} className="flex items-center justify-between rounded bg-muted px-3 py-1.5">
              <span className="truncate">{f.file.name}</span>
              <button type="button" onClick={() => onRemove(f.i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
