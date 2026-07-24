# Expense Splitter

Expense Splitter is a group expense app that lets anyone log shared costs, split them flexibly, track multiple currencies, and settle up clearly with the people they share expenses with.

## What it does

The app lets people create groups, add members even if those people do not have an account, and log shared expenses. Expenses can be split equally, by exact amounts, by percentages, or by shares, and everything is validated so the numbers always add up. Every expense can be entered in any currency and gets converted to the group's default currency using live exchange rates. Group members can see who owes whom at a glance, with suggested settlements that use the fewest possible payments. Settlements can be recorded as full or partial, and balances update immediately. Expenses can be filtered by category, date, or member, and a spending breakdown chart shows where the money went.

Anyone can try the app instantly as a guest, complete with preloaded groups and expenses, or sign up for a real account that starts empty.

## Tech stack

The app is built with Next.js using the App Router and TypeScript. Prisma is used as the database layer, authentication is handled with NextAuth, styling is done with Tailwind CSS, charts are rendered with Recharts, and entrance animations use GSAP. Multi currency conversion is powered by a live exchange rate API.

## Running it locally

Install dependencies, set up the database, then start the dev server.

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Then open http://localhost:3000 in your browser. Click "Continue as guest" to explore the app immediately with sample data, or sign up for a new account.

## Environment variables

The app reads its configuration from a `.env` file in the project root.

```
DATABASE_URL="file:./dev.db"
EXCHANGE_RATE_API_KEY=""
AUTH_SECRET="a-random-secret-string"
```

`EXCHANGE_RATE_API_KEY` is optional. Without it, the app falls back to a free exchange rate API that does not require a key.
