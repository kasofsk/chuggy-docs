---
title: Jobs
description: What chuggy runs a project's stages in, and how to make them fast.
---

# Jobs

A project's configuration is a file in its repository that names the stages a
change goes through. In the work stage an agent makes the change. Each
evaluation stage after it runs one or more evaluators, each either a list of
check commands or a reviewing agent; a version 2 configuration calls the work
and each evaluator a workload. chuggy runs the work, and each evaluator,
as a job on one of the project's runners. A runner is a machine its owner
registered to run the project's jobs, with
[chuggy-linux](https://github.com/kasofsk/chuggy-linux) on Linux or
[chuggy-darwin](https://github.com/kasofsk/chuggy-darwin) on a Mac, which runs
jobs in Colima's Linux VM. Each one's README covers installing and configuring
it.

- [A job's container](jobs/container.md) lists what chuggy sets for every
  job in a container: how it starts, its user, environment, checkout, passing
  variables from setup, mounts, network and size.
- [Jobs on the runner's machine](jobs/host.md) covers a job that asks for
  capabilities in place of an image, and what changes when it runs outside a
  container.
- [The project's image](jobs/image.md) says what an image needs, how a
  configuration names it, and gives a Dockerfile to start from.
- [Docker in a job](jobs/docker.md) covers a check that runs `docker`, and the
  runner's engine socket.
- [Build caches](jobs/build-caches.md) gives four ways to keep dependencies and
  compiled output between jobs, and what each costs.
- [Sizing a stage](jobs/sizing.md) shows how a configuration asks for CPUs and
  memory.
- [A repository's settings](repository.md) covers letting jobs change GitHub
  workflow files, and protecting the default branch.
