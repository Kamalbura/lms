# Vercel Deployment Checklist for LMS Application

## Before Deployment

1. Ensure you have the following:
   - A MongoDB Atlas cluster set up (free tier or paid)
   - Cloudinary account (for file uploads)
   - Vercel account

## Environment Variables Setup

When deploying to Vercel, add the following environment variables in your Vercel project settings:

### Required Environment Variables

- `NODE_ENV`: Set to `production`
- `MONGO_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/lms`)
- `JWT_SECRET`: A secure random string for JWT authentication
- `JWT_EXPIRE`: Token expiration time (e.g., `7d`)

### Cloudinary Configuration (For File Uploads)

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## Deployment Steps

1. Ensure your code is committed to your repository

2. Run the deployment:
   ```
   vercel
   ```
   Or if you're redeploying:
   ```
   vercel --prod
   ```

3. If asked during deployment process:
   - Select your project scope
   - Create a new project or link to existing (select "no" to create new)
   - Enter your project name (e.g., "lms")
   - Confirm the root directory (./ or current directory)

4. After deployment completes, go to the Vercel dashboard:
   - Navigate to your project
   - Go to "Settings" > "Environment Variables"
   - Add all the required environment variables listed above

5. Redeploy your project after setting environment variables:
   ```
   vercel --prod
   ```

## Troubleshooting Common Issues

### Build Errors

If you encounter build errors:
1. Check the Vercel build logs
2. Verify all dependencies are correctly listed in package.json
3. Ensure there are no React errors in your code
4. Test the build locally with `npm run build` in the client directory

### API Connection Issues

If the frontend can't connect to the API:
1. Verify the environment variable `REACT_APP_API_URL` is set to `/api` in client/.env.production
2. Check that API routes are correctly defined in vercel.json
3. Examine the Network tab in browser DevTools for failing requests

### Database Connection Issues

If the API can't connect to MongoDB:
1. Ensure your MongoDB Atlas cluster is running
2. Verify the MongoDB connection string is correct in Vercel environment variables
3. Check that your MongoDB Atlas IP whitelist includes Vercel's IPs (or set it to allow all IPs)

## Post-Deployment

1. Test all features of your application
2. Check file uploads are working correctly with Cloudinary
3. Verify user authentication flows
4. Test course enrollment and progression features