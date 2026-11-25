# Food Recipe React

## Run locally
```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite.

## Demo roles
- Super Admin: `superadmin@foodrecipe.com` / `superadmin123`
- Chef/Admin: register through **Chef / Admin Login → Register as Admin**, then log in with the account you created.
- User: create an account from the customer Signup page, then log in.

## Features
- Customer signup/login, recipe browsing, cuisine filters, favorites and recipe ratings.
- Chef/Admin registration and login, recipe creation, per-recipe view counts and user ratings.
- Super Admin dashboard with registered account totals, login activity, active-session counts, recipe engagement and all user ratings.

## Important demo limitation
This is a front-end React project using browser Local Storage. Data and dashboard counts are stored in the current browser profile on the current device; this is a demonstration, not a shared multi-user production database. "Currently logged in" counts reflect sessions recorded in that browser and are not reliable across different devices or browsers.
