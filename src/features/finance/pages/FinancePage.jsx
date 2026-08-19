import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign, Wallet, CreditCard, Loader2, RefreshCw, Plus, Trash2,
  TrendingUp, TrendingDown, Building2, Landmark,
  CheckCircle2, AlertTriangle, X, ChevronDown, Banknote,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  createPayoutMethod, deletePayoutMethod, fetchEarnings, fetchPayoutMethods, fetchPayouts,
} from "../api";
import { getAuthToken } from "@/stores/authStore";

const TABS = [
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "payouts", label: "Payouts", icon: Banknote },
  { key: "methods", label: "Payout Methods", icon: CreditCard },
];

const METHOD_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2, desc: "Direct bank deposit" },
  { value: "PAYPAL", label: "PayPal", icon: Wallet, desc: "Online payment platform" },
];

const INITIAL_METHOD_FORM = {
  type: "BANK_TRANSFER", accountName: "", accountNumber: "", bankName: "", bankCountry: "",
  branchName: "", branchCode: "",
  mobileProvider: "", mobileNumber: "", paypalEmail: "", currency: "USD",
};

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export default function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "earnings";
  const [highlightedPayoutId, setHighlightedPayoutId] = useState(searchParams.get("payoutId") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [payoutsSummary, setPayoutsSummary] = useState({});
  const [methods, setMethods] = useState([]);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [methodForm, setMethodForm] = useState(INITIAL_METHOD_FORM);
  const [savingMethod, setSavingMethod] = useState(false);
  const [expandedMethod, setExpandedMethod] = useState(null);

  const loadData = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      if (activeTab === "earnings") {
        const result = await fetchEarnings({ limit: 50 });
        setEarnings((result.earnings || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
        setEarningsSummary(result.summary);
      } else if (activeTab === "payouts") {
        const result = await fetchPayouts({ limit: 50 });
        setPayouts((result.payouts || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
        setPayoutsSummary(result.summary);
      } else {
        const result = await fetchPayoutMethods();
        setMethods(result);
      }
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load finance data");
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    // Deferred so the setState's happen inside the promise chain
    Promise.resolve().then(() => {
      if (!cancelled) loadData();
    });
    return () => { cancelled = true; };
  }, [loadData]);

  const handleAddMethod = async (e) => {
    e.preventDefault(); setSavingMethod(true);
    try {
      const payload = { type: methodForm.type, currency: methodForm.currency };
      if (methodForm.type === "BANK_TRANSFER") {
        Object.assign(payload, { accountName: methodForm.accountName, accountNumber: methodForm.accountNumber, bankName: methodForm.bankName, bankCountry: methodForm.bankCountry, branchName: methodForm.branchName || null, branchCode: methodForm.branchCode || null });
      } else { payload.paypalEmail = methodForm.paypalEmail; }
      await createPayoutMethod(payload);
      toast.success("Payout method added");
      setShowMethodForm(false);
      setMethodForm(INITIAL_METHOD_FORM);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add payout method");
    } finally { setSavingMethod(false); }
  };

  const handleDeleteMethod = async (id) => {
    if (!confirm("Delete this payout method?")) return;
    try {
      await deletePayoutMethod(id);
      toast.success("Payout method deleted");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete payout method");
    }
  };

  useEffect(() => {
    if (!highlightedPayoutId || payouts.length === 0) return;
    const id = highlightedPayoutId;
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(`[data-payout-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
    const clearTimer = setTimeout(() => {
      setHighlightedPayoutId(null);
      setSearchParams((prev) => {
        if (!prev.get("payoutId")) return prev;
        const next = new URLSearchParams(prev);
        next.delete("payoutId");
        return next;
      }, { replace: true });
    }, 3000);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [payouts, highlightedPayoutId, setSearchParams]);

  const summaryStats = useMemo(() => {
    if (activeTab === "earnings") return [
      { label: "Total Earnings", value: formatCurrency(Number(earningsSummary.totalEarnings) || 0), icon: DollarSign, accent: "emerald" },
      { label: "Total Revenue", value: formatCurrency(Number(earningsSummary.totalRevenue) || 0), icon: TrendingUp, accent: "blue" },
      { label: "Commission Paid", value: formatCurrency(Number(earningsSummary.totalCommission) || 0), icon: TrendingDown, accent: "amber" },
      { label: "Confirmed Bookings", value: earningsSummary.totalBookings || 0, icon: CheckCircle2, accent: "cyan" },
    ];
    if (activeTab === "payouts") return [
      { label: "Total Paid Out", value: formatCurrency(Number(payoutsSummary.totalEarned) || 0), icon: Wallet, accent: "emerald" },
      { label: "Payout Records", value: payoutsSummary.totalPayouts || 0, icon: CreditCard, accent: "blue" },
    ];
    return [
      { label: "Payout Methods", value: methods.length, icon: CreditCard, accent: "emerald" },
    ];
  }, [activeTab, earningsSummary, payoutsSummary, methods.length]);

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-linear-to-b from-emerald-500 to-emerald-300 rounded-full" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Finance</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track earnings, payouts, and payment methods</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 shadow-sm"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className={cn(
        "grid gap-3",
        activeTab === "earnings" && "grid-cols-2 lg:grid-cols-4",
        activeTab === "payouts" && "grid-cols-2 lg:grid-cols-2 max-w-lg",
        activeTab === "methods" && "grid-cols-1 lg:grid-cols-1 max-w-xs",
      )}>
        {summaryStats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-emerald-100/60 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mb-2.5">
                <Icon size={16} className="text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s.label}</p>
              <div className={cn(
                "mt-2 h-0.5 w-full rounded-full",
                s.accent === "emerald" && "bg-emerald-200/60",
                s.accent === "blue" && "bg-blue-200/60",
                s.accent === "amber" && "bg-amber-200/60",
                s.accent === "cyan" && "bg-cyan-200/60",
              )} />
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setSearchParams((prev) => ({ ...Object.fromEntries(prev), tab: tab.key }))}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab.key ? "text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {activeTab === tab.key && (
                <motion.span
                  layoutId="financeTab"
                  className="absolute inset-0 rounded-lg bg-emerald-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={14} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              <AlertTriangle size={13} /> {error}
              <button onClick={loadData} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "earnings" && (
          <motion.div key="earnings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                <div className="p-5 space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                      <div className="h-3 w-32 bg-slate-100 rounded" />
                      <div className="h-3 w-16 bg-slate-100 rounded ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            ) : earnings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 ring-1 ring-emerald-100/60">
                  <DollarSign size={26} className="text-emerald-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">No earnings yet</h3>
                <p className="text-sm text-slate-400 max-w-[220px]">Earnings will appear once bookings start coming in.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-all">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {["Booking", "Tour", "Customer", "Travel Date", "Payout", "Commission", "Total"].map((h) => (
                          <th key={h} className={cn(
                            "py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider",
                            (h === "Payout" || h === "Commission" || h === "Total") && "text-right",
                          )}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e, i) => (
                        <motion.tr
                          key={e.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition-colors"
                        >
                          <td className="py-3 px-4"><span className="font-mono text-[11px] font-semibold text-emerald-700">{e.bookingNumber}</span></td>
                          <td className="py-3 px-4 text-[11px] text-slate-600">{e.tour}</td>
                          <td className="py-3 px-4 text-[11px] text-slate-600">{e.customer}</td>
                          <td className="py-3 px-4 text-[11px] text-slate-500">{formatDate(e.travelDate)}</td>
                          <td className="py-3 px-4 text-right text-[11px] font-semibold text-emerald-600">{formatCurrency(e.supplierPayout, e.currency)}</td>
                          <td className="py-3 px-4 text-right text-[11px] text-slate-500">{formatCurrency(e.commissionAmount, e.currency)}</td>
                          <td className="py-3 px-4 text-right text-[11px] font-semibold text-slate-800">{formatCurrency(e.total, e.currency)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "payouts" && (
          <motion.div key="payouts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                <div className="p-5 space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                      <div className="h-3 w-14 bg-slate-100 rounded ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 ring-1 ring-emerald-100/60">
                  <Banknote size={26} className="text-emerald-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">No payouts yet</h3>
                <p className="text-sm text-slate-400 max-w-[240px]">Payouts are processed once bookings are completed.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-all">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {["Payout ID", "Booking", "Tour", "Amount", "Status", "Date", "Method"].map((h) => (
                          <th key={h} className={cn(
                            "py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider",
                            h === "Amount" && "text-right",
                            h === "Status" && "text-center",
                          )}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p, i) => (
                        <motion.tr
                          key={p.id}
                          data-payout-id={p.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            "border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition-colors duration-500",
                            highlightedPayoutId === p.id && "bg-emerald-100"
                          )}
                        >
                          <td className="py-3 px-4"><span className="font-mono text-[10px] font-semibold text-emerald-700">{p.id}</span></td>
                          <td className="py-3 px-4 text-[11px] text-slate-600">{p.bookingNumber}</td>
                          <td className="py-3 px-4 text-[11px] text-slate-600">{p.tour}</td>
                          <td className="py-3 px-4 text-right text-[11px] font-semibold text-slate-800">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="py-3 px-4 text-center"><StatusBadge status={p.status} label={p.status?.replace(/_/g, " ")} size="sm" /></td>
                          <td className="py-3 px-4 text-[11px] text-slate-500">{formatDate(p.date)}</td>
                          <td className="py-3 px-4 text-[11px] text-slate-500">{p.method}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "methods" && (
          <motion.div key="methods" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="space-y-4">
              {/* Add Method Button + Form */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => { setShowMethodForm((v) => !v); if (showMethodForm) setExpandedMethod(null); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm",
                    showMethodForm
                      ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-none"
                      : "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {showMethodForm ? <X size={14} /> : <Plus size={14} />}
                  {showMethodForm ? "Cancel" : "Add Method"}
                </button>
              </div>

              <AnimatePresence>
                {showMethodForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleAddMethod} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <CreditCard size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">New Payout Method</h3>
                          <p className="text-xs text-slate-500">Choose your preferred payout type</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {METHOD_TYPES.map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setMethodForm((prev) => ({ ...prev, type: t.value }))}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                                methodForm.type === t.value
                                  ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                methodForm.type === t.value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                              )}>
                                <Icon size={20} />
                              </div>
                              <div>
                                <p className={cn(
                                  "text-sm font-semibold",
                                  methodForm.type === t.value ? "text-emerald-800" : "text-slate-700"
                                )}>{t.label}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {methodForm.type === "BANK_TRANSFER" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name</label>
                            <input placeholder="e.g. John Doe" value={methodForm.accountName} onChange={(e) => setMethodForm((p) => ({ ...p, accountName: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                            <input placeholder="e.g. 1234567890" value={methodForm.accountNumber} onChange={(e) => setMethodForm((p) => ({ ...p, accountNumber: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                            <input placeholder="e.g. Barclays" value={methodForm.bankName} onChange={(e) => setMethodForm((p) => ({ ...p, bankName: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Branch <span className="font-normal text-slate-400">(optional)</span></label>
                            <input placeholder="e.g. Oxford Circus" value={methodForm.branchName} onChange={(e) => setMethodForm((p) => ({ ...p, branchName: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code <span className="font-normal text-slate-400">(optional)</span></label>
                            <input placeholder="e.g. 20-33-44" value={methodForm.branchCode} onChange={(e) => setMethodForm((p) => ({ ...p, branchCode: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                            <input placeholder="e.g. GH" value={methodForm.bankCountry} onChange={(e) => setMethodForm((p) => ({ ...p, bankCountry: e.target.value }))}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">PayPal Email</label>
                          <input type="email" placeholder="e.g. name@example.com" value={methodForm.paypalEmail} onChange={(e) => setMethodForm((p) => ({ ...p, paypalEmail: e.target.value }))}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
                        </div>
                      )}

                      <button type="submit" disabled={savingMethod}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
                      >
                        {savingMethod ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        {savingMethod ? "Saving..." : "Save Payout Method"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Methods List */}
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-28 bg-slate-100 rounded" />
                          <div className="h-3 w-44 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : methods.length === 0 && !showMethodForm ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 ring-1 ring-emerald-100/60">
                    <CreditCard size={26} className="text-emerald-300" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No payout methods</h3>
                  <p className="text-sm text-slate-400 max-w-[220px]">Add a payout method to start receiving payments.</p>
                </div>
              ) : (
                <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-3">
                  {methods.map((method) => {
                    const isExpanded = expandedMethod === method.id;
                    return (
                      <motion.div
                        key={method.id}
                        variants={FADE_UP}
                        layout
                        className={cn(
                          "bg-white border rounded-xl transition-all cursor-pointer overflow-hidden",
                          isExpanded ? "border-emerald-200 shadow-md shadow-emerald-900/5" : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                        )}
                      >
                        <div className="p-5" onClick={() => setExpandedMethod(isExpanded ? null : method.id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                isExpanded ? "bg-emerald-100" : "bg-emerald-50"
                              )}>
                                {method.type === "BANK_TRANSFER"
                                  ? <Landmark size={20} className={isExpanded ? "text-emerald-700" : "text-emerald-600"} />
                                  : <Wallet size={20} className={isExpanded ? "text-emerald-700" : "text-emerald-600"} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <p className="text-sm font-semibold text-slate-800">{method.type?.replace(/_/g, " ")}</p>
                                  {method.isDefault && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {method.accountName || method.paypalEmail || method.mobileProvider || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold",
                                method.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", method.verified ? "bg-emerald-500" : "bg-amber-500")} />
                                {method.verified ? "Verified" : "Pending"}
                              </div>
                              <ChevronDown size={15} className={cn("text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-slate-100 mx-5">
                                <div className="pt-4 pb-5 grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                                  {method.type === "BANK_TRANSFER" && (
                                    <>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account Name</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">{method.accountName || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account Number</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1 font-mono">{method.accountNumber || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bank Name</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">{method.bankName || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bank Branch</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">{method.branchName || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Branch Code</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">{method.branchCode || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Country</p>
                                        <p className="text-sm font-medium text-slate-700 mt-1">{method.bankCountry || method.country || "—"}</p>
                                      </div>
                                    </>
                                  )}
                                  {method.type === "PAYPAL" && (
                                    <div className="col-span-2">
                                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PayPal Email</p>
                                      <p className="text-sm font-medium text-slate-700 mt-1">{method.paypalEmail || "—"}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currency</p>
                                    <p className="text-sm font-medium text-slate-700 mt-1">{method.currency || "USD"}</p>
                                  </div>
                                  {method.createdAt && (
                                    <div>
                                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Added</p>
                                      <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(method.createdAt)}</p>
                                    </div>
                                  )}
                                  <div className="col-span-2 flex justify-end pt-1 border-t border-slate-50">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteMethod(method.id); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={13} />
                                      Remove method
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
