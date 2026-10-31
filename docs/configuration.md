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

## Importing

chuggy reads a repository's `.chug/configurations/` at a commit and stores
what it finds there as a new revision of each configuration the commit
declares. One file it cannot read as a configuration refuses the whole
commit's import, so a caller is never handed part of what the commit
declares. Earlier revisions stay usable: tickets keep releasing against the
previous one until a later commit imports cleanly.

What is checked against a length limit is a configuration's canonical form:
the file as JSON, with every prompt file it names by path stored inside it as
text. That form may not pass 131,072 characters, the value
`configurationCanonicalCharsMax` holds in `src/contract/http.ts`; a file
whose canonical form would be longer refuses the same way a file chuggy
cannot otherwise read does. Inside that form, one workload's prompt, however
it is written, may not itself pass 65,536 characters,
`configurationPromptTextCharsMax`.

A refusal keeps why. [A repository's settings](repository.md) says where
that reason shows.

## What length costs

A job reads only the prompt of its own workload, and reads it on every turn
of that job, so a long prompt costs on every turn of the job it belongs to,
and nowhere else: the length of the rest of a configuration, and of every
other workload's prompt, costs no turn anything.

Keep a prompt short two ways:

- Where a ticket only needs a different model for a workload, give it that
  model through the ticket's `overrides` instead of a whole copy of the
  workload. [Tools for your coding agent](tools.md) describes `overrides` on
  the draft tools.
- Keep rules several prompts share in one file under `.chug/`, and have each
  of those prompts tell its agent to read it with
  `git show "${CHUG_CHANGE_BASE:?}:<path>"` rather than from the checkout: a
  reviewing agent must read the rules as they stood at the change's base, not
  as the change itself may have left them.

The pages under [Jobs](jobs/index.md) cover what a workload runs in and how
to make it fast: the container, host jobs, Docker inside a job, build caches,
and sizing.
