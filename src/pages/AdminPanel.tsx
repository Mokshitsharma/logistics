import React, { useState, useEffect } from "react";
import { getAllBookings, getCaptains, getUsers, getFinancials } from "../services/firestoreService";
import { motion } from "motion/react";
import { 
  BarChart3, 
  Users, 
  Truck, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminPanel() {
  const [rides, setRides] = useState<any[]>([]);
  const [captains, setCaptains] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rides" | "captains" | "users" | "financials">("rides");
  const [rideSearch, setRideSearch] = useState("");
  const [captainSearch, setCaptainSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ridesData, captainsData, usersData, financialsData] = await Promise.all([
        getAllBookings(),
        getCaptains(),
        getUsers(),
        getFinancials(),
      ]);
      setRides(ridesData || []);
      setCaptains(captainsData || []);
      setUsers(usersData || []);
      setFinancials(financialsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  const filteredRides = (Array.isArray(rides) ? rides : []).filter((ride) => 
    ride.user?.name?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    ride.captain?.name?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    ride.id?.toLowerCase().includes(rideSearch.toLowerCase())
  );

  const filteredCaptains = (Array.isArray(captains) ? captains : []).filter((c) => 
    c.name?.toLowerCase().includes(captainSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(captainSearch.toLowerCase())
  );

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Full visibility into platform operations and financials.</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
          <h3 className="text-2xl font-bold text-slate-900">₹{financials?.totalVolume.toLocaleString()}</h3>
          <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            <span>Across {financials?.totalRides} rides</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Revenue</p>
          <h3 className="text-2xl font-bold text-indigo-600">₹{financials?.companyExpectedRevenue.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2">20% Base + 100% Extras - Discounts</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Online Collections</p>
          <h3 className="text-2xl font-bold text-slate-900">₹{financials?.onlineVolume.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2">Received via platform wallet</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Dues</p>
          <h3 className="text-2xl font-bold text-red-600">₹{Math.abs(financials?.outstandingCaptainDues?._sum?.balance || 0).toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2">To be collected from captains</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("rides")}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-colors border-b-2",
              activeTab === "rides" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            All Rides
          </button>
          <button
            onClick={() => setActiveTab("captains")}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-colors border-b-2",
              activeTab === "captains" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Captains
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-colors border-b-2",
              activeTab === "users" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-colors border-b-2",
              activeTab === "financials" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Financial Summary
          </button>
        </div>

        <div className="p-0">
          {activeTab === "rides" && (
            <div className="overflow-x-auto">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rides by user, captain or ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    value={rideSearch}
                    onChange={(e) => setRideSearch(e.target.value)}
                  />
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Ride ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Captain</th>
                    <th className="px-6 py-4">Base Fare</th>
                    <th className="px-6 py-4">Extras</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{ride.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{ride.userName}</p>
                        <p className="text-xs text-slate-400">{ride.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{ride.captainName}</p>
                      </td>
                      <td className="px-6 py-4">₹{ride.basePrice}</td>
                      <td className="px-6 py-4 text-slate-500">
                        ₹{ride.waitingCharge + ride.loadingCharge + ride.longDistanceFee + ride.lateNightFee}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{ride.finalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          ride.paymentMode === "CASH" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {ride.paymentMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {ride.createdAt?.toDate ? ride.createdAt.toDate().toLocaleDateString() : new Date(ride.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "captains" && (
            <div className="overflow-x-auto">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search captains by name or email..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    value={captainSearch}
                    onChange={(e) => setCaptainSearch(e.target.value)}
                  />
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Captain</th>
                    <th className="px-6 py-4">Total Rides</th>
                    <th className="px-6 py-4">Total Earnings</th>
                    <th className="px-6 py-4">Total Commission</th>
                    <th className="px-6 py-4">Current Balance</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCaptains.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>
                      <td className="px-6 py-4">{c.bookingCount || 0}</td>
                      <td className="px-6 py-4 font-medium text-green-600">₹{c.totalEarnings?.toFixed(2) || "0.00"}</td>
                      <td className="px-6 py-4 font-medium text-red-600">₹{c.totalCommission?.toFixed(2) || "0.00"}</td>
                      <td className={cn("px-6 py-4 font-bold", c.balance < 0 ? "text-red-700" : "text-indigo-700")}>
                        ₹{c.balance?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4">
                        {c.balance < 0 ? (
                          <div className="flex items-center text-red-600 text-xs font-bold">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Owes Company
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 text-xs font-bold">
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                            Settled
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Total Bookings</th>
                    <th className="px-6 py-4">Current Balance</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">{u.bookingCount || 0}</td>
                      <td className={cn("px-6 py-4 font-bold", u.balance < 0 ? "text-red-700" : "text-indigo-700")}>
                        ₹{u.balance?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4">
                        {u.balance < 0 ? (
                          <div className="flex items-center text-red-600 text-xs font-bold">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Low Balance
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 text-xs font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Healthy
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Revenue Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Base Fare Commission (20%)</span>
                      <span className="font-bold text-slate-900">₹{(financials?.totalBasePrice * 0.2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Extra Fees (100% Retained)</span>
                      <span className="font-bold text-slate-900">₹{financials?.totalExtras.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span className="">Total Discounts Applied</span>
                      <span className="font-bold">-₹{financials?.totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center text-lg font-bold text-indigo-600">
                      <span>Net Platform Revenue</span>
                      <span>₹{financials?.companyExpectedRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Volume Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Cash Volume (Paid to Captains)</span>
                      <span className="font-bold text-slate-900">₹{(financials?.cashVolume || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Online Volume (Paid to Wallet)</span>
                      <span className="font-bold text-slate-900">₹{(financials?.onlineVolume || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center text-lg font-bold text-slate-900">
                      <span>Total Gross Volume</span>
                      <span>₹{(financials?.totalVolume || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
