---
title: Configuration
description: The file in a repository that says how chuggy runs its work.
---

# Configuration

A repository tells chuggy how to run its work in files directly under
`.chug/configurations/`. Each file declares one configuration under a name,
and a ticket names the configuration that runs it where the project offers
more than one. chuggy publishes every key it reads as a JSON Schema at
<https://chuggy.vteng.io/api/v1/configuration-schema>; an editor that reads a
schema can offer the shape as you type.

A version 2 configuration is a catalog:

- **image.** The image a workload runs in where it names none of its own.
  [The project's image](jobs/image.md) says what an image needs.
- **workloads.** Named units of work. The work stage is one; each check and
  each reviewing agent is one. A workload names an image, or the
  capabilities a runner must meet instead, and what it runs: an agent with
  its instructions, or a list of commands. A workload may be written inline
  or as the path of a JSON file under `.chug/`.
- **plans.** How a change is evaluated: stages run in order, each naming the
  workloads that evaluate it. A stage that fails ends the evaluation and sends
  the work back with the reason.
- **finalizers.** How a passed change lands: a push to a branch, a pull
  request, or a pull request that is then merged. A finalizer may require a
  person's approval before it lands; absent, none is asked.
- **defaults.** Which workload does the work, which plan evaluates it, and
  which finalizer lands it, for a ticket that selects none.

A ticket may name its own branch and landing, and the check lines it adds;
the configuration supplies the rest.

A key at any depth may not contain `password`, `secret`, `token` or
`credential`, in any letter case: a configuration is public to the project
and carries no secret. Credentials are read on the runner, which
[Runners](runners.md) describes.

The pages under [Jobs](jobs/index.md) cover what a workload runs in and how
to make it fast: the container, host jobs, Docker inside a job, build caches,
and sizing.
