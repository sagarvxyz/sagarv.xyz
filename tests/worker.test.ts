import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/worker.ts";

const env = {
    ASSETS: {
        async fetch(request: Request) {
            const path = new URL(request.url).pathname;
            if (path === "/blog") return Response.redirect("https://sagarv.xyz/blog/", 307);
            const files: Record<string, [string, string]> = {
                "/": ["<h1>Sagar</h1>", "text/html"],
                "/index.md": ["# Sagar", "text/plain"],
                "/blog/": ["<h1>Writing</h1>", "text/html"],
                "/blog.md": ["# Writing", "text/plain"],
                "/blog/standards/": ["<h1>Standards</h1>", "text/html"],
                "/blog/standards.md": ["# Standards", "text/plain"],
                "/404.md": ["# Page not found", "text/plain"],
                "/main.js": ["export {};", "application/javascript"],
            };
            const [body, type] = files[path] ?? ["<h1>404</h1>", "text/html"];
            return new Response(request.method === "HEAD" ? null : body, {
                status: files[path] ? 200 : 404,
                headers: { "Content-Type": type },
            });
        },
    },
};

const get = (path: string, accept = "*/*", method = "GET") =>
    worker.fetch(
        new Request(`https://sagarv.xyz${path}`, { method, headers: { Accept: accept } }),
        env,
    );

test("pages negotiate by quality and specificity, defaulting to HTML on a tie", async () => {
    const cases: [string, string][] = [
        ["*/*", "text/html"],
        ["text/html, text/markdown", "text/html"],
        ["text/markdown;q=0.3, text/html;q=0.8", "text/html"],
        ["text/markdown;q=0.9, text/html;q=0.2", "text/markdown"],
        ["text/html;q=0, text/*;q=0.8", "text/markdown"],
        ["text/markdown;q=0, */*;q=1", "text/html"],
    ];
    for (const [accept, type] of cases) {
        const response = await get("/blog/standards/", accept);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("Content-Type")!, new RegExp(`^${type}`));
        assert.equal(
            await response.text(),
            type === "text/html" ? "<h1>Standards</h1>" : "# Standards",
        );
        assert.match(response.headers.get("Vary")!, /Accept/);
        assert.match(response.headers.get("Link")!, /\/blog\/standards\.md/);
    }
    assert.equal((await get("/", "text/html;q=0, text/markdown;q=0, */*;q=1")).status, 406);
});

test("direct Markdown and HEAD requests retain the representation's headers", async () => {
    const direct = await get("/index.md", "text/html");
    assert.equal(await direct.text(), "# Sagar");
    assert.match(direct.headers.get("Content-Type")!, /^text\/markdown/);
    const head = await get("/", "text/markdown", "HEAD");
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.match(head.headers.get("Content-Type")!, /^text\/markdown/);
    assert.match(head.headers.get("Vary")!, /Accept/);
});

test("missing pages stay 404 in either representation and canonical redirects survive", async () => {
    for (const path of ["/missing/", "/missing.md"]) {
        const response = await get(path, "text/markdown");
        assert.equal(response.status, 404);
        assert.equal(await response.text(), "# Page not found");
        assert.equal(response.headers.get("Link"), null);
    }
    assert.equal((await get("/missing/")).status, 404);
    const redirect = await get("/blog", "text/markdown");
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get("Location"), "https://sagarv.xyz/blog/");
});

test("static assets bypass negotiation and writes are rejected", async () => {
    const script = await get("/main.js", "text/markdown");
    assert.equal(script.headers.get("Content-Type"), "application/javascript");
    assert.equal(await script.text(), "export {};");
    const write = await get("/", "*/*", "POST");
    assert.equal(write.status, 405);
    assert.equal(write.headers.get("Allow"), "GET, HEAD");
});
