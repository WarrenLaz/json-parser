# CI: README Auto-Update Workflow

File: `.github/workflows/01-building-blocks.yaml` (workflow name: **Update READMEs with Claude Code**)

This workflow keeps the `readmes/` directory in sync with the source code. It runs Claude Code on a remote VM and pushes any documentation changes back to `main`.

## Trigger

- Runs on `push` to `main`.
- `paths-ignore: readmes/**`: a push that *only* changes `readmes/` doesn't trigger it, so the bot's own commit doesn't cause a loop. The bot's commit message also contains `[skip ci]`.
- `concurrency: update-readmes` with `cancel-in-progress: false` means runs are queued rather than run in parallel.
- The job has a 30-minute timeout.

## What it does

1. Writes an SSH private key and the `known_hosts` entries from repository secrets into `~/.ssh` on the runner.
2. SSHes into the VM (`bash -l -s`, with `BatchMode=yes` and `StrictHostKeyChecking=yes`) and runs a script there that:
   - unsets `ANTHROPIC_API_KEY`, so Claude Code uses the VM user's logged-in account
   - adds common install locations to `PATH` (`~/.local/bin`, `~/.claude/local`, `~/.npm-global/bin`, `/usr/local/bin`), falls back to loading `nvm`, and fails with a hint if `claude` can't be found
   - hard-resets the VM's clone to `origin/<branch>` and runs `git clean -fd`, **discarding local changes** (use a clone dedicated to this job)
   - runs `claude -p "<prompt>" --allowedTools "Read,Glob,Grep,Edit,Write" --max-turns 40 < /dev/null`
   - stages **only** `$DOCS_DIR`. If anything changed, it commits as `Claude README Bot <readme-bot@users.noreply.github.com>` with the message `docs: update readmes for <short-sha> [skip ci]` and pushes to the branch.
   - resets and cleans the clone again

## Required configuration

Repository **secrets**:

| Secret | Purpose |
| --- | --- |
| `VM_SSH_KEY` | Private SSH key used to log in to the VM |
| `VM_KNOWN_HOSTS` | `known_hosts` line(s) for the VM (strict host key checking is on) |
| `VM_HOST` | VM hostname or IP |
| `VM_USER` | SSH user on the VM. This user must be logged in to Claude Code and able to push to the repo. |

Repository **variables**:

| Variable | Purpose |
| --- | --- |
| `VM_REPO_DIR` | Path to the repository clone on the VM |

## Environment variables passed to the VM

| Variable | Value |
| --- | --- |
| `REPO_DIR` | `vars.VM_REPO_DIR` |
| `BRANCH` | `github.ref_name` (always `main`) |
| `SOURCE_SHA` | `github.sha`, used in the commit message |
| `DOCS_DIR` | `readmes`, the folder Claude edits and that gets committed |

These values are sent over the SSH session's stdin using `printf %q` quoting.

## VM prerequisites

- Claude Code is installed and logged in for `VM_USER`.
- A clone of this repository exists at `VM_REPO_DIR`, with push access to `origin`.
