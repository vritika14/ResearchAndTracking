#!/bin/bash
# RLS end-to-end test suite — runs directly against the real database as
# research_tracker_app, using real SET LOCAL session variables, to prove
# RLS policies actually enforce visibility correctly. Every test runs
# inside BEGIN/ROLLBACK so nothing is ever actually committed.
#
# Usage: PGPASSWORD=... ./test-rls.sh <host> <port> <dbname>
#
# Before running, edit the CONFIG section below with real, known-good
# IDs from your own database (a real project, its owner, a real
# collaborator, a genuinely unrelated user, etc).

set -uo pipefail

HOST="${1:?Usage: test-rls.sh <host> <port> <dbname>}"
PORT="${2:?Usage: test-rls.sh <host> <port> <dbname>}"
DBNAME="${3:?Usage: test-rls.sh <host> <port> <dbname>}"

PASS_COUNT=0
FAIL_COUNT=0

# ============================================================
# CONFIG — replace these with real IDs from your database before running
# ============================================================
OWNER_ID="b9320dbd-3847-44bb-a951-5f2b1b1c150b"       # simrag
COLLABORATOR_ID="89c5462d-8e7f-4637-b33f-fa7a58b04281" # vritshop
UNRELATED_ID="00000000-0000-0000-0000-000000000000"    # genuinely no matching user/rows
OWNED_PROJECT_ID="00e58a18-dea5-43a2-a117-f0173f3fd66d"
NON_COLLAB_PROJECT_ID="c4a060af-5fd5-4f73-9454-1676ac3a2c95" # a DIFFERENT project owner does not share

# ============================================================
# Test runner — executes a query with a given user context, compares row count
# ============================================================
run_test() {
  local description="$1"
  local user_id="$2"
  local query="$3"
  local expected_count="$4"

  local sql="
    BEGIN;
    SET LOCAL app.current_user_id = '${user_id}';
    ${query}
    ROLLBACK;
  "

  local result
  result=$(PGPASSWORD="$PGPASSWORD" psql -h "$HOST" -p "$PORT" -U research_tracker_app -d "$DBNAME" -t -A -c "$sql" 2>&1 | grep -E '^[0-9]+$' | tail -1)

  if [ "$result" == "$expected_count" ]; then
    echo "  PASS - $description (expected $expected_count, got $result)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  FAIL - $description (expected $expected_count, got '$result')"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

echo "=========================================="
echo "RLS End-to-End Test Suite"
echo "=========================================="

echo ""
echo "--- Projects ---"
run_test "Owner sees their own project" \
  "$OWNER_ID" \
  "SELECT COUNT(*) FROM projects WHERE id = '${OWNED_PROJECT_ID}';" \
  "1"

run_test "Unrelated user sees zero rows for that project" \
  "$UNRELATED_ID" \
  "SELECT COUNT(*) FROM projects WHERE id = '${OWNED_PROJECT_ID}';" \
  "0"

run_test "Collaborator sees the project they were added to" \
  "$COLLABORATOR_ID" \
  "SELECT COUNT(*) FROM projects WHERE id = '${OWNED_PROJECT_ID}';" \
  "1"

run_test "Collaborator does NOT see a project they were not added to" \
  "$COLLABORATOR_ID" \
  "SELECT COUNT(*) FROM projects WHERE id = '${NON_COLLAB_PROJECT_ID}';" \
  "0"

echo ""
echo "--- Modules ---"

run_test "Owner (via project) sees the module" "$OWNER_ID" "SELECT COUNT(*) FROM modules WHERE id = 'd51259d5-3d48-4f29-b5b5-3552a9f384e0';" "1"
run_test "Collaborator (via invitation) sees the module" "$COLLABORATOR_ID" "SELECT COUNT(*) FROM modules WHERE id = 'd51259d5-3d48-4f29-b5b5-3552a9f384e0';" "1"
run_test "Unrelated user does not see the module" "$UNRELATED_ID" "SELECT COUNT(*) FROM modules WHERE id = 'd51259d5-3d48-4f29-b5b5-3552a9f384e0';" "0"

echo ""
echo "--- Tasks & Notes (Private/Shared visibility) ---"

PRIVATE_TASK_ID="ae8dbba5-360d-415d-8106-07fadd1947d0"
SHARED_TASK_ID="3471dd2b-822a-45bf-927a-0653a0f453cd"

run_test "Creator sees their own private task" "$OWNER_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${PRIVATE_TASK_ID}';" "1"
run_test "A shared member does NOT see the creator's private task" "$COLLABORATOR_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${PRIVATE_TASK_ID}';" "0"
run_test "Unrelated user does not see the private task" "$UNRELATED_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${PRIVATE_TASK_ID}';" "0"

run_test "Creator sees their own shared task" "$OWNER_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${SHARED_TASK_ID}';" "1"
run_test "Explicit member sees the shared task" "$COLLABORATOR_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${SHARED_TASK_ID}';" "1"
run_test "Unrelated user does NOT see the shared task (not a member)" "$UNRELATED_ID" "SELECT COUNT(*) FROM tasks WHERE id = '${SHARED_TASK_ID}';" "0"

PRIVATE_NOTE_ID="99b6e355-49c8-4810-8f14-e20ee7ebaa68"
SHARED_NOTE_ID="b5067ba1-fa56-4e1d-930f-8f1a80c46f5f"

run_test "Creator sees their own private note" "$OWNER_ID" "SELECT COUNT(*) FROM notes WHERE id = '${PRIVATE_NOTE_ID}';" "1"
run_test "A shared member does NOT see the creator's private note" "$COLLABORATOR_ID" "SELECT COUNT(*) FROM notes WHERE id = '${PRIVATE_NOTE_ID}';" "0"
run_test "Unrelated user does not see the private note" "$UNRELATED_ID" "SELECT COUNT(*) FROM notes WHERE id = '${PRIVATE_NOTE_ID}';" "0"

run_test "Creator sees their own shared note" "$OWNER_ID" "SELECT COUNT(*) FROM notes WHERE id = '${SHARED_NOTE_ID}';" "1"
run_test "Explicit member sees the shared note" "$COLLABORATOR_ID" "SELECT COUNT(*) FROM notes WHERE id = '${SHARED_NOTE_ID}';" "1"
run_test "Unrelated user does NOT see the shared note (not a member)" "$UNRELATED_ID" "SELECT COUNT(*) FROM notes WHERE id = '${SHARED_NOTE_ID}';" "0"

echo ""
echo "--- No session context at all ---"
result=$(PGPASSWORD="$PGPASSWORD" psql -h "$HOST" -p "$PORT" -U research_tracker_app -d "$DBNAME" -t -A -c "SELECT COUNT(*) FROM projects;" 2>&1 | tail -1)
if [ "$result" == "0" ]; then
  echo "  PASS - No context set → zero rows visible anywhere (expected 0, got $result)"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  FAIL - No context set → should see zero rows (expected 0, got '$result')"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
echo "--- RLS actually enabled on every protected table ---"
DISABLED_TABLES=$(PGPASSWORD="$PGPASSWORD" psql -h "$HOST" -p "$PORT" -U research_tracker_app -d "$DBNAME" -t -A -c "
  SELECT relname FROM pg_class
  WHERE relname IN ('projects','modules','notes','tasks','project_collaborators','module_collaborators','task_members','note_members','project_invitations','module_invitations')
    AND relrowsecurity = false;
" 2>&1)

if [ -z "$DISABLED_TABLES" ]; then
  echo "  PASS - RLS enabled on all protected tables"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  FAIL - RLS DISABLED on: $DISABLED_TABLES"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
echo "=========================================="
echo "Results: $PASS_COUNT passed, $FAIL_COUNT failed"
echo "=========================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0