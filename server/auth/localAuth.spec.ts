import test from "node:test";
import assert from "node:assert/strict";
import { getRequiredSessionSecret } from "./localAuth";

test("getRequiredSessionSecret throws when secret is missing", () => {
  assert.throws(() => getRequiredSessionSecret(undefined), /SESSION_SECRET must be set/);
});

test("getRequiredSessionSecret returns configured secret", () => {
  assert.equal(getRequiredSessionSecret("abc123"), "abc123");
});
