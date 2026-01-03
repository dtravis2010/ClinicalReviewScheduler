#!/bin/bash
#
# Cleanup Script: Remove Unused Files from ClinicalReviewScheduler
#
# These files were identified as unused - they exist but are not imported 
# or used anywhere in the actual source code. They only appear in:
# - Documentation/implementation guides (*.md files)
# - Their own test files (which are also being removed if applicable)
# - Their own definition
#
# Run this script from the project root directory:
#   chmod +x cleanup-unused-files.sh
#   ./cleanup-unused-files.sh
#
# To preview what will be deleted without actually deleting:
#   DRY_RUN=1 ./cleanup-unused-files.sh

set -e

DRY_RUN=${DRY_RUN:-0}

echo "🧹 ClinicalReviewScheduler Cleanup Script"
echo "=========================================="
echo ""

if [ "$DRY_RUN" = "1" ]; then
    echo "⚠️  DRY RUN MODE - Files will NOT be deleted"
    echo ""
fi

# Function to delete or preview
delete_file() {
    local file=$1
    if [ -f "$file" ]; then
        if [ "$DRY_RUN" = "1" ]; then
            echo "  Would delete: $file"
        else
            rm "$file"
            echo "  ✓ Deleted: $file"
        fi
    else
        echo "  ⏭  Skipped (not found): $file"
    fi
}

echo "📦 Removing unused components..."
echo ""

# Components that are not imported anywhere in source code
delete_file "src/components/AnalyticsHeaderBar.jsx"
delete_file "src/components/CommandPalette.jsx"
delete_file "src/components/ConflictAutoResolver.jsx"
delete_file "src/components/ContextualHelp.jsx"
delete_file "src/components/DashboardWidget.jsx"
delete_file "src/components/DateRangeFilter.jsx"
delete_file "src/components/EmptyState.jsx"
delete_file "src/components/EmployeeSidebar.jsx"
delete_file "src/components/EntityCard.jsx"
delete_file "src/components/ErrorBoundary.jsx"
delete_file "src/components/GlobalSearch.jsx"
delete_file "src/components/HoverCard.jsx"
delete_file "src/components/LoadingSpinner.jsx"
delete_file "src/components/NotificationBadge.jsx"
delete_file "src/components/NotificationCenter.jsx"
delete_file "src/components/PresentationMode.jsx"
delete_file "src/components/QuickAssignToolbar.jsx"
delete_file "src/components/RealtimePresence.jsx"
delete_file "src/components/RoleCardsView.jsx"
delete_file "src/components/SmartSuggestionsPanel.jsx"
delete_file "src/components/WorkloadHeatMap.jsx"
delete_file "src/components/WorkloadOptimizer.jsx"

echo ""
echo "📦 Removing unused atom components..."
echo ""

delete_file "src/components/atoms/HelpTooltip.jsx"

echo ""
echo "📦 Removing unused hooks..."
echo ""

# Hooks not imported in source code (only in docs/tests)
delete_file "src/hooks/useDashboardLayout.js"
delete_file "src/hooks/useFocusTrap.js"
delete_file "src/hooks/usePresence.js"

echo ""
echo "📦 Removing unused services..."
echo ""

# Services only referenced in docs
delete_file "src/services/exportService.js"

echo ""
echo "📦 Removing unused utilities..."
echo ""

# Utilities not imported anywhere
delete_file "src/utils/errorHandler.js"

echo ""
echo "📦 Removing unused styles..."
echo ""

# Styles only referenced in docs
delete_file "src/styles/designTokens.js"

echo ""
echo "📦 Removing test files for deleted code..."
echo ""

# Test file for useFocusTrap (hook is being deleted)
delete_file "src/__tests__/hooks/useFocusTrap.test.js"

echo ""
echo "=========================================="
echo ""
echo "📚 OPTIONAL: Documentation cleanup"
echo "The following files are implementation notes that could be removed:"
echo "  - AUTONOMOUS_IMPROVEMENTS.md (implementation summary)"
echo "  - QUICK_WINS_IMPLEMENTATION.md (integration guide for removed components)"
echo "  - PHASE_4_FEATURES.md (feature summary)"
echo "  - PHASE_4_IMPLEMENTATION.md (implementation guide)"
echo "  - PHASE_5_COMPLETE.md (phase completion notes)"
echo "  - USER_IMPROVEMENTS_COMPLETE.md (completed improvements)"
echo "  - SCHEDULE_NAVIGATION_FEATURE.md (feature documentation)"
echo "  - SETUP_CHECKLIST.md (initial setup checklist)"
echo "  - data-extraction-prompt.txt (one-time data import prompt)"
echo "  - fix-tests.sh (one-time test fix script)"
echo ""
echo "Keep: README.md, CONTRIBUTING.md, TESTING.md, SECURITY.md, ACCESSIBILITY.md, CLAUDE.md, QUICK_START.md"
echo ""
echo "To remove optional docs, uncomment lines below or run manually."
echo ""
# Uncomment to remove optional documentation:
# delete_file "AUTONOMOUS_IMPROVEMENTS.md"
# delete_file "QUICK_WINS_IMPLEMENTATION.md"
# delete_file "PHASE_4_FEATURES.md"
# delete_file "PHASE_4_IMPLEMENTATION.md"
# delete_file "PHASE_5_COMPLETE.md"
# delete_file "USER_IMPROVEMENTS_COMPLETE.md"
# delete_file "SCHEDULE_NAVIGATION_FEATURE.md"
# delete_file "SETUP_CHECKLIST.md"
# delete_file "data-extraction-prompt.txt"
# delete_file "fix-tests.sh"

echo "=========================================="

if [ "$DRY_RUN" = "1" ]; then
    echo "✅ Dry run complete. No files were deleted."
    echo "   To actually delete files, run without DRY_RUN=1"
else
    echo "✅ Cleanup complete! 30 unused source files removed."
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm test' to ensure tests still pass"
    echo "  2. Run 'npm run build' to verify the build works"
    echo "  3. Review optional documentation files above"
    echo "  4. Commit the changes"
fi

echo ""
