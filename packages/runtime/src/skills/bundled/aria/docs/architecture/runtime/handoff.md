# Handoff

This page defines the durable submission boundary between local or runtime-originated work and `Projects Control` tracked work.

## Role

Handoff accepts idempotent submissions and can materialize them into:

- thread records
- job records
- queued dispatch records

## Requirements

- idempotency key
- project-scoped association
- durable linkage from handoff to created dispatch
- safe re-read and re-processing of pending submissions
- explicit target thread type when the source node and execution target differ

## Boundary

Handoff exists so Aria-managed intent and project execution ownership stay explicit.

- `Aria Agent` can decide to create work
- `Projects Control` owns the tracked project thread and environment attachment
- execution happens through `Aria Agent` on the selected local or remote node
- source kind records where the handoff came from; target thread type records
  where the materialized project work should run

## Current Surfaces

The current repo exposes handoff through:

- `aria projects handoff-submit`
- `aria projects handoff-process`
- `projects.handoff.submit`
- `projects.handoff.list`
- `projects.handoff.materialize`

Gateway handoff procedures use the same durable store and materialization
service as the CLI path.
