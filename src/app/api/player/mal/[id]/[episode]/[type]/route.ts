import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episode: string; type: string }> }
) {
  const { id, episode, type } = await params;

  // Build the MegaPlay URL
  const embedUrl = `https://megaplay.buzz/stream/mal/${id}/${episode}/${type}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Player - FlixWorld</title>
    
    <!-- Domain health check - mimics MegaPlay's implementation -->
    <script>
      (function(g) {
        var u = "https://megaplay.buzz/lib/check_domain.json?cache_burst=" + Date.now();
        g.__MegaCdnHealthEarly = fetch(u, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        })
        .then(function(r) {
          if (!r.ok) throw new Error('cdn-health ' + r.status);
          return r.json();
        })
        .then(function(d) {
          g.__MegaCdnHealthEarlyData = d;
          return d;
        })
        .catch(function() {
          return null;
        });
      })(window);
    </script>

    <!-- GetSources rewrite logic - injects domain verification -->
    <script>
      (function(g) {
        var s = null;
        var S = (new URLSearchParams(location.search || "").get("s") || "").replace(/[^a-z0-9_-]/gi, "");
        
        function w(u) {
          return (!u || typeof u != "string" || !S || u.indexOf("getSources") === -1 || /[?&]s=/.test(u)) 
            ? u 
            : u + (u.indexOf("?") === -1 ? "?" : "&") + "s=" + encodeURIComponent(S);
        }
        
        function i() {
          var o = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(m, u) {
            return o.apply(this, [m, w(String(u))].concat([].slice.call(arguments, 2)));
          };
          
          if (g.fetch) {
            var f = g.fetch;
            g.fetch = function(a, b) {
              if (typeof a == "string") a = w(a);
              else if (a && typeof a == "object" && a.url) {
                var r = w(a.url);
                r !== a.url && (a = new Request(r, a));
              }
              return f.call(this, a, b);
            };
          }
        }
        
        Object.defineProperty(g, "GetSourcesRewrite", {
          configurable: true,
          enumerable: true,
          get: function() { return s; },
          set: function(v) {
            v && typeof v == "object" && (v.rewrite = w, v.install = i);
            s = v;
          }
        });
      })(window);
    </script>

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
