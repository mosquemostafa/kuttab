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

    defineRouting
    localePrefix
    localePrefix: 'always' (default)
    localePrefix: 'as-needed'
    localePrefix: 'never'
    prefixes
    pathnames
    domains
    localeDetection
    localeCookie
    alternateLinks (hreflang)
    next.config.ts
    basePath
    trailingSlash

Edit this page
Docs
Routing
Configuration
Routing configuration
defineRouting

The routing configuration that is shared between the middleware and the navigation APIs can be defined with the defineRouting function.
src/i18n/routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// A list of all locales that are supported
locales: ['en', 'de'],

// Used when no locale matches
defaultLocale: 'en'
});

Depending on your routing needs, you may wish to consider further settings—see below.

localePrefix

By default, the pathnames of your app will be available under a prefix that matches your directory structure (e.g. /en/about → app/[locale]/about/page.tsx). You can however adapt the routing to optionally remove the prefix or customize it per locale by configuring the localePrefix setting.

Learn more:
Prefix-based routing
localePrefix: 'always' (default)

By default, pathnames always start with the locale (e.g. /en/about).
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...
localePrefix: 'always'
});

localePrefix: 'as-needed'

If you want to use no prefix for the default locale (e.g. /about) while keeping it for other locales (e.g. /de/about), you can configure your routing accordingly:
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...
localePrefix: 'as-needed'
});

Note that:

    If you use this routing strategy, make sure that your matcher detects unprefixed pathnames.
    The middleware will by default set a cookie to remember the user’s locale preference. If no explicit locale prefix is present in the pathname, then locale detection will potentially redirect users to the latest locale that was matched based on the cookie value (e.g. / → /de).
    If a superfluous locale prefix like /en/about is requested, the middleware will automatically redirect to the unprefixed version /about. This can be helpful in case you’re redirecting from another locale and you want to update a potential cookie value first (e.g. <Link /> relies on this mechanism).

localePrefix: 'never'

If you’d like to provide a locale to next-intl, e.g. based on user settings, you can consider not using locale-based routing in the first place.

However, you can also configure the middleware to never show a locale prefix in the URL, which can be helpful in the following cases:

    You want to use domain-based routing and there’s only one locale per domain
    You want to use a cookie to determine the locale while enabling static rendering

routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...
localePrefix: 'never'
});

In this case, requests for all locales will be rewritten to have the locale only prefixed internally. You still need to place all your pages inside a [locale] folder for the routes to be able to receive the locale param.

Note that:

    If you use this routing strategy, make sure that your matcher detects unprefixed pathnames.
    Alternate links are disabled in this mode since URLs might not be unique per locale. Due to this, consider including these yourself, or set up a sitemap that links localized pages via alternates.
    You can consider increasing the maxAge attribute of the locale cookie to a longer duration to remember the user’s preference across sessions.

prefixes

If you’d like to customize the user-facing prefix, you can provide a locale-based mapping:
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
locales: ['en-US', 'de-AT', 'zh'],
defaultLocale: 'en-US',
localePrefix: {
mode: 'always',
prefixes: {
'en-US': '/us',
'de-AT': '/eu/at'
// (/zh will be used as-is)
}
}
});

Note that:

    You should adapt your matcher to match the custom prefixes.
    Custom prefixes are only visible to the user and rewritten internally to the corresponding locale. Therefore, the [locale] segment corresponds to the locale, not the prefix.

pathnames

Prefer to watch a video?
Localized pathnames

Many apps choose to localize pathnames, especially when search engine optimization is relevant.

Example:

    /en/about
    /de/über-uns

Since you typically want to define these routes only once internally, you can use the next-intl middleware to rewrite such incoming requests to shared pathnames.
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
locales: ['en-US', 'en-UK', 'de'],
defaultLocale: 'en-US',

// The `pathnames` object holds pairs of internal and
// external paths. Based on the locale, the external
// paths are rewritten to the shared, internal ones.
pathnames: {
// If all locales use the same pathname, a single
// external path can be used for all locales
'/': '/',
'/blog': '/blog',

    // If locales use different paths, you can
    // specify the relevant external pathnames
    '/services': {
      de: '/leistungen'
    },

    // Encoding of non-ASCII characters is handled
    // automatically where relevant
    '/about': {
      de: '/über-uns'
    },

    // Dynamic params are supported via square brackets
    '/news/[articleSlug]': {
      de: '/neuigkeiten/[articleSlug]'
    },

    // Static pathnames that overlap with dynamic segments
    // will be prioritized over the dynamic segment
    '/news/just-in': {
      de: '/neuigkeiten/aktuell'
    },

    // Also (optional) catch-all segments are supported
    '/categories/[...slug]': {
      de: '/kategorien/[...slug]'
    }

}
});

Localized pathnames map to a single internal pathname that is created via the file-system based routing in Next.js. In the example above, /de/über-uns will be handled by the page at /[locale]/about/page.tsx.

domains

Prefer to watch a video?
Domain-based routing

If you want to serve your localized content based on different domains, you can provide a list of mappings between domains and locales via the domains setting.

Examples:

    us.example.com: en-US
    ca.example.com: en-CA
    ca.example.com/fr: fr-CA
    fr.example.com: fr-FR

In many cases, domains are combined with a localePrefix setting to achieve results as shown above. Also custom prefixes can be used to customize the user-facing prefix per locale.
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
locales: ['en-US', 'en-CA', 'fr-CA', 'fr-FR'],
defaultLocale: 'en-US',
domains: [
{
domain: 'us.example.com',
defaultLocale: 'en-US',
locales: ['en-US']
},
{
domain: 'ca.example.com',
defaultLocale: 'en-CA',
locales: ['en-CA', 'fr-CA']
},
{
domain: 'fr.example.com',
defaultLocale: 'fr-FR',
locales: ['fr-FR']
}
],
localePrefix: {
mode: 'as-needed',
prefixes: {
// Cleaner prefix for `ca.example.com/fr`
'fr-CA': '/fr'
}
}
});

Locales are required to be unique across domains, therefore regional variants are typically used to avoid conflicts. Note however that you don’t necessarily need to provide messages for each locale if the overall language is sufficient for your use case.

If no domain matches, the middleware will fall back to default locale matching based on prefixes (e.g. on localhost, for local development).

See also: Domain-based routing

localeDetection

The middleware will detect a matching locale based on your routing configuration & the incoming request and will either pass the request through for a matching locale or redirect to one that matches.

If you want to rely entirely on the URL to resolve the locale, you can set the localeDetection property to false. This will disable locale detection based on the accept-language header and a potentially existing cookie value from a previous visit.
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...
localeDetection: false
});

In this case, only the locale prefix and a potentially matching domain are used to determine the locale.
localeCookie

If a user changes the locale to a value that doesn’t match the accept-language header, next-intl will set a session cookie called NEXT_LOCALE that contains the most recently detected locale. This is used to remember the user’s locale preference for subsequent requests.

By default, the cookie will be configured with the following attributes:

    sameSite: This value is set to lax so that the cookie can be set when coming from an external site.
    path: This value is not set by default, but will use the value of your basePath if configured.

If you have more specific requirements, you can adjust these settings accordingly:
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...

// Will be merged with the defaults
localeCookie: {
// Custom cookie name
name: 'USER*LOCALE',
// Expire in one year
maxAge: 60 * 60 \_ 24 \* 365
}
});

… or turn the cookie off entirely:
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...

localeCookie: false
});

alternateLinks (hreflang)

The middleware automatically sets the link header to inform search engines that your content is available in different languages. Note that this automatically integrates with your routing strategy and will generate the correct links based on your configuration.

However, there are cases where you may want to provide these links yourself:

    You have pages that are only available for certain locales
    You’re using an external system like a CMS to manage pathnames of your pages

In this case, you can opt-out of this behavior by setting alternateLinks to false:
routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
// ...

alternateLinks: false
});

Learn more:
hreflang & canonicals
Sitemaps

next.config.ts

Apart from your routing configuration, next-intl will also incorporate settings from next.config.ts.
basePath

The middleware as well as the navigation APIs will automatically consider a basePath that you might have configured in your Next.js config.

The only exception is the getPathname function, which will return the bare pathname without a base path. Due to this, you can prefix the returned pathname manually if you need to.

When using a base path, you should make sure that your matcher handles an explicit root:
proxy.ts

export const config = {
// The `matcher` is relative to the `basePath`
matcher: [
// This entry handles the root of the base
// path and should always be included
'/'

    // ... other matcher config

]
};

trailingSlash

If you have trailingSlash set to true in your Next.js config, this setting will be taken into account by the middleware and the navigation APIs.

Note that if you’re using pathnames, your internal and external pathnames can be defined either with or without a trailing slash as they will be normalized internally.
Last updated on November 14, 2025
Setup
Proxy / middleware

Docs ·

Learn ·

Examples ·

Blog ·

X ·

Bluesky ·

GitHub ·

Hosted on

Routing configuration – Internationalization (i18n) for Next.js
