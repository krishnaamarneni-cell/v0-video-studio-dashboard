import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all monitored accounts
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("monitored_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add new account to monitor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Clean username (remove @)
    const cleanUsername = username.replace("@", "").trim().toLowerCase();

    // Check if already exists
    const { data: existing } = await supabase
      .from("monitored_accounts")
      .select("id")
      .eq("username", cleanUsername)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `@${cleanUsername} is already being monitored` },
        { status: 400 }
      );
    }

    // Add new account
    const { data, error } = await supabase
      .from("monitored_accounts")
      .insert({
        username: cleanUsername,
        enabled: true,
        auto_post_instagram: true,
        auto_post_youtube: true,
        reels_found: 0,
        reels_posted: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account: data,
      message: `Added @${cleanUsername} to monitored accounts`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update account settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("monitored_accounts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove account from monitoring
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("monitored_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Account removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}