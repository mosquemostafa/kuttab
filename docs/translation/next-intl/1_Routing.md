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
Edit this page
Docs
Routing
Routing

next-intl integrates with Next.js’ routing system in two places:

    Proxy / middleware: Negotiates the locale and handles redirects & rewrites (e.g. / → /en)
    Navigation APIs: Lightweight wrappers around Next.js’ navigation APIs like <Link />

This enables you to express your app in terms of APIs like <Link href="/about">, while aspects like the locale and user-facing pathnames are automatically handled behind the scenes (e.g. /de/über-uns).
Set up routing→
Configuration→
Proxy / middleware→
Navigation APIs→

Prefer to watch a video?
Locale-based routing
Last updated on October 22, 2025
Next.js plugin
Setup

Docs ·

Learn ·

Examples ·

Blog ·

X ·

Bluesky ·

GitHub ·

Hosted on

Routing – Internationalization (i18n) for Next.js
