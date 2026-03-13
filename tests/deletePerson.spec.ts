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

function personDeleteButton(page: Page): Locator {
    return page
        .getByRole('main')
        .getByRole('button', { name: /^löschen$/i })
        .first();
}

async function openFirstExistingPerson(page: Page) {
    const main = page.getByRole('main');

    const personLinks = main.locator('a[href^="/persons/"]:not([href="/persons/new"])');
    const count = await personLinks.count();
    expect(count).toBeGreaterThan(0);

    await personLinks.first().click();

    await expect(page.getByRole('link', { name: /zurück/i })).toBeVisible({ timeout: 15000 });
    await expect(personDeleteButton(page)).toBeVisible({ timeout: 15000 });
}

async function deleteCurrentPersonWithConfirm(page: Page, name: string) {
    const main = page.getByRole('main');

    page.once('dialog', async (dialog) => {
        await dialog.accept();
    });

    await personDeleteButton(page).click();

    // Wichtig: nicht sofort page.goto('/persons') machen.
    // Erst warten, bis die Detailansicht der gelöschten Person verschwunden ist.
    await expect(
        main.getByRole('heading', { level: 1, name })
    ).toHaveCount(0, { timeout: 15000 });

    // Falls die App nicht selbst auf /persons zurückspringt, jetzt erst navigieren.
    if (!/\/persons\/?$/.test(page.url())) {
        await page.goto('/persons');
    }

    await expect(page.getByRole('button', { name: /person hinzufügen/i })).toBeVisible({ timeout: 15000 });
}

test('Person löschen → vorhandene Person löschen (Popup OK)', async ({ page }) => {
    await loginAdmin(page);
    await gotoPersons(page);

    await openFirstExistingPerson(page);

    const name = (await page.getByRole('main').getByRole('heading', { level: 1 }).innerText()).trim();

    await deleteCurrentPersonWithConfirm(page, name);

    await expect(
        page.getByRole('main').getByRole('heading', { level: 3, name })
    ).toHaveCount(0, { timeout: 15000 });
});