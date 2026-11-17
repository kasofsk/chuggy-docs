---
title: A project's thread settings
description: What a project's thread settings are, where they are set, their length bound, and where the North Star is handed.
---

# A project's thread settings

A project's thread settings are its North Star, its standing rules, and its
[threads](index.md)' model and effort.

## Where they are set

Members who may manage them set them in the project's Settings → Threads, or by
asking their own coding agent, whose `update_lead_settings` writes them (see
[Tools for your coding agent](tools.md)).

- Each text, the North Star and the standing rules, is at least one character
  and at most 65,536 (`selectorSettingsTextCharsMax`).
- A project with no North Star has none. A project with no standing rules gets
  chuggy's default.

## Where the North Star goes

The North Star is handed to every thread in the project and to the brief of
every agent-run job.
