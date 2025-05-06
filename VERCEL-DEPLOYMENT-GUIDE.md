# LMS Project Deployment Guide for Vercel

This guide will help you deploy your Learning Management System (LMS) to Vercel.

## Prerequisites

- A Vercel account (create one at [vercel.com](https://vercel.com) if needed)
- Git repository with your LMS code (optional, but recommended)
- MongoDB Atlas account with a database set up
- Cloudinary account for file storage

## Environment Variables

Before deploying, make sure you have all these values ready:

| Environment Variable | Description |
|----------------------|-------------|
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT authentication |
| JWT_EXPIRE | Token expiration (e.g., "7d") |
| NODE_ENV | Set to "production" |
| CLOUDINARY_CLOUD_NAME | Your Cloudinary cloud name |
| CLOUDINARY_API_KEY | Your Cloudinary API key |
| CLOUDINARY_API_SECRET | Your Cloudinary API secret |

## Deployment Methods

### Option 1: Using Vercel Dashboard (Recommended for first-time users)

1. **Push your code to GitHub, GitLab, or Bitbucket**
   - Make sure your repository includes all the necessary files
   - Ensure your `vercel.json` is in the root directory

2. **Import your project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your Git repository
   - Configure your project settings (Framework preset: Other)

3. **Configure Environment Variables**
   - In the project setup page, add all required environment variables
   - Add all the variables from your `.env.vercel` file

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Using Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```
   vercel login
   ```

3. **Deploy from your project directory**
   ```
   cd /path/to/your/lms-project
   vercel --prod
   ```
   
   - Follow the prompts to configure your project
   - When asked to set up environment variables, provide all required values

4. **Alternative: Use the deployment script**
   ```
   node deploy-to-vercel.js
   ```

## Post-Deployment Configuration

After your initial deployment:

1. **Set up a custom domain** (optional)
   - Go to your Vercel project settings
   - Navigate to "Domains"
   - Add your custom domain

2. **Configure Cloudinary CORS settings**
   - In your Cloudinary Dashboard, go to Settings > Upload
   - Add your Vercel domain to the "Allowed Upload Sources"

3. **Update client API URL**
   - If needed, update the `REACT_APP_API_URL` in your `.env.production` file to match your Vercel deployment URL

## Troubleshooting Common Issues

### 404 Not Found Errors
- Check your `vercel.json` routing configuration
- Ensure the client-side routing is properly configured with a catch-all route

### API Connection Issues
- Verify your environment variables are correctly set
- Check CORS configuration in your server code
- Ensure MongoDB connection is working correctly

### Deployment Size Limits
- If you hit Vercel's size limits, try excluding unnecessary files
- Consider using the optimized `package-vercel.json` for your server

## Monitoring Your Deployment

- Use the Vercel Dashboard to monitor deployments
- Check the "Functions" tab to see your serverless functions
- Use the `/health` endpoint to verify your server is running correctly

## Need Help?

- Check Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Review your application logs in the Vercel Dashboard
- Visit the Vercel community forums: [vercel.com/community](https://vercel.community)