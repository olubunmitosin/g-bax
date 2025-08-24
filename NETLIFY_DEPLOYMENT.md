# Netlify Deployment Guide for G-Bax

This guide explains how to deploy the G-Bax project (frontend + backend) to Netlify.

## Overview

The project is configured to deploy:
- **Frontend**: Next.js static export to Netlify CDN
- **Backend**: Node.js API as Netlify Functions

## Prerequisites

1. Netlify account
2. GitHub repository connected to Netlify
3. Environment variables configured

## Environment Variables

Set these environment variables in your Netlify dashboard:

### Frontend Variables
```
NEXT_PUBLIC_SOLANA_NETWORK=honeynet
NEXT_PUBLIC_HONEYCOMB_API_KEY=your_api_key_if_needed
```

### Backend Variables (Required for Netlify Functions)
```
NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY=[1,2,3,4,5...] # JSON array format
NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS=GritFT3Zc6jw9SK6Q5kjfeF9iaKpzUvYTcabjyD2ctqa
NEXT_PUBLIC_HONEYCOMB_PROFILES_TREE_ADDRESS=HnpXrMjymEJE719STc2SuhpkWo7ZoDfudPrdDuxc1L5s
NEXT_PUBLIC_HONEYCOMB_RPC_URL=https://rpc.test.honeycombprotocol.com
NEXT_PUBLIC_HONEYCOMB_ENVIRONMENT=honeynet
```

### Database Variables (Required for Production)
```
# For Netlify deployment (recommended - automatically configured)
NETLIFY_DATABASE_URL=postgresql://username:password@hostname:port/database # Netlify Neon integration

# For other production environments
DATABASE_URL=postgresql://username:password@hostname:port/database # Standard PostgreSQL connection string
# OR
NEON_DATABASE_URL=postgresql://username:password@hostname:port/database # Alternative name for Neon
```

## Deployment Steps

### 1. Configure Netlify Site

1. Go to your Netlify dashboard
2. Connect your GitHub repository
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Functions directory**: `netlify/functions`

### 2. Set Environment Variables

1. Go to Site settings > Environment variables
2. Add all the environment variables listed above
3. Make sure to use the exact same values from your `.env.local` file

### 3. Deploy

1. Push your code to GitHub
2. Netlify will automatically build and deploy
3. Check the deploy logs for any errors

## API Endpoints

After deployment, your API will be available at:

```
https://your-site-name.netlify.app/.netlify/functions/health
https://your-site-name.netlify.app/.netlify/functions/create-profile
https://your-site-name.netlify.app/.netlify/functions/profile/[player-address]
```

The frontend will automatically use these endpoints via the `/api/*` redirects.

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure all required environment variables are set
2. **Build Errors**: Check that all dependencies are listed in `package.json`
3. **Function Timeouts**: Netlify Functions have a 10-second timeout limit
4. **CORS Issues**: Functions include CORS headers automatically

### Debug Steps

1. Check Netlify deploy logs
2. Test functions individually: `https://your-site.netlify.app/.netlify/functions/health`
3. Check browser network tab for API calls
4. Review function logs in Netlify dashboard

## File Structure

```
├── netlify/
│   └── functions/
│       ├── create-profile.js      # POST /api/create-profile
│       ├── health.js              # GET /api/health
│       ├── profile/
│       │   └── [player].js        # GET /api/profile/[player]
│       └── package.json           # Function dependencies
├── netlify.toml                   # Netlify configuration
└── backend/                       # Original backend code (reused by functions)
```

## Notes

- Functions automatically handle CORS
- Environment variables are available in functions
- Functions use the same backend controller logic
- Static assets are served from CDN
- API calls are routed to functions via redirects
