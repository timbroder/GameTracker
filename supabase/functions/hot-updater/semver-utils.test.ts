import { assertEquals } from "jsr:@std/assert";
import { filterCompatibleAppVersions } from "./semver-utils.ts";

Deno.test("filterCompatibleAppVersions", async (t) => {
  await t.step("returns matching versions for exact match", () => {
    const result = filterCompatibleAppVersions(["1.0.0", "2.0.0"], "1.0.0");
    assertEquals(result, ["1.0.0"]);
  });

  await t.step("returns matching versions for semver range", () => {
    const result = filterCompatibleAppVersions(
      ["^1.0.0", "^2.0.0", "^3.0.0"],
      "2.5.0"
    );
    assertEquals(result, ["^2.0.0"]);
  });

  await t.step("returns multiple matching versions sorted descending", () => {
    const result = filterCompatibleAppVersions(
      [">=1.0.0", ">=2.0.0", ">=3.0.0"],
      "3.0.0"
    );
    // All >= ranges match 3.0.0, sorted descending by localeCompare
    assertEquals(result, [">=3.0.0", ">=2.0.0", ">=1.0.0"]);
  });

  await t.step("returns empty array when no versions match", () => {
    const result = filterCompatibleAppVersions(["^2.0.0", "^3.0.0"], "1.0.0");
    assertEquals(result, []);
  });

  await t.step("handles tilde ranges", () => {
    const result = filterCompatibleAppVersions(
      ["~1.2.0", "~1.3.0", "~2.0.0"],
      "1.2.5"
    );
    assertEquals(result, ["~1.2.0"]);
  });

  await t.step("handles x-range wildcards", () => {
    const result = filterCompatibleAppVersions(["1.x", "2.x"], "1.5.0");
    assertEquals(result, ["1.x"]);
  });

  await t.step("handles hyphen ranges", () => {
    const result = filterCompatibleAppVersions(
      ["1.0.0 - 2.0.0", "3.0.0 - 4.0.0"],
      "1.5.0"
    );
    assertEquals(result, ["1.0.0 - 2.0.0"]);
  });

  await t.step("coerces partial versions", () => {
    const result = filterCompatibleAppVersions(["^1.0.0"], "1");
    assertEquals(result, ["^1.0.0"]);
  });

  await t.step("returns empty for invalid current version", () => {
    const result = filterCompatibleAppVersions(["^1.0.0"], "invalid");
    assertEquals(result, []);
  });

  await t.step("handles empty target list", () => {
    const result = filterCompatibleAppVersions([], "1.0.0");
    assertEquals(result, []);
  });
});
