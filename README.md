# My AI — $0 ChatGPT-style PWA

A small mobile-first AI chat app using:
- HTML/CSS/JavaScript
- Vercel serverless function
- OpenRouter
- `openrouter/free`

## Deploy

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel: Project Settings → Environment Variables.
4. Add:
   - Name: `OPENROUTER_API_KEY`
   - Value: your OpenRouter API key
5. Redeploy.
6. Open the Vercel URL on Android.
7. Use your browser's "Add to Home screen" option.

## Important

Never put the OpenRouter API key in `app.js`, `index.html`, or any client-side file.

The free OpenRouter tier is rate-limited. The app itself does not charge you.
