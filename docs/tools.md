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
npm i -g https://github.com/kasofsk/chuggy-linux/releases/latest/download/chuggy-linux.tgz
claude mcp add chuggy -- chuggy-linux mcp --site <site> --workspace <workspace> --project <project>
```

`mcp` takes no runner registration. The first call with no sign-in answers
with the site's sign-in address for the agent to hand you; the sign-in
returns to a page `mcp` holds on this machine, so open it in a browser here.
After that, calls go through under your own account, and every action is
recorded as yours. The renewal token is kept in `~/.config/chuggy/sign-ins`,
readable only by you, one per site.

## The tools

They are the tools a session in chuggy has, for one project, in three groups.

**Reading the project.** `list_tickets`, `read_ticket`, `list_drafts`,
`read_draft`, `list_configurations`, `read_configuration`,
`list_repositories`, `list_executions`, `read_execution`,
`read_run_transcript`, `read_run_error`, `read_ticket_landings`,
`read_ticket_refusals`, `read_refusals`, `read_decision_log`, `read_lead`,
`read_lead_transcript`, `read_operation`, `list_threads`, `read_thread`,
`read_thread_transcript` and `fetch_image`. Everything the console shows,
one page at a time, each answer naming its cursor.

**Authoring.** `create_draft` files a ticket; `file_dependent` files one that
waits on another; `initialize_draft` and `revise_draft` shape a draft;
`release_draft` releases it; `delete_draft` discards it; `update_ticket`
revises a released ticket that has not started; `revoke_ticket` ends one.

**Not deciding.** The lead's tools, which dispatch, hold and lift tickets, are
not served here. A coding agent with these tools acts as you in the project;
it never acts as the project's lead.

## What to ask it

With the server added, the agent can answer questions such as what is in
flight, why a ticket is held, what a run's transcript says, and what a
configuration runs. It can file the follow-ups it finds while working, each
waiting on the ticket it came from, and release them when you say so.
