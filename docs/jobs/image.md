---
title: The project's image
description: What a job's image needs, how a configuration names it, and a Dockerfile to start from.
---

# The project's image

A job that runs in a container runs in an image the project chooses. The image
the project already builds for its CI is often the best start, with whatever
its checks need added.

## Naming it

A configuration is a file in the repository's `.chug/configurations/`
directory. In a version 2 configuration, the format chuggy writes for a new
repository, the top-level `image` is the image every workload runs in, and a
workload's own `image` replaces it for that workload:

```json
{
  "version": 1,
  "name": "standard",
  "configuration": {
    "version": 2,
    "image": "ghcr.io/acme/shop-ci:2026-10",
    "workloads": {
      "lint": {
        "runner": "Commands",
        "image": "ghcr.io/acme/lint:3",
        "commands": ["make lint"]
      }
    }
  }
}
```

The outer `version` is the file's and the inner one the configuration's. The
fragment leaves out the work, the plans and the defaults a whole configuration
has. chuggy publishes every key it reads as a JSON Schema at
<https://chuggy.vteng.io/api/v1/configuration-schema>.

An image is named by tag or by digest, as `ghcr.io/acme/shop-ci@sha256:...`.

## Where it comes from

Every runner that runs the project's jobs needs the image, and gets it on its
own.

- An image the runner's engine already holds under that name is used as it is.
  A runner's owner can build one there with `docker build -t` and it is used at
  once.
- An image it lacks is pulled from its registry with the runner machine's own
  login for that registry, so a private image works once the machine has one.
  Log in once on each runner machine, as the user the runner runs as and not
  with `sudo`: `docker login ghcr.io`, or on a podman runner
  `podman login --authfile ~/.config/containers/auth.json ghcr.io`, which
  keeps the login past a reboot. The runner does not see a shell's
  environment, so a login that only a shell profile points to does not reach
  it.
- A runner does not pull an image again once it holds it, so a tag pushed
  again is not picked up. Give each new image a new tag, or name it by digest.

The first job on each runner waits for the pull. A pull the registry refuses
stops the job at once, and one that fails any other way stops it after two
minutes of trying.

## What it needs

- `/bin/sh`.
- `git` on `PATH`, 2.31 or later to read the project's other repositories
  ([A job's container](container.md#other-repositories)).
- glibc 2.28 or later, with libstdc++, as a current Debian or Ubuntu has.
  Alpine and other musl images cannot load chuggy's runtime.
- A `HOME`, and a temporary directory (`TMPDIR`, or `/tmp`), that uid 1000 can
  write. An image with no user of uid 1000 and no `HOME` in its `ENV` gives the
  job a `HOME` it cannot write (`/` on docker).
- A build for `linux/amd64`, the platform chuggy's runtime is built for. A job
  that names an image runs only on a runner whose containers are
  `linux/amd64`, which rules out a Mac whose Colima VM is arm64, as it is by
  default on Apple silicon.
- A `WORKDIR` outside `/workspace/repository`. Docker makes an image's
  `WORKDIR` when the container starts, inside the job's workspace volume and
  owned by root, and the clone into `/workspace/repository` then fails.

chuggy checks the first four as each job starts, and a job on an image that
lacks one stops before its agent or checks start, with a reason naming what is
missing. The image needs no init, Node or agent of its own, and its
`ENTRYPOINT` and `CMD` never run.

`node:24-bookworm` meets all of them as it is. `debian:trixie-slim` and
`rust:1-slim` lack git, and `buildpack-deps:trixie-scm` has no user of uid 1000.

To check an image yourself (replace `IMAGE`):

```sh
docker run --rm -i --platform linux/amd64 --user 1000:1000 --entrypoint /bin/sh IMAGE -s <<'EOF'
fail() { echo "missing: $1"; exit 1; }
command -v git >/dev/null || fail "git on PATH"
v=$(getconf GNU_LIBC_VERSION 2>/dev/null) || fail "glibc"
printf '%s\n' "glibc 2.28" "$v" | sort -V -C || fail "glibc 2.28 or later (have $v)"
/sbin/ldconfig -p | grep -q 'libstdc++\.so\.6 ' || fail "libstdc++"
[ -w "$HOME" ] || fail "a HOME uid 1000 can write (HOME is $HOME)"
[ -w "${TMPDIR:-/tmp}" ] || fail "a temporary directory uid 1000 can write"
g=$(git --version | cut -d' ' -f3)
printf '%s\n' 2.31 "$g" | sort -V -C || echo "note: git $g cannot read the project's other repositories"
echo "ok: git $g, $v"
EOF
```

## A Dockerfile to start from

```dockerfile
FROM debian:trixie-slim

RUN apt-get update \
 && apt-get install --yes --no-install-recommends ca-certificates curl git \
 && rm -rf /var/lib/apt/lists/*

# Every job runs as uid 1000, which needs a HOME it can write.
RUN useradd --uid 1000 --user-group --create-home --home-dir /home/chuggy chuggy
ENV HOME=/home/chuggy

# The docker client, with its buildx and compose plugins, for checks that run
# docker on a runner that hands its jobs an engine. Leave these lines out
# otherwise.
COPY --from=docker:29-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:29-cli /usr/local/libexec/docker/cli-plugins/ /usr/local/libexec/docker/cli-plugins/

# Add the toolchains and tools the checks run here.
```

Build it for the runners and push it where they can pull it:

```sh
docker build --platform linux/amd64 -t ghcr.io/acme/shop-ci:2026-10 .
docker push ghcr.io/acme/shop-ci:2026-10
```

[Docker in a job](docker.md) covers the engine, and
[Build caches](build-caches.md) covers putting the project's dependencies in the
image.
