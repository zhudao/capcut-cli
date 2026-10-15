# Fixture: JianYing 9.0.0 on Windows

A real project folder from 剪映专业版 (JianYing) **9.0.0 on Windows 10**, captured
with `capcut fixture`, after the app had opened it. Only timeline JSON is
committed — no media; home paths, emails and device identifiers are redacted.

```
platform.app_version       9.0.0
platform.app_source        lv
tracks                     2 text segments
canonical (diagnose)       draft_info.json
```

## What the capture shows

Captured **after the app opened a draft that a tool had written**:

| File | State | Notes |
|---|---|---|
| `draft_info.json` | plaintext JSON, 3485 bytes | the primary; still the bytes the CLI wrote before the open — the app did not rewrite it |
| `draft_content.json` | encrypted blob | rewritten by the app on close |
| `template-2.tmp` | encrypted blob | rewritten by the app on close |
| `draft_meta_info.json` | encrypted blob | rewritten on close |
| `Timelines/project.json`, `Timelines/469574b7-…/draft_content.json` | layout + encrypted blob | the nested layout the app materialised |

Two facts this bundle pins down on this build:

1. **A plaintext tool-written primary is accepted.** The draft was written by
   `capcut-cli` (a `text` segment added, then a text template applied), closed,
   and opened in the app, which showed the added segment and allowed editing it.
   The app then encrypted the *legacy mirrors* but left `draft_info.json`
   plaintext — so the CLI still reads the project through its canonical file and
   never writes into the encrypted mirrors.
2. **`target_timerange.start` is not guaranteed.** The `smoke-test` segment
   carries `{"duration":3000000}` with no `start` and no `speed`, while the
   `smoke-cta-default` segment carries both. The app renders the first one
   normally; `capcut segments -H` printed `NaN:00NaN` / `undefinedx` for it
   before the read-side fix in the same series.

## Scope of the claim

This is *one machine*. It establishes the storage shape and that this build
opened a tool-written draft; it is not a claim that every JianYing 9.0.0 build
does. `docs/version-support.md` keeps the write guard conservative on the
strength of that — see its JianYing 9.0.0 (Windows) row.

An app-authored project on the same build looks different: a plaintext
`draft_content.json` and **no** `draft_info.json` / `template-2.tmp` at all. That
shape is not committed here (its content is the owner's), but it is why the
"primary file name is `draft_info.json` since 6.0" note in
`docs/version-support.md` does not hold for this build.
