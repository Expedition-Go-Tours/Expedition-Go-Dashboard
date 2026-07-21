import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search, X, ChevronDown, RefreshCw, Calendar, Loader2, Users,
  Phone, Mail, Clock, Tag, ShoppingCart, MessageCircle,
  CheckCircle2, AlertTriangle, Ban, ArrowUpDown, Download,
  ChevronRight, TrendingUp, Eye,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  BOOKING_STATUSES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  SUPPLIER_BOOKING_STATUS_OPTIONS,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatTime, cn } from "@/lib/utils";
import { optimizeImage } from "@/lib/image";
import DatePicker from "@/components/forms/DatePicker";
import { fetchSupplierBookings, updateBookingStatus } from "../api";
import { getAuthToken } from "@/stores/authStore";

const QUICK_FILTERS = [
  { key: "ALL", label: "All bookings" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_ACTIONS = {
  PENDING: [
    { value: "CONFIRMED", label: "Accept booking", variant: "primary" },
    { value: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  CONFIRMED: [
    { value: "COMPLETED", label: "Mark completed", variant: "primary" },
    { value: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
  NO_SHOW: [],
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(searchParams.get("bookingId") || null);

  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);
  const activeTab = searchParams.get("tab") || "ALL";
  const purchaseDateFrom = searchParams.get("purchaseFrom") || "";
  const purchaseDateTo = searchParams.get("purchaseTo") || "";
  const activityDateFrom = searchParams.get("activityFrom") || "";
  const activityDateTo = searchParams.get("activityTo") || "";

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [locPurchaseFrom, setLocPurchaseFrom] = useState(purchaseDateFrom);
  const [locPurchaseTo, setLocPurchaseTo] = useState(purchaseDateTo);
  const [locActivityFrom, setLocActivityFrom] = useState(activityDateFrom);
  const [locActivityTo, setLocActivityTo] = useState(activityDateTo);

  const apiStatus = activeTab !== "ALL" ? activeTab : undefined;

  const loadBookings = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSupplierBookings({
        page: page + 1, limit: pageSize,
        ...(apiStatus ? { status: apiStatus } : {}),
      });
      setBookings(result.bookings);
      setPagination(result.pagination);
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, apiStatus]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  useEffect(() => {
    if (highlightedBookingId && bookings.length > 0) {
      const match = bookings.find((b) => b.id === highlightedBookingId);
      if (match) {
        setTimeout(() => {
          const el = document.getElementById(`booking-${highlightedBookingId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        const timer = setTimeout(() => {
          setHighlightedBookingId(null);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("bookingId");
            return next;
          }, { replace: true });
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedBookingId, bookings, setSearchParams]);

  const updateFilters = useCallback((updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) params.delete(key);
      else if (Array.isArray(value)) { params.delete(key); value.forEach((v) => params.append(key, v)); }
      else params.set(key, String(value));
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleTabClick = (tabKey) => updateFilters({ tab: tabKey, page: 0 });

  const clearFilters = () => {
    setLocalSearch(""); setLocPurchaseFrom(""); setLocPurchaseTo(""); setLocActivityFrom(""); setLocActivityTo("");
    setSearchParams({});
  };

  const applyFilters = () => {
    updateFilters({
      search: localSearch || null,
      purchaseFrom: locPurchaseFrom || null, purchaseTo: locPurchaseTo || null,
      activityFrom: locActivityFrom || null, activityTo: locActivityTo || null,
      page: 0,
    });
  };

  const handleStatusUpdate = useCallback(async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, { status });
      toast.success("Booking status updated");
      await loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update booking status");
    } finally { setUpdatingId(null); }
  }, [loadBookings]);

  const filteredData = useMemo(() => {
    let data = [...bookings];
    const q = localSearch.toLowerCase().trim();
    if (q) {
      data = data.filter(b => b.bookingNumber.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q) || b.customerEmail.toLowerCase().includes(q) || b.tourName.toLowerCase().includes(q));
    }
    if (purchaseDateFrom) { const f = new Date(purchaseDateFrom); data = data.filter(b => new Date(b.bookingDate) >= f); }
    if (purchaseDateTo) { const t = new Date(purchaseDateTo); data = data.filter(b => new Date(b.bookingDate) <= t); }
    if (activityDateFrom) { const f = new Date(activityDateFrom); data = data.filter(b => new Date(b.travelDate) >= f); }
    if (activityDateTo) { const t = new Date(activityDateTo); data = data.filter(b => new Date(b.travelDate) <= t); }
    data.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    return data;
  }, [bookings, localSearch, purchaseDateFrom, purchaseDateTo, activityDateFrom, activityDateTo]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    pending: filteredData.filter(b => b.status === "PENDING").length,
    confirmed: filteredData.filter(b => b.status === "CONFIRMED").length,
    revenue: filteredData.reduce((sum, b) => sum + b.total, 0),
  }), [filteredData]);

  const hasFilters = localSearch || purchaseDateFrom || purchaseDateTo || activityDateFrom || activityDateTo;
  const totalItems = pagination?.totalCount ?? filteredData.length;
  const totalPages = pagination?.totalPages ?? (Math.ceil(filteredData.length / pageSize) || 1);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all customer reservations</p>
        </div>
        <button onClick={loadBookings} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-emerald-100/60 rounded-xl text-sm font-medium text-slate-600 hover:bg-emerald-50/40 hover:text-slate-800 transition-all disabled:opacity-50 shadow-sm">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: ShoppingCart, color: "text-slate-900", bar: "bg-slate-200" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bar: "bg-amber-400" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-emerald-600", bar: "bg-emerald-400" },
          { label: "Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-[#044b3b]", bar: "bg-[#044b3b]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-emerald-100/60 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50/40 border border-emerald-100/60 flex items-center justify-center">
                <s.icon size={14} className={s.color} />
              </div>
              <span className={`text-base sm:text-lg font-bold ${s.color} text-right`}>{s.value}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">{s.label}</p>
            <div className={`mt-2 h-0.5 w-full rounded-full ${s.bar} opacity-30`} />
          </div>
        ))}
      </div>

      {/* ====== TOOLBAR ====== */}
      <div className="bg-white rounded-xl border border-emerald-100/60 shadow-sm">
        {/* Quick filters */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
          {QUICK_FILTERS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabClick(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-[#044b3b] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-emerald-50/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + advanced filters */}
        <div className="px-4 pb-3 pt-1 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search name, reference or tour..." value={localSearch}
              onChange={e => setLocalSearch(e.target.value)} autoFocus
              className="w-full pl-9 pr-3 py-2 bg-emerald-50/40 border border-emerald-100/60 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all"
            />
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              showFilters || hasFilters
                ? "border-[#044b3b] bg-emerald-50 text-[#044b3b]"
                : "border-emerald-100/60 bg-white text-slate-500 hover:bg-emerald-50/40"
            }`}
          >
            <Calendar size={13} /> Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#044b3b]" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Expandable date filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-emerald-100/40 pt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShoppingCart size={12} />
              <span>Purchased</span>
              <DatePicker value={locPurchaseFrom} onChange={setLocPurchaseFrom} placeholder="From" size="sm" className="w-28" maxDate={locPurchaseTo || undefined} />
              <span className="text-slate-300">–</span>
              <DatePicker value={locPurchaseTo} onChange={setLocPurchaseTo} placeholder="To" size="sm" className="w-28" minDate={locPurchaseFrom || undefined} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={12} />
              <span>Activity</span>
              <DatePicker value={locActivityFrom} onChange={setLocActivityFrom} placeholder="From" size="sm" className="w-28" maxDate={locActivityTo || undefined} />
              <span className="text-slate-300">–</span>
              <DatePicker value={locActivityTo} onChange={setLocActivityTo} placeholder="To" size="sm" className="w-28" minDate={locActivityFrom || undefined} />
            </div>
          </div>
        )}
      </div>

      {/* ====== ERROR ====== */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ====== BOOKINGS ====== */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-emerald-100/60 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-40 sm:h-48 bg-emerald-100/40 animate-pulse" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-48 bg-emerald-100/40 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-emerald-100/40 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((c) => (
                      <div key={c} className="space-y-1.5">
                        <div className="h-2 w-12 bg-emerald-100/40 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-emerald-100/40 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-100/40">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-100/40 animate-pulse" />
                      <div className="h-3 w-24 bg-emerald-100/40 rounded animate-pulse mt-1.5" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-7 w-20 bg-emerald-100/40 rounded-lg animate-pulse" />
                      <div className="h-7 w-20 bg-emerald-100/40 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-emerald-100/60">
          <div className="w-14 h-14 rounded-full bg-emerald-50/40 flex items-center justify-center mb-4">
            <ShoppingCart size={24} className="text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No bookings yet</p>
          <p className="text-xs text-slate-500 mb-4">Bookings will appear here once customers make reservations</p>
          {hasFilters && <button onClick={clearFilters} className="text-xs font-medium text-[#044b3b] hover:underline">Clear filters</button>}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">{filteredData.length} booking{filteredData.length !== 1 ? "s" : ""}</p>
          <div className="space-y-3">
            {filteredData.map((booking) => {
              const actions = STATUS_ACTIONS[booking.status] || [];
              const isUpdating = updatingId === booking.id;

              return (
                <div
                  key={booking.id}
                  id={`booking-${booking.id}`}
                  className={cn(
                    "group bg-white rounded-xl border transition-all duration-200 overflow-hidden",
                    highlightedBookingId === booking.id
                      ? "border-emerald-400 ring-2 ring-emerald-200/60 shadow-lg shadow-emerald-200/30"
                      : "border-emerald-100/60 hover:border-emerald-200 hover:shadow-lg"
                  )}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Tour photo */}
                    <div className="sm:w-48 shrink-0 relative">
                      {booking.tourPhoto ? (
                        <img src={optimizeImage(booking.tourPhoto, 192)} alt="" loading="lazy" className="w-full sm:w-48 h-40 sm:h-48 object-cover" />
                      ) : (
                        <div className="w-full sm:w-48 h-40 sm:h-48 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <span className="text-2xl text-slate-300">🏰</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <StatusBadge status={booking.status} label={BOOKING_STATUSES[booking.status]?.label || booking.status} size="sm" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{booking.tourName}</h3>
                          {booking.selectedTime && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              <Clock size={10} className="inline mr-1" />
                              {formatTime(booking.selectedTime)}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(booking.total, booking.currency)}</p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Reference</p>
                          <p className="text-xs font-semibold text-[#044b3b] font-mono">{booking.bookingNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Purchased</p>
                          <p className="text-xs font-medium text-slate-700">{formatDate(booking.bookingDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Activity</p>
                          <p className="text-xs font-medium text-slate-700">{formatDate(booking.travelDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Travelers</p>
                          <p className="text-xs font-medium text-slate-700">{booking.travelers} guest{booking.travelers !== 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {/* Customer + actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-100/40">
                        <div className="flex items-center gap-3 text-xs text-slate-500 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {booking.customerPhoto ? (
                              <img src={optimizeImage(booking.customerPhoto, 20)} alt="" loading="lazy" className="w-5 h-5 rounded-full shrink-0 object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#044b3b]/10 flex items-center justify-center text-[10px] font-bold text-[#044b3b] shrink-0">
                                {(booking.customerName || "?").charAt(0)}
                              </div>
                            )}
                            <span className="truncate font-medium text-slate-700">{booking.customerName}</span>
                          </div>
                          <span className="hidden sm:inline text-slate-300">|</span>
                          <a href={`mailto:${booking.customerEmail}`} className="hidden sm:flex items-center gap-1 hover:text-[#044b3b] transition-colors">
                            <Mail size={11} /> {booking.customerEmail}
                          </a>
                          {booking.customerPhone && (
                            <>
                              <span className="text-slate-300">|</span>
                              <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 hover:text-[#044b3b] transition-colors">
                                <Phone size={11} /> {booking.customerPhone}
                              </a>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {actions.map((action) => (
                            <button key={action.value} onClick={() => handleStatusUpdate(booking.id, action.value)} disabled={isUpdating}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50 ${
                                action.variant === "primary"
                                  ? "bg-[#044b3b] text-white hover:bg-[#033629] shadow-sm"
                                  : action.variant === "danger"
                                    ? "text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-emerald-50/40"
                              }`}
                            >
                              {isUpdating ? <Loader2 size={11} className="animate-spin" /> : null}
                              {action.label}
                            </button>
                          ))}
                          <button onClick={() => navigate(`/chat?customerId=${booking.customerId}`)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-[#044b3b] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all">
                            <MessageCircle size={11} /> Message customer
                          </button>
                        </div>
                      </div>

                      {/* Supplier notes */}
                      {booking.supplierNotes && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-700">
                          <AlertTriangle size={11} className="shrink-0" />
                          <span>{booking.supplierNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ====== PAGINATION ====== */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between pt-4 border-t border-emerald-100/60">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Show</span>
            <select value={pageSize} onChange={e => updateFilters({ pageSize: Number(e.target.value), page: 0 })}
              className="px-2 py-1 border border-emerald-100/60 rounded-lg text-xs text-slate-700 bg-white focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>of {totalItems}</span>
          </div>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => updateFilters({ page: page - 1 })}
              className="px-2.5 py-1.5 border border-emerald-100/60 rounded-lg text-xs font-medium text-slate-600 hover:bg-emerald-50/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} onClick={() => updateFilters({ page: p })}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#044b3b] text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50/40 border border-emerald-100/60"}`}
                >{p + 1}</button>
              );
            })}
            <button disabled={page >= totalPages - 1} onClick={() => updateFilters({ page: page + 1 })}
              className="px-2.5 py-1.5 border border-emerald-100/60 rounded-lg text-xs font-medium text-slate-600 hover:bg-emerald-50/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
