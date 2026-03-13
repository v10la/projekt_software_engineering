import { test, expect } from '@playwright/test';

test('Registrierung und Login funktioniert', async ({ page }) => {
    const unique = Date.now();
    const email = `pw-${unique}@example.com`;
    const password = 'Test123!';

    
    await page.goto('/register');

    
    await expect(page.getByLabel('Name')).toBeVisible();

    await page.getByLabel('Name').fill(`Playwright User ${unique}`);
    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill(password);
    await page.getByLabel('Passwort bestätigen').fill(password);

    await page.getByRole('button', { name: 'Registrieren' }).click();

    
    await expect(page).not.toHaveURL(/\/register/i, { timeout: 15000 });

    
    if (page.url().includes('/login')) {
        
        await expect(page.getByLabel('E-Mail')).toBeVisible();

        await page.getByLabel('E-Mail').fill(email);
        await page.getByLabel('Passwort').fill(password);
        await page.getByRole('button', { name: 'Anmelden' }).click();
    }

    
    await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(email)).toBeVisible();
});