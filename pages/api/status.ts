import type { NextApiRequest, NextApiResponse } from 'next';
import { getStore } from '../../lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const store = await getStore();
    res.status(200).json({ 
      success: true, 
      expenses: store.expenses,
      settlements: store.settlements,
      balance: store.balance,
      lastProcessedTimestamp: store.lastProcessedTimestamp
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
