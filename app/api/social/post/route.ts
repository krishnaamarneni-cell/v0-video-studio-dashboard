import { NextResponse } from "next/server";

// Make.com webhook URL
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "https://hook.us2.make.com/0kaubvw2hfot76jkqa5nstppp5q7q953";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, image_url, video_url, platforms, content_type, platform } = body;

    if (!text) {
      return NextResponse.json({ error: "Caption/text is required" }, { status: 400 });
    }

    if (content_type === "image" && !image_url) {
      return NextResponse.json({ error: "Image URL is required for image posts" }, { status: 400 });
    }

    if (content_type === "reel" && !video_url) {
      return NextResponse.json({ error: "Video URL is required for reel posts" }, { status: 400 });
    }

    const results: Record<string, any> = {};

    // Handle platform selection
    let platformList: string[] = [];
    if (platforms && Array.isArray(platforms)) {
      platformList = platforms;
    } else if (platform === "both") {
      platformList = ["instagram", "linkedin"];
    } else if (platform) {
      platformList = [platform];
    } else {
      platformList = ["instagram", "linkedin"];
    }

    // Send to Make.com for each platform
    for (const plat of platformList) {
      try {
        const payload = {
          platform: plat,
          content_type: content_type || "image",
          text,
          image_url: content_type === "image" ? image_url : null,
          video_url: content_type === "reel" ? video_url : null,
          timestamp: new Date().toISOString()
        };

        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        results[plat] = {
          success: response.ok || responseText === "Accepted",
          response: responseText
        };
      } catch (error: any) {
        results[plat] = {
          success: false,
          error: error.message
        };
      }
    }

    const allSuccess = Object.values(results).every((r: any) => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess
        ? `Posted to ${platformList.join(" & ")}!`
        : "Some posts failed"
    });

  } catch (error: any) {
    console.error("Post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post" },
      { status: 500 }
    );
  }
}