---
title: Epics
description: Group a project's tickets under one named goal, see how far along it is, and file tickets into it.
---

# Epics

An epic is a named set of tickets worked toward one end: a feature, a
migration, a release. It sits beside the ticket graph and changes nothing
about how a ticket runs. What it adds is a name for the group and one place
to see how far the group has come.

A ticket can be in any number of epics, and an epic holds tickets of its own
project only. A ticket in epics shows them as chips on its page and in the
project's ticket list.

## What an epic holds

- **Title.** One short line.
- **Summary.** Optional, a sentence the epic is listed with.
- **Description.** What the epic is for and what finishes it, as Markdown.
- **Visibility.** Active, or Archived. An Archived epic is kept and read like
  any other, and a write to it is refused if it would change its tickets,
  until it is Active again; deleting a draft that is its member still takes
  it out.
- **Tickets.** The members.

An epic's size is bounded as a whole: a write that would give it too many
tickets is refused as `ManyTickets`, and one whose content would weigh too
much as `LargeContent`.

## How far along it is

An epic's figures are worked out from its members' phases whenever it is read;
nothing records them.

- **Progress** counts the members in each phase, how many are Done, and how
  many there are in all. A Revoked member is left out of the total.
- **Status** is the first of these that holds: `empty` (no members), `done`
  (every member that is not Revoked is Done), `attention` (a member is
  Escalated), `not_started` (every member is Pending or a draft), `in_progress`.
- **Waiting on outside** lists the tickets outside the epic that a Pending
  member depends on and that are not yet Done, which is what keeps the epic
  from starting.

The epic's graph draws its members and those outside tickets, with an edge
from each dependency to the ticket that waits on it.

## Revisions

Every change to an epic is a new revision, and the history keeps each one with
who made it, when, and the title it had then. A write names the revision it was
made against. If the epic has moved since, the write is refused as
`StaleRevision`, naming the revision the epic is at now, and nothing is
written; read the epic again and decide.

Creating and changing an epic needs the same permission as filing and
revoking tickets, which the console and `read_abilities` (as `writeEpic`)
report. Anyone who can read the project can read its epics.

## Filing a ticket into an epic

A new draft can join an epic as it is filed. The draft and its place in the
epic are written together, so a draft is never left out of an epic it was filed
into. The epic must exist and be Active: a missing epic is refused `MissingEpic`,
an Archived one `ArchivedEpic`, and one that would grow past its bound
`ManyTickets` or `LargeContent`, and in each case no draft is filed.

A draft is a member from the moment it is filed, as a released ticket is, and
stays one when it is released or revised. Deleting the draft takes it out of
every epic that held it; each of those epics takes a new revision, made by
whoever deleted the draft.

## In the console

The project's navigation has an Epics page, listing the project's epics with
their progress and status, searchable and filterable by visibility. An epic's
page shows its description, members, graph and history, and is where it is
edited. When a ticket is created in the console, the epic it joins can be
chosen in the same form.

## With a coding agent

The tools in [Tools for your coding agent](tools.md) read epics (`list_epics`,
`read_epic`, `read_epic_history`, `read_epic_graph`) and write them
(`create_epic`, `revise_epic`, `add_epic_tickets`, `remove_epic_tickets`).
`create_draft` takes an `epic`, `list_tickets` takes an `epic` to list only
that epic's tickets, and a ticket read carries the `epics` it is in.
