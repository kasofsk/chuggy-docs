---
title: A repository's settings
description: Letting jobs change GitHub workflow files, protecting the default branch, and landing through a merge queue.
---

# A repository's settings

Each repository a project binds has a page in the console, under
**Repositories**. Only administrators of the project or its workspace can
change its settings.

## Workflow files

GitHub refuses a push that adds or changes a file under `.github/workflows`
unless the push's token carries the Workflows permission. chuggy asks for it
only for a repository whose **Workflow files** setting is On. It is Off by
default.

To let jobs change workflow files:

1. On GitHub, accept the Workflows permission for both of chuggy's apps,
   Chuggy Worker and Chuggy Portal, on the installations held by the account
   that owns the repository. An organization accepts on its own installations,
   apart from its members' personal ones.
2. On the repository's page, set **Workflow files** to On.

With it Off, or before both apps hold Workflows, GitHub refuses a ticket's
change to a workflow file. At its job's push, the ticket shows **Push failed**
with GitHub's refusal as the reason. At a **Push** landing, the landing holds as
**Workflow files refused** and the ticket then shows it under **Needs you**:
turn the setting On, accept the permission, then press **Resume**. Leave it Off
unless jobs need it, because a workflow runs with the repository's Actions
secrets.

## A refused import

An import that [Configuration](configuration.md#importing) refuses keeps
why, and shows it in three places. Under the repository's import line, on
its own page, a line names the first file refused, its fault in the
console's words — a configuration too long as its length against the limit,
such as "140,412 of 131,072 characters" — and how many more files were
refused. The project's ticket table and its Inbox each show a notice,
"Import refused", naming the repository and linking to its page, with how
many more repositories are refused. A binding later imported cleanly shows
none of this, and a retired binding is never notified on.

## Protecting the default branch

A ruleset on a repository's default branch can let only Chuggy Portal and the
repository's administrators update or delete the branch. Chuggy Portal is the
app that lands a finished ticket, so a **Push** or **Pull request, then merge**
landing works under it. With it, a collaborator who is not a repository
administrator cannot merge the pull request a **Pull request** landing opens.
A **Push** landing that a ruleset or hook declines is built and pushed again, in
case the decline passes, then holds as **Push declined** and shows under
**Needs you**: change the rule, then press **Resume**.

To add it, open the repository's **Settings** on GitHub, then **Rulesets**, and
add a branch ruleset:

- Give it a name, such as `chuggy portal + admins own main`, and set
  **Enforcement status** to **Active**. A new ruleset starts Disabled, and is
  not enforced until then.
- Target the default branch.
- Turn on **Restrict updates**, **Restrict deletions** and **Block force
  pushes**.
- In the bypass list, add the Chuggy Portal app and the Repository admin role.

GitHub offers rulesets on a private repository only with GitHub Pro, Team or
Enterprise Cloud, so a private repository without one cannot have this ruleset.

A repository that lands through a merge queue turns **Restrict updates** off
instead: left on, it stops the queue's own merge, and GitHub refuses to queue
the pull request with "Cannot update this protected ref," holding the landing
as **Blocked** forever. **Restrict deletions** and **Block force pushes** can
stay on, with Chuggy Portal and the Repository admin role bypassing as above.
[Landing through a merge queue](#landing-through-a-merge-queue) says what else
such a repository needs.

## Landing through a merge queue

GitHub offers a merge queue only on a repository owned by an organization:
any public one, or a private one whose organization is on GitHub Enterprise
Cloud. A repository under a personal account cannot have one.

chuggy uses the queue under a **Pull request, then merge** landing, whichever
merge method the queue uses. There is no chuggy setting to turn on: chuggy
asks GitHub to merge, GitHub answers that the branch requires the queue, and
chuggy puts the pull request on the queue at the head it evaluated and
follows it there. Until GitHub accepts it onto the queue — its checks still
running, or an approval missing — the landing waits as **Blocked**; once
queued it shows **In merge queue**. Under a **Pull request** landing, chuggy
opens the pull request and stops, so a person queues it as they would any
other.

To set up the repository on GitHub:

- The ruleset that requires the queue should also require a pull request and
  the status checks. With those, GitHub declined a direct push to the default
  branch even from a repository administrator.
- The workflow that reports each required check must run on `merge_group` as
  well as `pull_request`. Without it, the queue waits for a check that never
  reports and removes the pull request for `checks_timed_out`.
- The queue tests each pull request merged onto the base and the entries
  ahead of it, a combination nobody else tests: chuggy's own evaluation ran
  on the pull request against the base as it was then. The required checks
  should run the project's real tests on `merge_group` events too, not a step
  that skips them.
- Chuggy Portal must not be on the bypass list of the ruleset that requires
  the queue. GitHub accepts a bypass actor's merge directly, so chuggy's
  merge succeeds and the queue never runs.
- Turn **Restrict updates** off, as [Protecting the default
  branch](#protecting-the-default-branch) says.
- Where the ruleset requires an approving review, GitHub will not queue a
  pull request until it has one. The landing waits as **Blocked** until a
  person approves it on GitHub; chuggy queues it at its next reading, which
  in one landing seen live was about three minutes after the approval.

GitHub's reason for taking a pull request off the queue decides what chuggy
does next. Where a removal holds the landing, the ticket shows **Held**, and
escalates under that label after a while if nothing changes, not at once:

- Merged: the ticket is **Done**.
- An entry ahead of it changed the same lines (`merge_conflict`): the ticket
  goes back to Work with the conflict, as any landing that conflicts does.
- Checks failed (`failed_checks`): the first time, chuggy queues the same
  head again, since the failure may have been an entry ahead of it. The
  second time, the change goes back to Work as **Merge queue checks failed**,
  and the agent is told the base branch's commit to bring in and the commit
  the queue built, so it merges the base in before it fixes the change. Once
  the rework holds that base, `CHUG_CHANGE_BASE` in its checks and review is
  that base, so a check that reads it sees only the ticket's own change. A
  ticket is sent back this way at most twice by default; after that it holds
  as **Proposal merges exhausted**.
- Checks never reported (`checks_timed_out`): queued again once; the second
  time it holds as **Merge queue checks timed out again**. A rework cannot
  fix a check that never reports, which is what a missing `merge_group`
  trigger looks like.
- A person took it off the queue (`manual`), or any other reason: chuggy
  never puts it back over them. It holds as **Removed from merge queue**, and
  once escalated, **Needs you** names GitHub's reason and who removed it,
  such as "Queue removal: manual by `<login>`". **Resume** runs the landing
  again, which puts the pull request back on the queue.

A landing that escalates, or stops because its project is closing, takes its
pull request off the queue first, because a queued pull request merges with
nobody asking. A ticket cannot be revoked while it is landing: to stop one
whose pull request is queued, take the pull request off the queue on GitHub;
the ticket then escalates, and can be revoked. While a pull request is
queued, GitHub refuses pushes to its branch; take it off the queue to change
it.

For a coding agent, `read_ticket_landings` answers an `AwaitingMerge`
landing's `wait.reason` as `Blocked` until GitHub accepts it onto the queue,
and `Queued` while it waits there. An escalated landing (`state`
`Unavailable`) carries the `hold` it escalated from where one is recorded;
where that hold is the queue removing the pull request and the removal is
recorded, `hold.removal` gives GitHub's word for it — `manual`,
`failed_checks` or `checks_timed_out` — as `reason`, and, where GitHub names
one, the login that removed it as `actor`.
