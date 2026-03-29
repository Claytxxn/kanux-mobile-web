import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Role = "MEMBER" | "MANAGER" | "ADMIN";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ error: "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)" }, { status: 500 });
    }
    if (!serviceKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY in environment" }, { status: 500 });
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email as string | undefined)?.trim();
    const display_name = ((body.display_name as string | null | undefined) ?? null)?.trim() || null;
    const company_id = (body.company_id as string | undefined)?.trim();
    const role = (body.role as Role | undefined) || "MEMBER";

    if (!email || !company_id) {
      return NextResponse.json({ error: "missing email or company_id" }, { status: 400 });
    }
    if (!["MEMBER", "MANAGER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }

    // Client with user's JWT: used only for authorization checks (RLS)
    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const { data: callerProfile, error: callerProfileErr } = await authClient
      .from("user_profiles")
      .select("auth_user_id, is_super_admin")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (callerProfileErr || !callerProfile?.is_super_admin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Admin client (service role): actually creates/invites the user.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/login`;

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: display_name ? { display_name } : undefined,
    });

    if (inviteErr || !inviteData?.user) {
      return NextResponse.json({ error: inviteErr?.message || "failed to invite user" }, { status: 500 });
    }

    const invitedAuthUserId = inviteData.user.id;

    // Ensure user_profiles exists (idempotent)
    const { data: invitedProfile, error: upsertErr } = await admin
      .from("user_profiles")
      .upsert(
        {
          auth_user_id: invitedAuthUserId,
          email,
          display_name,
          is_super_admin: false,
        },
        { onConflict: "auth_user_id" }
      )
      .select("id")
      .single();

    if (upsertErr || !invitedProfile?.id) {
      return NextResponse.json({ error: upsertErr?.message || "failed to upsert profile" }, { status: 500 });
    }

    // Create company membership if missing
    const { data: existingMember } = await admin
      .from("company_members")
      .select("id")
      .eq("company_id", company_id)
      .eq("user_profile_id", invitedProfile.id)
      .maybeSingle();

    if (!existingMember?.id) {
      const { error: memberErr } = await admin.from("company_members").insert({
        company_id,
        user_profile_id: invitedProfile.id,
        role,
      });
      if (memberErr) {
        return NextResponse.json({ error: memberErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, invitedAuthUserId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

