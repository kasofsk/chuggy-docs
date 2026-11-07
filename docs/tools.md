---
title: Tools for your coding agent
description: Give Claude Code the chuggy tools a thread has, under your own sign-in.
---

# Tools for your coding agent

A thread in the console is an agent with chuggy's tools. The same tools can be
served to the coding agent on your own machine, so that it reads the project
and files tickets into it without leaving your terminal. The Linux runner
package serves them over MCP:

```sh
npm i -g https://github.com/kasofsk/chuggy-linux/releases/download/v0.33.0/chuggy-linux-0.33.0.tgz
claude mcp add chuggy -- chuggy-linux mcp --site <site> --workspace <workspace> --project <project>
```

That URL is pinned to a release; see the
[chuggy-linux README](https://github.com/kasofsk/chuggy-linux) for the
current one.

`mcp` takes no runner registration. The first call with no sign-in answers
with the site's sign-in address for the agent to hand you; the sign-in
returns to a page `mcp` holds on this machine, so open it in a browser here.
After that, calls go through under your own account, and every action is
recorded as yours. The renewal token is kept in `~/.config/chuggy/sign-ins`,
readable only by you, one per site.

## The tools

They are the tools a session in chuggy has, for one project, in three groups.
Epics, the named sets of tickets [Epics](epics.md) describes, are read and
written by the first two.

**Reading the project.** `list_tickets`, `read_ticket`, `list_drafts`,
`read_draft`, `list_configurations`, `read_configuration`,
`list_repositories`, `list_executions`, `read_execution`,
`read_run_transcript`, `read_run_error`, `read_ticket_landings`,
`read_ticket_refusals`, `read_refusals`, `read_decision_log`, `read_lead`,
`read_lead_transcript`, `read_operation`, `list_threads`, `read_thread`,
`read_thread_transcript`, `fetch_image`, `read_docs`, `read_abilities`,
`list_epics`, `read_epic`, `read_epic_history` and `read_epic_graph`.
Everything the console shows, one page at a time, each answer naming its cursor; and these docs,
`read_docs` answering their index with no argument and one page by the address
the index lists it at.

`read_configuration` with no `path` answers the route's body as it is where
that fits in one answer; where it does not, the parsed canonical document is
answered whole where that fits, and otherwise as its outline. A `path` walks
into the parsed canonical instead, keys such as
`["workloads", "review", "prompt"]`: the value there comes back whole where
it fits; an object or an array that does not comes back as the outline of
its entries instead — each entry's child whole where that is short, and
otherwise its kind, its entries and its length in characters; a string that
does not comes back cut to fit. Either says how much is left, which `offset`
reads on from.

**Authoring.** `create_draft` files a ticket; `file_dependent` files one that
waits on another; `initialize_draft` and `revise_draft` shape a draft;
`release_draft` releases it; `delete_draft` discards it; `update_ticket`
revises a released ticket that has not started; `revoke_ticket` ends one;
`dispatch_ticket` starts a released ticket now, where you may dispatch.
`create_epic` makes an epic and `revise_epic` rewrites one whole against the
`revision` `read_epic` answered; `add_epic_tickets` and `remove_epic_tickets`
change only an epic's members, reading it and revising it in one call, doing
nothing where the tickets are already in or already out, and trying once more
if the epic moved in between. `read_abilities` says whether you may write
epics, as `writeEpic`. `create_draft` takes an `epic` to file the draft into,
and `list_tickets` takes one to list only that epic's tickets; a ticket read
carries the `epics` it is in. A refused epic write comes back as the API
refused it, its status and body unaltered: `StaleRevision` names the revision
the epic is at now, and `UnknownTickets` the numbers that are neither a ticket nor a draft
of the project.
`create_draft`, `revise_draft` and `file_dependent` also take `overrides`:
what the ticket replaces of its configuration, each field replacing that
field's whole rather than merging into it. On a catalog it is `workloads`,
keyed by the name a workload is replaced for; on any other configuration it
is `worker`, `practices`, `brief` and `work`, which holds only
`instructions`. Give a workload's whole `worker` to choose a different model
for it, in place of carrying a copy of the workload just to change that.

**Not deciding.** The lead's tools, which choose, hold and lift tickets, are
not served here. A coding agent with these tools acts as you in the project: it
dispatches only what you may, and it never acts as the project's lead.

## What to ask it

With the server added, the agent can answer questions such as what is in
flight, why a ticket is held, what a run's transcript says, and what a
configuration runs. It can file the follow-ups it finds while working, each
waiting on the ticket it came from, and release them when you say so.
