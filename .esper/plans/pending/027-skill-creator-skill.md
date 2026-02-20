---
id: 027
title: Skill creator skill
status: pending
type: feature
priority: 3
phase: phase-2
branch: feature/phase-2
created: 2026-02-19
---

# Skill creator skill

## Context
A built-in meta-skill that helps users create new skills. When the user asks SA to create a skill, the agent activates this skill and follows its instructions to scaffold a new SKILL.md with proper frontmatter, directory structure, and optional scripts/references.

This is itself a skill — it lives in `src/skills/bundled/skill-creator/SKILL.md`.

## Approach
1. Create `src/skills/bundled/skill-creator/SKILL.md`:
   - Frontmatter: `name: skill-creator`, `description: Create new agent skills. Use when the user wants to build, scaffold, or define a new skill.`
   - Instructions guide the agent through:
     1. Ask the user what the skill should do
     2. Generate a kebab-case name from the description
     3. Write the SKILL.md with proper frontmatter (name, description)
     4. Create optional `scripts/`, `references/`, `assets/` directories as needed
     5. Validate the skill using the agentskills.io naming rules
     6. Offer to install it to `~/.sa/skills/` or the current workspace
2. Create `src/skills/bundled/` directory for all bundled skills
3. Update `src/skills/loader.ts` to also scan `src/skills/bundled/` as a built-in skill source
4. The skill-creator skill uses existing tools (Write, Bash) — no new tools needed

## Files to change
- `src/skills/bundled/skill-creator/SKILL.md` (create — the skill creator skill itself)
- `src/skills/loader.ts` (modify — add bundled skills directory to scan paths)

## Verification
- Run: Start Engine, chat "create a skill that formats JSON files", verify SKILL.md is generated
- Expected: Agent follows skill-creator instructions, writes a valid SKILL.md to `~/.sa/skills/`
- Edge cases: Skill name collision with existing skill, invalid characters in name
