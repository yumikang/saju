#!/bin/bash

# Test Freemium API Stages

BASE_URL="http://localhost:3003/api/naming/freemium"

echo "========================================="
echo "Testing Stage 1: Create Session"
echo "========================================="

STAGE1_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": 1,
    "data": {
      "lastName": "김",
      "lastNameStrokes": 8,
      "gender": "M",
      "birthDate": "1990-05-15",
      "birthTime": "14:30",
      "isLunar": false,
      "selectedValues": ["health", "wisdom"]
    }
  }')

echo "$STAGE1_RESPONSE" | jq '.'

# Extract sessionId
SESSION_ID=$(echo "$STAGE1_RESPONSE" | jq -r '.sessionId')

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

echo "========================================="
echo "Testing Stage 2: Calculate Saju"
echo "========================================="

STAGE2_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"stage\": 2,
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "$STAGE2_RESPONSE" | jq '.'
echo "✅ Saju calculated"
echo ""

echo "========================================="
echo "Testing Stage 3: Generate Names"
echo "========================================="

STAGE3_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"stage\": 3,
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "$STAGE3_RESPONSE" | jq '.recommendations | length' | xargs echo "Names generated:"
echo "$STAGE3_RESPONSE" | jq '.recommendations[0]'
echo "✅ Names generated"
echo ""

echo "========================================="
echo "All stages completed successfully! 🎉"
echo "========================================="
