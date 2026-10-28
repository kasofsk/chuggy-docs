---
title: Getting started
description: From an invite to a first ticket landed.
---

# Getting started

chuggy is open by invitation. An invite link signs you in with GitHub and
either makes a workspace, which it asks you to name, or adds you to one.

## A project

A project belongs to a workspace and has a name. **New project** in the
console asks for both. The project is empty until it binds a repository.

## Connect GitHub

A project's repositories come from GitHub accounts the workspace has
connected. Connecting an account installs chuggy's GitHub Apps on it:

- **Chuggy Portal** is what chuggy acts as on your behalf. It reads the
  repositories an installation grants and lands finished work.
- **Chuggy Worker** is what a job's own git credential is minted under, so
  a repository can tell a job's pushes from a person's. A repository rule can
  refuse it on the default branch, which
  [A repository's settings](repository.md) describes.

The project's Repositories page lists what its installations grant and binds
one with a click. A binding with no configuration yet is shown as deferred,
with the configuration step offered on its row.

## A configuration

A repository tells chuggy how to run its work in files under
`.chug/configurations/`: the image jobs run in, the work, the checks and
reviews that evaluate it, and how a passed change lands.
[Configuration](configuration.md) describes the file.

The quickest way to write one is to let an agent do it. **New project** shows
a prompt to paste into Claude Code in your repository. It fetches chuggy's
setup program from the site and runs it there; the program reads what it can
from the repository and asks for the rest.

## A runner

Work runs on machines you register, not on chuggy's. The project's Runners
page mints a registration token and shows the two commands that spend it:
install the runner package for the machine's platform, then register. The
same page does this for a shared pool and for your own runner. A runner needs
a model credential on the machine, such as a Claude subscription token or an
API key, which stays there. [Runners](runners.md) has the detail.

## A ticket

A ticket is filed in two ways.

**By hand.** New ticket asks for what only a person can say: the title, what
is asked, what to read first, any images, the check lines this ticket adds,
the branch the work happens on and the one it lands on, and which
configuration runs it where the project offers more than one. Submit drafts
it, releases it and, where you may dispatch, starts it.

**In a thread.** Open a thread and say what you want. The agent reads the
project, drafts the ticket, and releases it when you say so. It can file
follow-ups that wait on the first, and it acts through the same commands you
have, recorded as yours.

Once released, a ticket waits for the tickets it depends on, then runs: the
work stage on a runner, each evaluation stage after it, and finalization. A
failed check sends the work back with the reason. Work that fails too often
parks, and the ticket appears in the inbox for a person.
[A ticket](tickets.md) names each phase, says who moves a ticket out of each,
and shows a brief.

## Watching it

The ticket's page shows each stage as it runs, with the agent's transcript,
every check's output, the reviewer's verdict, the cost, and the commit or
pull request it became. The inbox lists every ticket that needs a person:
a parked ticket, an approval the configuration requires, or a decision the
lead has held for review.

## From your terminal

[Tools for your coding agent](tools.md) gives Claude Code the same tools a
thread has, under your own sign-in, so the agent you already work with can
read the project and file tickets into it.
