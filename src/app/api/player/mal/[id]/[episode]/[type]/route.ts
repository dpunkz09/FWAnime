import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episode: string; type: string }> }
) {
  const { id, episode, type } = await params;

  // Build the FlixWorld Anime API embed URL
  // Using malId parameter for MyAnimeList ID
  const embedUrl = `https://anime-api.flixworld.xyz/api/embed?malId=${id}&episode=${episode}&audio=${type}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Player - FlixWorld</title>
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
      iframe { display: block; width: 100%; height: 100%; border: none; }
    </style>
</head>
<body>
    <iframe
      src="${embedUrl}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      referrerpolicy="origin"
    ></iframe>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
