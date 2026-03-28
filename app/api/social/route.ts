import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch social posts
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new social post
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      text_content,
      media_url,
      source_url,      // Instagram reel URL for local download
      platforms,
      status,
      content_type,
      scheduled_for,
    } = body;

    // Validation - but allow empty text_content for reels (AI will generate)
    if (content_type === "image" && !text_content?.trim()) {
      return NextResponse.json(
        { error: "text_content is required for image posts" },
        { status: 400 }
      );
    }

    if (content_type === "reel" && !source_url?.trim()) {
      return NextResponse.json(
        { error: "source_url is required for reel posts" },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required" },
        { status: 400 }
      );
    }

    // Insert the post
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        text_content: text_content || "",  // Allow empty for reels
        media_url: media_url || null,
        source_url: source_url || null,
        platforms,
        status: status || "pending_approval",
        content_type: content_type || "image",
        scheduled_for: scheduled_for || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post: data,
      message: content_type === "reel"
        ? "Reel queued for processing by local script"
        : "Post created successfully"
    });
  } catch (error: any) {
    console.error("POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a social post
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("social_posts")
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

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a social post
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}