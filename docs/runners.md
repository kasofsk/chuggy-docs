---
title: Runners
description: The machines that run a project's jobs, and how work is placed on them.
---

# Runners

A runner is a machine its owner registered to run jobs. chuggy hands it
assignments; it runs each as a container of the image the assignment names,
or on the machine itself for work that asks for capabilities instead of an
image. There is one package per platform:

| Package | Platform | Runs jobs with |
| --- | --- | --- |
| [chuggy-linux](https://github.com/kasofsk/chuggy-linux) | Linux, as a systemd user service | Docker or rootless Podman |
| [chuggy-darwin](https://github.com/kasofsk/chuggy-darwin) | A Mac, from a terminal or under launchd | Docker in Colima's VM |
| [chuggy-windows](https://github.com/kasofsk/chuggy-windows) | Windows 11, as a scheduled task | Docker Desktop |

Each needs Node 24 or later. Each README covers installing, configuring, and
the credentials a runner reads.

A member's chat host can run a thread that dispatches a project's tickets; see
[Running a ticket dispatcher from a thread](dispatcher-thread.md).

## Your own runner

A **personal runner** is a member's own machine. It runs only work that member
started, in the projects they allow it, and a member may hold several. A
workspace administrator grants a member the right to register one.

Work that runs on runners runs only on a runner of its owner: the member who
took the ticket, else the member who filed it. Nothing in a workspace or a
project has to be set for a runner to take its owner's work.

- While the owner has a runner serving the project and it is offline, the run
  shows "Waiting on your personal runners · offline" and waits for it.
- Where the owner has no runner serving the project, or the ticket has no owner
  who is a member, the run is blocked, "Nowhere to run this work", and the
  ticket stops for a person. A member who has a runner can Take the ticket, and
  once it is resumed with Resume its next run is theirs. A take moves no run
  that has already started or stopped.

## A chat host

A chat host is the one machine of yours, in a workspace, that your threads run on, under your own Claude credential. It takes no jobs. A
workspace administrator grants a member the right to register one.

To register one from the console, open the personal-runners page in your
settings and press Register chat host, choose the machine, Linux or Mac, and
run the commands it shows on that machine.

Your coding agent can do it for you, on Linux or a Mac: paste the Claude Code
line the same page shows into Claude Code on that machine, or have it run the
setup program's

```sh
chat-host --site <origin> --workspace <workspace>
```

To move your chat host from another machine, run it on the new one with
`--replace <short id>`, the short id your personal-runners page shows for the
host. That ends the old host's sessions.

[chuggy-linux](https://github.com/kasofsk/chuggy-linux#a-chat-host) and
[chuggy-darwin](https://github.com/kasofsk/chuggy-darwin#chat-host) cover the
rest: its settings, its credential and its container.

## How a runner chooses its next job

Of the jobs a runner may take, it takes a started ticket's next step before
it starts a new ticket. A ticket is started once a runner has taken work of
it: a retry, a review, a check or a rework. After that the oldest ticket
goes first. A job too large for the room a runner has left waits, and a
smaller one may go first.

On your own runners each project you serve has a priority, High, Normal or
Low, which you set per project on Personal runners. Among started work, and
again among new tickets, a higher-priority project's job goes first, ahead
of the age of its ticket. A Low project starts a ticket only when nothing
above it could start one. Priority only orders what starts: started work
never waits behind it.

Personal runners shows what each of your runners is running: the project
and ticket, whether it is work or an evaluation, and its cycle, or Idle where
it holds nothing. Beside each project's priority it shows how many jobs wait
in that project, as 99+ past that count.

## Registering

Register runner on Settings → Personal runners mints a registration token for
your own runner and shows the steps that spend it: install the package, then

```sh
chuggy-linux register --personal --api <site> --token=<token>
```

with `--host` for a machine that runs
image-less work on itself, and `--capability` for anything else the machine
meets, such as a tool a configuration may ask for. The token is spent once;
registering again replaces it.

chuggy no longer runs shared pools. A machine registered as one is refused at
its next poll and its service stops; the service stays installed, and is
refused again at each start. Its operator removes the pool's service and file
and registers the machine again as their own runner, which needs the right a
workspace administrator grants.

## Credentials

A job's agent needs a credential, and it is read on the runner: a Claude
subscription token or API key, Bedrock, Vertex AI or Foundry for Claude, and
a login for Codex. The runner's own configuration names the files. A
credential reaches a job through a file mounted read-only, and its secrets
are scrubbed from what the job reports. Its name and usage readings are sent
to chuggy; its secret is not.

### Several credentials for one agent

A runner's configuration may name a set of credentials for one agent, each
with a `name`: for Claude, subscription tokens or API keys, and for Codex,
logins or API keys. Each type has an `order`, and a `prefer` policy chooses
between the types:

```json
"claudeCredential": { "prefer": "PreferOAuth", "oauth": { "order": "InOrder", "credentials": [ … ] }, "apiKey": { … } }
```

The [chuggy-linux](https://github.com/kasofsk/chuggy-linux#configure) and
[chuggy-darwin](https://github.com/kasofsk/chuggy-darwin#readme) READMEs give
the full form and an example.

**Who chooses, and when.** Each service chooses for itself: a personal
runner or a chat host. Nothing is shared between services or
machines. A credential is chosen for each job and for each chat session.
`InOrder` takes the first one that is free; `RoundRobin` takes the one after
the last one chosen. A running job keeps its credential to the end.

**Paused.** A credential at your usage threshold (Settings → Usage) is passed
over from that service's next job on. A runner waits only while every
credential it holds for the agent is paused. Your account reads paused for an
agent only while every credential your online runners hold for it is paused.

**Limited.** A credential the provider limits sits out on that service until
the reset the limit names; one out of credits sits out until the service
restarts. The run that hit the limit ends, and its ticket resumes once a
runner of yours holds a free credential. Where every credential is sitting
out, the one back soonest is used.

**Names.** chuggy keeps usage by name, under the account of the member whose
runner it is. Give a credential the same name on every machine: the same name
on two machines is one credential, and two names for one credential are
counted as two.

**Seeing them.** Settings → Usage lists each credential's readings and any
pause on it. Retire forgets a credential's readings and limit. It is refused
while a runner that is online still names that credential, so take the
credential out of the runner's configuration first; a run on it later brings
it back. chuggy does not hold a credential's secret, so adding a credential
means editing the configuration on each machine that should hold it.

**Versions.** A set needs chuggy-linux later than 0.47.0. chuggy pauses one
credential at a time only for a runner that tells it which credentials it
holds: chuggy-linux 0.51.0 and chuggy-darwin 0.21.0 or later. A runner that
doesn't, whether an earlier release or any build that doesn't report them, is
held whenever your account reads paused for the agent.

## What a runner does with a job

It takes an assignment only if the machine has the CPU and memory the job
asks for and the credential its agent needs, pulls the image if it is
missing (on an Apple silicon Mac, its `linux/arm64` build where it has one,
and otherwise its `linux/amd64` build, run through Rosetta), runs the job as
uid 1000 with every capability dropped, keeps the assignment alive while the
job runs, and saves the job's log when it ends.
[A job's container](jobs/container.md) lists everything a job finds inside.

## Runner metrics

A runner reports on itself only where its owner turns that on: set
`"reportMetrics": true` in its `runner.json`, on chuggy-linux 0.36.0 or
chuggy-darwin 0.7.0 or later, and restart its services, which read the file
when they start. chuggy-windows has no such setting. The runner then
reports its work to chuggy (jobs and sessions running and how they ended,
polls, refusals, pull and run times) and its machine's name, CPUs, load,
memory and free disk (on a Mac, Colima's VM's, but for the name).

These reports go to chuggy's own monitoring. The people who run chuggy read
them to keep the service working and to help you with a runner. The console
does not show them.
