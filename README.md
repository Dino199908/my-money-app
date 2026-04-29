# My Money Shared Budget

Upload these files to GitHub, then deploy on Vercel.

## Vercel Environment Variables

Add:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Use your Supabase Project URL and Publishable key.

## Supabase

Run `supabase-setup.sql` in Supabase SQL Editor.

Enable email login:
Authentication > Sign In / Providers > Email

Set URL config:
Authentication > URL Configuration
Site URL = your Vercel app URL
Redirect URL = your Vercel app URL
