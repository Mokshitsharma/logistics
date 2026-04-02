import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { Wallet, ArrowUpRight, ArrowDownLeft, History, AlertTriangle, Loader2, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function UserWalletPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [addAmount, setAddAmount] = useState(500);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/admin/users");
        setUsers(res.data);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSelectedUserId(res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserData();
    }
  }, [selectedUserId]);

  const fetchUserData = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`/api/wallet/user/${selectedUserId}`);
      setUserData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setUserLoading(false);
    }
  };

  const handleAddMoney = async () => {
    setActionLoading(true);
    try {
      await axios.post("/api/wallet/add", {
        userId: selectedUserId,
        amount: addAmount,
        description: "Manual top-up",
      });
      await fetchUserData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Wallet</h1>
          <p className="text-slate-500 mt-1">Manage your balance and view transaction history.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-slate-700">Switch User:</label>
          <select
            className="rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {(Array.isArray(users) ? users : []).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {userLoading && !userData ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>
      ) : userData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-6 rounded-2xl shadow-xl border-t-4",
                userData.balance < 0 ? "bg-red-50 border-red-500" : "bg-indigo-600 border-indigo-400 text-white"
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn("p-3 rounded-xl", userData.balance < 0 ? "bg-red-100" : "bg-indigo-500")}>
                  <Wallet className={cn("h-6 w-6", userData.balance < 0 ? "text-red-600" : "text-white")} />
                </div>
                {userData.balance < 0 && (
                  <div className="flex items-center bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Negative Balance
                  </div>
                )}
              </div>
              <p className={cn("text-sm font-medium opacity-80 mb-1", userData.balance < 0 && "text-red-700")}>Current Balance</p>
              <h2 className={cn("text-4xl font-bold mb-4", userData.balance < 0 && "text-red-900")}>
                ₹{userData.balance.toLocaleString()}
              </h2>
              <p className={cn("text-xs opacity-70", userData.balance < 0 && "text-red-600")}>
                {userData.balance < 0
                  ? "Please clear your outstanding dues to continue booking."
                  : "Your funds are safe and ready for your next ride."}
              </p>
            </motion.div>

            {/* Add Money */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Add Money</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAddAmount(amt)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                        addAmount === amt
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">₹</span>
                  <input
                    type="number"
                    className="w-full pl-7 rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={addAmount}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={handleAddMoney}
                  disabled={actionLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  {actionLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><Plus className="h-4 w-4 mr-2" /> Add to Wallet</>}
                </button>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-slate-400" />
                  Transaction History
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {userData.transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No transactions yet.</div>
                ) : (
                  userData.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          tx.type === "CREDIT" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {tx.type === "CREDIT" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold text-lg", tx.type === "CREDIT" ? "text-green-600" : "text-red-600")}>
                          {tx.type === "CREDIT" ? "+" : "-"}₹{tx.amount}
                        </p>
                        <p className="text-xs text-slate-400">Balance: ₹{tx.balanceAfter}</p>
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
