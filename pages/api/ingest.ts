import type { NextApiRequest, NextApiResponse } from 'next';
import { getSphere } from '../../lib/sphere';
import { parseSplitCommand } from '../../lib/parser';
import { getStore, saveStore } from '../../lib/store';
import { calculateNetBalances } from '../../lib/ledger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const store = await getStore();
    const sphere = await getSphere();

    // Sleep briefly to let the SDK sync DMs from Nostr relays
    await new Promise(resolve => setTimeout(resolve, 5000));

    const conversations = sphere.communications?.getConversations();
    if (!conversations) {
      return res.status(200).json({ success: true, newExpensesCount: 0, message: "Communications module not ready" });
    }
    
    let newExpensesCount = 0;
    let maxTimestamp = store.lastProcessedTimestamp;
    
    const debugMessages = [];

    // Process all DMs across all conversations
    for (const [peerPubkey, messages] of conversations.entries()) {
      for (const msg of messages) {
        debugMessages.push({ peer: peerPubkey, content: msg.content, sender: msg.senderPubkey, bot: sphere.identity?.chainPubkey });
        if (msg.timestamp <= store.lastProcessedTimestamp) continue;
        
        // Skip messages sent by the bot itself
        if (msg.senderPubkey === sphere.identity?.chainPubkey) continue;

        const parsed = parseSplitCommand(msg.content);
        if (parsed) {
          const payer = msg.senderNametag || msg.senderPubkey;
          
          store.expenses.push({
            id: crypto.randomUUID(),
            payer,
            amount: parsed.amount,
            coinId: parsed.coinId,
            participants: parsed.participants,
            memo: parsed.memo,
            sourceMessageId: msg.id || crypto.randomUUID(),
            timestamp: msg.timestamp,
          });
          newExpensesCount++;
        }

        if (msg.timestamp > maxTimestamp) {
          maxTimestamp = msg.timestamp;
        }
      }
    }

    if (newExpensesCount > 0) {
      store.lastProcessedTimestamp = maxTimestamp;
      store.balance = calculateNetBalances(store.expenses);
      await saveStore(store);
    }

    res.status(200).json({ 
      success: true, 
      newExpensesCount, 
      updatedBalances: store.balance,
      debugMessages
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
