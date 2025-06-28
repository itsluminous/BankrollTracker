# Bankroll Tracker

Bankroll Tracker is a modern, responsive web application designed to help you effortlessly manage and visualize your financial data. Track your bank account balances and fixed deposits with an intuitive interface, get insights from a trend graph, and easily export your data.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itsluminous/BankrollTracker)

## Getting Started

To run the development server locally, use the following command in your terminal:
```bash
npm run dev
```
Open the local URL provided in the output (e.g., `http://localhost:3000`) in your browser to see the application.

## Core Features

-   **Calendar View**: A clean calendar interface to select dates and see which days have recorded data at a glance.
-   **Trend Graph**: Visualize your total balance over time with a dynamic graph that automatically adjusts its granularity (daily, weekly, monthly) based on the available screen space.
-   **Daily View Layout**: A detailed daily view that displays account and Fixed Deposit (FD) details in collapsible, easy-to-read sections.
-   **Data Export & Import**: Easily export your entire dataset to a JSON file for backup, and import it back whenever needed. There is also a "Copy for WhatsApp" button that formats your daily balance details for easy sharing.
-   **Data Entry Form**: An intuitive form for entering your financial data. It comes pre-filled with the previous day's data to speed up entry and includes validation for matured FDs.
-   **Responsive Design**: A clean and modern UI that works seamlessly on both desktop and mobile devices.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **State Management**: React Hooks
-   **Data Storage**: Browser `localStorage` for client-side persistence.
