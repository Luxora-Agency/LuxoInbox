# Messenger screenshot reference QA

final result: passed

The configurable compact template matches the reference geometry. This is not a claim of byte-identical pixels: private identity/photo substitutions, platform emoji and library icons are intentional differences.

## Evidence

- Source: `/var/folders/rz/k948hmxd2qs6835p9xxm15p40000gn/T/codex-clipboard-54f2c811-df5f-4497-85cc-d656bd2639ed.png`.
- Actual exported PNG: `/Users/brayancardozo/.codex/worktrees/luxoinbox-messenger-simulator/.codex/qa/artifacts/messenger-simulator-reference-299x508.png`.
- Native downloaded PNG: `/Users/brayancardozo/Downloads/messenger-simulation-1 (3).png`.
- Export/download SHA-256: `d1ae1fe598deb27f999e24def3f1189b56c29f620b986fdb84150cb12f85ec30`.
- Source and output: **299 × 508 pixels**. Export width 299 CSS pixels, native 1× density; no rescaling or device chrome. Height follows content rather than clipping at 508 pixels.
- State: five editable messages and one optional timestamp. Identity and number were fictional substitutions; the source portrait was not imported. Reference content exists only in local QA output, not shipped defaults.
- Comparison: source and actual PNG opened together in the same image-tool input. Focused inspection covered header rows 0–27, bubbles, timestamp and footer rows 473–507. The native images were readable, so separate stored source crops were unnecessary.

## Fidelity checks

| Surface | Result |
| --- | --- |
| Typography | Arial 12px, 16.4px outgoing line height; header 14px bold; reference line wrapping preserved. The exact source font/OS is unknown. |
| Layout | 4px gutter, 28px header, 203px outgoing bubbles, 30px incoming avatars, 8px message gaps. Final composer begins at row 473, matching source. |
| Colors | Solid `#0084FF` outgoing/toolbar, `#E5E6EB` incoming, `#F1F2F6` gutter/input. No gradient or app-theme bleed. |
| Images/icons | Editable local avatar upload retained. No flattened screenshot background. Remix icons approximate source vectors; personal portrait intentionally absent. |
| Copy | Reference-format composer `Aa`; custom timestamp optional. Fictional defaults remain. Simulation notice is conspicuous in the editor, outside the exported image. |

## Comparison history

1. Initial generic template differed substantially: 390px width, oversized chrome and exported notices. Replaced with the selected compact format.
2. First compact PNG was 299 × 505: accumulated vertical drift, oversized composer text/icons and extra GIF/sticker icons. Corrected line height, timestamp spacing, glyph sizing and input content.
3. Final native export is 299 × 508. Source/output comparison found no remaining actionable P0/P1/P2 mismatch.

## Functional checks and residuals

- Real download bytes match the captured export. Browser warning/error logs: empty.
- A fresh independent reviewer also compared source/output together and confirmed no P0/P1/P2 mismatch or production regression.
- Mobile viewport 390 × 844: document client width and scroll width both 390px.
- Twelve temporary component checks pass, including optional timestamp, editing/reorder, revocation, account switching and export races. Production Vite build and changed-file lint pass.
- **P3:** timestamp baseline is approximately 2px lower; source antialiasing/compression, emoji and closest library glyphs differ slightly.
- No production deployment, real Messenger operation or provider test was performed.

## Implementation checklist

- [x] Editable reference-shaped rendering, not a raster background.
- [x] Native full-height export and account authorization preserved.
- [x] Real PNG compared after visual fixes.
- [x] Private source data excluded from shipped defaults and this report.

## Fast authoring and inbox export extension

final result: passed

Fast authoring, native PNG/ZIP delivery and the actual narrow inbox header were verified.

- Manual authoring now starts empty, with optional examples, one composer, sender buttons, Enter add/save, Shift+Enter newline, optional timestamp and collapsed participant settings. Download includes pending text.
- Inbox screenshot action loads the entire authorized public snapshot, not just visible messages. Private notes, system events and deleted messages are excluded. Failed messages say “Not sent”; attachments use type labels rather than fetching media.
- Both flows use the unchanged 299px renderer. Measured overflow creates numbered PNGs in one ZIP, including oversized single messages without text truncation. Resource-limit errors download nothing.
- Twenty-eight temporary component/pipeline tests and twenty-six existing route/sidebar tests pass: keyboard/IME, draft preservation, same-row edit regression, manual limit, permissions and switch races, multi-page history, 150,000-character text, Unicode-preserving splitting and ZIP packaging.
- Isolated real Rails checks passed: 103 Enterprise and 96 Community assertions, including decoded deleted flags, filtered pages, cursor failures, snapshots, custom roles, hidden conversations, revocation and no record changes. Ruby syntax passed; RuboCop was unavailable in the disposable production bundle.
- Actual Vite production build passed: 5,177 modules in 26.75 seconds. New JS/Vue files lint clean; the touched existing header retains its two pre-existing untranslated bullet warnings.
- Browser manual checks passed: Enter add, sender changes, multiline text, pending draft download, same-row edit retention, save and reorder. Network failure showed a recoverable error; delayed-request revocation hid the action and produced no new file.
- Real short export: `.codex/qa/artifacts/inbox-one-click-example.png`, 299 × 287, includes all three public messages, `[Audio]` and `[Not sent]`.
- Real 65-message ZIP: `.codex/qa/artifacts/inbox-65-messages.zip`, four ordered PNGs, maximum height 7,690px, final message visible. SHA-256 `90970cee21baddd6a08bc5897e8f134859d131558e29387d4db059036a98b7a8` matches the native download.
- Real 150,000-character ZIP: `.codex/qa/artifacts/inbox-150000-characters.zip`, twelve ordered PNGs, 8,607,413 bytes; final text and closing message visible. SHA-256 `8c146abb2aebd49465fa4683f2499ebf3ac9079b8dcc479f83395aa9856ea0d4` matches the native download. ZIP integrity check passed.
- Browser warning/error logs were empty for the verified manual and standalone-button flows. The actual-header fixture uses a narrow, QA-only router proxy to break an existing alternate-entry BackButton import cycle; no production router code changed.
- A fresh independent source review confirmed no remaining actionable production finding after composer and deleted-message fixes. No commit, push, deployment or real-provider operation occurred.

### Actual inbox header follow-up

- The first text-labeled action caused a confirmed narrow-pane regression: at a 1280px viewport with a 320px conversation panel, identity width collapsed and the loading label overflowed.
- Fixed with a stable icon-only action, descriptive accessible label, tooltip and screen-reader loading status. No general header redesign.
- Final real-header checks passed in idle and loading states: identity width 88.031px, actions width 187.969px, header scroll width and rendered width both 320px. No overlap. Clicking the real header action downloaded the native PNG after three authorized API calls.
- Mobile viewport 390 × 844: document scroll width equals viewport width, header fits, manual composer/actions remain usable and downloading a pending draft succeeds without a separate Add step.
- The harness mounts actual Header, MoreActions, Resolve and screenshot components. Only nonvisual app-router access is routed to the synthetic QA router; no production data or provider operation is involved.
