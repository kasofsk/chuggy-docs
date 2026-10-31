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

## Pinned and latest

A ticket is released pinned to one configuration revision, which [A
ticket](tickets.md) describes. Two fields choose whether a ticket instead
runs whatever its repository's newest import names under the same
configuration: `defaults.configuration`, on the catalog, for a project still
working on its configuration, so every ticket that chooses none of its own
follows; and a ticket's own `selection.configuration`, for a ticket that
needs the opposite of its catalog. Each holds `Pinned` or `Latest`; a
ticket's own choice wins over its catalog's default, which stands wherever
the ticket names none, and `Pinned` stands wherever neither does.

A ticket keeps the rule of the revision it holds, not of the one its
repository just imported: whether a ticket with no selection of its own
follows is read off `defaults.configuration` on the revision the ticket is
pinned to, every time it is asked. So a ticket already waiting, pinned to a
revision whose defaults say `Pinned`, follows only once an update moves its
pin onto a revision whose own defaults say `Latest` — turning a later
revision's `defaults.configuration` to `Latest` does nothing by itself for a
ticket already pinned behind it. The same holds in reverse: setting
`defaults.configuration` back to `Pinned` stops a ticket that is already
following only after its next move lands it on a revision that itself says
`Pinned`, because that move is what makes the revision's
`defaults.configuration` apply to it again. A ticket that must stop
following now, rather than at its next move, names `Pinned` in its own
`selection.configuration`.

A moved ticket lands exactly as it was released to land. Its brief's
finalization is resolved once, at the release or the revision that last
wrote it, from the brief's own mode and target, else the finalizer it
selected, else the repository's own landing; following a later revision onto
a new pin never resolves it again, whatever that revision's finalizer now
gives as `landing`.

Leave a ticket pinned, rather than following, where someone signs off the
ticket and its configuration together: a review that has to stay valid
against the exact revision it approved, regardless of what the project
imports afterward.

## A ticket held back

A Pending ticket that follows can still stay on the revision it holds rather
than move onto the newest. `Held` carries the code a release would be
refused with — the ticket, its held revision or the newest one is not one a
release could run it against. `Trimmed` is a ticket whose program already
runs less than its held plan — signed off running fewer stages than the plan
lists, so it is left where it is without the newest import even being read.

Both show as `following` on `read_ticket`'s answer for the ticket — `Held`
with the refusal's code, `Trimmed` on its own — and in the same words on the
ticket's own page. `following` is read fresh against the repository's newest
import every time it is asked, never stored, so the answer is only ever as
of that newest import: a later one can turn a `Held` ticket `Current` or move
it, or the other way around. No import changes `Trimmed`, which is decided
from the revision the ticket holds.

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
