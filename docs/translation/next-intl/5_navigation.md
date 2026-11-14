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

    APIs
    Link
    useRouter
    usePathname
    redirect
    getPathname

Edit this page
Docs
Routing
Navigation
Navigation APIs

Prefer to watch a video?
Navigation APIs

next-intl provides lightweight wrappers around Next.js’ navigation APIs like <Link /> and useRouter that automatically handle the user locale and pathnames behind the scenes.

To create these APIs, you can call the createNavigation function with your routing configuration:
navigation.ts

import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

export const {Link, redirect, usePathname, useRouter, getPathname} =
createNavigation(routing);

This function is typically called in a central module like src/i18n/navigation.ts in order to provide easy access to navigation APIs in your components.

APIs

The created navigation APIs are thin wrappers around the equivalents from Next.js and mostly adhere to the same function signatures. Your routing configuration and the user’s locale are automatically incorporated.

If you’re using the pathnames setting in your routing configuration, the internal pathnames that are accepted for href arguments will be strictly typed and localized to the given locale.
Link

This component wraps next/link and localizes the pathname as necessary.

import {Link} from '@/i18n/navigation';

// When the user is on `/en`, the link will point to `/en/about`

<Link href="/about">About</Link>
 
// Search params can be added via `query`
<Link href={{pathname: "/users", query: {sortBy: 'name'}}}>Users</Link>
 
// You can override the `locale` to switch to another language
// (this will set the `hreflang` attribute on the anchor tag)
<Link href="/" locale="de">Switch to German</Link>

Depending on if you’re using the pathnames setting, dynamic params can either be passed as:

// 1. A final string (when not using `pathnames`)

<Link href="/users/12">Susan</Link>
 
// 2. An object (when using `pathnames`)
<Link href={{
  pathname: '/users/[userId]',
  params: {userId: '5'}
}}>
  Susan
</Link>

useRouter

If you need to navigate programmatically, e.g. in an event handler, next-intl provides a convience API that wraps useRouter from Next.js and localizes the pathname accordingly.

'use client';

import {useRouter} from '@/i18n/navigation';

const router = useRouter();

// When the user is on `/en`, the router will navigate to `/en/about`
router.push('/about');

// Search params can be added via `query`
router.push({
pathname: '/users',
query: {sortBy: 'name'}
});

// You can override the `locale` to switch to another language
router.replace('/about', {locale: 'de'});

Depending on if you’re using the pathnames setting, dynamic params can either be passed as:

// 1. A final string (when not using `pathnames`)
router.push('/users/12');

// 2. An object (when using `pathnames`)
router.push({
pathname: '/users/[userId]',
params: {userId: '5'}
});

usePathname

To retrieve the current pathname without a potential locale prefix, you can call usePathname.

'use client';

import {usePathname} from '@/i18n/navigation';

// When the user is on `/en`, this will be `/`
const pathname = usePathname();

Note that if you’re using the pathnames setting, the returned pathname will correspond to an internal pathname template (dynamic params will not be replaced by their values).

// When the user is on `/de/über-uns`, this will be `/about`
const pathname = usePathname();

// When the user is on `/de/neuigkeiten/produktneuheit`,
// this will be `/news/[articleSlug]`
const pathname = usePathname();

redirect

If you want to interrupt the render and redirect to another page, you can invoke the redirect function. This wraps redirect from Next.js and localizes the pathname as necessary.

Note that a locale prop is always required, even if you’re just passing the current locale.

import {redirect} from '@/i18n/navigation';

// Redirects to `/en/login`
redirect({href: '/login', locale: 'en'});

// Search params can be added via `query`
redirect({href: '/users', query: {sortBy: 'name'}, locale: 'en'});

Depending on if you’re using the pathnames setting, dynamic params can either be passed as:

// 1. A final string (when not using `pathnames`)
redirect({href: '/users/12', locale: 'en'});

// 2. An object (when using `pathnames`)
redirect({
href: {
pathname: '/users/[userId]',
params: {userId: '5'}
},
locale: 'en'
});

When using a localePrefix setting other than always, you can enforce a locale prefix by setting the forcePrefix option to true. This is useful when changing the user’s locale and you need to update the locale cookie first:

// Will initially redirect to `/en/about` to update the locale
// cookie, regardless of your `localePrefix` setting
redirect({href: '/about', locale: 'en', forcePrefix: true});

permanentRedirect is supported too.

getPathname

If you need to construct a particular pathname based on a locale, you can call the getPathname function.

import {getPathname} from '@/i18n/navigation';

// Will return `/en/about`
const pathname = getPathname({
locale: 'en',
href: '/about'
});

// Search params can be added via `query`
const pathname = getPathname({
locale: 'en',
href: {
pathname: '/users',
query: {sortBy: 'name'}
}
});

Depending on if you’re using the pathnames setting, dynamic params can either be passed as:

// 1. A final string (when not using `pathnames`)
const pathname = getPathname({
locale: 'en',
href: '/users/12'
});

// 2. An object (when using `pathnames`)
const pathname = getPathname({
locale: 'en',
href: {
pathname: '/users/[userId]',
params: {userId: '5'}
}
});

Use cases:
Sitemaps
hreflang & canonicals
Last updated on November 14, 2025
Proxy / middleware
Environments

Docs ·

Learn ·

Examples ·

Blog ·

X ·

Bluesky ·

GitHub ·

Hosted on

Navigation APIs – Internationalization (i18n) for Next.js
