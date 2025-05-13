"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { AppTabs } from "../components/AppTabs";
import { Card, Button, Select, Input } from "../components/DemoComponents";

type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
};

const NETWORKS = [
  {
    name: "Ethereum Mainnet",
    key: "mainnet",
    apiBase: "https://api.etherscan.io",
    explorer: "https://etherscan.io",
  },
  {
    name: "Sepolia Testnet",
    key: "sepolia",
    apiBase: "https://api-sepolia.etherscan.io",
    explorer: "https://sepolia.etherscan.io",
  },
];

type TimeFrame = "thisMonth" | "lastMonth" | "lastYear" | "custom";

export default function TransactionsPage() {
  const { address } = useAccount();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState(NETWORKS[0]); // Default to mainnet
  const [usdValues, setUsdValues] = useState<{ [hash: string]: number }>({});
  const [company, setCompany] = useState<{
    name: string;
    taxId: string;
    city: string;
    country: string;
    postalCode: string;
    address: string;
    dunsId: string;
    logoUrl: string | null;
  } | null>(null);

  // Time frame selector state
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("thisMonth");
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");

  // Load company data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("companyProfile");
      if (stored) setCompany(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (!address) return;

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch transactions from Next.js API route (server-side, API key protected)
        const url = `/api/etherscan?address=${address}&network=${network.key}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "1") {
          setError("No transactions found or error fetching transactions.");
          setTransactions([]);
          setUsdValues({});
        } else {
          const txs: Transaction[] = data.result;
          setTransactions(txs);

          // Get unique dates for transactions
          const dateMap: { [date: string]: Transaction[] } = {};
          txs.forEach(tx => {
            const date = new Date(Number(tx.timeStamp) * 1000);
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            const dateStr = `${dd}-${mm}-${yyyy}`;
            if (!dateMap[dateStr]) dateMap[dateStr] = [];
            dateMap[dateStr].push(tx);
          });

          // Fetch USD price for each unique date from Next.js API route (server-side, API key protected)
          const fetchPrices = async () => {
            const usdMap: { [hash: string]: number } = {};
            await Promise.all(
              Object.entries(dateMap).map(async ([dateStr, txsOnDate]) => {
                try {
                  const res = await fetch(
                    `/api/coingecko?date=${dateStr}`
                  );
                  const data = await res.json();
                  const price = data?.market_data?.current_price?.usd;
                  if (price) {
                    txsOnDate.forEach(tx => {
                      usdMap[tx.hash] = price * (Number(tx.value) / 1e18);
                    });
                  } else {
                    txsOnDate.forEach(tx => {
                      usdMap[tx.hash] = NaN;
                    });
                  }
                } catch {
                  txsOnDate.forEach(tx => {
                    usdMap[tx.hash] = NaN;
                  });
                }
              })
            );
            setUsdValues(usdMap);
          };

          fetchPrices();
        }
      } catch (err) {
        setError("Failed to fetch transactions.");
        console.error(err);
        setTransactions([]);
        setUsdValues({});
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address, network]);

  // Filtering logic for transactions based on selected time frame
  function filterTransactions(transactions: Transaction[]): Transaction[] {
    if (!transactions.length) return [];

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    const now = new Date();

    if (timeFrame === "thisMonth") {
      toDate = now;
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1); // first day of this month
    } else if (timeFrame === "lastMonth") {
      // Previous calendar month: from first day of previous month to last day of previous month
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      fromDate = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0);
      toDate = new Date(prevMonthYear, prevMonth + 1, 0, 23, 59, 59, 999); // last day of prev month
    } else if (timeFrame === "lastYear") {
      // Previous calendar year: Jan 1 to Dec 31 of last year
      const prevYear = now.getFullYear() - 1;
      fromDate = new Date(prevYear, 0, 1, 0, 0, 0, 0);
      toDate = new Date(prevYear, 11, 31, 23, 59, 59, 999);
    } else if (timeFrame === "custom") {
      if (!customFromDate || !customToDate) {
        // If either date is missing, show no transactions
        return [];
      }
      fromDate = new Date(customFromDate);
      toDate = new Date(customToDate);
      // Include the whole day for the "to" date
      toDate.setHours(23, 59, 59, 999);
    }

    // Debug logs to help diagnose filtering
    console.log("Filtering transactions:");
    console.log("timeFrame:", timeFrame);
    console.log("fromDate:", fromDate);
    console.log("toDate:", toDate);
    transactions.forEach(tx => {
      const txDate = new Date(Number(tx.timeStamp) * 1000);
      console.log("tx.hash:", tx.hash, "tx.timeStamp:", tx.timeStamp, "txDate:", txDate);
    });

    return transactions.filter(tx => {
      const txDate = new Date(Number(tx.timeStamp) * 1000);
      if (fromDate && txDate < fromDate) return false;
      if (toDate && txDate > toDate) return false;
      return true;
    });
  }

  const filteredTransactions = filterTransactions(transactions);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <Header />
        <AppTabs />
        <Card title="Network" className="mb-4">
          <div>
            <label htmlFor="network-select" className="block text-sm font-medium mb-1">
              Select Network
            </label>
            <Select
              id="network-select"
              value={network.key}
              onChange={e => {
                const selected = NETWORKS.find(n => n.key === e.target.value);
                if (selected) setNetwork(selected);
              }}
              required
            >
              {NETWORKS.map(n => (
                <option key={n.key} value={n.key}>
                  {n.name}
                </option>
              ))}
            </Select>
          </div>
        </Card>
        <Card title="Time Frame" className="mb-4">
          <div className="flex space-x-2 mb-2">
            <Button
              variant={timeFrame === "thisMonth" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("thisMonth")}
            >
              This Month
            </Button>
            <Button
              variant={timeFrame === "lastMonth" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("lastMonth")}
            >
              Last Month
            </Button>
            <Button
              variant={timeFrame === "lastYear" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("lastYear")}
            >
              Last Year
            </Button>
            <Button
              variant={timeFrame === "custom" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("custom")}
            >
              Custom
            </Button>
          </div>
          {timeFrame === "custom" && (
            <div className="flex space-x-2 items-center">
              <div>
                <label htmlFor="from-date" className="block text-xs mb-1">
                  From
                </label>
                <Input
                  id="from-date"
                  type="date"
                  value={customFromDate}
                  onChange={e => setCustomFromDate(e.target.value)}
                  max={customToDate || undefined}
                />
              </div>
              <div>
                <label htmlFor="to-date" className="block text-xs mb-1">
                  To
                </label>
                <Input
                  id="to-date"
                  type="date"
                  value={customToDate}
                  onChange={e => setCustomToDate(e.target.value)}
                  min={customFromDate || undefined}
                />
              </div>
            </div>
          )}
        </Card>
        <Card title="Transactions" className="mb-4">
          {address && (
            <div className="text-xs text-[var(--app-foreground-muted)] break-all mb-2">
              Wallet: {address}
            </div>
          )}
          <div>
            {loading && <div>Loading transactions...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && filteredTransactions.length === 0 && (
              <div>
                {timeFrame === "custom" && (!customFromDate || !customToDate)
                  ? "Please select both a 'From' and 'To' date to view transactions."
                  : "No transactions found."}
              </div>
            )}
            {!loading && !error && filteredTransactions.length > 0 && (
              <>
                <ul className="space-y-4">
                  {filteredTransactions.map((tx) => (
                    <li key={tx.hash} className="border-b pb-2">
                      <div>
                        <span className="font-mono text-xs">Hash:</span>{" "}
                        <a
                          href={`${network.explorer}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </a>
                      </div>
                      <div className="text-xs">
                        <span>From:</span> {tx.from}
                      </div>
                      <div className="text-xs">
                        <span>To:</span> {tx.to}
                      </div>
                      <div className="text-xs">
                        <span>Value:</span> {Number(tx.value) / 1e18} ETH
                        {typeof usdValues[tx.hash] === "number" && !isNaN(usdValues[tx.hash]) && (
                          <span className="ml-2 text-green-700">
                            (${usdValues[tx.hash].toLocaleString(undefined, { maximumFractionDigits: 2 })} USD)
                          </span>
                        )}
                        {typeof usdValues[tx.hash] === "number" && isNaN(usdValues[tx.hash]) && (
                          <span className="ml-2 text-yellow-600">(USD unavailable)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span>Timestamp:</span>{" "}
                        {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const csvRows = [
                        ["Hash", "From", "To", "Value (ETH)", "Value (USD)", "Timestamp"],
                        ...filteredTransactions.map(tx => [
                          tx.hash,
                          tx.from,
                          tx.to,
                          (Number(tx.value) / 1e18).toString(),
                          (typeof usdValues[tx.hash] === "number" && !isNaN(usdValues[tx.hash]))
                            ? usdValues[tx.hash].toFixed(2)
                            : "",
                          new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
                        ]),
                      ];
                      const csvContent = csvRows.map(row =>
                        row.map(field =>
                          `"${String(field).replace(/"/g, '""')}"`
                        ).join(",")
                      ).join("\n");
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "transactions.csv";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { exportTransactionsPDF } = await import("../../lib/pdf");
                      await exportTransactionsPDF({
                        company,
                        filteredTransactions,
                        usdValues,
                        address,
                      });
                    }}
                  >
                    Export PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
