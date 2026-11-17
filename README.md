# JSONPathX playground

An interactive playground for [`@jsonpathx/jsonpathx`](https://www.npmjs.com/package/@jsonpathx/jsonpathx): run JSONPath queries against a car-listings dataset or your own JSON, in the browser.

Live: https://jsonpathx-playground.vercel.app/

It installs the **published** package at an exact version (see `package.json`), so it shows what npm users get. Nothing leaves the browser: no uploads, analytics or cookies.

## Features

- **Query editor** with real-time results, a shareable URL (`?q=`) and keyboard shortcuts (`⌘/Ctrl + /` lists them).
- **Example queries**: slicing, property access, filters, multiple conditions.
- **Datasets**: a 500-car sample loads at startup; the full dataset (28,488 cars, about 49 MB) is fetched only when you pick it from the dataset menu. Upload your own `.json` (drag and drop); small files are kept in `localStorage`.
- **Results**: pretty or compact view, recursive full-text search with highlighting, copy, download as JSON or CSV.
- **Code generator**: a runnable snippet for Node.js (ES modules or CommonJS), TypeScript or a browser page, for the current query.
- **History and favourites** (`localStorage`), **performance analytics** per run, **light/dark/auto theme**.

Filters run in jsonpathx's RFC 9535 filter mode (`filterMode: 'rfc'`), which evaluates them without `eval`, so the page works under a strict Content-Security-Policy. Both `[?@.price < 10]` and the jsonpath-plus form `[?(@.price < 10)]` work; arbitrary JavaScript inside filters does not.

## Development

Node.js 22.12 or later (`.nvmrc` pins 26).

```bash
npm ci
npm run dev        # http://localhost:3000
npm run typecheck
npm run lint       # ESLint, no warnings allowed
npm test           # Vitest + Testing Library
npm run build      # -> dist/
npm run preview    # serves dist/ with the production security headers
```

`public/cars-sample.json` is generated from `public/cars.json` with `node scripts/make-cars-sample.mjs [count]`.

## Deployment

Vercel, framework preset Vite, default build and output settings. `vercel.json` only sets the security headers (CSP `'self'`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`); Vercel adds HSTS. `vite preview` serves the same headers, so the CSP is tested locally.

## Stack

React 19, Vite 8, TypeScript 6, Tailwind CSS 4, ESLint 10 (flat config), Vitest.
