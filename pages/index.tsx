import { useEffect, useState } from 'react';

type Expense = {
  id: string;
  payer: string;
  amount: string;
  coinId: string;
  participants: string[];
  memo: string;
  timestamp: number;
};

type Settlement = {
  from: string;
  to: string;
  amount: string;
  status: string;
};

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const runIngest = async () => {
    await fetch('/api/ingest');
    fetchStatus();
  };

  const runSettle = async () => {
    await fetch('/api/settle', { method: 'POST' });
    fetchStatus();
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate-dm');
      const data = await res.json();
      if (data.success) {
        alert(data.message + "\n\nNow wait 5 seconds and click Run Ingest!");
      } else {
        alert("Simulation failed: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">SplitBot Dashboard</h1>
            <p className="text-gray-500">Autonomous Group Expense Settlement Agent</p>
          </div>
          <div className="space-x-4">
            <button 
              onClick={handleSimulate} 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors"
            >
              Simulate DM
            </button>
            <button 
              onClick={runIngest} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors"
            >
              Run Ingest
            </button>
            <button 
              onClick={runSettle}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors"
            >
              Run Settle
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Balances</h2>
            {Object.keys(data.balance || {}).length === 0 ? (
              <p className="text-gray-500 text-sm">No balances yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.balance).map(([nametag, bal]: [string, any]) => (
                  <li key={nametag} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">{nametag}</span>
                    <span className={`font-mono ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bal >= 0 ? '+' : ''}{bal}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Settlements</h2>
            {data.settlements?.length === 0 ? (
              <p className="text-gray-500 text-sm">All settled up!</p>
            ) : (
              <ul className="space-y-3">
                {data.settlements?.map((s: Settlement, i: number) => (
                  <li key={i} className="text-sm border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{s.from} → {s.to}</span>
                      <span className="font-mono text-gray-900">{s.amount} UCT</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                        Status: {s.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Expenses</h2>
          {data.expenses?.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-2">Time</th>
                    <th className="py-2">Payer</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Memo</th>
                    <th className="py-2">Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses?.slice().reverse().map((e: Expense) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 text-gray-500">
                        {new Date(e.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="py-2 font-medium">{e.payer}</td>
                      <td className="py-2 font-mono">{e.amount} {e.coinId}</td>
                      <td className="py-2">{e.memo || '-'}</td>
                      <td className="py-2 text-gray-600">
                        {e.participants.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
