---
title: A ticket
description: The phases a ticket moves through, what its brief says, and how a coding agent files one.
---

# A ticket

A ticket is filed as a draft and released, and then moves through the phases
below until it is Done or Revoked.

## Phases

- **Draft.** Filed and not yet released. It holds its ticket number, it can
  be revised or deleted, and nothing runs it.
- **Pending.** Released, which starts nothing by itself. It waits until every
  ticket it depends on is Done, then until it is dispatched: the project's
  lead chooses it, or a person who may dispatch starts it. Where the project
  holds the lead's choices for approval, a person approves the choice first.
- **Work.** An agent makes the change on a runner, on the brief's branch.
- **Evaluation.** The stages of the configuration's plan run in order, such
  as checks and then a reviewing agent. A stage that fails sends the work back
  to Work with the reason.
- **Finalization.** The passed change lands by a push, a pull request, or a
  pull request that is then merged, after a person's approval where the
  configuration asks for one. A landing that conflicts with its target sends
  the work back to Work with the conflict.
- **Done.** The landing succeeded. Under a **Pull request** landing, its pull
  request is open for a person to merge.
- **Escalated.** Parked for a person: its run stopped at a step such as its
  clone, setup or push, it failed evaluation too many times, it could not be
  run, or its landing could not go through. It waits in the inbox until a
  person resumes it where it stopped or revokes it.
- **Revoked.** Ended by a person while Pending, in Work, in Evaluation or
  Escalated. Work running for it is cancelled.

Every phase after Draft is a value `list_tickets` takes as `phase`, and
`NonTerminal`, on its own, takes all but Done and Revoked.

## The brief

A ticket's brief is the part its author writes. The agent doing the work and
each reviewing agent read its title and intent as what the ticket asks for,
and its links as what to read first. Give these on every ticket:

- **title.** One line naming the work, which the console lists tickets by.
- **intent.** What the ticket is for, in the author's words. A good one names
  the problem, what to build, what not to touch, and how to verify the change.
- **links.** Addresses to read first, each `https://`. Give an empty list
  where there are none.
- **repository.** The clone URL of a repository the project binds, as
  `list_repositories` answers it. A draft may leave it out, but its release
  is refused.
- **branch.** The `refs/heads/` branch the work happens on, which need not
  exist yet. Under a pull request landing it is a branch of the ticket's own,
  never the branch the pull request opens into.

These are optional:

- **images.** The project's images the work is handed, each by the identity
  `fetch_image` takes.
- **checks.** Command lines added to the first check stage the configuration
  runs as commands. Where the configuration has no such stage, a release
  carrying them is refused.
- **finalization.** How the work lands: `mode` is `Push`, `PullRequest`,
  `PullRequestMerge` or `None`, which lands nothing. `target` is the branch a
  push lands on, where that is not `branch`, or the branch a pull request
  opens into, where that is not the default branch. A brief naming none lands
  as its configuration's finalizer says, or else by the repository's landing
  default.

A docs fix, landed by pull request:

```json
{
  "title": "README links to the moved contributing guide",
  "intent": "The Contributing link in README.md points at CONTRIBUTING.md in the repository root, but the guide moved to docs/contributing.md, so the link is broken. Point the link at docs/contributing.md. Change nothing else in README.md and do not move the guide. Verify that every relative link in README.md names a file the repository has.",
  "links": ["https://github.com/acme/website/blob/main/docs/contributing.md"],
  "repository": "https://github.com/acme/website.git",
  "branch": "refs/heads/docs/readme-contributing-link",
  "finalization": { "mode": "PullRequest" }
}
```

## Filing one from a coding agent

With the tools [Tools for your coding agent](tools.md) sets up, an agent files
a ticket in this order:

1. `list_repositories`. Each row's `repository` is a clone URL a brief can
   name, unless the row carries `retiredAt`.
2. `list_configurations`. Where the repository's row has `configurationsHeld`
   `Bootstrapped`, use the `revision` it names. Otherwise take the newest
   revision whose `provenance.repository` is that repository; the list is
   newest first.
3. `initialize_draft` with that `revision`. It answers the fence,
   `fence.projectSequence` and `fence.configurationDigest`, and `defaults`.
4. `create_draft` with the revision as `configurationRevision`, the fence as
   `configurationDigest` and `expectedProjectSequence`, the brief, and
   `authoring` set to `defaults`, with any tickets it waits on added to
   `authoring.dependencies`. It answers the draft and its ticket number.
5. `read_draft`. The draft as stored, with its `authoringVersion`.
6. `release_draft` with the ticket, its `authoringVersion` and its
   `configurationRevision`. It submits the release and answers the
   operation's id.
7. `read_operation`. What the release did, a refusal's `code` included. It
   is the only way to learn a submitted command's outcome.
