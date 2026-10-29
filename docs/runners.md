---
title: Runners
description: The machines that run a project's jobs, shared or your own, and how work is placed on them.
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

## Shared pools and your own runner

A **pool** is a project's shared machine. Any ticket in the project may run on
it, and so may the project's threads and its lead. A project can have many
pools, and a pool is one per name in a project.

A **personal runner** is a member's own machine. It runs only work that member
started, in the projects they allow it, and a member may hold several. A
workspace administrator grants a member the right to register one. The
workspace also says how a member's own runners and the shared pools share
the member's work: their own runners take it and no shared runner does while
one of theirs serves the project, or a shared runner takes it while none of
theirs is online.

## Registering

The project's Runners page mints a registration token and hands it over in
the steps that spend it: install the package, then

```sh
chuggy-linux register --api <site> --token=<token>
```

with `--personal` for your own runner, `--host` for a machine that runs
image-less work on itself, and `--capability` for anything else the machine
meets, such as a tool a configuration may ask for. The token is spent once.
Registering again from a machine replaces its registration.

## Credentials

A job's agent needs a credential, and it is read on the runner: a Claude
subscription token or API key, Bedrock, Vertex AI or Foundry for Claude, and
a login for Codex. The runner's own configuration names the files. A
credential reaches a job through a file mounted read-only, and every secret
in it is scrubbed from what the job reports. Nothing of it is sent to chuggy.

## What a runner does with a job

It takes an assignment only if the machine has the CPU and memory the job
asks for and the credential its agent needs, pulls the image if it is
missing (on an Apple silicon Mac, its `linux/arm64` build where it has one,
and otherwise its `linux/amd64` build, run through Rosetta), runs the job as
uid 1000 with every capability dropped, keeps the assignment alive while the
job runs, and saves the job's log when it ends.
[A job's container](jobs/container.md) lists everything a job finds inside.

## Metrics in Grafana

A runner reports on itself only where its owner turns that on: set
`"reportMetrics": true` in its `runner.json`, on chuggy-linux 0.36.0 or
chuggy-darwin 0.7.0 or later, and restart its services, which read the file
when they start. chuggy-windows has no such setting. The runner then
reports its work to chuggy (jobs and sessions running and how they ended,
polls, refusals, pull and run times) and its machine's name, CPUs, load,
memory and free disk (on a Mac, Colima's VM's, but for the name).

Sign in to <https://grafana.vteng.io> with your chuggy account. The
**Chuggy runners** dashboard opens on your own runners. Everyone shows every
runner, and a Project then narrows it to that project's shared pools, which
belong to no one member. **Chuggy usage** shows what ticket work and chat
cost, their tokens and turns, and how long work and checks took. Every member
who signs in can query every series, so these choices narrow what a page
shows and keep nothing private.
