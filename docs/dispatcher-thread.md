---
title: Running a ticket dispatcher from a thread
description: How a member's thread dispatches a project's tickets on its member's behalf, with a script it starts as a job, a queue file it keeps, and a wake only when something needs judgement.
---

# Running a ticket dispatcher from a thread

A member can have one of their threads dispatch a project's tickets on their
behalf. The thread runs on the member's
[chat host](runners.md). A script it starts as a job polls chuggy through the
`chuggy` command, which costs no tokens, and the thread is woken only when
the script logs something that needs judgement. This page is what a thread
reads, through `read_docs`, when its owner asks it to dispatch.

The script below has not been run against chuggy. Before relying on it, run it
once with `--once` and compare what it logs with what `chuggy list_tickets`
prints.

## What it needs

- A thread on the member's chat host. The host's `chat.sessionCapabilities`
  names the capabilities its threads may hold: `ProjectRead`,
  `TicketDispatch` and what gives the thread a shell (chuggy-linux's README
  gives `RunCommands` as an example). Naming them is also what hands the
  thread's shell the credential `chuggy` uses. If `chuggy` says the shell was
  handed no credential, the host names no `sessionCapabilities`: unset, a
  thread holds its whole roster and its shell gets none.
- With only `ProjectRead`, `TicketDispatch` and `RunCommands`, the thread has
  no Read, Write or Edit tool, which come with `RepositoryRead` and
  `RepositoryWrite`. It works on files with shell commands.
- One of its host's `sessionsMax` sessions, for as long as the thread is open.
- Ticket wakes left at their default. A thread is no longer woken for events
  on its own tickets unless its host's `ticketWakes` or its own `ticket_wakes`
  tool says so; leave both alone, so the thread wakes only for its watch, its
  job exiting and its owner.
- Optionally the host's own `chat.deadlineSecs`, which stops each session at
  that age. Unset, a session has no deadline.

[chuggy-linux](https://github.com/kasofsk/chuggy-linux#a-chat-host) and
[chuggy-darwin](https://github.com/kasofsk/chuggy-darwin) say how to set
them. chuggy-linux's README says both settings need 0.53.0 or later.

## The queue

`queue.json`, in the thread's workspace, is read again on every pass:

```json
{
  "cap": 2,
  "cap_counts": "queue",
  "order": [412, 405],
  "epics": [7],
  "after": { "405": [412] },
  "held": { "409": "waiting for the owner's word on the API shape" },
  "deferred": { "415": "needs the migration to land first" },
  "ignore": [380],
  "paused": null,
  "interval_seconds": 60
}
```

- `cap`: how many tickets may be in Work, Evaluation or Finalization at once.
- `cap_counts`: `"queue"`, the default, counts only active tickets the queue
  names, through `order` or `epics`. `"project"` counts every active ticket in
  the project except those in `ignore`.
- `order`: ticket numbers, highest priority first.
- `epics`: epic numbers whose Pending members queue after `order`, epic by
  epic, each member after the members it depends on, then by number.
- `after`: ticket to the tickets that must be Done before it is dispatched,
  beside chuggy's own dependencies.
- `held` and `deferred`: ticket to reason. The owner releases a held ticket;
  the thread releases one it deferred. The script skips both.
- `ignore`: tickets neither counted nor touched.
- `paused`: a reason, or `null`. While it is a string the script dispatches
  nothing.
- `interval_seconds`: how often to poll. Default 60. Polling costs no tokens,
  and chuggy gives a session no project event feed to wake on.

The thread and the script each change a file by writing a new one beside it
and renaming that over the old one, so a reader never sees half a file. The
script writes only `dispatcher-state.json`, beside the queue, which holds the
keys of the flags it has raised.

## The tools it calls

The script calls only `chuggy`, which prints the route's status line, then
its body, and exits 1 on a refusal or failed call.

- `list_tickets` takes `phase`, `epic`, `limit` and `after`. A page carries
  `tickets` and `nextAfter`. Each entry carries `ticket`, `phase`,
  `openDependencies` (each with `ticket` and `phase`) and
  `revokedDependencies`.
- `read_ticket` carries the same fields.
- `read_epic_graph` carries `nodes` (`ticket`, `phase`, `member`) and `edges`
  (`from` a dependency, `to` its dependent).
- `read_epic` carries `visibility` (Active or Archived) and `status`.
- `dispatch_ticket` answers the operation's id as `operation`, and its
  `state`; `read_operation` takes that `operation` and answers its `state`:
  Pending, Succeeded, Refused with a `code`, Answered or Cancelled. A ticket
  that is not Pending is answered without anything being submitted, so a pass
  run again after a restart cannot dispatch it twice.

## The script

Save this as `dispatcher.mjs` in the workspace. It needs Node and nothing
beyond what Node ships with. Each pass it reads the queue, reads the tickets
the queue names from listings, and dispatches the ready ones in order, up to
the cap, reading each dispatch's operation before the next. It logs one line
per action. A line starting with `NEEDS-JUDGEMENT` is a flag for something
the thread must decide, and is logged once each time its condition starts: the
flag's key is kept in `dispatcher-state.json` while the condition holds and
dropped once it is gone, so a recurrence is flagged again and a restart does
not repeat one. `--once` runs one pass and exits.

```js
import { execFile } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const queuePath = "queue.json";
const statePath = "dispatcher-state.json";
const MARK = "NEEDS-JUDGEMENT";

const log = (line) => console.log(`${new Date().toISOString()} ${line}`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const list = (numbers) => (numbers.length ? numbers.join(", ") : "none");

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (failure) {
    if (failure.code === "ENOENT" && fallback !== undefined) return fallback;
    throw failure;
  }
}

async function writeJson(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, path);
}

/** One chuggy tool call: its status and its parsed body. */
async function chuggy(tool, input = {}) {
  let out;
  try {
    ({ stdout: out } = await run("chuggy", [tool, JSON.stringify(input)], {
      maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (failure) {
    const said = `${failure.stdout ?? ""}${failure.stderr ?? ""}`.trim();
    throw new Error(`${tool} failed: ${said || failure.message}`);
  }
  const newline = out.indexOf("\n");
  const status = out.slice(0, newline);
  const text = out.slice(newline + 1).trim();
  try {
    return { status, body: text === "" ? {} : JSON.parse(text) };
  } catch {
    throw new Error(`${tool} answered ${status} with a body that is not JSON`);
  }
}

/** The flags raised before, and those this pass raises. */
let before = new Set();
let raised = new Set();
function flag(key, detail = "") {
  raised.add(key);
  if (!before.has(key)) {
    before.add(key);
    log(`${MARK} ${key}${detail ? `: ${detail}` : ""}`.slice(0, 400));
  }
}

/** Keep the keys raised now; with `complete`, drop the rest. */
async function settle(complete) {
  const kept = complete ? raised : new Set([...before, ...raised]);
  const was = new Set((await readJson(statePath, { flags: [] })).flags);
  if (kept.size === was.size && [...kept].every((key) => was.has(key))) return;
  await writeJson(statePath, { flags: [...kept].sort() });
}

/** Every entry of a listing, following the pages. */
async function listTickets(filter) {
  const found = [];
  let after;
  do {
    const { body } = await chuggy("list_tickets", { ...filter, after });
    found.push(...(body.tickets ?? []));
    after = body.nextAfter ?? undefined;
  } while (after !== undefined);
  return found;
}

/** Pending members of an epic in dependency order, then by number. */
function inEpicOrder(pending, edges) {
  const left = new Set(pending);
  const waits = new Map(pending.map((n) => [n, new Set()]));
  for (const { from, to } of edges)
    if (waits.has(to) && waits.has(from)) waits.get(to).add(from);
  const ordered = [];
  while (left.size > 0) {
    const ready = [...left].filter((n) => [...waits.get(n)].every((d) => !left.has(d)));
    const next = Math.min(...(ready.length > 0 ? ready : left));
    ordered.push(next);
    left.delete(next);
  }
  return ordered;
}

/** Read one dispatch's operation until it is no longer Pending. */
async function outcome(operation) {
  for (;;) {
    const { body } = await chuggy("read_operation", { operation });
    if (body.state !== "Pending") return body;
    await sleep(2000);
  }
}

async function pass() {
  const queue = await readJson(queuePath, null);
  if (queue === null) {
    log("no queue.json; waiting");
    return { interval: 60 };
  }
  const interval = queue.interval_seconds ?? 60;
  before = new Set((await readJson(statePath, { flags: [] })).flags);
  raised = new Set();

  const ignore = new Set((queue.ignore ?? []).map(Number));
  const skipped = new Set(
    [...Object.keys(queue.held ?? {}), ...Object.keys(queue.deferred ?? {})].map(Number),
  );
  const known = new Map(); // ticket -> listing entry
  const remember = (entry) => known.set(entry.ticket, entry);

  // Epics: each is read, then its members listed, or flagged and skipped.
  const epicOrder = new Map(); // epic -> Pending members in order
  const inEpics = new Set();
  const skippedEpics = [];
  for (const epic of queue.epics ?? []) {
    try {
      const { body: head } = await chuggy("read_epic", { epic });
      if (head.status === "done") flag(`epic ${epic} done`, "tell its owner");
      if (head.visibility === "Archived") {
        flag(`epic ${epic} archived`, "skipped");
        skippedEpics.push(epic);
        continue;
      }
      const { body: graph } = await chuggy("read_epic_graph", { epic });
      const members = await listTickets({ epic });
      members.forEach(remember);
      members.forEach((entry) => inEpics.add(entry.ticket));
      const pending = members.filter((e) => e.phase === "Pending").map((e) => e.ticket);
      epicOrder.set(epic, inEpicOrder(pending, graph.edges ?? []));
    } catch (failure) {
      flag(`epic ${epic} unreadable`, failure.message);
      skippedEpics.push(epic);
    }
  }

  // Tickets of `order` in no listed epic are read one by one.
  for (const number of (queue.order ?? []).filter((n) => !inEpics.has(n))) {
    try {
      const { body } = await chuggy("read_ticket", { ticket: number });
      remember({ ...body, ticket: number });
    } catch (failure) {
      flag(`ticket ${number} unreadable`, failure.message);
    }
  }

  const named = new Set([...(queue.order ?? []), ...inEpics]);

  // A skipped epic's members were not read, so what was flagged about them,
  // and its own "done" flag, stay raised rather than being dropped and raised
  // again when it reads.
  if (skippedEpics.length > 0)
    for (const key of before) {
      const member = /^ticket (\d+) (escalated|has a revoked dependency)$/.exec(key);
      const epicDone = /^epic (\d+) done$/.exec(key);
      if (
        (member && !known.has(Number(member[1])) && !(queue.order ?? []).includes(Number(member[1]))) ||
        (epicDone && skippedEpics.includes(Number(epicDone[1])))
      )
        raised.add(key);
    }

  for (const entry of await listTickets({ phase: ["Escalated"] }))
    if (named.has(entry.ticket) && !ignore.has(entry.ticket))
      flag(`ticket ${entry.ticket} escalated`);

  const active = (await listTickets({ phase: ["Work", "Evaluation", "Finalization"] }))
    .map((entry) => entry.ticket)
    .filter((number) => !ignore.has(number));
  const counted = queue.cap_counts === "project" ? active : active.filter((n) => named.has(n));
  const others = active.filter((n) => !counted.includes(n));
  log(
    `cap ${queue.cap}, counting ${queue.cap_counts === "project" ? "the project" : "the queue"}: ` +
      `${counted.length} active (${list(counted)})` +
      (queue.cap_counts === "project" ? "" : `; other active in the project, not counted: ${list(others)}`),
  );

  if (typeof queue.paused === "string") {
    log(`paused: ${queue.paused}`);
    await settle(false);
    return { interval };
  }

  // Candidates: `order`, then each epic's Pending members in order.
  const wanted = [...(queue.order ?? [])];
  for (const members of epicOrder.values()) wanted.push(...members);
  const phaseOf = async (number) => {
    if (!known.has(number)) {
      const { body } = await chuggy("read_ticket", { ticket: number });
      remember({ ...body, ticket: number });
    }
    return known.get(number).phase;
  };

  const ready = [];
  for (const number of [...new Set(wanted)]) {
    const entry = known.get(number);
    if (!entry || entry.phase !== "Pending" || ignore.has(number) || skipped.has(number)) continue;
    if ((entry.revokedDependencies ?? []).length > 0) {
      flag(`ticket ${number} has a revoked dependency`, "skipped");
      continue;
    }
    if ((entry.openDependencies ?? []).length > 0) continue;
    let held = false;
    for (const dependency of (queue.after ?? {})[number] ?? []) {
      try {
        if ((await phaseOf(dependency)) !== "Done") held = true;
      } catch {
        held = true;
      }
    }
    if (!held) ready.push(number);
  }

  let room = queue.cap - counted.length;
  let dispatchRan = false;
  for (const number of ready) {
    if (room <= 0) break;
    dispatchRan = true;
    try {
      const { body } = await chuggy("dispatch_ticket", { ticket: number });
      const result = await outcome(body.operation);
      if (result.state === "Succeeded") {
        log(`dispatched ticket ${number}`);
        room -= 1;
      } else if (result.state === "Answered") {
        log(`ticket ${number} was not Pending; nothing submitted`);
      } else if (result.state === "Refused" && result.code === "TicketChanged") {
        log(`ticket ${number} changed under the dispatch; again next pass`);
      } else {
        flag(`dispatch of ticket ${number} ${result.state}: ${result.code ?? "no code"}`);
        break;
      }
    } catch (failure) {
      flag(`dispatch of ticket ${number} failed`, failure.message);
      break;
    }
  }

  // A dispatch flag stays while no dispatch was tried this pass.
  if (!dispatchRan)
    for (const key of before) if (key.startsWith("dispatch of ")) raised.add(key);
  await settle(true);
  return { interval };
}

const once = process.argv.includes("--once");
for (;;) {
  let interval = 60;
  try {
    ({ interval } = await pass());
  } catch (failure) {
    flag("pass failed", failure.message);
    await settle(false);
    if (once) process.exitCode = 1;
  }
  if (once) break;
  await sleep(Math.max(10, interval) * 1000);
}
```

## Running it

Start it as a job that is restarted with each attempt, with `job_start` and
`restart` true:

```json
{ "name": "dispatcher", "command": "node dispatcher.mjs", "restart": true }
```

`job_start` answers the job's pid and the path of its log. Then `watch` that
log for the marker, and only the marker:

```json
{ "name": "needs-judgement", "path": "<the log's path>", "pattern": "NEEDS-JUDGEMENT" }
```

A watch wakes the thread for a turn on every line it matches, so a second
watch on a routine line, such as each dispatch, costs a turn per match. Read
routine lines from the log when the thread is next woken; do not watch them.

Then end the turn. The job runs on between turns and the thread spends
nothing while it polls.

- **On a wake from the watch**, read the matched lines and the log around
  them, decide, change the queue (write a new file and rename it over the
  old one), and tell the owner what you did.
- **On a wake saying a new attempt restored the jobs**, run `job_list` and
  read the log's end. A pass the restart interrupted runs again from its
  start, and a dispatch it had submitted is answered without a second
  submission once the ticket is no longer Pending.

If the job itself exits, the thread is woken for it. Read its log for the
cause.

## Default rules

- Before writing the queue, agree it with the owner: which tickets, in what
  order, how many at once, and whether the cap counts the queue's tickets or
  the project's. Say it back.
- Run an epic by listing it in `epics`, not its members in `order`, so tickets
  added to it later are run and ones removed are not.
- Watch only the marker.
- Pause when one failure blocks every ticket, such as an authorization
  failure or a chuggy outage. Set `paused` to the reason, and tell the owner.
- Never work around a fault of chuggy's or the runner's inside a project's
  tickets. Do not file, edit or reorder tickets to get around one; report it.
- An escalated ticket waits for a person, who resumes or revokes it; no
  session tool can resume it. Tell the owner what its `escalation` and
  `read_run_error` say, and do not file, edit or reorder tickets to get
  around it.
- A done epic is flagged once: tell its owner.
- Before the thread is closed, tell the owner the queue as it stands, what is
  running and every flag not yet answered, because closing removes the
  workspace.

## What survives what

- The thread's workspace, and the jobs it started with `restart`, survive the
  runner's restarts, updates and drains. The thread is placed again without a
  message, and its next attempt starts the job again.
- A pass interrupted mid-run runs again. Flags already raised are kept in
  `dispatcher-state.json`, so they are not logged again.
- Closing the thread removes its workspace, and with it `queue.json`,
  `dispatcher-state.json` and the script. Keep what the owner needs in the
  project's tickets.
