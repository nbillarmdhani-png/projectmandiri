# Deployment

This project is split into two deployments:

- Railway runs the Express API from the repository root.
- Netlify builds and serves the Vite React frontend from `frontend`.

## Railway API

1. Create a new Railway project from this repository.
2. Set the Railway root directory to the repository root, the folder that contains `package.json` and `railway.json`.
3. Add these variables in Railway:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
JWT_SECRET=replace-with-a-long-random-secret
```

4. Deploy. Railway will run:

```bash
npm start
```

5. Confirm the API is live:

```text
https://your-railway-app.up.railway.app/api/health
```

## Netlify Frontend

1. Create a new Netlify site from the same repository.
2. Netlify will use `netlify.toml`:

```text
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

3. Add this variable in Netlify:

```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

4. Deploy the site.

## Notes

- `VITE_API_URL` must include `/api`.
- Uploaded/generated images currently use Supabase public URLs when created through the app.
- If you use local `/uploads/...` assets, the frontend strips `/api` from `VITE_API_URL` so images resolve against the Railway app origin.
