---
title: Sizing a stage
description: How a configuration asks for the CPUs and memory each job runs with, in version 2 and version 1.
---

# Sizing a stage

Each job runs with 2 CPUs and 4096 MiB of memory unless its configuration asks
for something else. The size is the container's CPU and memory limit
([A job's container](container.md#size-and-time)). `cpus` is a whole number
from 1 to 64, and `memoryMib` a whole number of MiB from 512 to 262144. Either
may be left out, and a field left out keeps its default.

## Version 2

A version 2 configuration, the format chuggy writes for a new repository, sizes
each workload with its own `resources`. Every job that runs the workload, as
the work or as an evaluator in any plan's stage, gets that size:

```json
"workloads": {
  "checks": {
    "runner": "Commands",
    "commands": ["cargo test --workspace"],
    "resources": { "cpus": 8, "memoryMib": 16384 }
  }
}
```

A version 2 configuration has no other place for a size. A `resources` block
at its top level is kept and ignored.

## Version 1

A version 1 configuration sizes jobs at its top level. `ticketDefault` applies
to every job, and an entry of `taskKindDefaults` replaces it for the work
(`Work`) or for one evaluation stage (`Evaluation:1` for the first entry of
`evaluations`, and so on), field by field:

```json
"resources": {
  "ticketDefault": { "cpus": 2, "memoryMib": 4096 },
  "taskKindDefaults": {
    "Evaluation:1": { "cpus": 8, "memoryMib": 16384 }
  }
}
```

In a configuration with no `evaluations` list, the key for its evaluation is
`Evaluation`. A key naming no stage the configuration runs is accepted and
sizes nothing: `Evaluation` beside an `evaluations` list, `Evaluation:1` and
the rest without one, and an `Evaluation:N` past the list's last entry.

## Limits

A ticket keeps the sizes it was released with, so a change to a configuration
sizes the tickets released after chuggy has imported it.

A runner takes a job only if its whole machine, or on a Mac its Colima VM, has
the CPUs and memory the job asks for, counting no other job. One whose machine
is smaller refuses the job, which blocks the job and escalates its ticket, with
the runner's reason shown on the job. Ask for no more than the smallest runner
of the project has.

A chuggy-linux runner also keeps a memory budget: its engine's memory less the
reserve its file's `memoryFreeGibMin` keeps for what the engine and its machine
use outside every container, as its
[configuration](https://github.com/kasofsk/chuggy-linux#configure) says.
Against it the runner counts every container running on that engine, whichever
runner started it. Each poll tells chuggy the room that count leaves and the
runner's ceiling, the budget less what its file's `memoryReservedGib` keeps for
what always runs beside jobs, and chuggy offers the runner only jobs that fit
both; one user's runners sharing an engine take them one at a time, so no two
are given the same room. A job no runner of the project has room for waits in
chuggy, and smaller jobs released after it may run first; it runs once a runner
has the room. A job asking more than every runner's ceiling is blocked at once,
and its ticket escalates as Too large for every runner: raise a runner's
ceiling, by its budget or its `memoryReservedGib`, or ask for less in the
tickets released after.

A job a runner took and then found no room for, as happens when two users'
runners on one engine are given jobs together or what else the engine runs
grows meanwhile, waits on that runner. It starts once it has
room and no job that began waiting before it on that engine still waits; one
whose deadline comes too near for it to start fails as a job lost on its runner,
which chuggy resumes by itself up to its retry limit and after that leaves to
you.

A job on the runner's own machine ([Jobs on the runner's machine](host.md)) is
checked against that machine, and then runs with no limit.
