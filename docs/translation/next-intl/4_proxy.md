Skip to content
Docs
LearnNew!
Examples
Blog
GitHub

    Getting started
        App Router
        Pages Router
    Usage guide
        Translations
        Numbers
        Dates and times
        Lists
        Request configuration
        useExtracted
        Next.js plugin
    Routing
        Setup
        Configuration
        Proxy / middleware
        Navigation
    Environments
        Server & Client Components
        Server Actions, Metadata & Route Handlers
        Error files (e.g. not-found)
        Testing
        Core library
        Runtime requirements
    Workflows & integrations
        TypeScript augmentation
        Localization management with Crowdin
        VSCode integration
        Storybook
        Validating messages
    Design principles

Presented by

On This Page

    Locale detection
    Prefix-based routing (default)
    Domain-based routing
    Matcher config
    Composing other middlewares
    Example: Additional rewrites
    Starter templates (auth, saas, tenants)
    Usage without proxy / middleware (static export)
    Troubleshooting
    ”The proxy / middleware doesn’t run for a particular page.”
    ”My page content isn’t localized despite the pathname containing a locale prefix.”
    ”Unable to find next-intl locale because the proxy / middleware didn’t run on this request and no locale was returned in getRequestConfig.”

Edit this page
Docs
Routing
Proxy / middleware
Proxy / middleware

The next-intl middleware can be created via createMiddleware.

It receives a routing configuration and takes care of:

    Locale negotiation
    Applying relevant redirects & rewrites
    Providing alternate links for search engines

Example:
proxy.ts

import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
// Match all pathnames except for
// - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
// - … the ones containing a dot (e.g. `favicon.ico`)
matcher: '/((?!api|trpc|\_next|\_vercel|._\\.._).\*)'
};

Note: proxy.ts was called middleware.ts up until Next.js 16.
Locale detection

The locale is negotiated based on your routing configuration, taking into account your settings for localePrefix, domains, localeDetection, and localeCookie.
Prefix-based routing (default)

Prefer to watch a video?
Prefix-based routing

By default, prefix-based routing is used to determine the locale of a request.

In this case, the locale is detected based on these priorities:

    A locale prefix is present in the pathname (e.g. /en/about)
    A cookie is present that contains a previously detected locale
    A locale can be matched based on the accept-language header
    As a last resort, the defaultLocale is used

To change the locale, users can visit a prefixed route. This will take precedence over a previously matched locale that is saved in a cookie or the accept-language header and will update a previous cookie value.

Example workflow:

    A user requests / and based on the accept-language header, the en locale is matched.
    The user is redirected to /en.
    The app renders <Link locale="de" href="/">Switch to German</Link> to allow the user to change the locale to de.
    When the user clicks on the link, a request to /de is initiated.
    The middleware will add a cookie to remember the preference for the de locale.
    The user later requests / again and the middleware will redirect to /de based on the cookie.

Domain-based routing

Prefer to watch a video?
Domain-based routing

If you’re using the domains setting, the middleware will match the request against the available domains to determine the best-matching locale. To retrieve the domain, the host is read from the x-forwarded-host header, with a fallback to host (hosting platforms typically provide these headers out of the box).

The locale is detected based on these priorities:

    A locale prefix is present in the pathname (e.g. ca.example.com/fr)
    A locale is stored in a cookie and is supported on the domain
    A locale that the domain supports is matched based on the accept-language header
    As a fallback, the defaultLocale of the domain is used

Since the middleware is aware of all your domains, if a domain receives a request for a locale that is not supported (e.g. en.example.com/fr), it will redirect to an alternative domain that does support the locale.

Example workflow:

    The user requests us.example.com and based on the defaultLocale of this domain, the en locale is matched.
    The app renders <Link locale="fr" href="/">Switch to French</Link> to allow the user to change the locale to fr.
    When the link is clicked, a request to us.example.com/fr is initiated.
    The middleware recognizes that the user wants to switch to another domain and responds with a redirect to ca.example.com/fr.

Matcher config

The middleware is intended to only run on pages, not on arbitrary files that you serve independently of the user locale (e.g. /favicon.ico).

A popular strategy is to match all routes that don’t start with certain segments (e.g. /\_next) and also none that include a dot (.) since these typically indicate static files. However, if you have some routes where a dot is expected (e.g. /users/jane.doe), you should explicitly provide a matcher for these.
proxy.ts

export const config = {
// Matcher entries are linked with a logical "or", therefore
// if one of them matches, the middleware will be invoked.
matcher: [
// Match all pathnames except for
// - … if they start with `/api`, `/_next` or `/_vercel`
// - … the ones containing a dot (e.g. `favicon.ico`)
'/((?!api|\_next|\_vercel|._\\.._).\*)',

    // However, match all pathnames within `/users`, optionally with a locale prefix
    '/([\\w-]+)?/users/(.+)'

]
};

Note that some third-party providers like Vercel Analytics typically use internal endpoints that are then rewritten to an external URL (e.g. /\_vercel/insights/view). Make sure to exclude such requests from your middleware matcher so they aren’t rewritten by accident.
Composing other middlewares

By calling createMiddleware, you’ll receive a function of the following type:

function middleware(request: NextRequest): NextResponse;

If you need to incorporate additional behavior, you can either modify the request before the next-intl middleware receives it, modify the response or even create the middleware based on dynamic configuration.
proxy.ts

import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';

export default async function proxy(request: NextRequest) {
// Step 1: Use the incoming request (example)
const defaultLocale = request.headers.get('x-your-custom-locale') || 'en';

// Step 2: Create and call the next-intl middleware (example)
const handleI18nRouting = createMiddleware({
locales: ['en', 'de'],
defaultLocale
});
const response = handleI18nRouting(request);

// Step 3: Alter the response (example)
response.headers.set('x-your-custom-locale', defaultLocale);

return response;
}

export const config = {
// Match only internationalized pathnames
matcher: '/((?!api|trpc|\_next|\_vercel|._\\.._).\*)'
};

Example: Additional rewrites

If you need to handle rewrites apart from the ones provided by next-intl, you can call NextResponse.rewrite() conditionally after the next-intl middleware has run.

This example rewrites requests for /[locale]/profile to /[locale]/profile/new if a special cookie is set.
proxy.ts

import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
let response = handleI18nRouting(request);

// Additional rewrite when NEW_PROFILE cookie is set
if (response.ok) {
// (not for errors or redirects)
const [, locale, ...rest] = new URL(
response.headers.get('x-middleware-rewrite') || request.url
).pathname.split('/');
const pathname = '/' + rest.join('/');

    if (
      pathname === '/profile' &&
      request.cookies.get('NEW_PROFILE')?.value === 'true'
    ) {
      response = NextResponse.rewrite(
        new URL(`/${locale}/profile/new`, request.url),
        {headers: response.headers}
      );
    }

}

return response;
}

export const config = {
// Match only internationalized pathnames
matcher: '/((?!api|trpc|\_next|\_vercel|._\\.._).\*)'
};

You may wish to customize this based on your routing configuration and use case.
Starter templates (auth, saas, tenants)

🌐 learn.next-intl.dev provides additional starter templates with middleware composition.

Including:

    app-router-auth with Better Auth: Auth-protected app with locale from user settings.
    app-router-saas with Better Auth: Locale prefixes on public routes with a login to a protected app.
    app-router-tenants: An advanced composition pattern that routes between multiple tenants and a landing page while supporting multiple locales.

Source code
Usage without proxy / middleware (static export)

If you’re using the static export feature from Next.js (output: 'export'), a proxy / middleware will not run. You can use prefix-based routing nonetheless to internationalize your app, but a few tradeoffs apply.

Static export limitations:

    Using a locale prefix is required (same as localePrefix: 'always')
    The locale can’t be negotiated on the server (same as localeDetection: false)
    You can’t use pathnames, as these require server-side rewrites
    Static rendering is required

Additionally, other limitations as documented by Next.js will apply too.

If you choose this approach, you might want to enable a redirect at the root of your app:
app/page.tsx

import {redirect} from 'next/navigation';

// Redirect the user to the default locale when `/` is requested
export default function RootPage() {
redirect('/en');
}

If you add such a root page at app/page.tsx, you need to add a root layout at app/layout.tsx as well, even if it’s just passing children through:
app/layout.tsx

export default function RootLayout({children}) {
return children;
}

Troubleshooting
”The proxy / middleware doesn’t run for a particular page.”

To resolve this, make sure that:

    The proxy / middleware is set up in the correct file (e.g. src/proxy.ts).
    Your matcher correctly matches all routes of your application, including dynamic segments with potentially unexpected characters like dots (e.g. /users/jane.doe).
    In case you’re composing other middlewares, ensure that the middleware is called correctly.
    In case you require static rendering, make sure to follow the static rendering guide instead of relying on hacks like force-static.

”My page content isn’t localized despite the pathname containing a locale prefix.”

This is very likely the result of your proxy / middleware not running on the request. As a result, a potential fallback from i18n/request.ts might be applied.
”Unable to find next-intl locale because the proxy / middleware didn’t run on this request and no locale was returned in getRequestConfig.”

If the middleware is not expected to run on this request (e.g. because you’re using a setup without locale-based routing, you should explicitly return a locale from getRequestConfig to recover from this error.

If the middleware is expected to run, verify that your middleware is set up correctly.

Note that next-intl will invoke the notFound() function to abort the render if no locale is available after getRequestConfig has run. You should consider adding a not-found page due to this.
Last updated on March 13, 2026
Configuration
Navigation

Docs ·

Learn ·

Examples ·

Blog ·

X ·

Bluesky ·

GitHub ·

Hosted on

Proxy / middleware – Internationalization (i18n) for Next.js
