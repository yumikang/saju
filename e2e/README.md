# E2E Testing Guide

Complete guide for running and maintaining E2E tests for the Saju Naming Platform Freemium flow.

## Overview

The E2E tests verify the complete user journey through the Freemium naming service:

1. **Stage 1**: Information input (lastName, gender, birth date/time, parent values)
2. **Stage 2**: Saju analysis (automatic calculation and display)
3. **Stage 3**: Name recommendations (2 free + 8 locked structure)
4. **Stage 4**: Payment flow (mock payment for testing)
5. **Stage 5**: Success page & PDF download

## Setup

### Prerequisites

- Node.js 18+ installed
- Development server running (`npm run dev`)
- Database with test data (Prisma migrations applied)

### Installation

Playwright and browsers are already installed via:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Running Tests

### All Tests

```bash
npm run e2e
```

### With UI Mode (Recommended for Development)

```bash
npm run e2e:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run tests step-by-step
- Debug failures
- View traces and screenshots

### Debug Mode

```bash
npm run e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Headed Mode (See Browser)

```bash
npm run e2e:headed
```

Runs tests with a visible browser window.

### View Test Report

After running tests:

```bash
npm run e2e:report
```

Opens HTML report with test results, traces, and screenshots.

## Test Structure

### Main Test File: `freemium-flow.spec.ts`

```typescript
test.describe('Freemium Flow E2E', () => {
  test('Complete Freemium user journey', async ({ page }) => {
    // Stage 1: Information Input
    // Stage 2: Saju Analysis
    // Stage 3: Name Recommendations (2+8)
    // Stage 4: Payment Flow
    // Stage 5: Success Page & PDF Download
  });

  // Edge cases
  test('Cannot access success page without payment', ...);
  test('Cannot download PDF without payment', ...);
  test('Mobile responsive design', ...);
  test('Session expiry validation', ...);
});
```

## Mock Payment Endpoint

For E2E testing, a mock payment endpoint is available:

**Endpoint**: `POST /api/payment/mock-success`

**Body**:
```json
{
  "sessionId": "uuid",
  "amount": 70000,
  "paymentKey": "test_payment_key_123",
  "orderId": "test_order_123"
}
```

**Behavior**:
- Only works in development/test environments
- Creates or updates payment record with `unlocked: true`
- Extends session expiry by 24 hours

**Security**: Returns 403 in production environment.

## Test Data Requirements

### Components with data-testid

The following components include test identifiers:

1. **ValueSelector** (`app/components/naming/ValueSelector.tsx`)
   - `data-testid="selected-value"` - Selected value badges

2. **NameCard** (`app/components/naming/NameCard.tsx`)
   - `data-testid="name-card"` - Unlocked name cards

3. **BlurredNameCard** (`app/components/naming/BlurredNameCard.tsx`)
   - `data-testid="name-card"` - Locked name cards
   - `data-locked="true"` - Indicates locked state
   - `data-icon="lock"` - Lock icon

## Test Validation Points

### Stage 1: Information Input
- ✅ Form fields present (lastName, gender, birthDate, birthTime)
- ✅ Value selector allows 1-3 selections
- ✅ Selected values display with badges
- ✅ Form submission navigates to analysis

### Stage 2: Saju Analysis
- ✅ URL changes to `/naming/freemium/analysis`
- ✅ Saju pillars displayed (년주, 월주, 일주, 시주)
- ✅ Element distribution shown (목, 화, 토, 금, 수)
- ✅ Next button navigates to results

### Stage 3: Name Recommendations
- ✅ URL includes sessionId parameter
- ✅ 2+ visible (unlocked) name cards
- ✅ 8+ locked name cards with blur effect
- ✅ Lock icon visible on locked cards
- ✅ Free names show full details (hanja, scores)

### Stage 4: Payment Flow
- ✅ Payment button opens modal
- ✅ Pricing displayed (₩70,000)
- ✅ Payment benefits listed
- ✅ Mock payment completes successfully

### Stage 5: Success Page & PDF
- ✅ Success celebration visible
- ✅ Payment amount displayed
- ✅ All 10 names unlocked and visible
- ✅ No lock icons remaining
- ✅ Ranks 1-10 all displayed
- ✅ PDF download button works
- ✅ PDF filename format: `naming-{lastName}-{timestamp}.pdf`
- ✅ PDF file size > 50KB
- ✅ All names show full details
- ✅ User guidance information present

## Debugging Failed Tests

### 1. Check Screenshots

Failed tests automatically capture screenshots:

```
e2e/test-results/{test-name}/screenshots/
```

### 2. View Traces

Playwright traces include:
- DOM snapshots
- Network requests
- Console logs
- Screenshots at each step

View traces in the HTML report:

```bash
npm run e2e:report
```

### 3. Run in Debug Mode

```bash
npm run e2e:debug
```

This allows you to:
- Step through test actions
- Inspect page state
- Run commands in console
- Modify selectors

### 4. Run Headed Mode

```bash
npm run e2e:headed
```

Watch the test execute in a real browser window.

### 5. Check Server Logs

E2E tests depend on the development server. Check server logs for:
- API errors
- Database connection issues
- Session/payment failures

## Common Issues

### Issue: Tests Timeout

**Cause**: Development server not running or slow response

**Solution**:
```bash
# Ensure dev server is running
npm run dev

# Increase timeout in playwright.config.ts
timeout: 120 * 1000  // 2 minutes
```

### Issue: Element Not Found

**Cause**: Selector changed or component not rendered

**Solution**:
1. Run in UI mode to inspect selectors
2. Check component still has correct data-testid
3. Wait for proper page load state

### Issue: Mock Payment Fails

**Cause**: Database connection or session expired

**Solution**:
1. Check Prisma connection
2. Verify sessionId is valid and not expired
3. Check mock endpoint logs

### Issue: PDF Download Fails

**Cause**: Payment not unlocked or PDF generation error

**Solution**:
1. Verify `payment.unlocked = true` in database
2. Check PDF generator logs in server console
3. Ensure pdfmake dependencies installed

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Setup database
        run: npx prisma migrate deploy

      - name: Run E2E tests
        run: npm run e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Isolate Tests

Each test should be independent and not rely on other tests' state.

### 2. Use Page Object Model

For complex flows, consider extracting page interactions into page objects:

```typescript
// e2e/pages/FreemiumPage.ts
export class FreemiumPage {
  constructor(private page: Page) {}

  async fillInputForm(data: InputData) {
    await this.page.fill('input[name="lastName"]', data.lastName);
    // ...
  }
}
```

### 3. Wait for Stable State

Use proper waiting strategies:

```typescript
// Wait for URL
await page.waitForURL(/\/results/);

// Wait for element
await page.waitForSelector('text=/사주팔자/', { timeout: 30000 });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### 4. Clean Up Test Data

After tests that create data, clean up to prevent pollution:

```typescript
test.afterEach(async () => {
  // Clean up test sessions
  await prisma.namingSession.deleteMany({
    where: { id: { startsWith: 'test_' } }
  });
});
```

### 5. Use Fixtures for Reusable Setup

```typescript
// e2e/fixtures.ts
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Setup authenticated state
    await use(page);
  },
});
```

## Adding New Tests

### 1. Create Test File

```bash
# Create new test file
touch e2e/feature-name.spec.ts
```

### 2. Follow Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/feature');

    // Act
    await page.click('button');

    // Assert
    await expect(page.locator('result')).toBeVisible();
  });
});
```

### 3. Add data-testid to Components

```tsx
<div data-testid="feature-component">
  {/* component content */}
</div>
```

### 4. Run and Verify

```bash
npm run e2e:ui
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)

## Support

For issues or questions:
1. Check this README first
2. Review Playwright documentation
3. Check existing test examples
4. Create issue with:
   - Test output/error
   - Screenshots from failure
   - Steps to reproduce
