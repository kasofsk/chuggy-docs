---
title: Connect chuggy to Claude
description: Add chuggy's tools to Claude's apps as a custom connector, sign in with your chuggy account, and remove it.
---

# Connect chuggy to Claude

chuggy serves its tools to Claude's apps (web, Desktop and mobile) from
`https://mcp.vteng.io/mcp`. Claude calls them acting as you, in the projects
you belong to: what you may do in the console, Claude may do, and every action
is recorded as yours.

## Adding it

Add chuggy as a custom connector, following Anthropic's
[Add a connector that isn't in the directory](https://claude.com/docs/connectors/custom/add-unlisted.md)
for your plan. Give it:

- the server URL `https://mcp.vteng.io/mcp`;
- your own OAuth client, with client ID `chuggy-claude` and no client secret.

On a Team or Enterprise plan, an owner adds the connector for the
organization, and each member then connects it with their own account.

## Signing in

Choose **Connect**, sign in with your chuggy account, then choose **Allow** on
the consent page.

Claude renews the sign-in itself. A connection left unused for longer than the
client's refresh lifespan, 30 days, needs **Connect** again.

## Using it

Ask Claude to list your chuggy projects. Every tool that reaches a project
names its workspace and its project, as that list gives them. For example:

- "Read ticket 42 in my project."
- "File a ticket in my project to add a retry to the upload."
- "Which tickets in my project are in flight, and why is any held?"

The tools are the ones [Tools for your coding agent](tools.md) lists.

## Claude Code

Claude Code uses the local server instead: see
[Tools for your coding agent](tools.md).

## Removing it

Disconnect or remove the connector in Claude's settings, as Anthropic's page
above describes for your plan.
