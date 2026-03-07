import { test, expect, Page } from '@playwright/test';

async function loginAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('admin@example.com');
    await page.getByLabel('Passwort', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible({ timeout: 15000 });
}

async function gotoPersons(page: Page) {
    await page.goto('/persons');
    await expect(page.getByRole('button', { name: /person hinzufügen/i })).toBeVisible();
}

async function createPerson(page: Page, name: string) {
    await page.getByRole('button', { name: /person hinzufügen/i }).click();

    const scope = page.getByRole('dialog').first().or(page.locator('main'));

    await expect(scope.getByLabel('Name', { exact: true })).toBeVisible();
    await scope.getByLabel('Name', { exact: true }).fill(name);

    
    const dateInput = scope.locator('input[type="date"]').first();
    if (await dateInput.count()) {
        await dateInput.fill('2000-01-01');
    } else {
        await scope.getByLabel(/geburtstag|datum/i).fill('01.01.2000');
    }

    await scope.getByRole('button', { name: /speichern|anlegen|erstellen|hinzufügen/i }).click();

   
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 });
}

test('Person anlegen → erscheint in Liste', async ({ page }) => {
    await loginAdmin(page);
    await gotoPersons(page);

    const unique = Date.now();
    const name = `PW Person ${unique}`;

    await createPerson(page, name);

    
});