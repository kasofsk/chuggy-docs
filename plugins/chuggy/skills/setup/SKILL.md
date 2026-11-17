---
name: setup
description: Use when the person wants chuggy set up for the repository in this folder, on this or another machine, or wants a runner or a chat host added. Covers driving the setup program, how to talk to the person, what each machine needs, and sizing the engine's memory.
---

# Setting chuggy up

## Driving the program

Run the setup program as the console's line has it run: fetch the site's own
program to `~/.chuggy-setup.mjs` with `curl -fsS <site>/chuggy-setup.mjs -o
~/.chuggy-setup.mjs`, then `node ~/.chuggy-setup.mjs --site <site>`, or
`chat-host --site <site> --workspace <workspace>` to make this machine the
person's chat host (chuggy `ui/chuggy-ui/app/core/claudeCodeLine.ts`). Its
`rule:` lines are the protocol and win over this page; this page restates
none of them. Do what the output says, and run the `next:` command it ends
with.

Once the person has said yes, launch a subagent to explore the repository and report
which toolchains its work needs and which images it already defines, and carry
on with the program meanwhile, so the answer is ready when the program asks
for a worker image.

## Talking to the person

- The first thing the person gets is a short message saying what setup will
  do, in order, and asking whether to go on. Start nothing before their yes:
  no subagent, no sign-in, no command beyond fetching the program and its
  first, bare run, which changes nothing.
- Ask one question at a time, in chat, and only about a real choice. A step
  with one sensible answer is announced, then done unless the person
  objects.
- While a sign-in page waits, keep re-running the `next:` command in the
  background rather than asking to be told the person is done. Give them the
  sign-in address in full, at once.
- Never ask the person to judge a package, a path or a version. Decide from
  the program's output; the person is asked what only they know.
- At the end, list what changed on the machine: what was installed, what
  was written and where, and which services were started.

## Each machine

**Linux.** Node 24 or later (the program's `setupNodeMajorMin`,
`ui/chuggy-ui/app/core/setupProgram.ts:15`), rootful docker or rootless
podman 4.3 or later, a systemd user session, and chuggy-linux, which the
program installs.

**Mac.** Node 24 or later, the docker CLI and Colima:
`brew install node docker colima`, then chuggy-darwin, which runs under
launchd. On Apple silicon, also install Rosetta and start Colima with
`colima start --vz-rosetta` (chuggy-darwin `README.md:5`). Colima is the only
engine to offer on a Mac: Docker Desktop is untested (chuggy-darwin
`README.md:207`), so do not suggest it.

What a runner is, and how it registers, is in
<https://github.com/kasofsk/chuggy-docs/blob/main/docs/runners.md>.

## The chat host

Encourage it: it is where the person's chats run. Skip it when the engine
cannot hold a job plus the host's reservation (below), or when the person
will use chuggy only through their agent.

## Sizing

The engine's memory needs to be at least a job's memory, plus the chat
host's reservation, plus headroom.

- A job asks 4,096 MiB where nothing names another size (chuggy
  `src/interpreter/workerPool.ts:195`).
- A chat host reserves `sessionsMax` × `sessionMemoryMib`: by default 4 ×
  2,048 MiB, 8 GiB (chuggy-common `chatHost.mjs:177,180,918-920`;
  chuggy-darwin `README.md:192-196`).
- On a Mac, a job is sized against Colima's VM, not the Mac
  (chuggy-darwin `README.md:45`), and a fresh VM has 2 GiB. Raise it with
  `colima stop` then `colima start --memory <GiB>`, keeping `--vz-rosetta` on
  Apple silicon.
- On Linux, docker uses the host's memory.
- To shrink the reservation, lower `chat.sessionsMax` (4) or
  `chat.sessionMemoryMib` (2048) in runner.json (chuggy-linux
  `README.md:246-258`, chuggy-darwin `README.md:192-196`). The top-level
  `sessionsMax` (2) is the pool's sessions, not the chat host's
  (chuggy-linux `README.md:85`, chuggy-darwin `README.md:57`).

Where the machine fits a job and the chat host, say nothing to the person
about memory, neither figures nor that it fits. Speak of it only where
something has to change (Colima's VM resized, the chat host skipped, another
machine used), and then say in a sentence what you will change or what they
need to do, without figures. Make the change yourself rather than
asking them to choose a number.
