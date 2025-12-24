# Local Development Setup Guide

## Issues Found

### 1. **Google Fonts SSL Certificate Error** (Main Issue)
- **Problem**: Next.js fails to fetch Google Fonts during build due to SSL certificate verification
- **Why it works on Vercel**: Vercel has proper SSL certificates configured
- **Why it fails locally**: Your local environment can't verify Google's SSL certificates

### 2. **Node Modules Permission Error**
- **Problem**: "Operation not permitted" when reading Next.js files from node_modules
- **Solution**: Clean reinstall of dependencies (already done)

## External Dependencies Found

### No API Keys Required ✅
The app doesn't use any API keys that need configuration. All functionality is client-side.

### External Services Used:
1. **Google Fonts** (Space Grotesk, Inter, JetBrains Mono)
   - Used in: `app/layout.tsx`
   - Issue: SSL certificate verification during build
   
2. **BigDataCloud Reverse Geocoding API** (Optional)
   - Used in: `app/onboarding/page.tsx` (line 102-103)
   - Purpose: Auto-detect location from GPS coordinates
   - No API key required - free public API
   - Client-side only, doesn't affect build

## Solutions

### Option 1: Fix SSL Certificate Issue (Recommended for Development)

Add this to your `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip SSL verification for Google Fonts during development
  // WARNING: Only use in development, not production
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      serverActions: {
        bodySizeLimit: '2mb',
      },
    },
  }),
};

export default nextConfig;
```

Then run dev server with:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

### Option 2: Use Local Font Files (More Secure)

Download fonts and use them locally instead of Google Fonts.

### Option 3: Fix System SSL Certificates

Update your system's CA certificates:
```bash
# macOS
brew install ca-certificates
```

## Current Status

- ✅ Error components created (`error.tsx`, `not-found.tsx`, `global-error.tsx`)
- ✅ Dependencies installed
- ✅ ESLint version conflict resolved
- ⚠️ Google Fonts SSL issue blocking build
- ⚠️ Node modules permission issue (may need system-level fix)

## Quick Fix for Development

Run the dev server with SSL verification disabled:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

**Note**: This is only safe for local development. Never use this in production.

