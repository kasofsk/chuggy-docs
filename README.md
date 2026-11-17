# chuggy docs

How to use [chuggy](https://chug.gy): the words, the first steps, a ticket's
phases and brief, the epics that group tickets, the runners that do the work, the tools a coding agent gets,
the configuration a repository carries, and what a job runs in. Rendered at
<https://chug.gy/docs>; `llms.txt` is the same list for a language model.

- [Introduction](docs/index.md)
- [Getting started](docs/getting-started.md)
- [A ticket](docs/tickets.md)
- [Epics](docs/epics.md)
- [A project's thread settings](docs/thread-settings.md)
- [Runners](docs/runners.md)
- [Running a ticket dispatcher from a thread](docs/dispatcher-thread.md)
- [Tools for your coding agent](docs/tools.md)
- [Configuration](docs/configuration.md)
- [Jobs](docs/jobs/index.md)
  - [A job's container](docs/jobs/container.md)
  - [Jobs on the runner's machine](docs/jobs/host.md)
  - [The project's image](docs/jobs/image.md)
  - [Docker in a job](docs/jobs/docker.md)
  - [Build caches](docs/jobs/build-caches.md)
  - [Sizing a stage](docs/jobs/sizing.md)
- [A repository's settings](docs/repository.md)

Each page opens with its title and a one-line description in front matter.
Links between pages are relative paths to the files, which read the same on
GitHub and on the site.

## Claude Code plugin

A Claude Code plugin teaches an agent to set chuggy up and to file a ticket:

```sh
claude plugin marketplace add https://github.com/kasofsk/chuggy-docs.git --sparse .claude-plugin plugins
claude plugin install chuggy@chuggy
```
