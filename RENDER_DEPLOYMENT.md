# MediAI HealthOS Backend

AI-Powered Healthcare SaaS Platform Backend API

## Deployment to Render

### Prerequisites
- Render account (sign up at https://render.com)
- MongoDB Atlas database
- Firebase service account credentials

### Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Create a new Web Service on Render:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Shakil7869/managehospital25_backend`
   - Configure the service:
     - **Name**: `mediai-healthos-backend` (or your preferred name)
     - **Region**: Choose closest to your users
     - **Branch**: `main`
     - **Root Directory**: Leave empty (or `.` if needed)
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Choose based on your needs (Free tier available)

3. **Add Environment Variables:**
   In the Render dashboard, add these environment variables:

   ```
   PORT=5050
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://shakil300:Mongodb(786)@cluster0.augh5ou.mongodb.net/?appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-secure
   JWT_EXPIRE=30d
   FIREBASE_PROJECT_ID=managehospital2025
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9eruKF+F+vhBr\nlspc0eh0rhEyI5AnWGoEfuarGEn2cQDAYHJ0nzTkgBZ4NRSd4NR9iXY0MSAaE+F2\nSiagK9Z3rohUMm1X1drATlx6B3ssdrCbaU4P/wTp7rZ3BONyBiHopS6matrc5TjH\nCM7MkYKyLaypbSY4IzI0WUoVA6ZuB4ZF7e8+amWs7zIBQGCd60D4Rux+jLxOE8kG\nhcOI7Qx6Ob6PIScbs0gEv4CxCIExQ+h3d6Mu9MAbrQeiE1NrRnd4/PCDHPo+rG5V\nTE/QFmP8yRZgy6DAOF6cTy+RtyL6vFCxFj82dYQ8T7u8aRbz/X3MGWOI+fsAvroj\nT5RpD1efAgMBAAECggEADfakfsnBvr2yUhYbtaQWdbrPiPAL/d+geH0C8hWT0HXa\nxf1APLia2kKs5TuW2F0AQSbHL5N14oDCkHK9zqH3EnzUjnfk4ks1QroY9ePlP41D\no0BVwLdcx6yQL8yMF768naYb/lGeQsHLDF0+zYk6UM0tjegoSozKygbRKc6fY45I\n/GFotXqdVVxRl+S57WiufPqZyzvKrK4bzB9Vh1ZV5tAlCQOLDsewlhjzSu/70aBP\nkCcN3fK9NbSalj1qaPmSLWKutKx2F5hAuSY7RptKYr8kJtrt0AZkJy9MqdixmTvg\nIiLHHNW8UCnD6dj/NoYJThiC78luh779NWw+IYwGAQKBgQD7hSUTo4XRAu74EtYQ\nvyKgF+3TdISdnsqwGAeYx8swDK7vo0Y5jGbPwgWTYVpY1r83hGVij7cc1tn8VqIV\nVdil2kX2N3nPy6LtWX1wN5wYzjEAMSP1PCJ04adjVgYdKFarUvHNyOeCFRrmadzX\ntVaNrTwsT9BGdEtP2eyz1aA/AQKBgQDA2rN95ZidpBmwbFcHA/qnU2In+lioeX8I\nK2g5NQKOraQwOz6pzSJqs9Rov/eVXyiFmgGyKQGA069I++X2RoxytOn24lvwQ4aU\nnBmNul8RGnobxQVUv36E6sK7lOYcY3LXtHVDfhU32nMuf6SOSLXA2aF1eLcE93Ee\n5APuqz42nwKBgQDV3/IXMQWpJYVvDRVaSC15VN+2322lWlGgS86p67qrsR1QSNZ+\nORVztNho6m+Y+4K+AqbzmKFstIXIPSK2YblHzsOPCr1aJR72FRLFSYRC05J3R1H8\nRpZGLVvY7F1mjdak+HMFOcEirC+jnoFcK6bd8mEojPXd8yXXUMgmY5FQAQKBgCvv\n56LQMzP/Fgc2t6EWi/2hJqS7CYXgoEtpMEaQSDPfZZ/Db6RZ4vRyYfs3eR2j32SI\n0MgZRYlnMPEsypiQPCFKDF+99HpJuBiVc9DxXAVWhelburozIoz/uzvnUYG4Oorg\nRzMIP6dI8qLuW7w63oXAT2OnC/NquG/0PN0cUIE7AoGAT2mDtD+xISo7ARF72rxU\n3OaBLb0PRNXGG93d+2cifyXpZtcp5jxFCqASTTlgxz+3TKni6Uw8hyUoZiLogB+D\nuZhAypqovKufxrAx+H8PP9i2mFG3Ik/Be4Cp3Je95fOBu7noqUJeuT491faAK0kS\noTDjP7AGXZUfWMrtlPsCi48=\n-----END PRIVATE KEY-----\n
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@managehospital2025.iam.gserviceaccount.com
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

   **Important**: Replace placeholder values with your actual credentials.

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Wait for the deployment to complete

5. **Get Your API URL:**
   - After deployment, Render will provide a URL like: `https://mediai-healthos-backend.onrender.com`
   - Your API will be available at: `https://mediai-healthos-backend.onrender.com/api/v1`

6. **Update Flutter App:**
   - Update `lib/main.dart` in your Flutter app
   - Change `apiBaseUrl` from `http://localhost:5050/api/v1` to your Render URL
   - Example: `https://mediai-healthos-backend.onrender.com/api/v1`

### Testing Your Deployment

Test the health endpoint:
```bash
curl https://your-app-name.onrender.com/health
```

Test the API:
```bash
curl https://your-app-name.onrender.com/api/v1/auth/register
```

### Important Notes

1. **Free Tier Limitations:**
   - Free instances spin down after 15 minutes of inactivity
   - First request after inactivity may take 30-60 seconds (cold start)
   - Consider upgrading to a paid plan for production

2. **Environment Variables:**
   - Never commit `.env` file to GitHub
   - Always use Render's environment variable settings
   - **CRITICAL**: Change all secrets before going live

3. **MongoDB Atlas:**
   - Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) for Render
   - Or whitelist Render's IP addresses

4. **CORS Configuration:**
   - Update CORS settings in `src/server.js` to include your Flutter app's domain
   - Add your production URLs to the `allowedOrigins` array

5. **Monitoring:**
   - Check Render logs for any errors
   - Set up alerts for application health

### Troubleshooting

- **Connection Errors**: Check MongoDB Atlas network access settings
- **Build Failures**: Check Node.js version compatibility
- **Runtime Errors**: Check Render logs in the dashboard
- **CORS Errors**: Verify CORS configuration includes your client domain

### Support

For issues, check:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
