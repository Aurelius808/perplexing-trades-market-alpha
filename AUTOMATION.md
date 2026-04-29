# Automation Contract

This file describes the contract that scheduled Morning / Midday / Evening / Weekend
agents must honor when updating the public site. It exists so that future agents can
target stable markers and avoid asking the user how to publish.

## Marker scheme

`index.html` exposes the following run-owned zones. Agents replace ONLY content
between the matching `START` and `END` markers. Anything outside markers
(design shell, masthead, voice-briefing module, footer wrapper, CSS/JS includes)
must remain untouched without an explicit code review.

| Marker pair | Owns |
|---|---|
| `PT_TITLE_START` / `PT_TITLE_END` | the `<title>` text |
| `PT_SESSBADGE_START` / `PT_SESSBADGE_END` | session chip in the topbar |
| `PT_TICKER_START` / `PT_TICKER_END` | ticker tape items |
| `PT_VOICELABEL_START` / `PT_VOICELABEL_END` | voice-briefing meta line |
| `PT_VOICETITLE_START` / `PT_VOICETITLE_END` | voice-briefing module headline |
| `PT_VOICECAPTION_START` / `PT_VOICECAPTION_END` | one-line caption / framing under the voice title |
| `PT_VOICESRC_START` / `PT_VOICESRC_END` | MP3 path used by the Direct MP3 fallback link |
| `PT_VOICESTATUS_START` / `PT_VOICESTATUS_END` | default status string before first play |
| `PT_RUN_START` / `PT_RUN_END` | hero + numbered sections (Key Numbers, Regime Card, Plays, Watch/Avoid, Catalyst Map, Desk Note, Sources) |
| `PT_SOURCES_START` / `PT_SOURCES_END` | the citations `<ol>` |
| `PT_FOOTERBAR_START` / `PT_FOOTERBAR_END` | session line in the footer bar |

`archive.html` exposes:

| Marker pair | Owns |
|---|---|
| `PT_ARCHIVE_ROWS_START` / `PT_ARCHIVE_ROWS_END` | dated `.arc-day` blocks (newest at the top) |

## Voice briefing rule

The voice-briefing module shell (markup, CSS classes, `app.js` controller) is
part of the design shell. The five `PT_VOICE*` markers above are the only
fields a run is allowed to change. Treat them as one atomic group — when a
fresh recording exists, all five must be updated together so the asset, label,
and copy stay in lockstep.

When a fresh recording IS published for the current session:

- Drop a versioned MP3 into `assets/` (e.g. `lilith-apr29-setup-brief.mp3`) so
  cached copies of the previous file don't shadow the new one.
- Update both the `<audio id="lilith-audio">` `src` attribute (outside markers,
  fixed string) **and** `PT_VOICESRC_*` to point at the new file. Keep the two
  in sync. Verify with `grep` that no stale MP3 path remains as the live source.
- `PT_VOICELABEL_*` should read as the current session label (e.g.
  "Voice Briefing · Session #022 · Apr 29 Setup Brief · …"), not "Prior".
- `PT_VOICETITLE_*` and `PT_VOICECAPTION_*` should reflect the substance of the
  recorded read for this session.
- `PT_VOICESTATUS_*` is the pre-play one-liner; keep it specific to the session.

When a fresh recording does NOT exist for the current session:

- Leave `PT_VOICESRC_*` and the `<audio>` `src` pointing at the most recent
  recorded asset.
- Update only `PT_VOICELABEL_*` to "Prior Voice Briefing · Session #N · DATE",
  and adjust `PT_VOICETITLE_*` / `PT_VOICECAPTION_*` / `PT_VOICESTATUS_*` so
  they do not imply a new recording exists.
- Never change the player markup or the controller in `app.js`.

## Per-run checklist for scheduled agents

1. Read the run payload (e.g. `morning_alpha_payload_<DATE>.json`).
2. Refuse to publish if the payload is empty or obviously malformed.
3. Update each marked zone:
   - `PT_TITLE`, `PT_SESSBADGE`, `PT_FOOTERBAR` — session label + date.
   - `PT_TICKER` — quotes + earnings + top gainers/losers from the payload.
   - `PT_RUN` — hero narrative + Key Numbers + Regime + Plays + Watch + Catalysts + Desk note. Use only the data in the payload; do not invent prices.
   - `PT_SOURCES` — public URLs from the payload's source list. Link text must match the destination.
   - `PT_VOICELABEL` — relabel as "Prior Voice Briefing" if no fresh audio.
4. Append a row to `archive.html` inside `PT_ARCHIVE_ROWS_*`, newest at the top.
5. Run `bash scripts/public-audit.sh`. If it fails, fix and re-run before push.
6. Commit with a descriptive message and push to `main`. GitHub Actions
   (`.github/workflows/pages.yml`) handles the deploy.

## Privacy floor (non-negotiable)

The exact forbidden filenames and content phrases are codified in
`scripts/public-audit.sh` — that script is the source of truth. At a high level
the public site must never contain personal-portfolio language, broker or order
details, personal calendar entries, private dashboard URLs, environment files,
keys, or any private-side asset.

`scripts/public-audit.sh` enforces these and is wired into `deploy.sh` and the
GitHub Actions Pages build. Trust the audit, do not bypass it. If you need to
know the precise pattern list, read the audit script directly.

## Escalation rule

Only escalate to a human when:

- The payload is missing or malformed beyond conservative recovery.
- A required marker is missing from the template (file it as a fix, do not invent layout).
- The privacy audit fails on content that is genuinely required for the run.

In all other cases, publish the run, log it, and exit.
