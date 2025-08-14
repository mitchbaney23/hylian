# 🚂 Railway Deployment Guide for Hylian

## 🎯 Quick Setup Steps

Since you've already connected the repo to Railway, here's what to do next:

### 1. Add PostgreSQL Database
1. In your Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a PostgreSQL instance
4. Copy the connection string from the database settings

### 2. Configure Environment Variables
In Railway's **Variables** tab, add these:

```env
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:xxxx/railway
JWT_SECRET=hylian-super-secure-production-key-2024
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app-name.up.railway.app
```

**Optional Email Settings:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 3. Domain Configuration
1. Go to **Settings** tab in Railway
2. Under **Domains**, Railway will provide: `https://your-app-name.up.railway.app`
3. Update `FRONTEND_URL` environment variable with this URL

### 4. Deploy
1. Railway will automatically deploy when you push to GitHub
2. Check the **Deployments** tab for build progress
3. View logs to ensure everything starts correctly

## 🔧 What's Been Configured

### ✅ **Production-Ready Features Added:**
- **Static file serving** - Frontend served by backend in production
- **CORS configuration** - Proper origin handling for Railway domains
- **Database migrations** - Auto-run on deployment
- **Error handling** - Email failures won't crash contract creation
- **Health endpoint** - `/api/health` for monitoring
- **Environment detection** - Different configs for dev/prod

### ✅ **Files Created/Modified:**
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration  
- `Procfile` - Process definitions
- `.env.production.example` - Environment template
- Updated CORS and static serving in backend
- Fixed email error handling

## 🚀 Post-Deployment Testing

### Test these features once deployed:
1. **Health check**: `https://your-app.up.railway.app/api/health`
2. **User registration/login**
3. **Document upload**
4. **Contract creation** (should work without email setup)
5. **Digital signatures**

### If email is configured:
6. **Email invitations** should work automatically

## 🔍 Monitoring & Troubleshooting

### Railway Dashboard:
- **Deployments** - Build status and logs
- **Metrics** - CPU, Memory, Network usage  
- **Variables** - Environment configuration
- **Logs** - Real-time application logs

### Common Issues:
1. **Database connection**: Check `DATABASE_URL` format
2. **CORS errors**: Verify `FRONTEND_URL` matches Railway domain
3. **Build failures**: Check build logs in Deployments tab
4. **Email errors**: Non-blocking, contracts still work

## 📋 Production Checklist

- [ ] PostgreSQL database added to Railway
- [ ] Environment variables configured
- [ ] `FRONTEND_URL` set to Railway domain
- [ ] JWT_SECRET updated for production
- [ ] Gmail credentials added (optional)
- [ ] App deployed successfully
- [ ] Health endpoint responding
- [ ] User registration working
- [ ] Document upload working
- [ ] Contract creation working

Your Hylian app is now production-ready on Railway! 🎉