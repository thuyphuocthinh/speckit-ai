# Spec: v0.4b — Translate All Templates to English

## Overview

All template files under `templates/` are currently written in Vietnamese. Since this CLI will be published to npm for global use, all template content must be rewritten in English.

## Feature Type
- [x] Bugfix — translate all ~31 template files in `templates/`

## Acceptance Criteria

- [ ] All files in `templates/_core/` are in English
- [ ] All files in `templates/_skills/` are in English
- [ ] All files in `templates/nestjs/`, `nextjs/`, `vue/`, `react/`, `node-express/`, `generic/` are in English
- [ ] No Vietnamese text remains in any template file
- [ ] `npm test` passes 100%
- [ ] Placeholders `{{FRAMEWORK}}`, `{{PACKAGE_MANAGER}}` are preserved

## Out of Scope

- Do not translate files in `specs/`, `docs/` of the CLI project itself
- Do not change source code logic
