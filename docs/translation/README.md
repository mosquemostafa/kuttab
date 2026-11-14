# Translation System Documentation

This document describes the complete i18n infrastructure in the `modawim` project.
It covers folder structure, next-intl integration, locale routing, component patterns, server actions, error handling, and tooling.

## 1. Goals

- Provide fully localized UI in English (`en`) and Arabic (`ar`).
- Use `next-intl` with App Router and locale segment paths (`/[locale]`).
- Allow consistent translation in UI components and server actions.
- Keep translations centralized and namespace-scoped.
- Support editing and checking keys with `i18n-ally`.

## 2. Project translation architecture

### 2.1 Locale files

Translation files are stored under:

- `src/messages/en/*.json`
- `src/messages/ar/*.json`

Namespaces in this project:

- `admin` (admin screens)
- `auth` (authentication screens)
- `common` (shared labels, errors)
- `dashboard` (dashboard pages)
- `header` (top nav and language switcher)
- `todos` (todos features)

Example base path (English): `src/messages/en/auth.json`.

### 2.2 JSON structure

> [!IMPORTANT]
> **Strict Rule: Never use arrays in translation JSON files.**
> All message files must consist exclusively of nested keyed objects and string values. Raw arrays (`[ ... ]`) are strictly forbidden because static analysis tools (including `i18n-ally`) decompose array elements into numeric leaf keys (`.0`, `.1`, etc.), breaking parent key resolution and usage tracking.
>
> **Instead of arrays, use keyed objects:**
>
> ```json
> // ❌ FORBIDDEN
> "weekdayLabels": ["Sun", "Mon", "Tue"]
>
> // ✅ REQUIRED
> "weekdayLabels": {
>   "sun": "Sun",
>   "mon": "Mon",
>   "tue": "Tue"
> }
> ```

`auth.json` example:

- `errors` (generic and action-specific error strings)
- `success` (global operation success message)
- `login` / `register` / `forgot` / `reset` sections for each screen.

Keep keys as nested property trees. For example:

- `auth.login.form.emailLabel`
- `auth.login.form.errors.invalidEmail`
- `auth.reset.page.invalidToken`

## 3. next-intl routing and middleware

### src/i18n/routing.ts

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
});
```

### src/i18n/request.ts

Loads active locale messages for server-rendered pages.

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const localesWithNamespaces = [
  "common",
  "header",
  "auth",
  "dashboard",
  "admin",
  "todos",
];

async function loadMessages(locale: string) {
  const messages: Record<string, string> = {};
  for (const namespace of localesWithNamespaces) {
    try {
      const file = await import(`../messages/${locale}/${namespace}.json`);
      messages[namespace] = file.default ?? file;
    } catch (error) {
      console.warn(`next-intl: missing ${namespace} translation for ${locale}`);
    }
  }
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = (await requestLocale) ?? routing.defaultLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
```

### next.config.ts

Uses `next-intl` plugin automatically by default in App Router (no plugin overhead if keys are applied separately). Make sure `experimental` is not in conflict.

## 4. Language switcher

`src/components/language-switcher.tsx` handles locale toggle (two languages). It uses `useLocale`, `useTranslations`, `useRouter`, and `useTransition`.

Pattern:

- Server component provides text labels from localizable strings.
- Client component updates route with `router.push(pathname ?? '/', { locale: nextLocale })`.
- Only one UI element, not a `<select>` in your final version.

## 5. Component-level translation usage

### 5.0 One translator per file (required)

### 5.0.1 Never use `t.raw()` (strictly forbidden)

- Never use `t.raw()` to fetch raw objects or arrays.
- `t.raw()` bypasses type safety, disables compile-time checking, and causes `i18n-ally` to flag false "missing keys" for parent paths and false "not in use" warnings for array children.
- Always consume translations via standard `t("key")` or `t.rich("key")` calls.
- Enforced via `pnpm check:i18n` (`scripts/check-i18n-translator-aliases.mjs`).

To keep `i18n-ally` usage detection accurate, use only one `useTranslations` call per file.

Additional mandatory rule:

- Never pass translator functions (for example `t`) as component props or function parameters.
- Each component/page/action must declare its own translator locally:
  - Client components: `const t = useTranslations('namespace')` (or `useTranslations()` with full keys)
  - Server components/actions: `const t = await getTranslations('namespace')`

Precedence note:

- If these two rules conflict, do NOT pass `t` as a parameter.
- Prefer extracting child UI into a separate file with its own local translator when possible.

Reason: passing `t` across components hides key usage from tooling and makes translation scope harder to track.

Recommended pattern:

- `const t = useTranslations();`
- Use fully qualified keys in JSX, for example:
  - `t('header.adminBadge')`
  - `t('notifications.unreadSubtitle')`

Avoid this pattern in the same file:

- `const t = useTranslations('header')`
- `const tNotifications = useTranslations('notifications')`

Avoid this pattern across components/functions:

- `function Child({t}: {t: ...}) { ... }`
- `<Child t={t} />`

Reason: i18n-ally can mis-detect usage when multiple translator aliases/scopes exist in one file, causing false "not used" reports for one namespace based on declaration order.

### 5.1 Login form (`src/components/auth/login-form.tsx`)

Use:

- `const t = useTranslations('auth.login.form');`
- labels: `t('emailLabel')`, `t('passwordLabel')`
- placeholders: `t('emailPlaceholder')`, `t('passwordPlaceholder')`
- zod schema:
  - `t('errors.invalidEmail')`
  - `t('errors.passwordRequired')`

Return server-side errors from action by setting the `FormError` state from action result.

### 5.2 Register form (`src/components/auth/register-form.tsx`)

Use `useTranslations('auth.register.form')`. Equivalent structure for labels and errors.

### 5.3 Forgot password and Reset password forms

Similar pattern: `useTranslations('auth.forgot.form')` and `useTranslations('auth.reset.form')`.

## 6. Server actions (next-intl in server functions)

### 6.1 Approach

In action files like:

- `src/app/[locale]/auth/login/action.ts`
- `src/app/[locale]/auth/register/action.ts`
- `src/app/[locale]/auth/forgot-password/action.ts`
- `src/app/[locale]/auth/reset-password/action.ts`

Use `getTranslations("auth.*")` and map messages:

```ts
const t = await getTranslations("auth.login.form");
return { error: { reason: t("errors.invalidCredentials") } };
```

For Zod error mapping on `safeParse`

```ts
const fieldErrorMap = { name: t('errors.name'), ... };
const parsed = schema.safeParse(data, {
  error(issue) {
    const path = issue.path?.[0];
    return path ? fieldErrorMap[path as keyof typeof fieldErrorMap] ?? t('errors.generic') : t('errors.generic');
  },
});
```

### 6.2 Key path consistency

Make sure paths are resolved by translation context:

- `t('errors.invalidEmail')` when context is `auth.login.form`
- `t('login.form.errors.invalidEmail')` if context is `auth`
- `t('reset.page.invalidToken')` if context is `auth`

## 7. Repair guidelines for `i18n-ally` missing `/ not in use`

### Common mismatch reasons

- using `'auth.login.form'` in `useTranslations` but keys are at `auth.errors.*`
- referencing fully namespaced key in `t(...)` under a root that already includes that namespace
- static mismatch `t('auth.login.form.errors.invalidEmail')` when using `useTranslations('auth')` (double prefix)
- dynamic key template literals like `t(`errors.${variable}`)` are not tracked by i18n-ally and may cause keys to be flagged as unused; prefer explicit branches instead
- using computed provider helper mapping that uses child translation keys (e.g., helper returns `t('providers.google')` from `settings.linkedAccounts` context) can break tool tracking. prefer explicit branch keys at call site:
  - `providerId === 'google' ? t('providers.google') : t('providers.github')`
- declaring multiple translators in one file (e.g., `useTranslations('header')` and `useTranslations('notifications')`) can cause false unused-key reports in `i18n-ally`

### Correct forms

- `useTranslations('auth.login.form')` + `t('errors.invalidEmail')`
- `useTranslations('auth')` + `t('login.form.errors.invalidEmail')`

## 8. i18n-ally settings (from `.vscode/settings.json`)

```json
{
  "i18n-ally.localesPaths": ["src/i18n", "src/messages"],
  "i18n-ally.keystyle": "nested",
  "i18n-ally.pathMatcher": "{locale}/{namespace}.json",
  "i18n-ally.namespace": true,
  "i18n-ally.enabledParsers": ["json"],
  "i18n-ally.sourceLanguage": "ar",
  "i18n-ally.displayLanguage": "en",
  "i18n-ally.enabledFrameworks": ["react", "i18next", "next-intl"],
  "i18n-ally.annotationInPlace": true,
  "i18n-ally.extract.autoDetect": true,
  "i18n-ally.includeSubfolders": true,
  "i18n-ally.dirStructure": "dir",
  "i18n-ally.review.enabled": true,
  "i18n-ally.review.gutters": true,
  "i18n-ally.usage.scanningIgnore": [
    "**/.git/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**"
  ]
}
```

## 9. Translation files style notes

- keep message keys stable (avoid removing old keys until all places migrated)
- support both Simple and nested access patterns
- keep `auth.json` fallback keys:
  - `errors.generic` / `errors.invalidRequest` / `errors.invalidToken`
  - `success` for generic success state

## 10. Testing and validation

- Build command: `pnpm run build`
- You should not see `MISSING_MESSAGE` during build.
- Test switching locales via `LanguageSwitcher`.
- Use `i18n-ally` to detect missing/untranslated keys.

## 11. Adding a new translation

1. Add the key in both language JSON files (e.g., `auth.login.form.newKey`).
2. Use the same namespace in components: `const t = useTranslations('auth.login.form');`.

## 12. i18n folder (`src/i18n`) details

### 12.1 `routing.ts`

- Hosts locale settings and prefix behavior.
- Keep this file in sync with project locale policy.

### 12.2 `request.ts`

- `loadMessages` loads all namespaces for the current locale.
- Uses `getRequestConfig` and `hasLocale`.
- If namespace file missing, logs warning and proceeds.

### 12.3 `navigation.ts`

- Export wrapped next-intl router builders:
  - `Link` (use as `<Link href="...">` in app)
  - `redirect`, `usePathname`, `useRouter`, `getPathname`

## 13. Proxy and route handling (`src/proxy.ts`)

- Creates middleware composition with `next-intl/middleware`.
- Strips locale prefix for internal path matching.
- Uses `localePrefix: "always"` and `defaultLocale: "ar"`, so a visit to `/` is redirected to `/ar`.
- Auth flow:
  - if already signed in and on `/auth/`, redirect to dashboard
  - public paths are skipped (login/register/forgot etc.)
  - protected paths require cookie session, else redirect to `/auth/login`
- The matcher includes all frontend routes except assets, `_next`, and `api`.

## 14. Static rendering and locale-based routing details

You can follow the same steps as next-intl docs for enabling static rendering while supporting locale-based routing (prefix-based or domain-based). The key files are the same and their behavior matches your app:

### 14.1 route setup records

- `src/i18n/routing.ts` defines supported locales and default locale.
- `src/proxy.ts` (middleware) applies the locale middleware before auth checks.
- `src/i18n/navigation.ts` exposes localized routing helpers (`Link`, `useRouter`, etc.).
- `src/i18n/request.ts` loads translations for the matched locale.

### 14.2 app/[locale] layout and params

- Put page hierarchy under `app/[locale]`.
- `app/[locale]/layout.tsx` should validate locale with `hasLocale(routing.locales, locale)` and `notFound()` if invalid.
- call `setRequestLocale(locale)` before `useTranslations` in server components.

### 14.3 generateStaticParams

In `app/[locale]/layout.tsx` (or page), export:

```ts
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

### 14.4 setRequestLocale usage in layout and pages

#### app/[locale]/layout.tsx

```tsx
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

#### app/[locale]/page.tsx

```tsx
import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default function IndexPage({ params }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("IndexPage");

  return <h1>{t("title")}</h1>;
}
```

### 14.5 metadata localization

```ts
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title") };
}
```

### 14.6 summary of where these pieces live in this repo

- `src/i18n/routing.ts`
- `src/proxy.ts`
- `src/i18n/navigation.ts`
- `src/i18n/request.ts`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx` (and other nested pages)

## 15. Storybook / docs-like static pages

For static pages that resemble docs (menu, sidebar, etc.), ensure:

- they are inside `[locale]` routes
- `setRequestLocale` is applied in shared layout(s)
- translation keys are available in both `en` and `ar` message files
- `generateStaticParams` includes all languages.

## 14. next.config.ts

- Uses `next-intl` plugin wrapper:

```ts
import createNextIntlPlugin from "next-intl/plugin";
const nextConfig = {};
export default createNextIntlPlugin(nextConfig);
```

- No further locale-specific code is needed in Next config.

## 15. Language switcher

`src/components/language-switcher.tsx`:

- `useTranslations('header')` for labels
- `useLocale()` for current locale
- `usePathname()` to stay on current page
- `useRouter()` for push with new locale
- `useTransition()` for visual disabled state
- toggles between `en` and `ar`

## 16. Server & client component rules

### 16.1 Server components

- Key text and arrays should come from `useTranslations` on server whenever possible.
- Component structures render translation context and can pass text to client components.

### 16.2 Client components

- Handles user interactions (forms, buttons, route transitions, validation state).
- Use `useTranslations` in client components when static data is also needed at runtime, but prefer server for plain content.

## 17. Zod-based localization

### Flow (applies for default schema and server action)

#### 17.1 In client form validation (login/register)

```tsx
const loginSchema = z.object({
  email: z.string().email({ message: t("errors.invalidEmail") }),
  password: z.string().min(1, { message: t("errors.passwordRequired") }),
});
```

- Use with `zodResolver(loginSchema)`.
- `errors.*` keys should exist in the same translation namespace.

#### 17.2 In server actions (register/reset etc.)

```ts
const t = await getTranslations("auth.reset.form");
const fieldErrorMap = {
  token: t("page.invalidToken"),
  password: t("errors.passwordsMustMatch"),
};

const parsed = resetPasswordSchema.safeParse(
  { token, password },
  {
    error(issue) {
      const path = issue.path?.[0];
      if (path)
        return (
          fieldErrorMap[path as keyof typeof fieldErrorMap] ??
          t("errors.generic")
        );
      return t("errors.generic");
    },
  },
);
```

- Prefer using `page` keys for request-level issues (e.g., `page.invalidToken`) and `errors` keys for field-specific issues.

## 18. Validation checklist

1. `pnpm run build` should pass with no `MISSING_MESSAGE`.
2. `i18n-ally` should show no missing keys for all namespaces.
3. UI should render labels in both locales.
4. `LanguageSwitcher` toggles correctly.
5. Form client validation shows localized error strings.
6. Auth server actions return localized errors and success values.

## 20. i18n-ally Static Analysis Rules & Anti-Patterns

To ensure `i18n-ally` and other static tools accurately detect all keys in use and prevent **accidental deletion of active translation keys**, follow these strict rules:

### 1. Forbid Conditional/Ternary Translator Scopes

**Anti-Pattern:**

```tsx
// ❌ FORBIDDEN: i18n-ally only indexes the final branch, marking all other namespaces as unused!
const t =
  translationNamespace === "courses.share"
    ? useTranslations("courses.share")
    : translationNamespace === "articles.share"
      ? useTranslations("articles.share")
      : useTranslations("books.share");
```

**Fix:**
Provide specialized wrapper components (e.g. `<CourseShareDialog>`, `<ArticleShareDialog>`) or pass translated strings/render props directly from the caller where the namespace is known statically:

```tsx
// ✅ REQUIRED: Explicit static scope per component
const t = useTranslations("articles.share");
```

---

### 2. Forbid Dynamic Key Variables & Dynamic Casting (`t as unknown as ...`)

**Anti-Pattern:**

```tsx
// ❌ FORBIDDEN: Static analysis cannot track dynamic variable keys or aliased functions
const translate = t as unknown as (k: string) => string;
return <span>{translate(row.labelKey)}</span>;
```

**Fix:**
Use static key maps with compile-time type-safety:

```tsx
// ✅ REQUIRED: Static mapping table linking keys directly
const FEATURE_LABELS: Record<string, string> = {
  tasks: t("features.free.tasks"),
  plans: t("features.pro.plans"),
  books: t("features.pro.books"),
};
return <span>{FEATURE_LABELS[featureId]}</span>;
```

---

### 3. Namespace Redirection & Duplicate Key Name Pitfall

**Anti-Pattern:**
Calling `t("dashboard.tags.detailTitle")` when `t` is scoped to `metadata`. `next-intl` will look up `metadata.json` (which contains a duplicate `dashboard.tags.detailTitle` key), leaving the identical key in `dashboard.json` appearing unused to `i18n-ally`.
**Fix:**
Always scope `t` to the exact namespace file you intend to read from:

```tsx
// ✅ REQUIRED: Scoped to the actual namespace
const t = useTranslations("dashboard");
return <h1>{t("tags.detailTitle")}</h1>;
```

---

### 5. Forbid Custom `t()` Helper Functions in Files Without `next-intl`

**Anti-Pattern:**

```tsx
// ❌ FORBIDDEN: Defining a fake t() helper in a file without useTranslations/getTranslations
const t = (key: keyof Messages) => messages[key];
return <span>{t("title")}</span>;
```

**Why it fails:**
`i18n-ally` scans each file in isolation. When it sees `t("title")` in a component that has no `useTranslations("...")`, it assumes `"title"` is an unscoped root-level key in your translation JSON files, reporting false-positive errors like _"24 keys are missing: title, subtitle, copied..."_.

**Fix:**
Access properties on your strongly typed `messages` object directly in JSX:

```tsx
// ✅ REQUIRED: Directly access properties
return <span>{messages.title}</span>;
```

### 4. Forbid Arrays and `t.raw()`

Never store JSON arrays `[ ... ]` in message files or read them with `t.raw()`. Use keyed objects with static sub-keys instead.

## 19. Recommended maintenance

- Keep key naming consistent (example: use `auth.xxx` with nested depth, do not mix multiple paths unless explicit).
- Update both `en` and `ar` files each time.
- Validate translations automatically with `i18n-ally`, plus manual smoke UI tests.

---

End of translation documentation for Modawim. 3. Use it in JSX: `{t('newKey')}`. 4. Optionally use in server action with the same translation context. 5. Run build.

## 12. Conclusion

The translation system has now been normalized and documented for team maintenance. Keep `auth.*` and `namespace` usage consistent to avoid duplicated or missing i18n key path mapping.
