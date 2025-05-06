# Vercel Deployment Checklist for LMS

## Pre-Deployment Steps
- [x] Fix ESLint errors in client code
- [x] Update vercel.json configuration for proper routing
- [x] Create .env.production file with correct API URL
- [x] Optimize server-side package size (package-vercel.json)

## Vercel Environment Variables to Set
- [ ] MONGO_URI - Your MongoDB connection string
- [ ] JWT_SECRET - Secret for signing JWT tokens
- [ ] NODE_ENV - Set to "production"

## Deployment Steps
1. Push code to your Git repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Common Deployment Issues
- [x] 404 NOT_FOUND errors: Fixed by updating route configuration in vercel.json
- [x] API routing issues: Added proper routes for /api paths
- [x] Client-side routing issues: Added catch-all route to serve index.html for client routes
- [x] MongoDB connection in production: Make sure MONGO_URI environment variable is set in Vercel

## Post-Deployment Checks
- [ ] Visit homepage (should load without errors)
- [ ] Test authentication flow (register/login)
- [ ] Test API endpoints (/api/health should work)
- [ ] Test course viewing and enrollment
- [ ] Test assessment functionality