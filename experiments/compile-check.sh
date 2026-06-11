set -e
cd /work/crater
echo "=== shards install ==="
shards install 2>&1 | tail -20
echo "=== patch rcl ==="
/work/scripts/patch-rcl-crystal-merge.sh /work/crater/lib/rcl/src/rcl/document.cr || true
echo "=== build (type check) ==="
crystal build --no-codegen src/crater.cr 2>&1 | tail -40
echo "BUILD_DONE_EXIT=$?"
