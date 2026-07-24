# Expense Splitter

Expense Splitter is a group expense app that lets anyone log shared costs, split them flexibly, track multiple currencies, and settle up clearly with the people they share expenses with.

## What it does

The app lets people create groups, add members even if those people do not have an account, and log shared expenses. Expenses can be split equally, by exact amounts, by percentages, or by shares, and everything is validated so the numbers always add up. Every expense can be entered in any currency and gets converted to the group's default currency using live exchange rates. Group members can see who owes whom at a glance, with suggested settlements that use the fewest possible payments. Settlements can be recorded as full or partial, and balances update immediately. Expenses can be filtered by category, date, or member, and a spending breakdown chart shows where the money went.

Anyone can try the app instantly as a guest, complete with preloaded groups and expenses, or sign up for a real account that starts empty.

## Tech stack

The app is built with Next.js using the App Router and TypeScript. Prisma is used as the database layer, authentication is handled with NextAuth, styling is done with Tailwind CSS, charts are rendered with Recharts, and entrance animations use GSAP. Multi currency conversion is powered by a live exchange rate API.
