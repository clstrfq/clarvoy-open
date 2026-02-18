import test from "node:test";
import assert from "node:assert/strict";
import { fileStorage } from "./fileStorage";

test("stored upload file names must be uuid plus extension", () => {
  assert.equal(fileStorage.isStoredFileNameSafe("123e4567-e89b-12d3-a456-426614174000.pdf"), true);
  assert.equal(fileStorage.isStoredFileNameSafe("../etc/passwd"), false);
  assert.equal(fileStorage.isStoredFileNameSafe("plain-name.pdf"), false);
  assert.equal(fileStorage.isStoredFileNameSafe("123e4567-e89b-12d3-a456-426614174000"), false);
});
