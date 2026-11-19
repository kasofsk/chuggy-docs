---
title: Access tokens
description: Let a script run by launchd, cron or systemd use chuggy's tools as you, with a project access token in place of a sign-in.
---

# Access tokens

[Tools for your coding agent](tools.md) serves chuggy's tools to Claude Code
under your own sign-in, through a browser. A script run by launchd, cron or
systemd, with nobody at the machine, loses that sign-in when it ends, and
nothing recovers it without a person. A project access token stands in for it.

## What a token is

A token acts as the person who made it, in one project only, with Read or
Write access. It can never do more than its maker can do at that moment, and
everything it does is recorded as the maker's.

A project's admins make tokens, and so does anyone who can read the project and
whom the workspace lets register personal runners. A reader sees their own
tokens; an admin sees every token in the project.

A token is for your own scripts. Never give one to another person: what it
files runs on your runners, under your Claude login.

## Making one

In the project's Settings, open Access tokens, choose New token, and give a
name, the access and an expiry. The expiry is required and at most a year. The
token is shown once, so copy it then.

## Using it

Set `CHUGGY_TOKEN` in the environment of the process that runs Claude Code,
which starts `chuggy-darwin mcp` on a Mac or `chuggy-linux mcp` on Linux. With
it set, the server makes no sign-in and touches no stored sign-in.

A launchd agent's property list:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>CHUGGY_TOKEN</key>
  <string>the token</string>
</dict>
```

A cron line, which reads the token from a file only you can read:

```sh
0 * * * * CHUGGY_TOKEN=$(cat ~/.config/chuggy/token) claude -p "..."
```

A systemd unit, with the variable in a file:

```ini
[Service]
EnvironmentFile=%h/.config/chuggy/token.env
ExecStart=/usr/bin/claude -p "..."
```

where `token.env` holds the line `CHUGGY_TOKEN=the token`. Keep the file that
holds the token readable only by you (`chmod 600`), and never commit it.

Claude Code gives a stdio server its own environment, minus the variables it
strips, of which its docs name only `OTEL_*`
([debug your config](https://code.claude.com/docs/en/debug-your-config.md)).
As an alternative, a server's `env` may name `${CHUGGY_TOKEN}`, in `.mcp.json`
or in a local- or user-scoped entry in `~/.claude.json`
([MCP](https://code.claude.com/docs/en/mcp.md)):

```json
"env": { "CHUGGY_TOKEN": "${CHUGGY_TOKEN}" }
```

## What it cannot do

A token never does what chuggy keeps for a person at the keyboard. It cannot:

- answer an evaluation's approval;
- merge a pull request;
- change the project's thread settings or placement;
- use the agent-account tools;
- make, list or delete tokens.

It reaches no other project, which answers as if absent, so a token used on the
wrong project reads "not found". A Read token writes nothing. A Write token can
dispatch, as its maker.

## Expiry

In a token's last 7 days, every tool answer ends with a line saying when it
expires and what to do. The Settings list marks it Expiring.

## When it stops working

The answer says the token was refused: it was deleted, it expired, or it is for
another site. Make a new one, and set `CHUGGY_TOKEN` to it.

A token whose maker lost access to the project is refused, because chuggy
refuses them. It works again if they are re-added. Its expiry bounds both.
Whoever removes a person may delete that person's tokens in Settings.

## Deleting a token

Delete a token in Settings and it stops on the very next request.

Never paste a token into a ticket, a thread or a log.
