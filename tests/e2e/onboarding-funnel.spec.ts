import { test, expect } from '@playwright/test';

/**
 * Smoke test du funnel d'inscription public.
 *
 * On vérifie uniquement les éléments visibles SANS avoir besoin de
 * compte Supabase (ce qui rendrait le test fragile en CI).
 *
 * Si un de ces tests casse, c'est qu'une page publique est down ou
 * qu'un libellé clé a changé — c'est un signal fort de régression.
 */

test.describe('Funnel inscription — smoke', () => {
  test('Home → Inscription : CTA accessible et navigation OK', async ({
    page,
  }) => {
    await page.goto('/');

    // Le wordmark Zodiak est partout : c'est le smoke le plus fiable.
    await expect(page).toHaveTitle(/Zodiak/i);

    // Au moins un CTA d'inscription doit être visible sur la home.
    const cta = page
      .getByRole('link', { name: /commencer|inscription|gratuit|essayer/i })
      .or(page.getByRole('button', { name: /commencer|inscription|gratuit|essayer/i }))
      .first();
    await expect(cta).toBeVisible({ timeout: 10000 });

    // Navigation directe vers /register : la page doit répondre.
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);

    // Champs email / mot de passe attendus.
    await expect(
      page.locator('input[type="email"], input[name="email"]'),
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[name="password"]'),
    ).toBeVisible();
  });

  test('Login : page accessible avec champs email / password', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.locator('input[type="email"], input[name="email"]'),
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[name="password"]'),
    ).toBeVisible();
  });

  test('Mot de passe oublié : page accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.locator('input[type="email"], input[name="email"]'),
    ).toBeVisible();
  });

  test('Routes protégées : guidance redirige vers login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/guidance');
    // Soit on tombe sur /login, soit sur la home (selon la stratégie de redirect)
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test('Lien parrainage invalide : message clair, pas d\'erreur 500', async ({
    page,
  }) => {
    await page.goto('/r/CODE_INEXISTANT_123');
    // La page de fallback doit s'afficher avec un message
    await expect(
      page.getByText(/invitation invalide|invalide/i),
    ).toBeVisible({ timeout: 8000 });
  });
});
