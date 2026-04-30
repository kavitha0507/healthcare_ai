# Vercel Deployment Steps (From Render to Vercel)

## Step 1: Deploy Backend to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Select your GitHub repository: `kavitha0507/healthcare_ai`
4. Vercel will automatically detect it's a Python project
5. **IMPORTANT - Add Environment Variables:**
   - Click "Environment Variables" before deploying
   - Add: `GROQ_API_KEY` = your actual Groq API key
   - Add: `DATABASE_URL` = `sqlite:///:memory:`
   - Click "Deploy"

6. Wait for deployment to complete (usually 1-2 minutes)
7. **Copy your backend URL** (e.g., `https://healthcare-ai-five.vercel.app`)

## Step 2: Deploy Frontend to Vercel

1. Go back to https://vercel.com
2. Click "Add New..." → "Project"
3. Select your frontend GitHub repository
4. Vercel will detect it's a React/Vite project
5. **Add Environment Variable:**
   - Add: `VITE_API_URL` = your backend URL from Step 1
   - Click "Deploy"

6. Wait for deployment
7. **Your frontend is now live!**

## Step 3: Test Everything

- Visit your frontend URL
- Try: "Calculate my BMI - 5.3' 135lb"
- Try: "Diet Plan"

## What We'll Fix First

Before you deploy, let me make sure everything is ready.
