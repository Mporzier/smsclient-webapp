/** Sélecteurs stables pour les tests E2E (data-cy existants + rôles ARIA). */
export const authSelectors = {
  error: '[data-cy="authForm-error"]',
  submit: '[data-cy="authForm-submit"]',
  signupCheckEmail: '[data-cy="authForm-signupCheckEmail"]',
} as const;
