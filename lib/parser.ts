export type ParseResult = {
  amount: string;
  coinId: string;
  participants: string[];
  memo: string;
};

/**
 * Parses a split command from natural text.
 * Expected format: /split <amount> <coinId> <@user1,@user2,...> [memo:"optional description"]
 * Example: /split 300 UCT @alice,@bob memo:"dinner"
 */
export function parseSplitCommand(text: string): ParseResult | null {
  const regex = /^\/split\s+(\d+(?:\.\d+)?)\s+([A-Za-z0-9]+)\s+(@[a-zA-Z0-9_,@]+)(?:\s+memo:"([^"]+)")?/i;
  
  const match = text.trim().match(regex);
  if (!match) return null;

  const amount = match[1];
  const coinId = match[2];
  const participantsRaw = match[3];
  const memo = match[4] || '';

  const participants = participantsRaw.split(',').map(p => p.trim()).filter(p => p.startsWith('@'));

  return {
    amount,
    coinId,
    participants,
    memo
  };
}
