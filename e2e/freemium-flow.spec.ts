/**
 * Freemium Flow E2E Test
 *
 * Tests the complete user journey:
 * 1. Input form (Stage 1)
 * 2. Saju analysis (Stage 2)
 * 3. Name recommendations - 2+8 structure (Stage 3)
 * 4. Payment flow (Stage 4)
 * 5. Success page & PDF download (Stage 5)
 */

import { test, expect } from '@playwright/test';

test.describe('Freemium Flow E2E', () => {
  test.setTimeout(120000); // 2 minutes for full flow

  test('Complete Freemium user journey', async ({ page }) => {
    // =====================================================
    // Stage 1: Information Input
    // =====================================================
    await test.step('Navigate to Freemium page', async () => {
      await page.goto('/naming/freemium');
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      // Verify we're on the correct page by checking for form elements
      await expect(page.getByRole('heading', { name: '기본 정보 입력' })).toBeVisible();
    });

    await test.step('Fill input form', async () => {
      // Fill lastName (성씨)
      await page.fill('input[name="lastName"]', '김');

      // Select gender (남아)
      await page.click('button:has-text("남아")');

      // Fill birth date
      await page.fill('input[name="birthDate"]', '2024-01-15');

      // Fill birth time
      await page.fill('input[name="birthTime"]', '14:30');

      // Select parent values (3 values)
      await page.click('button:has-text("성공과 출세")');
      await page.click('button:has-text("건강과 장수")');
      await page.click('button:has-text("지혜와 학업")');

      // Verify 3 values selected
      const selectedBadges = await page.locator('[data-testid="selected-value"]').count();
      expect(selectedBadges).toBe(3);

      // Submit Stage 1
      await page.click('button:has-text("다음")');
    });

    // =====================================================
    // Stage 2: Saju Analysis (Auto-load)
    // =====================================================
    await test.step('View Saju analysis', async () => {
      // Wait for analysis page to load
      await page.waitForURL(/\/naming\/freemium\/analysis/);

      // Wait for loading to complete
      await page.waitForSelector('text=/사주팔자/', { timeout: 30000 });

      // Verify Saju pillars displayed
      await expect(page.locator('text=/년주|월주|일주|시주/')).toBeVisible();

      // Verify element distribution
      await expect(page.locator('text=/오행 분포|목|화|토|금|수/')).toBeVisible();

      // Click next to proceed to Stage 3
      await page.click('button:has-text("이름 추천 보기")');
    });

    // =====================================================
    // Stage 3: Name Recommendations (2+8 Structure)
    // =====================================================
    let sessionId: string;

    await test.step('View name recommendations', async () => {
      // Wait for results page
      await page.waitForURL(/\/naming\/freemium\/results/);

      // Extract sessionId from URL for later use
      const url = page.url();
      const urlParams = new URLSearchParams(url.split('?')[1]);
      sessionId = urlParams.get('sessionId') || '';
      expect(sessionId).toBeTruthy();

      // Verify 2 free names visible (ranks 1-2)
      const visibleNames = await page.locator('[data-testid="name-card"]:not([data-locked="true"])').count();
      expect(visibleNames).toBeGreaterThanOrEqual(2);

      // Verify 8 locked names (ranks 3-10)
      const lockedNames = await page.locator('[data-testid="name-card"][data-locked="true"]').count();
      expect(lockedNames).toBeGreaterThanOrEqual(8);

      // Verify free name shows full details
      const firstNameCard = page.locator('[data-testid="name-card"]').first();
      await expect(firstNameCard.locator('text=/한자:|점수:|오행/')).toBeVisible();

      // Verify locked name shows lock icon
      const lockedCard = page.locator('[data-testid="name-card"][data-locked="true"]').first();
      await expect(lockedCard.locator('svg[data-icon="lock"]')).toBeVisible();
    });

    // =====================================================
    // Stage 4: Payment Flow (Mock)
    // =====================================================
    await test.step('Initiate payment', async () => {
      // Click payment button
      await page.click('button:has-text("프리미엄 잠금 해제")');

      // Wait for payment modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Verify pricing displayed
      await expect(page.locator('text=/69,000원/')).toBeVisible();

      // Verify payment benefits listed
      await expect(page.locator('text=/1-10위|전체 이름 공개/')).toBeVisible();
    });

    await test.step('Mock payment completion', async () => {
      // For E2E testing, we'll simulate payment success
      // In production, this would go through TossPayments

      // Option 1: Test with mock payment endpoint
      // Create a mock payment directly in database
      await page.evaluate(async (sid) => {
        const response = await fetch('/api/payment/mock-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            amount: 69000,
            paymentKey: 'test_payment_key_' + Date.now(),
            orderId: 'test_order_' + Date.now(),
          }),
        });
        return response.json();
      }, sessionId);

      // Navigate to success page
      await page.goto(`/naming/freemium/result?sessionId=${sessionId}&payment=success`);
    });

    // =====================================================
    // Stage 5: Success Page & PDF Download
    // =====================================================
    await test.step('Verify payment success page', async () => {
      // Wait for success page to load
      await page.waitForURL(/\/naming\/freemium\/result/);

      // Verify success celebration
      await expect(page.locator('text=/결제 완료/')).toBeVisible();

      // Verify payment amount displayed
      await expect(page.locator('text=/69,000원/')).toBeVisible();

      // Verify all 10 names now visible
      const unlockedNames = await page.locator('[data-testid="name-card"]').count();
      expect(unlockedNames).toBe(10);

      // Verify no locked badges on names
      const lockedBadges = await page.locator('svg[data-icon="lock"]').count();
      expect(lockedBadges).toBe(0);

      // Verify ranks 1-10 displayed
      for (let i = 1; i <= 10; i++) {
        await expect(page.locator(`text=/^${i}위:/`)).toBeVisible();
      }

      // Verify PDF download button visible
      await expect(page.locator('button:has-text("PDF 다운로드")')).toBeVisible();
    });

    await test.step('Test PDF download', async () => {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');

      // Click PDF download button
      await page.click('button:has-text("PDF 다운로드")');

      // Wait for download
      const download = await downloadPromise;

      // Verify download filename
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/naming-김-\d+\.pdf/);

      // Verify file is PDF
      expect(filename).toContain('.pdf');

      // Save and verify file size (PDF should be > 50KB)
      const path = await download.path();
      const fs = await import('fs');
      const stats = fs.statSync(path!);
      expect(stats.size).toBeGreaterThan(50000); // 50KB minimum
    });

    // =====================================================
    // Additional Verifications
    // =====================================================
    await test.step('Verify all unlocked names show details', async () => {
      // Check that all 10 names show full details
      for (let i = 0; i < 10; i++) {
        const nameCard = page.locator('[data-testid="name-card"]').nth(i);

        // Verify name displayed
        await expect(nameCard.locator('text=/^김/')).toBeVisible();

        // Verify score displayed
        await expect(nameCard.locator('text=/점수:.*점/')).toBeVisible();

        // Verify hanja information
        await expect(nameCard.locator('text=/한자:/')).toBeVisible();
      }
    });

    await test.step('Verify user guidance information', async () => {
      // Scroll to guidance section
      await page.locator('text=/안내사항/').scrollIntoViewIfNeeded();

      // Verify guidance bullets
      await expect(page.locator('text=/평생 보관/')).toBeVisible();
      await expect(page.locator('text=/PDF 파일/')).toBeVisible();
      await expect(page.locator('text=/상세 정보/')).toBeVisible();
    });
  });

  // =====================================================
  // Edge Cases & Error Scenarios
  // =====================================================
  test('Cannot access success page without payment', async ({ page }) => {
    // Try to access success page directly without payment
    await page.goto('/naming/freemium/result?sessionId=invalid-session-id&payment=success');

    // Should redirect or show error
    await expect(page.locator('text=/결제.*필요|Session not found|만료/')).toBeVisible();
  });

  test('Cannot download PDF without payment', async ({ page }) => {
    // Try to access PDF endpoint directly without payment
    const response = await page.goto('/api/pdf/freemium/invalid-session-id');

    // Should return 403 or 404
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('Mobile responsive design', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    // Test mobile flow
    await page.goto('/naming/freemium');

    // Verify mobile layout
    await expect(page.locator('input[name="lastName"]')).toBeVisible();

    // Touch interactions should work
    await page.tap('button:has-text("남아")');
    await expect(page.locator('button:has-text("남아")[aria-selected="true"]')).toBeVisible();
  });

  test('Session expiry validation', async ({ page }) => {
    // Create a session and wait for expiry (24 hours in production)
    // For testing, we'd need a test endpoint to create expired sessions

    await page.goto('/naming/freemium/results?sessionId=expired-session-id');

    // Should show expiry message
    await expect(page.locator('text=/만료|expired/i')).toBeVisible();
  });
});
