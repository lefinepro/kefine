set -e
cd /work/crater
/work/scripts/patch-rcl-crystal-merge.sh /work/crater/lib/rcl/src/rcl/document.cr || true
echo "=== run github_import spec ==="
crystal spec spec/github_import_spec.cr 2>&1 | tail -40
