import React, { useState, useEffect } from "react";
import { getCaptains, getCaptain, getBookingsByCaptain, subscribeCaptainTransactions } from "../services/firestoreService";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Percent, 
  Wallet, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  CheckCircle2, 
  Clock,
  IndianRupee
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CaptainDashboard() {
  const [captains, setCaptains] = useState<any[]>([]);
  const [selectedCaptainId, setSelectedCaptainId] = useState("");
  const [captainData, setCaptainData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [captainLoading, setCaptainLoading] = useState(false);

  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        const data = await getCaptains();
        setCaptains(data || []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedCaptainId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCaptains();
  }, []);

  useEffect(() => {
    if (selectedCaptainId) {
      fetchCaptainData();
      const unsubscribe = subscribeCaptainTransactions(selectedCaptainId, (txs) => {
        setTransactions(txs);
      });
      return () => unsubscribe();
    }
  }, [selectedCaptainId]);

  const fetchCaptainData = async () => {
    setCaptainLoading(true);
    try {
      const [captain, captainBookings] = await Promise.all([
        getCaptain(selectedCaptainId),
        getBookingsByCaptain(selectedCaptainId)
      ]);
      setCaptainData(captain);
      setBookings(captainBookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCaptainLoading(false);
    }
  };

  const calculateStats = () => {
    const earnings = (Array.isArray(transactions) ? transactions : [])
      .filter((tx: any) => tx.type === "EARNING")
      .reduce((acc: number, tx: any) => acc + tx.amount, 0);
    const commission = (Array.isArray(transactions) ? transactions : [])
      .filter((tx: any) => tx.type === "COMMISSION")
      .reduce((acc: number, tx: any) => acc + tx.amount, 0);
    return { earnings, commission };
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  const stats = calculateStats();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Captain Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your earnings, commissions, and ride history.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-slate-700">Switch Captain:</label>
          <select
            className="rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedCaptainId}
            onChange={(e) => setSelectedCaptainId(e.target.value)}
          >
            {(Array.isArray(captains) ? captains : []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {captainLoading && !captainData ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>
      ) : captainData ? (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">₹{stats.earnings.toLocaleString()}</h3>
              <p className="text-sm text-slate-500 mt-1">Net profit from all rides</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <Percent className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Paid</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">₹{stats.commission.toLocaleString()}</h3>
              <p className="text-sm text-slate-500 mt-1">20% platform fee deducted</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-6 rounded-2xl border shadow-sm",
                captainData.balance < 0 ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-200"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", captainData.balance < 0 ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600")}>
                  <Wallet className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Balance</span>
              </div>
              <h3 className={cn("text-2xl font-bold", captainData.balance < 0 ? "text-red-700" : "text-indigo-700")}>
                ₹{captainData.balance.toLocaleString()}
              </h3>
              <p className={cn("text-sm mt-1", captainData.balance < 0 ? "text-red-600" : "text-indigo-600")}>
                {captainData.balance < 0 ? "Outstanding dues to company" : "Available for settlement"}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Rides */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-slate-400" />
                  Recent Rides
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No rides completed yet.</div>
                ) : (
                  bookings.map((ride: any) => (
                    <div key={ride.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">Booking #{ride.id.slice(0, 8)}</p>
                          <p className="text-sm text-slate-500">
                            {ride.createdAt?.toDate ? ride.createdAt.toDate().toLocaleString() : new Date(ride.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          ride.paymentMode === "CASH" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {ride.paymentMode}
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center text-slate-700">
                          <IndianRupee className="h-3 w-3 mr-1" />
                          <span className="font-bold text-lg">{ride.finalAmount}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Your Share</p>
                          <p className="text-green-600 font-bold">₹{(ride.finalAmount * 0.8).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-slate-400" />
                  Financial Ledger
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No transactions recorded.</div>
                ) : (
                  transactions.map((tx: any) => (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          tx.type === "EARNING" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {tx.type === "EARNING" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{tx.description}</p>
                          <p className="text-[10px] text-slate-500">
                            {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold", tx.type === "EARNING" ? "text-green-600" : "text-red-600")}>
                          {tx.type === "EARNING" ? "+" : "-"}₹{tx.amount}
                        </p>
                        <p className="text-[10px] text-slate-400">Balance: ₹{tx.balanceAfter.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
