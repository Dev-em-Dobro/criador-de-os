---
name: git-push-credential-warning
description: Pushes in this repo print "git: 'credential-manager-core' is not a git command" — benign noise, not a push failure
metadata:
  type: project
---

Every `git push` in this repo prints `git: 'credential-manager-core' is not a git command. See 'git --help'.` before the transfer lines. The push still succeeds (exit 0, refs updated).

**Why:** The machine's git config points at a credential helper binary (`credential-manager-core`) that isn't installed; git falls back to another auth path and completes the push anyway.

**How to apply:** Do NOT treat that line as a failed push or start "fixing" auth. Judge success by the exit code and the `old..new  branch -> branch` line, and confirm with `git ls-remote origin refs/heads/<branch>`. Only escalate if the exit code is non-zero.
