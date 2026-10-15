import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnCli } from "./helpers/spawn-cli.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures", "jianying-9-0-0-windows");

/**
 * A real JianYing 9.0.0 (Windows) project that the app opened and closed, so
 * the app encrypted `draft_content.json`, `template-2.tmp` and
 * `draft_meta_info.json` in place while leaving the primary `draft_info.json`
 * plaintext. See the fixture README for the full capture.
 *
 * What these tests guard: the project stays *readable* through its plaintext
 * primary, the version markers are read off that primary, and the write guard
 * verdict for this version does not change silently.
 */
describe("JianYing 9.0.0 (Windows): encrypted legacy mirrors", () => {
  it("selects the plaintext draft_info.json as canonical", () => {
    const r = spawnCli(["diagnose", FIXTURE]);
    assert.equal(r.status, 0, `stderr: ${r.stderr}`);
    assert.equal(r.json.canonical, "draft_info.json");
    assert.equal(r.json.version, "9.0.0");
    assert.equal(r.json.diverged, false);
  });

  it("reports the app-encrypted mirrors instead of failing on them", () => {
    const r = spawnCli(["diagnose", FIXTURE]);
    const byName = new Map(r.json.candidates.map((c) => [c.file, c]));
    assert.equal(byName.get("draft_info.json").parseable_timeline, true);
    for (const name of ["draft_content.json", "template-2.tmp", "draft_meta_info.json"]) {
      const candidate = byName.get(name);
      assert.ok(candidate?.exists, `${name} should be reported as present`);
      assert.equal(candidate.parseable_timeline, false, `${name} is an encrypted blob, not a timeline`);
    }
    // The readable primary still carries the timeline.
    assert.equal(byName.get("draft_info.json").tracks, 1);
  });

  it("reads the version markers from the primary", () => {
    const r = spawnCli(["version", FIXTURE]);
    assert.equal(r.status, 0, `stderr: ${r.stderr}`);
    assert.equal(r.json.app, "JianYing");
    assert.equal(r.json.app_source, "lv");
    assert.equal(r.json.app_version, "9.0.0");
  });

  it("keeps the conservative write guard for this version", () => {
    const r = spawnCli(["version", FIXTURE]);
    // Committing a fixture is evidence for the storage shape, not a licence to
    // write: a second build still has to confirm the round-trip.
    assert.equal(r.json.support.status, "known-broken");
    assert.equal(r.json.support.write_guard, "refuse");
    assert.equal(r.json.support.beyond_known_range, true);
  });
});
