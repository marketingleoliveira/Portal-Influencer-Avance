import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
  instagramHandle: z.string().max(60).optional().nullable(),
});

// Cria a primeira conta de admin somente se ainda nao existir nenhum admin.
export const createInitialAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createUserSchema.parse(d))
  .handler(async ({ data }) => {
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) return { error: cErr.message };
    if ((count ?? 0) > 0) return { error: "Ja existe um administrador. Faca login." };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) return { error: error?.message ?? "Erro ao criar usuario" };

    // Trigger ja criou perfil + role 'influencer'. Removemos a role de influencer e adicionamos admin.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (rErr) return { error: rErr.message };
    return { error: null };
  });

// Cria nova influencer (somente admin)
export const createInfluencer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (!roles || roles.length === 0) return { error: "Apenas administradores podem criar contas" };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        instagram_handle: data.instagramHandle ?? "",
      },
    });
    if (error || !created.user) return { error: error?.message ?? "Erro ao criar usuario" };

    // Atualiza profile (caso instagram nao tenha vindo no metadata corretamente)
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, instagram_handle: data.instagramHandle ?? null })
      .eq("id", created.user.id);

    return { error: null, userId: created.user.id };
  });

// Lista influencers (admin)
export const listInfluencers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (!roles || roles.length === 0) return { error: "forbidden", data: [] };

    const { data: infRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "influencer");
    const ids = (infRoles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { error: null, data: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, instagram_handle, created_at")
      .in("id", ids);

    // Buscar emails
    const enriched = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(p.id);
        return { ...p, email: u.user?.email ?? "" };
      }),
    );
    return { error: null, data: enriched };
  });

// Gera URL assinada para baixar/visualizar arquivo (admin ou dono)
export const signFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    // Verifica acesso: admin ou dono (path comeca com userId/)
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = roles?.some((r) => r.role === "admin");
    const ownsPath = data.path.startsWith(`${context.userId}/`);
    if (!isAdmin && !ownsPath) return { error: "forbidden", url: null };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("influencer-uploads")
      .createSignedUrl(data.path, 60 * 60);
    if (error) return { error: error.message, url: null };
    return { error: null, url: signed.signedUrl };
  });
