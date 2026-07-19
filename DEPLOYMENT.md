# Deploying LUDOSN

This guide explains how to deploy the LUDOSN multiplayer game for free using **Render** for the backend server and **Vercel** for the frontend client.

Before you begin, make sure you have pushed this entire project to a **GitHub repository**.

---

## Part 1: Deploy Backend to Render

Render is an excellent platform for hosting Node.js and WebSocket servers.

1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing this project.
4. Fill in the following details for your new Web Service:
   - **Name**: `ludosn-server` (or similar)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Select the **Free** instance type.
6. Click **Advanced** and add the following Environment Variable (you will update the value later after setting up Vercel):
   - `CLIENT_URL` : `*` (Temporary. Change this to your Vercel URL later, e.g., `https://ludosn.vercel.app`)
7. Click **Create Web Service**.

Render will now build and deploy your backend. Once it's live, copy the generated URL (e.g., `https://ludosn-server.onrender.com`). You will need this for the frontend!

---

## Part 2: Deploy Frontend to Vercel

Vercel is the creator of Next.js and has first-class support for Vite React apps.

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository.
4. In the configuration screen, adjust the following:
   - **Framework Preset**: Vercel should auto-detect **Vite**.
   - **Root Directory**: Click `Edit` and select `client`.
5. Open the **Environment Variables** section and add:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: Paste the URL you copied from Render (e.g., `https://ludosn-server.onrender.com`)
6. Click **Deploy**.

Vercel will build and deploy your frontend. Once finished, click **Continue to Dashboard** and visit your live site!

---

## Part 3: Final Security Step (Optional but Recommended)

Once your frontend is live on Vercel, copy its URL (e.g., `https://ludosn.vercel.app`).

1. Go back to your Render Dashboard.
2. Select your Web Service -> **Environment**.
3. Update the `CLIENT_URL` variable to your Vercel URL (make sure there is no trailing slash `/`).
4. Save the changes. Render will automatically restart your server.

This ensures that only your official Vercel frontend is allowed to connect to your Render backend via Cross-Origin Resource Sharing (CORS).

---

## Troubleshooting

- **"Failed to connect to server"**: Ensure your `VITE_BACKEND_URL` on Vercel exactly matches your Render URL, without a trailing slash (e.g., `https://your-app.onrender.com`).
- **White screen on Vercel**: Check your Vercel build logs. Ensure your Root Directory is strictly set to `client`.
- **Render sleeps after inactivity**: Render's free tier spins down the server after 15 minutes of inactivity. The very first time you load the game after a long break, it may take 30-50 seconds for the server to wake up.
