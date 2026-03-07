import { test, expect } from '@playwright/test';

test('Login mit gültigen Daten', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('admin@example.com');
    await page.getByLabel('Passwort').fill('admin123');
    await page.getByRole('button', { name: /anmelden|login/i }).click();

    await expect(page.getByRole('button', { name: /abmelden|logout/i })).toBeVisible();
    await expect(page.getByText('admin@example.com')).toBeVisible();
    await expect(page).toHaveURL('/'); 
});

test('Login schlägt fehl mit falschem Passwort', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('admin@example.com');
    await page.getByLabel('Passwort').fill('falsch');
    await page.getByRole('button', { name: /anmelden|login/i }).click();

    
    await expect(page.getByText(/ungültig|falsch|invalid/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
});

test('Logout funktioniert', async ({ page }) => {
    
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('admin@example.com');
    await page.getByLabel('Passwort').fill('admin123');
    await page.getByRole('button', { name: /anmelden|login/i }).click();
    await expect(page.getByRole('button', { name: /abmelden|logout/i })).toBeVisible();

    
    await page.getByRole('button', { name: /abmelden|logout/i }).click();

    
    await expect(page).toHaveURL(/\/login/i);
});