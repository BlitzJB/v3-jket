#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo ""
echo "================================================================"
echo "  JKET WARRANTY REMINDER SYSTEM - COMPREHENSIVE TEST SUITE"
echo "================================================================"
echo ""

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_script=$2

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: ${test_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if npx tsx "$test_script" 2>&1; then
        echo ""
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Pre-flight checks
echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
else
    echo -e "${GREEN}✓${NC} Docker is running"
fi

# Check if PostgreSQL is accessible
if docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${GREEN}✓${NC} PostgreSQL container is running"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL container not running, starting services..."
    docker-compose up -d
    sleep 5
fi

# Check if Prisma client is generated
if [ -d "node_modules/.pnpm/@prisma+client@"* ]; then
    echo -e "${GREEN}✓${NC} Prisma client is generated"
else
    echo -e "${YELLOW}⚠${NC}  Prisma client not found, generating..."
    npx prisma generate
fi

# Check environment variables
if grep -q "SMTP_USER" .env && grep -q "SMTP_PASS" .env; then
    echo -e "${GREEN}✓${NC} Email configuration present"
else
    echo -e "${YELLOW}⚠${NC}  Email configuration incomplete (some tests may fail)"
fi

if grep -q "CRON_SECRET" .env; then
    echo -e "${GREEN}✓${NC} Cron secret configured"
else
    echo -e "${YELLOW}⚠${NC}  Cron secret not configured"
fi

echo ""
echo -e "${GREEN}✅ Pre-flight checks complete!${NC}"
echo ""

# Run all tests
echo "================================================================"
echo "  RUNNING TEST SUITE"
echo "================================================================"

# Test 1: Warranty Calculations
run_test "Test 1: Warranty Calculations" "scripts/test-warranty-calculations.ts"

# Test 2: Database Operations
run_test "Test 2: Database Operations" "scripts/test-warranty-db.ts"

# Test 3: Email System
run_test "Test 3: Email System" "scripts/test-email-system.ts"

# Test 4: Reminder Service
run_test "Test 4: Reminder Service" "scripts/test-reminder-service.ts"

# Test 5: End-to-End System
run_test "Test 5: End-to-End System" "scripts/test-reminder-system-e2e.ts"

# Test 6: API Endpoints
run_test "Test 6: API Endpoints" "scripts/test-api-endpoints.ts"

# Test 7: Scheduling UI
run_test "Test 7: Scheduling UI Integration" "scripts/test-step-4-scheduling-ui.ts"

# Final Summary
echo ""
echo ""
echo "================================================================"
echo "  FINAL TEST SUMMARY"
echo "================================================================"
echo ""
echo -e "Total Tests:  ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Warranty reminder system is fully functional.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review test emails in your inbox"
    echo "  2. Deploy to production: vercel --prod"
    echo "  3. Configure environment variables in Vercel dashboard"
    echo "  4. Monitor cron job execution"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Database not running (run: docker-compose up -d)"
    echo "  - Email credentials not configured in .env"
    echo "  - Prisma client not generated (run: npx prisma generate)"
    echo ""
    exit 1
fi
