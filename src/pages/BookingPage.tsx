import React, { useState, useEffect } from "react";
import { getUsers, getCaptains, createBooking } from "../services/firestoreService";
import { motion } from "motion/react";
import { Plus, Minus, Tag, CheckCircle2, AlertCircle, Loader2, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BookingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [captains, setCaptains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [captainSearch, setCaptainSearch] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    captainId: "",
    basePrice: 300,
    waitingCharge: 0,
    loadingCharge: 0,
    longDistanceFee: 0,
    lateNightFee: 0,
    coupon: "",
    paymentMode: "ONLINE",
  });

  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, captainsData] = await Promise.all([
          getUsers(),
          getCaptains(),
        ]);
        setUsers(usersData || []);
        setCaptains(captainsData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateTotal = () => {
    const subtotal =
      formData.basePrice +
      formData.waitingCharge +
      formData.loadingCharge +
      formData.longDistanceFee +
      formData.lateNightFee;
    return Math.max(0, subtotal - appliedDiscount);
  };

  const applyCoupon = () => {
    if (formData.coupon === "FLAT50") {
      setAppliedDiscount(50);
      setDiscountMessage("FLAT50 applied! Saved ₹50 🎉");
    } else if (formData.coupon === "FIRST10") {
      const subtotal =
        formData.basePrice +
        formData.waitingCharge +
        formData.loadingCharge +
        formData.longDistanceFee +
        formData.lateNightFee;
      setAppliedDiscount(subtotal * 0.1);
      setDiscountMessage("FIRST10 applied! Saved 10% 🎉");
    } else {
      setAppliedDiscount(0);
      setDiscountMessage("Invalid coupon");
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.captainId) {
      setError("Please select a user and a captain");
      return;
    }

    setBookingLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const finalAmount = calculateTotal();
      await createBooking({
        ...formData,
        totalDiscount: appliedDiscount,
        finalAmount,
        status: "COMPLETED"
      });
      setSuccess("Booking completed successfully!");
      setFormData({
        ...formData,
        waitingCharge: 0,
        loadingCharge: 0,
        longDistanceFee: 0,
        lateNightFee: 0,
        coupon: "",
      });
      setAppliedDiscount(0);
      setDiscountMessage("");
    } catch (e: any) {
      setError(e.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCaptains = (Array.isArray(captains) ? captains : []).filter(c => 
    c.name?.toLowerCase().includes(captainSearch.toLowerCase()) || 
    c.email?.toLowerCase().includes(captainSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Create New Booking</h1>
        <p className="text-slate-500 mt-2">Enter ride details and calculate dynamic pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleBooking} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-1.5 text-sm rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="">Choose a user...</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Captain</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search captains..."
                    className="w-full pl-10 pr-4 py-1.5 text-sm rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={captainSearch}
                    onChange={(e) => setCaptainSearch(e.target.value)}
                  />
                </div>
                <select
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formData.captainId}
                  onChange={(e) => setFormData({ ...formData, captainId: e.target.value })}
                >
                  <option value="">Choose a captain...</option>
                  {filteredCaptains.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Pricing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waiting Charge (₹)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.waitingCharge}
                    onChange={(e) => setFormData({ ...formData, waitingCharge: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loading Charge (₹)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.loadingCharge}
                    onChange={(e) => setFormData({ ...formData, loadingCharge: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Long Distance Fee (₹)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.longDistanceFee}
                    onChange={(e) => setFormData({ ...formData, longDistanceFee: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Late Night Fee (₹)</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.lateNightFee}
                    onChange={(e) => setFormData({ ...formData, lateNightFee: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  >
                    <option value="ONLINE">Online Wallet</option>
                    <option value="CASH">Cash to Captain</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Discounts</h3>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter coupon code (FLAT50, FIRST10)"
                    className="pl-10 w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.coupon}
                    onChange={(e) => setFormData({ ...formData, coupon: e.target.value.toUpperCase() })}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Apply
                </button>
              </div>
              {discountMessage && (
                <p className={cn("text-sm font-medium", appliedDiscount > 0 ? "text-green-600" : "text-red-600")}>
                  {discountMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 flex justify-center items-center"
            >
              {bookingLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Confirm Booking"}
            </button>

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Fare Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base Price</span>
                <span>₹{formData.basePrice}</span>
              </div>
              {formData.waitingCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Waiting Charge</span>
                  <span>₹{formData.waitingCharge}</span>
                </div>
              )}
              {formData.loadingCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Loading Charge</span>
                  <span>₹{formData.loadingCharge}</span>
                </div>
              )}
              {formData.longDistanceFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Long Distance Fee</span>
                  <span>₹{formData.longDistanceFee}</span>
                </div>
              )}
              {formData.lateNightFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Late Night Fee</span>
                  <span>₹{formData.lateNightFee}</span>
                </div>
              )}
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{appliedDiscount}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-slate-900">
                <span>Total Amount</span>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>
            <div className="mt-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                {formData.paymentMode === "ONLINE"
                  ? "Amount will be deducted from user's wallet balance."
                  : "User will pay the total amount in cash to the captain."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
