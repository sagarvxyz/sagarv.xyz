type Assets = { fetch: (request: Request) => Promise<Response> };

/** Specific media ranges override wildcards; quality wins, ties prefer HTML. */
function quality(accept: string, type: string): number {
    const [category] = type.split("/");
    let specificity = -1;
    let quality = 0;
    for (const part of accept.toLowerCase().split(",")) {
        const [range, ...params] = part.trim().split(";");
        const rank = range === type ? 2 : range === `${category}/*` ? 1 : range === "*/*" ? 0 : -1;
        if (rank < 0) continue;
        const q = params.find((p) => p.trim().startsWith("q="));
        const value = q ? Number(q.trim().slice(2)) : 1;
        if (rank > specificity) {
            specificity = rank;
            quality = 0;
        }
        if (rank === specificity && value >= 0 && value <= 1) quality = Math.max(quality, value);
    }
    return quality;
}

export default {
    async fetch(request: Request, env: { ASSETS: Assets }): Promise<Response> {
        const url = new URL(request.url);
        if (request.method !== "GET" && request.method !== "HEAD") {
            return new Response("Method not allowed", {
                status: 405,
                headers: { Allow: "GET, HEAD" },
            });
        }
        // Asset routes do not need content negotiation.
        if (
            url.pathname.includes(".") &&
            !url.pathname.endsWith(".html") &&
            !url.pathname.endsWith(".md")
        ) {
            return env.ASSETS.fetch(request);
        }
        const directMarkdown = url.pathname.endsWith(".md");
        const accept = request.headers.get("Accept") ?? "*/*";
        const mdQuality = quality(accept, "text/markdown");
        const htmlQuality = quality(accept, "text/html");
        const asMarkdown = directMarkdown || mdQuality > htmlQuality;
        if (!directMarkdown && !htmlQuality && !mdQuality) {
            return new Response(
                request.method === "HEAD"
                    ? null
                    : "Supported representations: text/html, text/markdown",
                {
                    status: 406,
                    headers: { Vary: "Accept", "Content-Type": "text/plain; charset=utf-8" },
                },
            );
        }
        // Vite serves directory aliases directly; normalize them in the Worker in both environments.
        const directory = new URL(url);
        if (!directory.pathname.includes(".") && !directory.pathname.endsWith("/"))
            directory.pathname += "/";
        // Check the actual HTML asset first, preserving missing-page status.
        let asset = await env.ASSETS.fetch(new Request(directory));
        if (directory.pathname !== url.pathname && asset.status === 200) {
            return new Response(null, {
                status: 308,
                headers: { Location: directory.href, Vary: "Accept" },
            });
        }
        const path = url.pathname
            .replace(/index\.html$/, "")
            .replace(/\.html$/, "")
            .replace(/\/$/, "");
        const copy = directMarkdown ? url.pathname : path ? `${path}.md` : "/index.md";
        if (asset.status >= 300 && asset.status < 400) {
            const headers = new Headers(asset.headers);
            headers.set("Vary", "Accept");
            return new Response(null, { status: asset.status, headers });
        }
        let missing = asset.status === 404;
        if (asMarkdown) {
            if (!directMarkdown || missing)
                asset = await env.ASSETS.fetch(
                    new Request(new URL(missing ? "/404.md" : copy, url)),
                );
            missing ||= asset.status === 404;
        }
        const headers = new Headers(asset.headers);
        headers.set(
            "Vary",
            [...new Set([...(headers.get("Vary")?.split(/,\s*/) ?? []), "Accept"])].join(", "),
        );
        if (asMarkdown) headers.set("Content-Type", "text/markdown; charset=utf-8");
        if (!missing)
            headers.set(
                "Link",
                `<${copy}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"`,
            );
        return new Response(request.method === "HEAD" ? null : asset.body, {
            status: missing ? 404 : asset.status,
            headers,
        });
    },
};
