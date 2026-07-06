import fs from 'fs';
import path from 'path';
import { Expense, SettlementInstruction, Balance } from './ledger';

export type StoreData = {
  lastProcessedTimestamp: number;
  expenses: Expense[];
  settlements: SettlementInstruction[];
  balance: Balance;
};

const defaultData: StoreData = {
  lastProcessedTimestamp: 0,
  expenses: [],
  settlements: [],
  balance: {},
};

const getStorePath = () => {
  // Use a local JSON file for MVP. In a production Vercel environment,
  // this should be replaced with @vercel/kv or a database.
  // /tmp is used if not in development to avoid read-only file system errors on Vercel.
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', '.splitbot-store.json');
  }
  return path.join(process.cwd(), '.store.json');
};

export async function getStore(): Promise<StoreData> {
  try {
    const data = fs.readFileSync(getStorePath(), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { ...defaultData };
  }
}

export async function saveStore(data: StoreData): Promise<void> {
  fs.writeFileSync(getStorePath(), JSON.stringify(data, null, 2));
}
