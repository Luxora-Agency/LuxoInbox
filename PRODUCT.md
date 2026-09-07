# LuxoInbox product context

## Register

product

## Users

Customer-support agents and account administrators use the dashboard to manage conversations across channels. Super administrators manage account access and configuration.

## Product Purpose

LuxoInbox is a self-hosted, Chatwoot-based support platform. Its dashboard prioritizes conversation work, team collaboration and account-scoped tools. The Messenger screenshot tool supports fast manual fictional conversations and one-click, read-only exports of authorized inbox conversations. Public history is exported; private notes and system events are excluded. Media uses explicit labels, and long conversations download as ordered PNG files in one ZIP. It never sends messages or modifies conversation records. Simulation disclosure remains visible in the editor, outside the exported reference-matching image.

## Messenger template library

The account-scoped Messenger template API stores reusable fictional scripts, not contact records or real conversation history. It is gated by the default-off Messenger simulator feature: administrators manage scripts, while authorized account agents can read them. Definitions accept only literal `{{contact.name}}` and `{{contact.phone}}` variables and a typed contact-avatar choice; personalization is not stored in the library. A conversation-authorized context endpoint supplies template export data without reading message history and revalidates the selected template and contact snapshot before file delivery.

Administrators manage saved scripts from the simulator page using the same composer and preview as manual simulations; draft replacement and deletion require confirmation. Name and phone chips insert literal variables at the cursor; sample values appear only in previews and sample downloads, never in saved definitions.

## Brand Personality

Professional, clear and task-oriented. Preserve the existing Orbis identity and shared dashboard components; this feature is not a redesign.

## Anti-references

Avoid marketing-page treatments inside the dashboard, invented customer claims, misleading claims of real provider activity and controls that look like real provider actions.

## Design Principles

- Keep account boundaries and permissions explicit.
- Separate simulations from real customer records and messaging.
- Prefer familiar controls with a visible, accurate preview.
- Reuse existing components, tokens and English-source localization.

## Accessibility & Inclusion

Use labeled inputs, keyboard-accessible controls, visible focus states and readable contrast. Reordering must not require dragging. Respect reduced motion. No formal accessibility certification is claimed.

## Sources

Existing context: README.md, AGENTS.md, tailwind.config.js and dashboard components-next. Simulator scope: user-approved implementation brief.
