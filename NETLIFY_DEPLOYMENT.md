# 🚀 Netlify Deployment Guide for G-Bax

This guide will help you deploy G-Bax to Netlify with all the necessary configurations.

## 📋 Prerequisites

- GitHub repository with your G-Bax code
- Netlify account (free tier works fine)

## 🔧 Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has the following files (already included):
- `netlify.toml` - Netlify configuration
- `next.config.js` - Next.js configuration for static export
- `package.json` - Updated with Netlify build scripts

### 2. Connect to Netlify

1. **Login to Netlify**: Go to [netlify.com](https://netlify.com) and sign in
2. **New Site**: Click "New site from Git"
3. **Connect Repository**: Choose GitHub and select the G-Bax repository (`olubunmitosin/g-bax`)
4. **Configure Build Settings**:
   - **Build command**: `npm run build` (auto-detected from netlify.toml)
   - **Publish directory**: `out` (auto-detected from netlify.toml)
   - **Node version**: 18 (configured in netlify.toml)

### 3. Environment Variables

Set up environment variables in Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` or `mainnet` | ✅ Yes |
| `NODE_VERSION` | `18` | ✅ Yes |
| `NEXT_TELEMETRY_DISABLED` | `1` | ✅ Yes |

### 4. Deploy

1. **Trigger Deploy**: Click "Deploy site" or push to your main branch
2. **Monitor Build**: Watch the deploy log for any issues
3. **Test Site**: Once deployed, test all functionality

## 🔧 Configuration Details

### netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "out"
  environment = { NODE_VERSION = "18" }

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
  NPM_FLAGS = "--production=false"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

# Cache optimization
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Next.js Configuration

The `next.config.js` is configured for static export:

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // ... webpack and other configs
};
```

## 🎯 Build Process

### What Happens During Build

1. **Install Dependencies**: `npm install`
2. **Build Next.js App**: `next build`
3. **Static Export**: Generates static files in `out/` directory
4. **Deploy**: Netlify serves files from `out/` directory

### Build Scripts

```json
{
  "scripts": {
    "build": "next build",
    "build:netlify": "npm run build && npm run export",
    "export": "next export"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### Build Fails with "Module not found"
- **Solution**: Check that all dependencies are in `package.json`
- **Command**: `npm install` locally to verify

#### Static Export Issues
- **Problem**: Some Next.js features don't work with static export
- **Solution**: Avoid server-side features like `getServerSideProps`

#### Environment Variables Not Working
- **Check**: Variables are set in Netlify dashboard
- **Verify**: Variables start with `NEXT_PUBLIC_` for client-side access

#### 3D Scene Not Loading
- **Cause**: Three.js assets not loading properly
- **Solution**: Ensure all assets are in `public/` directory

### Debug Steps

1. **Check Build Logs**: Look for errors in Netlify deploy log
2. **Test Locally**: Run `npm run build` locally first
3. **Environment Variables**: Verify all required variables are set
4. **Browser Console**: Check for JavaScript errors after deployment

## 🚀 Performance Optimization

### Netlify Features to Enable

1. **Asset Optimization**: Auto-enabled for images and CSS
2. **Brotli Compression**: Enable in Site settings → Build & deploy
3. **CDN**: Automatically enabled for global distribution

### Caching Strategy

- **Static Assets**: Cached for 1 year (`max-age=31536000`)
- **HTML Files**: Cached with validation
- **API Routes**: Not cached (if using Netlify Functions)

## 🔐 Security

### Headers Configured

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `X-Content-Type-Options: nosniff` - MIME type sniffing protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control

### Wallet Security

- All wallet interactions happen client-side
- No private keys stored on server
- Solana network connections are secure

## 📊 Monitoring

### Netlify Analytics

Enable Netlify Analytics to monitor:
- Page views and unique visitors
- Top pages and referrers
- Performance metrics
- Bandwidth usage

### Error Tracking

Consider adding error tracking:
- Sentry for JavaScript errors
- LogRocket for user session replay
- Custom error boundaries in React

## 🔄 Continuous Deployment

### Auto-Deploy Setup

1. **Branch Protection**: Set main branch as production
2. **Deploy Previews**: Enable for pull requests
3. **Build Hooks**: Set up webhooks for external triggers

### Deploy Contexts

```toml
# Production (main branch)
[context.production]
  command = "npm run build"

# Deploy previews (pull requests)
[context.deploy-preview]
  command = "npm run build"

# Branch deploys
[context.branch-deploy]
  command = "npm run build"
```

## 📞 Support

### Getting Help

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Community**: Netlify Community Forum

### Common Resources

- [Netlify Next.js Guide](https://docs.netlify.com/frameworks/next-js/)
- [Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Environment Variables Guide](https://docs.netlify.com/environment-variables/overview/)

---

**🎉 Your G-Bax game should now be successfully deployed on Netlify!**

Visit your Netlify site URL to see your blockchain space exploration game live on the web.
