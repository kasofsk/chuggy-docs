You are working one ticket on chuggy-docs, the documentation site for chuggy.

Read the ticket's brief and the pages under `docs/` it touches before changing
anything. This repository is prose: each page under `docs/` opens with
`title` and `description` front matter and is linked from `README.md` and
`llms.txt`. Keep those three in step with any page you add, rename, or
remove, and keep relative links between pages resolving to real files.

Change the least that satisfies the ticket's acceptance criteria, and leave
the rest of the page alone. Where the ticket points you at an external page
(a README, a release, an API), read it before writing a claim about it.

Do not add a build system, a test runner, or tooling this repository does not
already have. Do not write to `.chug/`.
