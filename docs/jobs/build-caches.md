---
title: Build caches
description: Four ways to keep downloaded dependencies and compiled output between jobs, and what each costs.
---

# Build caches

Every job starts from an empty workspace and a fresh container, so a check that
installs dependencies or compiles starts cold each time. There are four ways to
keep that work between jobs. Baking it into the image needs nothing from the
runner's owner; the other three need something set up on each runner.

## Bake it into the image

Install dependencies, or build once, while building the image, so a job only
does what changed since. Build at `/workspace/repository`, the path every job's
checkout is at, so a tool that records where it built finds the same path in
the job. Keep the output outside `/workspace`, since the job's own workspace
volume covers that directory. For a Mac runner, end with `WORKDIR /`, or the
job's clone fails ([The project's image](image.md#what-it-needs)).

For npm, keep npm's cache in the image and install offline-first in setup:

```dockerfile
FROM node:24-bookworm
ENV npm_config_cache=/opt/npm-cache
WORKDIR /workspace/repository
COPY package.json package-lock.json ./
RUN npm ci && chown -R 1000:1000 /opt/npm-cache
```

```json
"worker": { "setup": ["npm ci --prefer-offline"], "files": [] }
```

For Rust, build the project with a target directory outside the workspace, so
the job compiles only the project's own crates:

```dockerfile
FROM rust:1-slim
RUN apt-get update \
 && apt-get install --yes --no-install-recommends ca-certificates git \
 && rm -rf /var/lib/apt/lists/*
RUN useradd --uid 1000 --user-group --create-home --home-dir /home/chuggy chuggy
ENV HOME=/home/chuggy CARGO_TARGET_DIR=/opt/target
WORKDIR /workspace/repository
COPY . .
RUN cargo build --locked && chown -R 1000:1000 /opt/target "$CARGO_HOME"
```

Run the same `cargo` commands in the image as the checks run, since a different
profile or feature set compiles again.

**Cost.** The image grows by the cache, and each rebuild needs a new tag in
the configuration, which every runner then pulls. Rebuild it when the lockfile changes; until then each job
fetches and compiles only what is new.

## An owner volume

The owner of a chuggy-linux runner can mount a volume of the machine into every
job, at a path the image points a tool's cache at. In the runner's
`runner.json`:

```json
"volumes": [{ "source": "npm-cache", "target": "/cache/npm" }]
```

and in the image:

```dockerfile
ENV npm_config_cache=/cache/npm
RUN mkdir -p /cache/npm && chown 1000:1000 /cache/npm
```

The `mkdir` keeps the image working on a runner with no such volume, where npm
could not make `/cache/npm` itself. For Cargo, the same with
`ENV CARGO_HOME=/cache/cargo` keeps the registry and git checkouts.

Leave a named volume for the runner to make. A runner starting a job makes any
volume that is missing and opens it to uid 1000. One made by hand with
`docker volume create` is mounted as it is, owned by root, and jobs cannot
write it. A `source` that is an absolute path mounts that directory of the
machine instead, which must exist, and `chuggy-linux doctor` says whether jobs
can write it. A `target` cannot be at, inside or above `/opt/chuggy`,
`/workspace`, `/var/run/chuggy` or `/var/run/docker.sock`, or their `/run`
spellings. The [chuggy-linux README](https://github.com/kasofsk/chuggy-linux#configure)
has the rest.

**Cost.** The runner's owner sets it up on each machine, and the first job on
each runs cold. One volume serves every project and job on the machine, including
jobs running at the same time, so it suits a tool whose cache is safe to share, as
npm's and Cargo's are. One project's job can read and change what another's
wrote there. Nothing removes a volume or limits its size. Sessions and
[jobs on the runner's machine](host.md) do not get it.

## A cache service on the runner's network

A tool with a remote cache can use a server on the network jobs join. For Rust,
that can be [sccache](https://github.com/mozilla/sccache) with Redis. Once the
runner has made its network, its owner starts the server:

```sh
docker run -d --name build-cache --network chuggy-jobs --restart unless-stopped \
  redis:7-alpine redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
```

and hands jobs its address in `runner.json`:

```json
"environment": { "SCCACHE_REDIS_ENDPOINT": "redis://build-cache:6379" }
```

The image installs sccache and turns it on:

```dockerfile
ADD --checksum=sha256:45f1447fbe231e3037bde351ef70677dd212216c8d62ae7ca409fecc4d6acc89 \
  https://github.com/mozilla/sccache/releases/download/v0.18.0/sccache-v0.18.0-x86_64-unknown-linux-musl.tar.gz /tmp/sccache.tgz
RUN tar --extract --gzip --file /tmp/sccache.tgz --directory /usr/local/bin --strip-components 1 \
      sccache-v0.18.0-x86_64-unknown-linux-musl/sccache \
 && rm /tmp/sccache.tgz
ENV RUSTC_WRAPPER=sccache CARGO_INCREMENTAL=0
```

On a runner with no `SCCACHE_REDIS_ENDPOINT`, sccache keeps its cache on the
job's own disk, and the build still works. sccache cannot cache incremental
compilation, hence `CARGO_INCREMENTAL=0`, nor crates that call the system
linker, such as binaries and proc-macros, which every job compiles again.
Other tools with remote caches, such as Bazel and Gradle, work the same way.

**Cost.** A server for the runner's owner to run and keep, and a network round
trip for each compilation. Like a volume, it is shared by every project
on the machine. Without `--maxmemory`, nothing limits its size.

## BuildKit cache mounts through the socket

On a runner that hands jobs its engine ([Docker in a job](docker.md)), a check
can run its build in `docker build`, and a `RUN --mount=type=cache` keeps its
directory in the machine's builder between builds, from any job:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-bookworm
WORKDIR /src
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=acme-shop-npm,target=/root/.npm,sharing=locked npm ci
COPY . .
RUN npm test
```

A mount's `id` defaults to its `target`, so give it one of the project's own,
or two projects' builds share it. `docker build --no-cache` starts every cache
mount empty.

**Cost.** It needs the engine socket, with the trust that takes. It helps
only steps that run inside `docker build`. The builder may clear a cache at
any time, so a build has to work with whatever the cache holds, or nothing.
