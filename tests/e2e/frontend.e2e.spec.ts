import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  // We removed the 'let page' and 'beforeAll' block entirely.
  // Playwright handles page creation automatically via the { page } fixture.

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Specialist Application/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to your new project.')
  })
})
