# SplitBot - Autonomous Group Expense Settlement Agent

SplitBot is an autonomous economic agent built on the Unicity Testnet v2 using the Sphere SDK. It acts as an automated ledger and settlement coordinator for group expenses.

### Hackathon / Builder Program Details

- **Track:** Social and Messaging
- **Agentic: Yes** 
  - *Justification:* SplitBot operates entirely autonomously on a cron cycle (via Next.js API routes). It periodically polls for Nostr DM commands, parses natural-language-like expense reports using Regex, updates a unified ledger via a greedy min-cash-flow netting algorithm, and autonomously sends real `payment_request` primitives on the Unicity Testnet to settle debts. Once deployed, it requires zero human intervention or approval to manage group settlements and reminders.
- **AstridOS: No**

### How it Works

1. **Ingest:** Users DM the bot's nametag (`@splitbot_39074` for this deployment) with commands like `/split 300 UCT @alice,@bob memo:"dinner"`.
2. **Compute:** The `/api/ingest` cron parses these messages, and `lib/ledger.ts` computes the optimal "who owes whom" settlement paths.
3. **Settle:** The `/api/settle` cron runs periodically to issue real Unicity `payment_requests` to the debtors, asking them to pay the owed amount.
4. **Dashboard:** A dynamic, premium dashboard displays the ledger, pending settlements, and latest expenses.

### Run Instructions (Testnet v2)

This bot is configured to run on the Unicity Testnet v2.

1. **Prerequisites:**
   - Node.js (v20+)
   - A Unicity Sphere Wallet configured for Testnet v2.

2. **Setup:**
   ```bash
   npm install
   # .env.local must be populated with your SPHERE_NAMETAG and SPHERE_MNEMONIC
   ```

3. **Running Locally:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the Dashboard. You can use the "Run Ingest" and "Run Settle" buttons to manually trigger the crons for testing.

4. **Testing as a User:**
   - From your own Sphere Extension (or CLI), send a Direct Message to `@splitbot_39074` (or your bot's nametag).
   - Format: `/split 500 UCT @your_nametag,@friend_nametag memo:"test expense"`
   - Click "Run Ingest" on the bot's dashboard.
   - Click "Run Settle" on the bot's dashboard.
   - You should receive a real Unicity Testnet Payment Request from the bot for the netted amount!

### Project Structure
- `lib/sphere.ts`: Sphere SDK wrapper and wallet initialization
- `lib/ledger.ts`: Core netting algorithm (Greedy min-cash-flow)
- `lib/parser.ts`: Natural language parser for expense DMs
- `pages/api/ingest.ts`: Cron handler for reading DMs and updating the ledger
- `pages/api/settle.ts`: Cron handler for dispatching payment requests
- `pages/index.tsx`: Web Dashboard

### Production Deployment (Vercel)
This app is ready to deploy on Vercel. 
Simply link your GitHub repo and configure the `SPHERE_MNEMONIC` environment variable. The `vercel.json` file configures the serverless crons automatically.

