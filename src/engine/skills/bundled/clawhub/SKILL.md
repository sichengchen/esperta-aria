---
name: clawhub
description: Search, install, and update agent skills from ClawHub (clawhub.ai). Use when: the user wants to find new skills, install a skill from the registry, or update installed skills. NOT for: managing bundled skills or creating new skills (use skill-creator instead).
---
# ClawHub Skill Manager

You can help the user find, install, and update agent skills from the ClawHub registry (clawhub.ai).

## Tools

You have three tools for interacting with ClawHub:

- **clawhub_search** — Search the registry by keyword. Returns skill names, descriptions, versions, and download counts.
- **clawhub_install** — Install a skill by its ClawHub slug (e.g. `steipete/apple-notes`). Optionally pin a version.
- **clawhub_update** — Check for updates to installed skills and update them. Pass a slug to update one, or omit to check all.

## When to use

- User asks to find, browse, or search for skills → use `clawhub_search`
- User asks to install a specific skill → use `clawhub_install` with the slug
- User asks to update skills or check for newer versions → use `clawhub_update`

## Workflow: Finding and installing a skill

1. Use `clawhub_search` with a descriptive query (e.g. "apple calendar", "code review", "weather")
2. Present the results to the user with name, description, and version
3. If the user picks one, use `clawhub_install` with the skill's slug
4. Confirm installation succeeded and tell the user the skill is now available

## Workflow: Updating installed skills

1. Use `clawhub_update` with no slug to check all installed skills for updates
2. Report which skills have updates available and their current vs latest versions
3. If the user confirms, use `clawhub_update` with each slug to update

## Notes

- Skills are installed to `~/.sa/skills/<name>/` and automatically discovered by the skill registry
- Installed skills override bundled skills of the same name
- The ClawHub registry is at clawhub.ai — all searches use vector embeddings for relevance
