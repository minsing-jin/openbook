# Tmux Project Folder Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure tmux so each window shows the active project's folder name and the status line keeps the session context visible.

**Architecture:** Use tmux-native format strings instead of helper scripts. Window names are driven by `automatic-rename-format`, and the left status area shows the session name plus the active pane's current folder.

**Tech Stack:** tmux 3.6a, `~/.tmux.conf`

---

### Task 1: Update the tmux naming rules

**Files:**
- Modify: `/Users/jinminseong/.tmux.conf`

**Step 1: Prepare a safe editable copy**

Run: `cp /Users/jinminseong/.tmux.conf /Users/jinminseong/Desktop/openbook/.tmux.conf.codex`
Expected: workspace copy exists for patching

**Step 2: Apply the naming configuration**

Set:

```tmux
set -g automatic-rename on
set -g automatic-rename-format "#{?pane_current_path,#{b:pane_current_path},#{pane_current_command}}"
set -g allow-rename off
set -g status-left-length 40
set -g status-left "#[bold]#S#[default] #{?pane_current_path,| #{b:pane_current_path},}"
setw -g window-status-format "#I:#W"
setw -g window-status-current-format "#[bold]#I:#W"
```

Expected: window names track the active pane's project folder, with command fallback when no path is available

### Task 2: Install and reload the config

**Files:**
- Modify: `/Users/jinminseong/.tmux.conf`

**Step 1: Replace the home config with the patched copy**

Run: `cp /Users/jinminseong/Desktop/openbook/.tmux.conf.codex /Users/jinminseong/.tmux.conf`
Expected: home config contains the new naming rules

**Step 2: Reload tmux**

Run: `tmux start-server`
Run: `tmux source-file /Users/jinminseong/.tmux.conf`
Expected: tmux accepts the updated config without errors

### Task 3: Verify the effective options

**Files:**
- Check: `/Users/jinminseong/.tmux.conf`

**Step 1: Inspect the loaded options**

Run: `tmux show-options -gw automatic-rename`
Run: `tmux show-options -gw automatic-rename-format`
Run: `tmux show-options -g status-left`
Expected:

- `automatic-rename on`
- `automatic-rename-format "#{?pane_current_path,#{b:pane_current_path},#{pane_current_command}}"`
- `status-left` contains `#S` and `#{b:pane_current_path}`

**Step 2: Spot-check the file content**

Run: `sed -n '1,80p' /Users/jinminseong/.tmux.conf`
Expected: the codex naming block matches the intended settings
