import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const migration = fs.readFileSync("supabase/migrations/20260808081841_v4_finalize_idempotency.sql", "utf8")

test("same package version is protected by a database uniqueness guard", () => {
  assert.match(migration, /unique index if not exists application_submission_versions_one_per_package_version/i)
  assert.match(migration, /package_id, source_package_version/i)
})

test("finalizer returns an existing immutable submission before inserting another", () => {
  const lookup = migration.indexOf("source_package_version = package_row.package_version")
  const existingReturn = migration.indexOf("if created_version.id is not null")
  const insert = migration.indexOf("insert into public.application_submission_versions")
  assert.ok(lookup >= 0)
  assert.ok(existingReturn > lookup)
  assert.ok(insert > existingReturn)
})
