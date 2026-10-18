---
title: Docker in a job
description: Running docker, docker compose or testcontainers from a job, through the engine socket a runner can hand its jobs.
---

# Docker in a job

A check that runs `docker` needs a docker client in the project's image and an
engine to reach. chuggy puts no client in the image, and only the runner's
owner can hand jobs an engine.

## The client

Copy the client and its plugins from the official image, as the
[starting Dockerfile](image.md#a-dockerfile-to-start-from) does:

```dockerfile
COPY --from=docker:29-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:29-cli /usr/local/libexec/docker/cli-plugins/ /usr/local/libexec/docker/cli-plugins/
```

That gives `docker`, `docker buildx` and `docker compose`.

## The engine

A chuggy-linux runner whose `runner.json` has `"engineSocket": true` mounts its
machine's engine socket into every job at `/var/run/docker.sock` and sets `DOCKER_HOST`
to it. It also sets `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE`, and on podman
`TESTCONTAINERS_HOST_OVERRIDE`, for testcontainers. Any other runner gives
jobs no engine, and a job cannot ask for one.

The socket gives a job everything the engine can do, which on rootful docker
is root on the runner's machine. The
[chuggy-linux README](https://github.com/kasofsk/chuggy-linux#configure)
says what a runner's owner accepts by turning it on.

## Paths are the machine's

The engine looks for every path a `docker run` mounts on the runner's machine,
where the job's `/workspace/repository` does not exist:

```console
$ docker run --rm --mount "type=bind,source=$PWD,target=/src" alpine:3 ls /src
docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /workspace/repository
```

To give a container the checkout, mount the job's workspace volume by name. A
job's hostname is its container's short id, which the job can look itself up
by:

```sh
workspace=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Name}}{{end}}{{end}}' "$(hostname)")
docker run --rm --volume "$workspace:/workspace" --workdir /workspace/repository alpine:3 ls
```

`docker build .` works as it does anywhere, because the client sends the build
context from the job.

## The network

A container a job starts joins the engine's default network unless told
otherwise, and the job cannot reach it there by name. Start it on the job's own
network:

```sh
network=$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' "$(hostname)")
docker run -d --rm --name "db-$(hostname)" --network "$network" \
  -e POSTGRES_HOST_AUTH_METHOD=trust postgres:18
```

The job then reaches it at `db-$(hostname):5432`. Every job on the runner
shares that network, so give what a job starts a name of its own, as above.

For docker compose, name the job's network as the compose project's default
network, and reach each service by its container name, which a project name of
the job's own makes unique:

```yaml
services:
  web:
    image: nginx:alpine
networks:
  default:
    name: ${JOB_NETWORK}
    external: true
```

```sh
export JOB_NETWORK="$network"   # found as above
project="checks-$(hostname)"
trap 'docker compose -p "$project" down --volumes' EXIT
docker compose -p "$project" up -d --wait
curl -fsS "http://$project-web-1/"
```

A service's bare name, `web` here, answers for every job running the same file
at once. Each line of a configuration runs in a shell of its own, so steps that
share a variable or a `trap`, like these, go in one script the check runs.

## Lifetime and limits

What a job starts through the socket runs as the engine runs it, as root on
rootful docker, outside the job's CPU, memory and process limits. It outlives
the job, since the runner removes only the job's own container and workspace,
so a check removes what it starts, with `--rm`, `docker compose down` or a
`trap` as above. testcontainers' reaper removes what testcontainers starts,
though a job that is killed can leave its containers running.

A file a started container writes into the workspace is root's unless the
container runs as the job's user, and the job then cannot remove it. Pass
`--user "$(id -u):$(id -g)"` to a container that writes there.

Images and build caches a job makes stay in the machine's engine, beside every
other job's. Tag what a job builds and remove it when the job is done with it.
