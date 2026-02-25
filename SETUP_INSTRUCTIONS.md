# Instructions for Setting Up Neon Postgres Integration
1. Go to the [Neon Website](https://neon.tech/) and create a free account.
2. In your Neon console, create a new Project named "Hackathon Judging App" (or anything you prefer).
3. Once the database is created, you will be taken to your **Dashboard**.
4. In the "Connection Details" section, find the **Connection string**. 
   It will look like this: `postgres://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`
5. Copy this entire connection string.

## Local Development (.env.local)
Create a file named `.env.local` in the root of your project (`digihack-award-system/.env.local`) and add the variable:

```env
DATABASE_URL="postgres://[your-copied-connection-string-here]"
```

## Vercel Deployment
When deploying to Vercel, navigate to **Settings > Environment Variables** and add:
- Key: `DATABASE_URL`
- Value: Your copied connection string.

## Database Initialization
Once you have added the `DATABASE_URL`, start your application locally (`npm run dev`) or deploy it to Vercel. 
Then, open your browser and navigate to:
`http://localhost:3000/api/setup-db` (or your Vercel URL).

This will securely execute the `CREATE TABLE` script on your Neon database and initialize it for the hackathon data. You only need to do this **once**.
