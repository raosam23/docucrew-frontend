/**
 * Capture README screenshots of the real DocuCrew UI.
 *
 * Browser requests to the API are intercepted and answered with sample
 * collections. The app itself is unchanged — no mock data, no test hooks.
 * Shapes match what this frontend calls on docucrew-backend (main):
 *   POST /api/auth/register          201 UserResponse
 *   POST /api/auth/login             200 UserResponse (httpOnly access_token cookie)
 *   POST /api/auth/logout            200 { message }
 *   GET  /api/auth/me                200 UserResponse
 *   GET/POST /api/collections/       CollectionResponse[] / CollectionResponse
 *   GET/DELETE /api/collections/{id}
 *   GET/POST /api/collections/{id}/documents[/]
 *   DELETE /api/collections/{id}/documents/{document_id}   204
 *   GET  /api/collections/{id}/history
 *   POST /api/collections/{id}/query
 *   POST /api/collections/{id}/query/stream
 *        SSE: event status, then token, then done
 *        (done payload is query_id, answer, citations, created_at)
 *
 * Re-run from the repo root (Google Chrome required, port 3000 free):
 *   bun run screenshots
 *
 * The script rebuilds the production app with
 * NEXT_PUBLIC_API_URL=http://localhost:8000, serves it on port 3000,
 * writes PNGs to docs/screenshots/, and stops the server.
 */
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const API_ORIGIN = "http://localhost:8000";
const API_URL = API_ORIGIN;
const PORT = 3000;
const BASE = `http://127.0.0.1:${PORT}`;

const USER = {
  id: "8f3a1c2e-6b47-4d1a-9e20-1c5a7b9d0e11",
  email: "priya.shah@example.com",
  name: "Priya Shah",
  created_at: "2026-06-02T15:04:00.000Z",
};

const NOW = "2026-10-28T18:30:00.000Z";

const RUNBOOKS_ID = "11111111-1111-4111-8111-111111111111";
const INCIDENTS_ID = "22222222-2222-4222-8222-222222222222";
const CONTRACTS_ID = "33333333-3333-4333-8333-333333333333";
const ONBOARDING_ID = "44444444-4444-4444-8444-444444444444";
const DESIGN_ID = "55555555-5555-4555-8555-555555555555";
const SECURITY_ID = "66666666-6666-4666-8666-666666666666";

function collection(id, name, description, hoursAgo) {
  return {
    id,
    user_id: USER.id,
    name,
    description,
    chroma_collection_id: `col_${id}`,
    created_at: new Date(Date.parse(NOW) - hoursAgo * 3600_000).toISOString(),
  };
}

const collections = [
  collection(
    RUNBOOKS_ID,
    "Runbooks",
    "Deploy, rollback, and paging notes for the payments platform.",
    2,
  ),
  collection(
    INCIDENTS_ID,
    "Incidents",
    "Postmortems and timelines from the last two quarters.",
    26,
  ),
  collection(
    CONTRACTS_ID,
    "Contracts",
    "OpenAPI specs and compatibility rules for public APIs.",
    50,
  ),
  collection(
    ONBOARDING_ID,
    "Setup",
    "Engineer setup, service map, and first-week reading.",
    80,
  ),
  collection(
    DESIGN_ID,
    "Designs",
    "Architecture decisions for the payments stack.",
    120,
  ),
  collection(
    SECURITY_ID,
    "Security",
    "Threat models and access reviews.",
    200,
  ),
];

function document(id, collectionId, filename, fileType, status, chunkCount) {
  return {
    id,
    collection_id: collectionId,
    filename,
    file_type: fileType,
    status,
    chunk_count: chunkCount,
    error_message: null,
    created_at: NOW,
  };
}

const documents = new Map([
  [
    RUNBOOKS_ID,
    [
      document(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        RUNBOOKS_ID,
        "platform-runbook.pdf",
        "pdf",
        "ready",
        48,
      ),
      document(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        RUNBOOKS_ID,
        "incident-response.md",
        "md",
        "ready",
        16,
      ),
      document(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
        RUNBOOKS_ID,
        "sre-handbook.docx",
        "docx",
        "ready",
        27,
      ),
    ],
  ],
  [
    INCIDENTS_ID,
    [
      document(
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
        INCIDENTS_ID,
        "sev2-timeline.pdf",
        "pdf",
        "processing",
        null,
      ),
      document(
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        INCIDENTS_ID,
        "postmortem-2026-q3.md",
        "md",
        "ready",
        11,
      ),
    ],
  ],
]);

const PRIOR_QUESTION =
  "What error budget does the checkout API keep during a regional failover?";

const PRIOR_ANSWER =
  "Checkout keeps a 30-minute monthly error budget. During a regional failover, burn alerts page payments on-call only after five consecutive failed probes, and the runbook says to hold the canary rather than fail open.";

const QUESTION =
  "If a canary deploy fails health checks, what is the rollback order and who gets paged?";

const ANSWER =
  "Roll the canary back first, then the payments-api deployment, and leave the shared gateway in place. Page payments on-call immediately. Page the platform secondary only if that rollback is still failing health checks after ten minutes. The incident notes and the SRE handbook agree on that order, and the handbook marks a failed rollback as a SEV-2.";

const CITATIONS = [
  { filename: "platform-runbook.pdf", chunk_index: 3, relevance_score: 0.91 },
  { filename: "incident-response.md", chunk_index: 1, relevance_score: 0.84 },
  { filename: "sre-handbook.docx", chunk_index: 6, relevance_score: 0.77 },
];

const PRIOR_CITATIONS = [
  { filename: "platform-runbook.pdf", chunk_index: 11, relevance_score: 0.88 },
  { filename: "sre-handbook.docx", chunk_index: 4, relevance_score: 0.73 },
];

const histories = new Map([
  [
    RUNBOOKS_ID,
    [
      {
        id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
        question: PRIOR_QUESTION,
        answer: PRIOR_ANSWER,
        citations: PRIOR_CITATIONS,
        created_at: "2026-10-28T18:12:00.000Z",
      },
    ],
  ],
]);

function corsHeaders(request) {
  const origin = request.headers()["origin"] || "http://127.0.0.1:3000";
  const requested = request.headers()["access-control-request-headers"];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": requested || "Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    Vary: "Origin",
  };
}

function json(route, status, body, request) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders(request),
    body: JSON.stringify(body),
  });
}

function empty(route, status, request) {
  return route.fulfill({
    status,
    headers: corsHeaders(request),
    body: "",
  });
}

function fileTypeOf(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "txt" || ext === "md") return ext;
  return "txt";
}

function filenamesFromUpload(request) {
  const raw = request.postDataBuffer()?.toString("latin1") ?? "";
  const names = [...raw.matchAll(/filename="([^"]+)"/g)].map((match) => match[1]);
  return names.length > 0 ? names : ["upload.pdf"];
}

function sseBody(answer, done) {
  const events = [`event: status\ndata: ${JSON.stringify({ message: "started" })}\n\n`];
  for (const part of answer.split(/(\s+)/).filter((part) => part.length > 0)) {
    events.push(`event: token\ndata: ${JSON.stringify({ content: part })}\n\n`);
  }
  events.push(`event: done\ndata: ${JSON.stringify(done)}\n\n`);
  return events.join("");
}

function rememberQuery(collectionId, question, answer, citations) {
  const item = {
    id: crypto.randomUUID(),
    question,
    answer,
    citations,
    created_at: new Date().toISOString(),
  };
  const history = histories.get(collectionId) ?? [];
  history.push(item);
  histories.set(collectionId, history);
  return item;
}

async function mockApi(route) {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  let pathName = url.pathname;
  if (pathName.length > 1 && pathName.endsWith("/")) pathName = pathName.slice(0, -1);

  if (method === "OPTIONS") {
    return empty(route, 204, request);
  }

  const log = (status) => console.log(`  mock ${method} ${url.pathname} -> ${status}`);

  if (method === "POST" && pathName === "/api/auth/login") {
    log(200);
    return json(route, 200, USER, request);
  }
  if (method === "POST" && pathName === "/api/auth/register") {
    log(201);
    return json(route, 201, USER, request);
  }
  if (method === "POST" && pathName === "/api/auth/logout") {
    log(200);
    return json(route, 200, { message: "Logged out successfully" }, request);
  }
  if (method === "GET" && pathName === "/api/auth/me") {
    log(200);
    return json(route, 200, USER, request);
  }

  if (pathName === "/api/collections") {
    if (method === "GET") {
      log(200);
      return json(route, 200, collections, request);
    }
    if (method === "POST") {
      const body = request.postDataJSON();
      const created = collection(
        crypto.randomUUID(),
        body.name,
        body.description ?? null,
        0,
      );
      collections.push(created);
      documents.set(created.id, []);
      histories.set(created.id, []);
      log(201);
      return json(route, 201, created, request);
    }
  }

  const stream = pathName.match(/^\/api\/collections\/([^/]+)\/query\/stream$/);
  if (stream && method === "POST") {
    const collectionId = stream[1];
    const body = request.postDataJSON();
    const saved = rememberQuery(collectionId, body.question, ANSWER, CITATIONS);
    log(200);
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        ...corsHeaders(request),
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
      body: sseBody(ANSWER, {
        query_id: saved.id,
        answer: saved.answer,
        citations: saved.citations,
        created_at: saved.created_at,
      }),
    });
  }

  const query = pathName.match(/^\/api\/collections\/([^/]+)\/query$/);
  if (query && method === "POST") {
    const collectionId = query[1];
    const body = request.postDataJSON();
    const saved = rememberQuery(collectionId, body.question, ANSWER, CITATIONS);
    log(200);
    return json(
      route,
      200,
      { answer: saved.answer, citations: saved.citations, query_id: saved.id },
      request,
    );
  }

  const history = pathName.match(/^\/api\/collections\/([^/]+)\/history$/);
  if (history && method === "GET") {
    log(200);
    return json(route, 200, histories.get(history[1]) ?? [], request);
  }

  const oneDocument = pathName.match(/^\/api\/collections\/([^/]+)\/documents\/([^/]+)$/);
  if (oneDocument && method === "DELETE") {
    const [collectionId, documentId] = [oneDocument[1], oneDocument[2]];
    const list = documents.get(collectionId) ?? [];
    documents.set(
      collectionId,
      list.filter((item) => item.id !== documentId),
    );
    log(204);
    return empty(route, 204, request);
  }

  const docs = pathName.match(/^\/api\/collections\/([^/]+)\/documents$/);
  if (docs && method === "GET") {
    log(200);
    return json(route, 200, documents.get(docs[1]) ?? [], request);
  }
  if (docs && method === "POST") {
    const collectionId = docs[1];
    const uploaded = filenamesFromUpload(request).map((filename) =>
      document(
        crypto.randomUUID(),
        collectionId,
        filename,
        fileTypeOf(filename),
        "ready",
        12,
      ),
    );
    documents.set(collectionId, [...(documents.get(collectionId) ?? []), ...uploaded]);
    log(200);
    return json(route, 200, uploaded, request);
  }

  const oneCollection = pathName.match(/^\/api\/collections\/([^/]+)$/);
  if (oneCollection && method === "GET") {
    const found = collections.find((item) => item.id === oneCollection[1]);
    if (!found) {
      log(404);
      return json(route, 404, { detail: "Collection not found" }, request);
    }
    log(200);
    return json(route, 200, found, request);
  }
  if (oneCollection && method === "DELETE") {
    const index = collections.findIndex((item) => item.id === oneCollection[1]);
    if (index >= 0) collections.splice(index, 1);
    log(204);
    return empty(route, 204, request);
  }

  log(404);
  return json(route, 404, { detail: `No mock for ${method} ${pathName}` }, request);
}

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "127.0.0.1");
  });
}

const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

function run(args, extraEnv = {}) {
  return spawn(process.execPath, [NEXT_BIN, ...args], {
    cwd: ROOT,
    detached: true,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...extraEnv },
  });
}

function stop(child) {
  if (!child || child.killed || child.pid == null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function waitForServer(child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) {
      throw new Error(`next start exited early (${child.exitCode})`);
    }
    try {
      const response = await fetch(BASE, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Server still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start on ${BASE}`);
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(200);
}

async function shoot(page, name) {
  await settle(page);
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, animations: "disabled", caret: "hide" });
  console.log(`  saved ${path.relative(ROOT, file)}`);
}

async function sampleFiles() {
  const dir = await mkdtemp(path.join(tmpdir(), "docucrew-docs-"));
  const names = ["platform-runbook.pdf", "incident-response.md", "sre-handbook.docx"];
  const paths = [];
  for (const name of names) {
    const file = path.join(dir, name);
    await writeFile(file, `DocuCrew sample document: ${name}\n`);
    paths.push(file);
  }
  return paths;
}

async function exerciseApi(page) {
  const report = await page.evaluate(
    async ({ api, runbooksId, incidentsId }) => {
      const calls = [];
      async function hit(method, path, options = {}) {
        const response = await fetch(`${api}${path}`, {
          method,
          credentials: "include",
          ...options,
        });
        const contentType = response.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
        calls.push({ method, path, status: response.status, contentType, body });
      }

      await hit("POST", "/api/auth/register", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "priya.shah@example.com",
          password: "correct-horse",
          name: "Priya Shah",
        }),
      });
      await hit("POST", "/api/auth/login", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "priya.shah@example.com",
          password: "correct-horse",
        }),
      });
      await hit("GET", "/api/auth/me");
      await hit("POST", "/api/auth/logout");
      await hit("GET", "/api/collections/");
      await hit("POST", "/api/collections/", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Scratch",
          description: "Temporary collection from the screenshot check.",
        }),
      });
      const created = calls.at(-1).body;
      await hit("GET", `/api/collections/${runbooksId}`);
      await hit("GET", `/api/collections/${runbooksId}/documents`);
      const form = new FormData();
      form.append("files", new File(["# notes"], "extra-notes.md", { type: "text/markdown" }));
      await hit("POST", `/api/collections/${runbooksId}/documents/`, { body: form });
      await hit(
        "DELETE",
        `/api/collections/${incidentsId}/documents/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2`,
      );
      await hit("GET", `/api/collections/${runbooksId}/history`);
      await hit("POST", `/api/collections/${runbooksId}/query`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Where is the rollback order written down?" }),
      });
      await hit("POST", `/api/collections/${runbooksId}/query/stream`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ question: "Who is the secondary page target?" }),
      });
      await hit("DELETE", `/api/collections/${created.id}`);
      return calls.map((call) => ({
        method: call.method,
        path: call.path,
        status: call.status,
        contentType: call.contentType,
        isArray: Array.isArray(call.body),
        keys: call.body && typeof call.body === "object" && !Array.isArray(call.body)
          ? Object.keys(call.body)
          : [],
        id: call.body && typeof call.body === "object" && !Array.isArray(call.body) ? call.body.id : undefined,
        hasStatus: typeof call.body === "string" && call.body.includes("event: status"),
        hasToken: typeof call.body === "string" && call.body.includes("event: token"),
        hasDone: typeof call.body === "string" && call.body.includes("event: done"),
      }));
    },
    { api: API_URL, runbooksId: RUNBOOKS_ID, incidentsId: INCIDENTS_ID },
  );

  const expect = (method, path, status) => {
    const found = report.find((call) => call.method === method && call.path === path);
    if (!found || found.status !== status) {
      throw new Error(
        `Expected ${method} ${path} -> ${status}, got ${JSON.stringify(found ?? null)}`,
      );
    }
    return found;
  };

  const userKeys = ["id", "email", "name", "created_at"];
  for (const key of userKeys) {
    if (!expect("POST", "/api/auth/login", 200).keys.includes(key)) {
      throw new Error(`Login response missing ${key}`);
    }
  }
  expect("POST", "/api/auth/register", 201);
  expect("GET", "/api/auth/me", 200);
  expect("POST", "/api/auth/logout", 200);
  if (!expect("GET", "/api/collections/", 200).isArray) {
    throw new Error("Collection list was not an array");
  }
  const created = expect("POST", "/api/collections/", 201);
  if (!created.keys.includes("chroma_collection_id")) {
    throw new Error("Created collection missing chroma_collection_id");
  }
  expect("GET", `/api/collections/${RUNBOOKS_ID}`, 200);
  if (!expect("GET", `/api/collections/${RUNBOOKS_ID}/documents`, 200).isArray) {
    throw new Error("Document list was not an array");
  }
  expect("POST", `/api/collections/${RUNBOOKS_ID}/documents/`, 200);
  expect(
    "DELETE",
    `/api/collections/${INCIDENTS_ID}/documents/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2`,
    204,
  );
  if (!expect("GET", `/api/collections/${RUNBOOKS_ID}/history`, 200).isArray) {
    throw new Error("History was not an array");
  }
  const query = expect("POST", `/api/collections/${RUNBOOKS_ID}/query`, 200);
  for (const key of ["answer", "citations", "query_id"]) {
    if (!query.keys.includes(key)) throw new Error(`Query response missing ${key}`);
  }
  const streamed = expect("POST", `/api/collections/${RUNBOOKS_ID}/query/stream`, 200);
  if (!streamed.contentType.startsWith("text/event-stream") || !streamed.hasStatus || !streamed.hasToken || !streamed.hasDone) {
    throw new Error(`SSE mock check failed: ${JSON.stringify(streamed)}`);
  }
  expect("DELETE", `/api/collections/${created.id}`, 204);
  console.log("  api mock ok");
}

async function capture(browser) {
  const desktop = {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
  };

  const anon = await browser.newContext(desktop);
  anon.setDefaultTimeout(20_000);
  await anon.route(`${API_ORIGIN}/**`, mockApi);
  const login = await anon.newPage();
  login.on("pageerror", (error) => console.error(`  page error: ${error.message}`));
  await login.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await login.getByRole("heading", { name: "Welcome back" }).waitFor();
  await login.getByRole("button", { name: "Sign in" }).waitFor();
  await shoot(login, "login.png");

  const register = await anon.newPage();
  await register.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await register.getByRole("heading", { name: "Create your account" }).waitFor();
  await register.getByRole("button", { name: "Create Account" }).waitFor();
  await shoot(register, "register.png");

  await login.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await login.getByLabel("Email").fill(USER.email);
  await login.getByLabel("Password").fill("correct-horse");
  await login.getByRole("button", { name: "Sign in" }).click();
  await login.getByRole("heading", { name: "My Collections" }).waitFor();
  await login.getByText("Runbooks").waitFor();
  await login.getByText(USER.name).waitFor();
  const toast = login.getByText("Logged in successfully");
  try {
    await toast.waitFor({ timeout: 3000 });
    await toast.waitFor({ state: "hidden", timeout: 8000 });
  } catch {
    // The toast can already be gone before we look for it.
  }
  await shoot(login, "dashboard.png");

  await login.goto(`${BASE}/collections/new`, { waitUntil: "networkidle" });
  await login.getByRole("heading", { name: "New Collection" }).waitFor();
  await login.getByLabel("Name").fill("Platform Runbooks");
  await login.getByLabel("Description").fill(
    "Deploy, rollback, and paging notes for the payments platform.",
  );
  await login.locator("#files").setInputFiles(await sampleFiles());
  await login.waitForFunction(() => {
    const input = document.querySelector("#files");
    return input instanceof HTMLInputElement && input.files?.length === 3;
  });
  await shoot(login, "new-collection.png");

  await login.goto(`${BASE}/collections/${INCIDENTS_ID}`, { waitUntil: "networkidle" });
  await login.getByRole("heading", { name: "Incidents" }).waitFor();
  await login.getByText("sev2-timeline.pdf").waitFor();
  await login.getByText("processing").waitFor();
  await login.getByText("Waiting for all documents to be ready.").waitFor();
  await shoot(login, "ingesting.png");

  await login.goto(`${BASE}/collections/${RUNBOOKS_ID}`, { waitUntil: "networkidle" });
  await login.getByRole("heading", { name: "Runbooks" }).waitFor();
  await login.getByRole("complementary").getByText("platform-runbook.pdf").waitFor();
  await login.getByText(PRIOR_QUESTION).waitFor();
  await login.getByPlaceholder("Ask a question about your documents...").fill(QUESTION);
  const failed = login.getByText("Failed to submit query");
  const submitted = login.getByRole("button", { name: "Submit Query" }).click();
  const outcome = await Promise.race([
    login.getByText("Roll the canary back first").waitFor().then(() => "ok"),
    failed.waitFor().then(() => "fail"),
  ]);
  await submitted;
  if (outcome !== "ok") {
    throw new Error("Submitting a question did not stream an answer");
  }
  await login.getByText("Sources (3)").click();
  await login.getByText("chunk 4").waitFor();
  await login.getByText("91%").waitFor();
  await login.getByRole("button", { name: "Submit Query" }).waitFor();
  await shoot(login, "workspace.png");

  await exerciseApi(login);
  await anon.close();

  const phone = await browser.newContext({
    ...desktop,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  phone.setDefaultTimeout(20_000);
  await phone.route(`${API_ORIGIN}/**`, mockApi);
  const mobileLogin = await phone.newPage();
  await mobileLogin.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await mobileLogin.getByRole("heading", { name: "Welcome back" }).waitFor();
  await shoot(mobileLogin, "login-mobile.png");
  await phone.close();
}

let serverProcess;

process.on("SIGINT", () => {
  stop(serverProcess);
  process.exit(130);
});
process.on("SIGTERM", () => {
  stop(serverProcess);
  process.exit(143);
});

async function main() {
  if (await portInUse(PORT)) {
    throw new Error(`Port ${PORT} is already in use. Stop that process and re-run.`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log("Building production app…");
  const build = run(["build"], { NEXT_PUBLIC_API_URL: API_URL });
  const buildCode = await new Promise((resolve) => build.on("exit", resolve));
  if (buildCode !== 0) throw new Error(`build failed (${buildCode})`);

  console.log(`Starting server on ${BASE}…`);
  serverProcess = run(["start", "-H", "127.0.0.1", "-p", String(PORT)]);
  try {
    await waitForServer(serverProcess);
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });
    try {
      await capture(browser);
    } finally {
      await browser.close();
    }
  } finally {
    stop(serverProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
