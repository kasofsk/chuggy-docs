---
title: Tools for your coding agent
description: Give Claude Code the chuggy tools a thread has, and the project's thread settings and placement, under your own sign-in.
---

# Tools for your coding agent

A thread in the console is an agent with chuggy's tools. The same tools can be
served to the coding agent on your own machine, so that it reads the project
and files tickets into it without leaving your terminal. The runner package
for the machine serves them over MCP: chuggy-linux on Linux, chuggy-darwin on a
Mac. Install the one for your machine as its README says, in
[chuggy-linux](https://github.com/kasofsk/chuggy-linux) or
[chuggy-darwin](https://github.com/kasofsk/chuggy-darwin), then add it to
Claude Code.

On Linux:

```sh
claude mcp add chuggy -- chuggy-linux mcp --site <site> --workspace <workspace> --project <project>
```

On a Mac:

```sh
claude mcp add chuggy -- chuggy-darwin mcp --site <site> --workspace <workspace> --project <project>
```

`mcp` takes no runner registration. The first call with no sign-in answers
with the site's sign-in address for the agent to hand you; the sign-in
returns to a page `mcp` holds on this machine, so open it in a browser here.
After that, calls go through under your own account, and every action is
recorded as yours. The renewal token is kept in `~/.config/chuggy/sign-ins`,
readable only by you, one per site, by both packages.

## The tools

They are the tools a session in chuggy has, for one project, and the tools
for the project's thread settings and placement, which only your own agent is
given. Epics,
the named sets of tickets [Epics](epics.md) describes, are read and written by
the first two groups.

**Reading the project.** `list_tickets`, `read_ticket`, `list_drafts`,
`read_draft`, `list_configurations`, `read_configuration`,
`list_repositories`, `list_executions`, `read_execution`,
`read_run_transcript`, `read_run_error`, `read_ticket_landings`,
`read_operation`, `list_threads`, `read_thread`,
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
`dispatch_ticket` starts a released ticket, where you may dispatch.
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

**Thread settings and placement.** No session in chuggy is given these, so
that a thread does not make an administrator's change on the strength of a chat
message. `read_lead_settings` and `update_lead_settings` read and write a
project's [thread settings](thread-settings.md); their names are kept from
before. `read_lead_settings` answers `overrides`, what the project sets;
`effective`, what its threads run with, `northStar` and `threadStandingRules`;
and the `revision` a write is made against. The fields are `northStar`,
`threadStandingRules`, `threadModel` and `threadEffort`. Settings larger than
one answer are read by `path` and `offset`, as `read_configuration` reads a
configuration. `update_lead_settings` takes that `revision` as
`expectedRevision`, `set`, the fields to replace, each whole, and `clear`, the
fields to return to the default. A field named in neither keeps what the
settings hold: the tool writes the whole set itself, so a long text never has
to pass back through your agent. Settings that moved since they were read are
refused as `SettingsRevisionConflict`, and the tool does not try again.
`read_placement` answers where the project's threads run; `update_placement`
changes the fields it is given and keeps the rest. Fields that older clients
still send have no effect. Reading or writing the thread settings
needs `manageSelector` in `read_abilities`, and changing placement needs
`administer`, as in the console. These four come with chuggy-linux 0.48.0 and
chuggy-darwin 0.18.0.

A coding agent with these tools acts as you in the project: it dispatches only
what you may.

The chuggy tools do not change the machine they run on. To make this computer your chat host, the agent runs the setup program's `chat-host`; [A chat host](runners.md#a-chat-host) says how.

## What to ask it

With the server added, the agent can answer questions such as what is in
flight, why a ticket is held, what a run's transcript says, and what a
configuration runs. It can file the follow-ups it finds while working, each
waiting on the ticket it came from, and release them when you say so. And
when you ask, it can change the project's thread settings.
