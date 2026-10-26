---
title: A repository's settings
description: Letting jobs change GitHub workflow files, and protecting the default branch.
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
