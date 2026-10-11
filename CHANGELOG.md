# Changelog

All notable changes to `speckit-ai`. Versions before 2.2.0 are described by their git tags and commit messages.

After updating, run `npx speckit-ai upgrade` (add `--apply` to write) to refresh `specs/_workflow.md` and the skills in `.agents/skills/`. Your own `.agents/AGENTS.md` is never changed by the tool: `upgrade` only lists the lines you may want to add.

## 2.3.0 - 2026-10-11

### Added
- `speckit-ai done [<name>] --check`: runs exactly the gates of `done` and reports what is missing, without writing or moving anything. Exit code `0` when ready, `1` otherwise.
- LLM settings (environment or `.env`): `SPECKIT_LLM_TIMEOUT_MS` (default `60000`), `SPECKIT_GEMINI_MODEL`, `SPECKIT_ANTHROPIC_MODEL`, `SPECKIT_OPENAI_MODEL`.
- `CHANGELOG.md`, and a CI workflow that runs the tests on Node 18, 20 and 22 for every push and pull request, plus a smoke test of the packed tarball. The publish workflow now stops when the tag does not match the version in `package.json`.

### Changed
- Calls to the LLM (`--mode=auto`, `handoff`, `review`) now have a timeout and are retried (3 attempts in total, 1 s then 2 s apart) on temporary errors: network errors, timeouts, HTTP 429, 500, 502, 503, 504. Other errors stop at once with the provider's message; an empty or blocked answer is reported with its reason instead of a `TypeError`.
- `review` sends the spec to the model with each unchanged acceptance criterion reduced to its heading when the work changes an existing feature, so the model sees what changed.
- The default Claude model is now `claude-sonnet-5-5` (the old default may have been retired). The Gemini and OpenAI defaults are unchanged; set the environment variable of a provider if its model was retired.
- The Gemini API key is sent in the `x-goog-api-key` header instead of the URL.
- `--mode=auto` checks that the answer has a non-empty `technology` and `projectOverview` before writing anything.

### Fixed
- When several API keys were set, the key of one provider could be sent to another (for example, only `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` set sent the OpenAI key to Claude). The provider is now chosen first (Gemini, then Claude, then OpenAI) and only its own key is used.
- `specs/_workflow.md` no longer contradicts itself about the `## Changelog` of a spec: the single `hotfix` line added when fixing a spec directly is the only hand-written line.

## 2.2.0 - 2026-10-11

### Added
- `done` saves the `### Lessons Learned` section of `review.md` to `specs/features/<slug>/lessons.md`, and `start --affects` prints the path of that file for every affected feature that has one.
- `done` requires `review.md` to mention every new or changed `AC-n` of the targets (all of them for a new feature; for a change to an existing feature, those that are new or differ from the current spec). Bypass with `--force` (recorded in the Changelog).

### Changed
- `review` never passes on changes it has not fully seen: a long diff is split by file and every part must pass; a single file over 15,000 characters stops the command with exit code `1`; new untracked files are included; lock files are not sent; a malformed or contradictory answer of the model counts as failed.
- `handoff` uses the same diff as `review` and warns when the diff is truncated.
- The `AGENTS.md` template splits its reading order into files to read always and files to read when the task needs them.

### Fixed
- The summary in a Changelog line written by `done` no longer loses the words inside backticks.
