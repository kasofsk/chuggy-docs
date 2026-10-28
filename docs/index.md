---
title: Introduction
description: What chuggy is, the words it uses, and where to start.
---

# Introduction

chuggy coordinates software work done by people and AI agents together. A
piece of work is a ticket. Tickets say what they wait on, so a project's work
is one graph, and every ticket moves through the same stages: an agent does
the work, checks and reviewing agents evaluate it, and it lands in the
repository. The work runs on machines you register, with your own model
accounts, and chuggy keeps the record of what ran, what it decided, and why.

## The words

- **Workspace.** The top of the tree: the people, the connected GitHub
  accounts, and the projects. An invite link makes one or adds you to one.
- **Project.** A set of repositories worked on together, with its own
  tickets, runners, and, optionally, a lead. Every ticket belongs to one
  project.
- **Repository.** A GitHub repository the project binds. It holds the
  project's [configurations](configuration.md) under `.chug/configurations/`.
- **Ticket.** One piece of work: a title, what is asked, what to read first,
  which configuration runs it, and the branch it lands on. A ticket is a
  draft until it is released, and it may wait on other tickets.
  [A ticket](tickets.md) covers its phases and its brief.
- **Stage.** A step a ticket moves through. In the work stage an agent makes
  the change; each evaluation stage after it runs checks or a reviewing agent;
  finalization lands what passed, with a person's approval where the
  configuration requires one.
- **Task.** What a ticket owes at one stage: the one work task of a cycle,
  or one evaluator's task in one evaluation stage. A task is retried until it
  is fulfilled or the ticket parks.
- **Job.** One run of a task on one runner: a container, or a process on the
  machine itself, with its own log and exit. A task that fails may be run as
  more than one job. [Jobs](jobs/index.md) covers what a job runs in and how
  to make it fast.
- **Runner.** A machine registered to run a project's jobs: a shared pool, or
  one member's own. [Runners](runners.md) covers the three packages and how
  work is placed.
- **Thread.** A chat with an agent that acts on your behalf in a project: it
  reads the project, drafts tickets, and releases them on your word.
- **Lead.** A project's own agent that watches the whole graph rather than one
  ticket. It proposes what to run next, holds a ticket that would conflict
  with work in flight and says why, and answers members' questions. Its
  decisions are in a log; the ones it holds for a person are in the inbox.

## Where to start

[Getting started](getting-started.md) walks from an invite to a first ticket
landed. [Tools for your coding agent](tools.md) gives Claude Code the same
tools a thread has, so you can file and follow tickets from your own
terminal. The rest of these pages are reference.
