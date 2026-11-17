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

The script below has not been run against chuggy. Its tool names, its
arguments, `tickets` and `nextAfter` in a page of `list_tickets`, the phase
names (including `Escalated`) and `authoring.dependencies` of `read_ticket`
come from the descriptions of chuggy-common's tools. The keys naming a ticket
within a listed entry, and the key naming a ticket's phase in `read_ticket`,
were not read, so the script tries `ticket`, then `number`, and `phase`.
Before relying on it, run it once with `--once` and compare what it logs with
what `chuggy list_tickets` prints.

## What it needs

- A thread on the member's chat host. The host's `chat.sessionCapabilities`
  names the capabilities its threads may hold: at least `ProjectRead` and
  `TicketDispatch`, plus what gives the thread a shell (chuggy-linux's README
  gives `RunCommands` as an example). Naming
  it is also what hands the thread's shell the credential `chuggy` uses.
  Unset, a thread holds its whole roster and its shell gets no credential, so
  the script could not call chuggy.
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
  "order": [412, 405],
  "epics": [7],
  "held": { "409": "waiting for the owner's word on the API shape" },
  "deferred": { "415": "needs the migration to land first" },
  "ignore": [380],
  "paused": null,
  "interval_seconds": 300
}
```

- `cap`: how many tickets may be in Work, Evaluation or Finalization at once.
- `order`: ticket numbers, highest priority first.
- `epics`: epic numbers whose Pending members queue after `order`, epic by
  epic.
- `held` and `deferred`: ticket to reason. The owner releases a held ticket;
  the thread releases one it deferred. The script skips both.
- `ignore`: tickets neither counted nor touched.
- `paused`: a reason, or `null`. While it is a string the script dispatches
  nothing.
- `interval_seconds`: how often to poll.

The thread and the script each change it by writing a new file beside it and
renaming that over the old one, so a reader never sees half a file.

## The script

Save this as `dispatcher.mjs` in the workspace. It needs Node and nothing
beyond what Node ships with, and calls only `chuggy` (`list_tickets`,
`read_ticket`, `dispatch_ticket`, `list_epics`, `read_epic`). `chuggy` prints
the route's status line, then its body, and exits 1 on a refusal or failed
call. Each pass it reads the queue, counts the tickets active under the cap,
and dispatches Pending tickets in order whose dependencies are Done, up to
the cap. It logs one line per action, and one line starting with
`NEEDS-JUDGEMENT` for each thing the thread must decide: a ticket that
escalated, or a call that failed. `--once` runs one pass and exits.

```js
import { execFile } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const queuePath = "queue.json";
const MARK = "NEEDS-JUDGEMENT";
const flagged = new Set();

const log = (line) => console.log(`${new Date().toISOString()} ${line}`);
const flag = (line) => {
  if (flagged.has(line)) return;
  flagged.add(line);
  log(`${MARK} ${line}`);
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

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

const numberOf = (entry) =>
  typeof entry === "number" ? entry : (entry.ticket ?? entry.number);

/** Every ticket in `phases`, following the pages. */
async function ticketsIn(phases) {
  const found = [];
  let after;
  do {
    const { body } = await chuggy("list_tickets", { phase: phases, after });
    found.push(...(body.tickets ?? []));
    after = body.nextAfter;
  } while (after !== undefined);
  return found;
}

/** The members of one epic, in the order it lists them. */
async function epicMembers(epic) {
  const { body } = await chuggy("read_epic", { epic });
  return (body.tickets ?? body.members ?? []).map(numberOf);
}

async function pass() {
  const queue = await readJson(queuePath);
  const ignore = new Set((queue.ignore ?? []).map(Number));
  const skipped = new Set([
    ...Object.keys(queue.held ?? {}),
    ...Object.keys(queue.deferred ?? {}),
  ].map(Number));

  const escalated = (await ticketsIn(["Escalated"]))
    .map(numberOf)
    .filter((number) => !ignore.has(number));
  for (const number of escalated) flag(`ticket ${number} escalated`);

  if (typeof queue.paused === "string") {
    log(`paused: ${queue.paused}`);
    return;
  }

  const active = (await ticketsIn(["Work", "Evaluation", "Finalization"]))
    .map(numberOf)
    .filter((number) => !ignore.has(number));
  const room = queue.cap - active.length;
  log(`${active.length} active, cap ${queue.cap}`);
  if (room <= 0) return;

  const pending = new Set((await ticketsIn(["Pending"])).map(numberOf));
  const wanted = [...(queue.order ?? [])];
  for (const epic of queue.epics ?? []) wanted.push(...(await epicMembers(epic)));
  const candidates = [...new Set(wanted)].filter(
    (number) => pending.has(number) && !ignore.has(number) && !skipped.has(number),
  );

  const phases = new Map();
  const phaseOf = async (number) => {
    if (!phases.has(number))
      phases.set(number, (await chuggy("read_ticket", { ticket: number })).body);
    return phases.get(number);
  };

  let dispatched = 0;
  for (const number of candidates) {
    if (dispatched >= room) break;
    const ticket = await phaseOf(number);
    const dependencies = ticket.authoring?.dependencies ?? ticket.dependencies ?? [];
    const waiting = [];
    for (const dependency of dependencies.map(numberOf))
      if ((await phaseOf(dependency)).phase !== "Done") waiting.push(dependency);
    if (waiting.length > 0) {
      log(`ticket ${number} waits on ${waiting.join(", ")}`);
      continue;
    }
    try {
      const { status } = await chuggy("dispatch_ticket", { ticket: number });
      log(`dispatched ticket ${number}: ${status}`);
      dispatched += 1;
    } catch (failure) {
      flag(`dispatch of ticket ${number} failed: ${failure.message}`.slice(0, 300));
    }
  }
}

const once = process.argv.includes("--once");
let lastFailure;
for (;;) {
  try {
    await pass();
    lastFailure = undefined;
  } catch (failure) {
    if (failure.message !== lastFailure) flag(`pass failed: ${failure.message}`);
    lastFailure = failure.message;
    if (once) process.exitCode = 1;
  }
  if (once) break;
  const { interval_seconds } = await readJson(queuePath, {});
  await sleep(Math.max(10, interval_seconds ?? 300) * 1000);
}
```

Each marked line is logged once per run of the script, so a failure that
repeats does not wake the thread every interval. A restart of the job logs it
again. The script writes nothing but its log: it never changes `queue.json`.
To keep a ticket from being tried again, the thread adds it to `deferred`.

## Running it

Start it as a job that is restarted with each attempt, with `job_start` and
`restart` true:

```json
{ "name": "dispatcher", "command": "node dispatcher.mjs", "restart": true }
```

`job_start` answers the job's pid and the path of its log. Then `watch` that
log for the marker:

```json
{ "name": "needs-judgement", "path": "<the log's path>", "pattern": "NEEDS-JUDGEMENT" }
```

Then end the turn. The job runs on between turns and the thread spends
nothing while it polls.

- **On a wake from the watch**, read the matched lines and the log around
  them, decide, change the queue (write a new file and rename it over the
  old one), and tell the owner what you did.
- **On a wake saying a new attempt restored the jobs**, run `job_list` and
  read the log's end: a pass the restart interrupted runs again from its
  start, and a ticket it was dispatching may or may not have been. Check it
  with `chuggy read_ticket` before dispatching it again. `chuggy` treats
  each submitted command as an operation of its own, so a dispatch run again
  is a second submission, not a repeat of the first.

If the job itself exits, the thread is woken for it. Read its log for the
cause.

## Default rules

- Pause when one failure blocks every ticket, such as an authorization
  failure or a chuggy outage. Set `paused` to the reason, and tell the owner.
- Never work around a fault of chuggy's or the runner's inside a project's
  tickets. Do not file, edit or reorder tickets to get around one; report it.
- Tell the owner rather than dispatch again what escalated twice. The script
  keeps no count: count a ticket's `escalated` lines in the log (each is
  logged once per run of the script, so a restart may repeat one), and
  once it has escalated twice, stop and ask.

## What survives what

- The thread's workspace, and the jobs it started with `restart`, survive the
  runner's restarts, updates and drains. The thread is placed again without a
  message, and its next attempt starts the job again.
- A pass interrupted mid-run runs again. A dispatch the interrupted pass
  already submitted may be submitted again if the ticket still reads Pending,
  because `chuggy` treats each submitted command as an operation of its own.
  The pass reads each ticket's phase before it dispatches, which narrows that
  but does not close it.
- Closing the thread removes its workspace, and with it `queue.json` and the
  script. Keep what the owner needs in the project's tickets.
