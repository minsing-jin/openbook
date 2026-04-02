# Tmux Project Folder Display Design

**Date:** 2026-03-16

## Goal

Make each tmux window show the active project's folder name so the current task is visible at a glance, while keeping the session name visible in the status line.

## Chosen Approach

Use tmux's built-in automatic window renaming with `automatic-rename-format` set to the basename of `pane_current_path`. Keep `allow-rename` disabled so shell title changes do not override the naming rule. Update `status-left` to display the current session name and the active pane's project folder together.

## Alternatives Considered

1. Manual window renaming only

This preserves explicit labels but requires constant user maintenance and does not reliably reflect the current task.

2. External shell script for naming

This would work, but it adds moving parts and is unnecessary because tmux already exposes the current pane path and basename formatting.

## Verification

Reload `~/.tmux.conf` with `tmux source-file ~/.tmux.conf`, then confirm:

- `automatic-rename` is `on`
- `automatic-rename-format` resolves from `pane_current_path`
- `status-left` includes both `#S` and the basename of `pane_current_path`
