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

function editButton(page: Page): Locator {
    return page
        .getByRole('main')
        .locator('button:has(svg.lucide-square-pen), button:has(svg[data-lucide="square-pen"])')
        .first();
}

async function openFirstExistingPerson(page: Page) {
    const main = page.getByRole('main');

    
    const personLinks = main.locator('a[href^="/persons/"]:not([href="/persons/new"])');
    const count = await personLinks.count();
    expect(count).toBeGreaterThan(0);

    await personLinks.first().click();

    await expect(page.getByRole('link', { name: /zurück/i })).toBeVisible({ timeout: 15000 });
    await expect(editButton(page)).toBeVisible({ timeout: 15000 });
}

async function editCurrentPerson(page: Page, newName: string, newDateISO: string) {
    const main = page.getByRole('main');

    await editButton(page).click();

    
    const okButton = main.getByRole('button', { name: /^ok$/i });
    await expect(okButton).toBeVisible({ timeout: 15000 });

   
    const dateInput = main.locator('input[type="date"]').first();
    const hasNativeDate = (await dateInput.count()) > 0;

    const nameInput = hasNativeDate
        ? main.locator('input:not([type="date"])').first()
        : main.locator('input').first();

    const dateField = hasNativeDate ? dateInput : main.locator('input').nth(1);

    await expect(nameInput).toBeVisible();
    await nameInput.fill(newName);

    
    if (hasNativeDate) {
        await dateField.fill(newDateISO); 
    } else {
        
        const ddmmyyyy = newDateISO.split('-').reverse().join('.');
        await dateField.fill(ddmmyyyy);
    }

    await okButton.click();

    
    await expect(main.getByRole('heading', { level: 1, name: newName })).toBeVisible({ timeout: 15000 });

    
    const ddmmyyyy = newDateISO.split('-').reverse().join('.');
    await expect(main.getByText(new RegExp(`${newDateISO}|${ddmmyyyy}`))).toBeVisible({ timeout: 15000 });
}

test('Person bearbeiten → vorhandene Person ändern (Name + Datum) und OK', async ({ page }) => {
    await loginAdmin(page);
    await gotoPersons(page);

    await openFirstExistingPerson(page);

    const unique = Date.now();
    const newName = `PW Edit ${unique}`;
    const newDateISO = '2000-02-02';

    await editCurrentPerson(page, newName, newDateISO);

   
    await page.getByRole('link', { name: /zurück/i }).click();
});