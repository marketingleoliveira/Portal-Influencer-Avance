import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tag, Image as ImageIcon, Video, X } from "lucide-react";

export const Route = createFileRoute("/painel/novo")({
  component: () => <RequireRole role="influencer"><NovoEnvio /></RequireRole>,
});

type Kind = "etiqueta" | "foto" | "video";

function NovoEnvio() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    if (files.length === 0) {
      toast.error("Anexe pelo menos um arquivo.");
      return;
    }
    setBusy(true);
    try {
      const { data: sub, error: sErr } = await supabase
        .from("submissions")
        .insert({ influencer_id: user.id, title, description })
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
    <AppShell title="Novo envio">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Novo envio</h1>
          <p className="text-sm text-muted-foreground">Inclua a etiqueta da embalagem e o conteudo produzido com as pecas.</p>
        </div>

        <div>
          <Label htmlFor="t">Titulo</Label>
          <Input id="t" required maxLength={120} placeholder="Ex: Look verao - Vestido floral" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="d">Descricao (opcional)</Label>
          <Textarea id="d" rows={3} placeholder="Detalhes do conteudo, pecas usadas, observacoes..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <FileSection
          title="Etiqueta da embalagem"
          icon={<Tag className="h-4 w-4" />}
          accept="image/*"
          files={grouped("etiqueta")}
          onAdd={(l) => addFiles("etiqueta", l)}
          onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))}
        />
        <FileSection
          title="Fotos com as pecas"
          icon={<ImageIcon className="h-4 w-4" />}
          accept="image/*"
          multiple
          files={grouped("foto")}
          onAdd={(l) => addFiles("foto", l)}
          onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))}
        />
        <FileSection
          title="Videos"
          icon={<Video className="h-4 w-4" />}
          accept="video/*"
          multiple
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
  title, icon, accept, multiple, files, onAdd, onRemove,
}: {
  title: string;
  icon: React.ReactNode;
  accept: string;
  multiple?: boolean;
  files: { file: File; kind: Kind; i: number }[];
  onAdd: (l: FileList | null) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      <Input type="file" accept={accept} multiple={multiple} onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
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
