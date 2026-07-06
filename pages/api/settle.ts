import type { NextApiRequest, NextApiResponse } from 'next';
import { getSphere } from '../../lib/sphere';
import { getStore, saveStore } from '../../lib/store';
import { computeSettlements, SettlementInstruction } from '../../lib/ledger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const store = await getStore();
    const sphere = await getSphere();

    // Calculate current required settlements
    const currentSettlements = computeSettlements(store.balance);
    
    let requestsSent = 0;
    const newStoreSettlements: SettlementInstruction[] = [];

    const DEFAULT_COIN = 'UCT';

    for (const curr of currentSettlements) {
      const existing = store.settlements.find(s => s.from === curr.from && s.to === curr.to && s.amount === curr.amount);
      
      if (existing) {
        newStoreSettlements.push(existing);
      } else {
        // Send a payment request via Sphere SDK
        try {
          if (sphere.payments) {
            await sphere.payments.sendPaymentRequest(curr.from, {
              amount: curr.amount,
              coinId: DEFAULT_COIN,
              message: `Net settlement: You owe ${curr.amount} ${DEFAULT_COIN} to ${curr.to}`,
            });
            requestsSent++;
            
            newStoreSettlements.push({
              ...curr,
              status: 'requested'
            });
          }
        } catch (err: any) {
          console.error(`Failed to send payment request to ${curr.from}:`, err);
          newStoreSettlements.push({
            ...curr,
            status: 'pending' // retry next time
          });
        }
      }
    }
    
    // Update store with new settlements state
    if (requestsSent > 0 || store.settlements.length !== newStoreSettlements.length) {
      store.settlements = newStoreSettlements;
      await saveStore(store);
    }

    res.status(200).json({ 
      success: true, 
      requestsSent, 
      settlements: store.settlements 
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
