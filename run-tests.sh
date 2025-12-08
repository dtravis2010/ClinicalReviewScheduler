#!/bin/bash

echo "🧪 Running Phase 1 Tests..."
echo ""

# Run vitest in run mode (not watch mode)
npx vitest run --reporter=verbose

echo ""
echo "✅ Test run complete!"
