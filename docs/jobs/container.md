---
title: A job's container
description: What chuggy fixes about every job it runs in a container on a runner.
---

# A job's container

Each job runs in a container of its own, made from the image its configuration
names ([The project's image](image.md)) and removed when the job ends. A job
that names capabilities in place of an image can run on the runner's machine
instead, as [Jobs on the runner's machine](host.md) describes.

## How it starts

chuggy mounts its runtime read-only at `/opt/chuggy` and starts the container
with `/bin/sh /opt/chuggy/check.sh` in place of the image's `ENTRYPOINT` and
`CMD`, so neither of those runs. The script checks that the image has
[what a job needs](image.md#what-it-needs), then starts chuggy's worker under
tini, an init that reaps any process a job leaves orphaned. The image needs no
init of its own.

chuggy's own `node` and `claude` come from the runtime and are not put on
`PATH`, so a check that runs `node` gets the image's.

## User

Every job runs as uid 1000 and gid 1000, whatever user the image names, with
every Linux capability dropped and privilege escalation turned off, so `sudo`
and setuid programs cannot raise its privileges. A job can run at most 4096
processes.

On a runner using docker, uid 1000 is the machine's uid 1000. Rootless podman
maps it onto the user the runner runs as.

## Environment

A job gets the image's `ENV`, with the variables the runner's owner set in
`environment` in the runner's `runner.json` added over it. Every setup and
check line, and every shell the agent runs, is also told which job it is in.

| Variable           | Value                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `CHUG_TENANT`      | The id of the chuggy workspace the project belongs to.                                      |
| `CHUG_PROJECT`     | The project's id.                                                                           |
| `CHUG_REPOSITORY`  | The clone URL of the repository the job works on, such as `https://github.com/acme/shop.git`. |
| `CHUG_TICKET`      | The ticket's number.                                                                        |
| `CHUG_ATTEMPT`     | This attempt's id. A stage run again gets a new one.                                        |
| `CHUG_STAGE`       | `Work`, or `Evaluation:1`, `Evaluation:2` and so on for the evaluation stages in order.     |
| `CHUG_CHANGE_BASE` | The commit the change started from, set only where it is known.                             |

The runner's `environment` cannot set any of these. Setup and check lines run
under `sh -eu`, so a line reads the change base as `${CHUG_CHANGE_BASE-}`, which
is empty where it is unset.

Git is handed chuggy's configuration through `GIT_CONFIG_COUNT` and the
variables it numbers, after any the image sets. `CARGO_NET_GIT_FETCH_WITH_CLI`
is `true` unless the image or the runner set it, so cargo fetches git
dependencies with git and the credentials chuggy serves it.

If the image sets `NODE_OPTIONS`, `NODE_PATH`, `LD_PRELOAD`,
`LD_LIBRARY_PATH` or `LD_AUDIT`, chuggy keeps it away from its own processes
and hands it back, unchanged, to setup and check lines and the agent's shells.

## Workspace and checkout

`/workspace` is a volume of the job's own, empty when the job starts and
removed with it. It has no size limit.

chuggy clones the repository into `/workspace/repository`, with its full
history, and checks out the job's commit detached. That path is the same for
every job in a container on every runner, so an image can prepare things for it
([Build caches](build-caches.md)). The configuration's setup lines run there,
each under `/bin/sh -eu -c`, before the stage's checks or its agent. Files
setup leaves that git does not track are left out of the change.

An image whose `WORKDIR` is `/workspace/repository`, or a directory inside it,
breaks the clone ([The project's image](image.md#what-it-needs)).

## Other repositories

Any git command a job runs is given read access to the other repositories the
project binds on the same forge. That covers a `git clone` in a check, a
submodule, and a package manager fetching a git dependency with git. An SSH
address on the forge, such as `git@github.com:acme/lib.git`, is fetched over
HTTPS with the same access. A repository the project does not bind fails as any
repository git cannot read does.

chuggy's credential helper replaces any the image sets for that forge. It needs
git 2.31 or later; with an older git the job runs without these reads and its
log says so.

## Mounts

| Path                                     | What it is                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/opt/chuggy`                            | chuggy's runtime, read-only.                                                                    |
| `/workspace`                             | The job's workspace volume.                                                                     |
| `/var/run/chuggy/credentials/claude-code` | The runner's Claude token, read-only.                                                          |
| `/var/run/chuggy/minted`                 | A small in-memory directory only the job's user can open, for credentials chuggy mints for it. |
| `/var/run/docker.sock`                   | The runner's container engine, where its owner turned on `engineSocket` ([Docker in a job](docker.md)). |
| Each `target` in the runner's `volumes`  | A volume or directory of the runner's machine ([Build caches](build-caches.md#an-owner-volume)). |

Nothing else of the runner's machine is mounted.

## Network

A job joins the bridge network named by `network` in the runner's
`runner.json`, `chuggy-jobs` unless its owner changed it, and never the
machine's own network. It reaches whatever the machine reaches, and any
container on that network by name. A service the checks need, such as a
database, is started by a check, or run by the runner's owner on that network
with its address handed to jobs through `environment`. The
[chuggy-linux README](https://github.com/kasofsk/chuggy-linux#the-image-a-job-runs-in)
shows the second for PostgreSQL.

## Size and time

A job gets the CPUs and memory its configuration asks for, 2 CPUs and 4096 MiB
unless it asks otherwise ([Sizing a stage](sizing.md)), as the container's
limits. A job is stopped at the sooner of the deadline chuggy sets for it and
the runner's `timeoutSecsMax`.

## When it ends

The container and its workspace volume are removed, and the runner keeps the
job's log. A file the job wrote outlives it only on one of the runner's
volumes.

## Sessions

A project's chat and lead can also run on its runners, as sessions. A session
runs in chuggy's own image, never the project's, and is handed neither the
engine socket nor the runner's volumes.
