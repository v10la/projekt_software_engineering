import { test, expect, Page, Locator } from '@playwright/test';

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

function deleteButton(page: Page): Locator {
    const root = page.getByRole('main');

    return root
        .locator(
            [
                'button:has(svg.lucide-trash-2)',
                'button:has(svg.lucide-trash2)',
                'button:has(svg[data-lucide="trash-2"])',
                'button:has(svg[data-lucide="trash2"])',
            ].join(', ')
        )
        .first();
}

async function openFirstExistingPerson(page: Page) {
    const main = page.getByRole('main');

    const personLinks = main.locator('a[href^="/persons/"]:not([href="/persons/new"])');
    const count = await personLinks.count();
    expect(count).toBeGreaterThan(0);

    await personLinks.first().click();

    await expect(page.getByRole('link', { name: /zurück/i })).toBeVisible({ timeout: 15000 });
    await expect(deleteButton(page)).toBeVisible({ timeout: 15000 });
}

async function deleteCurrentPersonWithConfirm(page: Page) {
   
    page.once('dialog', async (dialog) => {
        // confirm popup -> OK
        await dialog.accept();
    });

    await deleteButton(page).click();
}

test('Person löschen → vorhandene Person löschen (Popup OK)', async ({ page }) => {
    await loginAdmin(page);
    await gotoPersons(page);

    await openFirstExistingPerson(page);

    
    const name = (await page.getByRole('main').getByRole('heading', { level: 1 }).innerText()).trim();

    await deleteCurrentPersonWithConfirm(page);

    
    await page.goto('/persons');
    await expect(page.getByText(name, { exact: true })).toHaveCount(0, { timeout: 15000 });
});