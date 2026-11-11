---
title: Writing a project's lead prompt
description: What a project's own lead prompt and North Star are for, what the lead already has without them, and how to write a prompt a lead applies as intended.
---

# Writing a project's lead prompt

A project's [lead](index.md) runs on one system prompt in three parts, in this
order: the project's own prompt, the project's North Star where it sets one,
and chuggy's standing instructions. Each turn's user message is the
observation. You write the first two. This page is about writing them well.

## Where it is set

Members with access to manage the project's lead settings write both texts in
the console's lead settings, under Base prompt and North Star; through the
project's `selector-settings` API route as `basePrompt` and `northStar`; or by
asking their own coding agent, whose `update_lead_settings` writes them (see
[Tools for your coding agent](tools.md)). A write to the route replaces the
whole set of settings under the revision it was read at, so leaving a field
out clears it. The tool reads the settings first and keeps every field it is
not told to change.

- A project that sets no prompt gets the installation's default. An
  installation that has not changed its default has one written for a lead
  that dispatches up to the budget its view states.
- A project that sets no North Star gets none: that part is left out of the
  prompt.
- Each text is at least one character and at most 65,536
  (`selectorSettingsTextCharsMax`). Write far less than that; the lead reads
  the whole prompt on every turn.

The lead settings also show Standing rules, which are how
[threads](index.md) act on the project. They are not part of the lead's prompt.

## What the lead has without your prompt

The standing instructions come after your text, so you do not need to repeat
them. In summary, they tell the lead:

- its decision tools write nothing, and the selector dispatches, refuses and
  lifts; its project tools act as a member of the project;
- it files only derived work, as a draft against a ticket that exists, and a
  draft it files is small enough for one work attempt, with an acceptance check
  that can be run;
- a candidate is a released, Pending ticket whose dependencies are all Done,
  so a dependency is never a reason to refuse one, and its size was settled by
  whoever released it;
- to set its attention and a short handoff note every turn, and that the note
  is an account and never a rule;
- an owner's hold on a ticket is a refusal of that ticket, and a hold that
  names no ticket is the project prompt's to state;
- that its memory can end between turns, and what its successor is given.

The observation each turn gives it the candidates, the refusals standing, the
changes since its last turn, the operational context, the handoff note, the
standing attention and the dispatch budget.

## Practices

**Write for the smallest model the project may run as its lead, and for a
lead that applies what it is told.** A phrase a large model reads past, a
smaller one applies to every candidate on every turn. Write each sentence so
it is still right applied that way. On the [subsidized
lead](subsidized-lead.md), the installation chooses the model.

**Don't restate what the selector settles.** A candidate is already released,
Pending, and has every dependency Done, and whoever released it settled its
size. A prompt that names these as reasons to refuse has the lead refuse
ready tickets for reasons that are not there. The standing instructions say
both, and the size rule as a rule for the drafts the lead files.

> Before: "Refuse a ticket whose dependency has not landed."
> After: leave it out.

**Name refusal reasons a lead can verify by reading.** A refusal is a check of
the brief against the tree: a brief that names files the checkout does not
have, an acceptance check that cannot pass as written, a configuration the
project has retired.

> Before: "Refuse tickets that look risky."
> After: "Refuse a ticket whose brief names a path that is not in the
> repository."

**Put a standing hold in the prompt, never the note.** The handoff note
is an account of one turn, read by the next, and an instruction left in it
hardens turn by turn into a blanket gate. A hold on one ticket is a refusal of
that ticket. A hold that names no ticket is the prompt's to state, and comes
out of the prompt when it ends.

> Before: a note reading "don't dispatch anything touching billing."
> After: the prompt says "Hold tickets that change `billing/` until the
> migration lands," and the line is deleted when it has.

**Say what the view can't.** Which repositories the project binds and what
each holds, how its work lands, what it has retired, and what a brief in it
must carry. Do not say how to read the observation or use the decision tools:
the standing instructions do, and a second version can contradict them.

> Before: "Read the candidates list, then call dispatch for each."
> After: "`api` holds the service; `web` holds the client."

**Keep it short.** Every turn reads all of it.

## An example

For a made-up project, Harbor, bound to two repositories:

```text
Harbor has two repositories. `harbor-api` holds the service and its database
migrations. `harbor-web` holds the browser client and calls the service only
through its published OpenAPI file.

Work lands through pull requests into each repository's `main`. A change to
an endpoint lands in `harbor-api` first, and the client change that uses it is
a separate ticket in `harbor-web`.

The v1 `/export` endpoint is retired. Refuse a ticket whose brief builds on
it, and say that it is retired.

A brief here names the repository it changes and the check that shows it is
done. Refuse one that names a file its repository does not have.

Hold tickets that change `harbor-api/migrations/` until the schema freeze
is lifted.
```

## When an edit takes effect

The prompt reaches the lead as its system prompt and nowhere else. At each
decision chuggy composes the prompt from the current settings and compares it
with the one the standing lead was opened with (`leadStandingReplaced`). If
they differ, that lead is closed and a successor is opened with the new
prompt, so the next decision is taken by the next lead, and the turn after an
edit is the first to read it. A lead mid-turn, or with an inquiry open, is not
closed, and decides as it was until it can be. The successor remembers none of
what the old lead read or reasoned; it is given the handoff note, a summary of
recent decisions, the standing refusals and the cursor. That is another reason
a standing hold belongs in the prompt.

A change to the lead's model, effort or compaction window replaces the lead in
the same way.
