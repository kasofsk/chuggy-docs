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

## Paths are on the runner's machine

The engine looks for every path a `docker run` mounts on the runner's machine,
where the job's `/workspace/repository` does not exist:

```console
$ docker run --rm --mount "type=bind,source=$PWD,target=/src" alpine:3 ls /src
docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /workspace/repository
```

To give a container the checkout, mount the job's workspace volume by name. A
job's hostname is its container's short id, so the job can find its own
container with `docker inspect`:

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
trap 'docker rm -fv "db-$(hostname)"' EXIT
docker run -d --name "db-$(hostname)" --network "$network" \
  -e POSTGRES_HOST_AUTH_METHOD=trust postgres:18
```

The job then reaches it at `db-$(hostname):5432`. Every job on the runner
shares that network, so give what a job starts a name of its own, as above.

For docker compose, make the job's network the project's default network and
give the project a name of the job's own. Each service is then reached by its
container name, `<project>-<service>-1`:

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
so a check removes what it starts. `--rm` removes a container only once it
exits, so stop a service such as a database with `docker rm -fv` or
`docker compose down --volumes` in a `trap`, as above. testcontainers' reaper removes what testcontainers starts,
though a job that is killed can leave its containers running.

On rootful docker, a file a started container writes into the workspace is
root's unless the container runs as the job's user, and the job then cannot remove it. Pass
`--user "$(id -u):$(id -g)"` to a container that writes there.

Images and build caches a job makes stay in the machine's engine, beside every
other job's. Tag what a job builds and remove it when the job is done with it.
