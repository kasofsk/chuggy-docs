---
title: Jobs on the runner's machine
description: A job that asks for capabilities in place of an image, and how it runs when the runner meets it on its own machine.
---

# Jobs on the runner's machine

A workload in a configuration can name capabilities in place of an image:

```json
"build": {
  "runner": "Commands",
  "commands": ["bazel test //..."],
  "executionRequirement": {
    "mode": "Capability",
    "operatingSystem": "Linux",
    "architecture": "Amd64",
    "capabilities": ["Tool:Bazel"]
  }
}
```

A workload names `image` or `executionRequirement`, never both. An agent
workload's own agent, `Agent:Claude` or `Agent:Codex`, is added to the
capabilities it names. The job is offered only to a runner on that platform
that declared every one of those capabilities when it was registered.

A runner registered with `--host` runs the job on its own machine, as below.
Any other runner runs it in the first image its `runner.json` lists under
`images` with every capability the job names, in a container like any other
([A job's container](container.md)), and refuses it if none does.

The [chuggy-linux README](https://github.com/kasofsk/chuggy-linux#the-image-a-job-runs-in)
covers both from the runner's side. chuggy-darwin does the same on a Mac for a
job that names the Mac's own platform, `"operatingSystem": "MacOS"`, as its
[README](https://github.com/kasofsk/chuggy-darwin#work-that-pins-no-image)
describes.

## What differs on a Linux runner's machine

| | In a container | On the runner's machine |
| --- | --- | --- |
| User | uid 1000 | The user the runner runs as |
| Checkout | `/workspace/repository` | `workspace/repository` in a directory of the job's own under `~/.local/state/chuggy-linux/jobs/` |
| `HOME` and `TMPDIR` | The image's | Directories of the job's own, removed with it |
| Programs | The image's | The machine's, on the runner service's `PATH` |
| CPU and memory | Limited to the stage's size | Checked against the machine when the runner takes the job, and not limited |
| Isolation | A container, its capabilities dropped | None |
| `engineSocket` and `volumes` | As the runner's owner set them | Not applied; the job reaches what the runner's user can |

Setup and check lines still run at the root of the checkout, so a line that
needs the checkout's path reads it from `$PWD`. The job starts with the runner
service's environment and the runner's `environment`, and its setup and check
lines get the variables [A job's container](container.md#environment) lists.
Reading the project's other repositories needs the machine's git to be 2.31 or
later.

`git` and the agent's command, such as `claude`, must be on the `PATH` of the
runner's systemd user service, which is not the `PATH` a login shell has.

A job on the machine can read and change whatever the runner's user can,
including the other jobs there. The runner stops it, with every process it
started, at the sooner of the deadline chuggy sets for it and
`timeoutSecsMax`. Its directory is removed when it ends.
