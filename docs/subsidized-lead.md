---
title: The subsidized lead
description: Running a project's lead on chuggy's own hardware and model account, free up to a monthly allowance; what it fixes, what counts against the allowance, what happens when it is spent, and what it does not load.
---

# The subsidized lead

A project's [lead](index.md) normally runs on the project's runners. Where an
installation offers it, a project can run its lead on chuggy's own hardware and
model account instead, free up to a monthly allowance. That is the subsidized
lead. This page is for a member deciding whether to turn it on, and for one
whose lead is already on it.

## Turning it on, and back

In the console, open Settings, Placement, and under Lead choose Subsidized in
place of Runners. The choice is there only where the installation offers it. It
is the project's lead offering, Own or Subsidized, which the
`session-placement` route takes as `leadOffering`.

A subsidized lead runs in chuggy's cluster and never on the project's runners.
Nothing else moves: work, evaluation and chat keep their own placement. To go
back, choose Lead, Runners.

## What chuggy fixes

The installation names the subsidized lead's model, effort, compaction window
and how much input it is given per decision. In the console's lead settings the
model and effort read Pinned, set by chuggy, and the allowance is shown beside
them. Read the model and the allowance there; an installation sets both, so
they are not the same everywhere.

## The allowance

Every lead turn counts against it, and so does every question asked of the
lead: a question forks from the lead and runs on the same footing. A turn that
ends without a measured cost is charged a fixed amount instead. That covers a
turn whose attempt was lost, and one that failed because the agent failed, hit
its rate limit, its turn limit or its budget, or the store refused it. A turn
withdrawn, or one in a session that was closed, is charged nothing.

The allowance is per workspace per month, and the installation has a limit
across all its workspaces too. A month is the calendar month in UTC.

When either is spent:

- **Decisions.** The lead is not given a turn. The project's lead reads Month's
  allowance spent, and resumes next month.
- **Questions.** Asking the lead is refused, saying the lead's subsidy for this
  month is spent.

You can wait for the month to turn, or move the lead back to Runners as above.

## What it does not load

A subsidized lead's session runs on its own system prompt. It does not use the
Claude Code preset, so it reads no `CLAUDE.md`. It loads no setting sources, so
none of the repository's `.claude/settings.json`, hooks, plugins or skills
apply. Its tools are confined: it reads a read-only checkout of the project's
repository with its file tools, nothing outside it, and it has the project's
chuggy tools.

So it can read the repository, but it is not instructed by it. The project's
lead prompt and North Star are the only project text it is given as
instruction. Everything a `CLAUDE.md` would have told a lead on runners belongs
in that prompt: see [Writing a project's lead prompt](lead-prompt.md).
