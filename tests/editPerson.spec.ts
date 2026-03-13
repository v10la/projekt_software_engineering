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

function personEditButton(page: Page): Locator {
    return page
        .getByRole('main')
        .getByRole('button', { name: /^bearbeiten$/i })
        .first();
}

async function openFirstExistingPerson(page: Page) {
    const main = page.getByRole('main');

    const personLinks = main.locator('a[href^="/persons/"]:not([href="/persons/new"])');
    const count = await personLinks.count();
    expect(count).toBeGreaterThan(0);

    await personLinks.first().click();

    await expect(page.getByRole('link', { name: /zurück/i })).toBeVisible({ timeout: 15000 });
    await expect(personEditButton(page)).toBeVisible({ timeout: 15000 });
}

async function editCurrentPerson(page: Page, newName: string, newDateISO: string) {
    const main = page.getByRole('main');

    await personEditButton(page).click();

    // Editor kann inline in <main> oder in einem Dialog erscheinen.
    const editor = page.getByRole('dialog').first().or(main);

    const nameInputByLabel = editor.getByLabel('Name', { exact: true }).first();
    const anyInput = editor.locator('input').first();

    await expect(nameInputByLabel.or(anyInput)).toBeVisible({ timeout: 15000 });

    const nameInput =
        (await nameInputByLabel.count()) > 0
            ? nameInputByLabel
            : anyInput;

    const nativeDateInput = editor.locator('input[type="date"]').first();
    const labeledDateInput = editor.getByLabel(/geburtstag|datum/i).first();

    let dateField: Locator;
    if ((await nativeDateInput.count()) > 0) {
        dateField = nativeDateInput;
    } else if ((await labeledDateInput.count()) > 0) {
        dateField = labeledDateInput;
    } else {
        dateField = editor.locator('input').nth(1);
    }

    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(newName);

    if ((await nativeDateInput.count()) > 0) {
        await dateField.fill(newDateISO);
    } else {
        const ddmmyyyy = newDateISO.split('-').reverse().join('.');
        await dateField.fill(ddmmyyyy);
    }

    const saveButton = editor
        .getByRole('button', { name: /^(ok|speichern|übernehmen)$/i })
        .first();

    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();

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