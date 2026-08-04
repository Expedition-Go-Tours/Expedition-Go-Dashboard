import { useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
  Package,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Undo2,
  Save,
  Ban,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  addDays,
  parseISO,
} from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMyProducts } from "@/features/products/api";
import {
  fetchTourAvailability,
  updateDateAvailability,
  removeDateOverride,
} from "@/features/availability/api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const STATUS_CONFIG = {
  available: { label: "Available", dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-400", icon: CheckCircle2 },
  limited: { label: "Limited", dot: "bg-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-400", icon: AlertTriangle },
  full: { label: "Full", dot: "bg-red-500", badge: "text-red-700 bg-red-50 border-red-200", bar: "bg-red-400", icon: XCircle },
  blocked: { label: "Blocked", dot: "bg-slate-300", badge: "text-slate-600 bg-slate-50 border-slate-200", bar: "bg-slate-300", icon: Ban },
};

const STATUS_ORDER = ["available", "limited", "full", "blocked"];

function monthRange(date) {
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tourFromUrl = searchParams.get("tour") || "";
  const dateFromUrl = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const [currentDate, setCurrentDate] = useState(() => {
    try { return parseISO(dateFromUrl); } catch { return new Date(); }
  });
  const [selectedTour, setSelectedTour] = useState(tourFromUrl);
  const [selectedDate, setSelectedDate] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const panelTimer = useRef(null);
  const [editStatus, setEditStatus] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [statusFilter, setStatusFilter] = useState({ available: true, limited: true, full: true, blocked: true });
  const [dateMode, setDateMode] = useState("month");

  const range = useMemo(() => {
    if (dateMode === "30days") {
      const today = new Date();
      return { start: format(today, "yyyy-MM-dd"), end: format(addDays(today, 29), "yyyy-MM-dd") };
    }
    if (dateMode === "all") {
      return { start: format(subMonths(new Date(), 3), "yyyy-MM-dd"), end: format(addMonths(new Date(), 3), "yyyy-MM-dd") };
    }
    return monthRange(currentDate);
  }, [currentDate, dateMode]);

  const syncUrl = useCallback((tour, date) => {
    const p = {};
    if (tour) p.tour = tour;
    if (date) p.date = format(typeof date === "string" ? parseISO(date) : date, "yyyy-MM-dd");
    setSearchParams(p, { replace: true });
  }, [setSearchParams]);

  const closePanel = useCallback(() => {
    if (panelTimer.current) clearTimeout(panelTimer.current);
    setPanelVisible(false);
    panelTimer.current = setTimeout(() => setPanelOpen(false), 250);
  }, []);

  const handleTourChange = (val) => {
    setSelectedTour(val);
    syncUrl(val, currentDate);
    closePanel();
  };

  const goMonth = (dir) => {
    const d = dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
    setCurrentDate(d);
    syncUrl(selectedTour, d);
  };

  const { data: toursData, isLoading: toursLoading, isError: toursError } = useQuery({
    queryKey: ["supplier-tours"],
    queryFn: async () => {
      const res = await listMyProducts({ limit: 100 });
      return (res.data?.data?.tours || []).filter((t) => t.status !== "ARCHIVED");
    },
    select: (t) => t.map((x) => ({ id: x.id, title: x.title })),
  });

  const tours = toursData || [];
  const validSelected = tours.some((t) => t.id === selectedTour);
  // A stale/invalid ?tour= id silently renders an empty "all available" calendar,
  // so resolve to the selected tour only when it actually exists in the list.
  const tourId = validSelected ? selectedTour : (tours.length > 0 ? tours[0].id : null);

  const { data: availData, isLoading: availLoading, isError: availError, refetch: refetchAvail } = useQuery({
    queryKey: ["tour-availability", tourId, range.start, range.end],
    queryFn: () => fetchTourAvailability(tourId, range.start, range.end),
    enabled: !!tourId,
  });

  const calendar = availData?.calendar || [];

  const getDay = useCallback((date) => {
    const key = format(date, "yyyy-MM-dd");
    return calendar.find((d) => d.date === key) || { status: "available", capacity: 0, booked: 0, remaining: 0, slots: [], hasOverride: false, overrideStatus: null };
  }, [calendar]);

  const rangeDays = useMemo(() => {
    if (dateMode === "30days") {
      const today = new Date();
      return eachDayOfInterval({ start: today, end: addDays(today, 29) });
    }
    if (dateMode === "all") {
      return eachDayOfInterval({ start: subMonths(new Date(), 3), end: addMonths(new Date(), 3) });
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate, dateMode]);

  const visibleDays = useMemo(() => rangeDays.filter((d) => statusFilter[getDay(d).status]), [rangeDays, statusFilter, getDay]);

  const stats = useMemo(() => {
    const s = { available: 0, limited: 0, full: 0, blocked: 0 };
    rangeDays.forEach((d) => { s[getDay(d).status]++; });
    return s;
  }, [rangeDays, getDay]);

  const totalDays = rangeDays.length;

  const saveMut = useMutation({
    mutationFn: ({ tourId, date, data }) => updateDateAvailability(tourId, date, data),
    onSuccess: () => { toast.success("Availability updated"); queryClient.invalidateQueries({ queryKey: ["tour-availability", tourId] }); },
    onError: (e) => { toast.error(e.response?.data?.message || "Failed to update"); },
  });

  const blockMut = useMutation({
    mutationFn: ({ tourId, date, status }) => updateDateAvailability(tourId, date, { status }),
    onSuccess: () => { toast.success("Date updated"); queryClient.invalidateQueries({ queryKey: ["tour-availability", tourId] }); },
    onError: (e) => { toast.error(e.response?.data?.message || "Failed to update"); },
  });

  const revertMut = useMutation({
    mutationFn: ({ tourId, date }) => removeDateOverride(tourId, date),
    onSuccess: () => { toast.success("Reverted to template"); queryClient.invalidateQueries({ queryKey: ["tour-availability", tourId] }); },
    onError: (e) => { toast.error(e.response?.data?.message || "Failed to revert"); },
  });

  const openPanel = useCallback((date) => {
    const d = getDay(date);
    setSelectedDate(date);
    setEditStatus(d.status);
    setEditCapacity(String(d.capacity));
    if (panelOpen) return;
    setPanelOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPanelVisible(true)));
  }, [getDay, panelOpen]);

  const handleSave = () => {
    if (!selectedDate || !tourId) return;
    saveMut.mutate({ tourId, date: format(selectedDate, "yyyy-MM-dd"), data: { status: editStatus.toUpperCase(), capacity: Number(editCapacity) } });
    closePanel();
  };

  const handleRevert = () => {
    if (!selectedDate || !tourId) return;
    revertMut.mutate({ tourId, date: format(selectedDate, "yyyy-MM-dd") });
    closePanel();
  };

  const handleBlockToggle = () => {
    if (!selectedDate || !tourId) return;
    blockMut.mutate({ tourId, date: format(selectedDate, "yyyy-MM-dd"), status: editStatus === "blocked" ? "AVAILABLE" : "BLOCKED" });
    closePanel();
  };

  const selectedDay = selectedDate ? getDay(selectedDate) : null;
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const cfg = selectedDay ? STATUS_CONFIG[editStatus] || STATUS_CONFIG.available : null;
  const pending = saveMut.isPending || blockMut.isPending || revertMut.isPending;

  const padStart = dateMode === "month" ? startOfMonth(currentDate).getDay() : 0;

  // ====== LOADING / ERROR / EMPTY ======
  if (toursLoading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  if (toursError) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle size={40} className="text-red-500" />
      <p className="text-slate-500">Failed to load tours</p>
      <button onClick={() => queryClient.invalidateQueries({ queryKey: ["supplier-tours"] })} className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm hover:bg-[#033629]"><RefreshCw size={14} /> Retry</button>
    </div>
  );

  if (tours.length === 0) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-4 p-4 bg-slate-50 rounded-full"><Package size={56} className="text-slate-400" strokeWidth={1.5} /></div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tours Yet</h3>
      <p className="text-slate-500 max-w-md">Create a tour first to manage its availability.</p>
    </div>
  );

  if (availError) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle size={40} className="text-red-500" />
      <p className="text-slate-500">Failed to load availability for this tour</p>
      <button onClick={() => refetchAvail()} className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm hover:bg-[#033629]"><RefreshCw size={14} /> Retry</button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Availability</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage when your tours can be booked</p>
        </div>
      </div>

      {/* ====== CONTROLS ====== */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:px-5 sm:py-3 mb-6 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CalendarIcon size={16} className="text-slate-400 shrink-0" />
          <Select value={tourId || ""} onValueChange={handleTourChange}>
            <SelectTrigger className="flex-1 min-w-0 border-0 bg-transparent shadow-none px-0 text-sm font-medium text-slate-900 focus:ring-0 focus:border-0">
              <SelectValue placeholder="Select a tour" />
            </SelectTrigger>
            <SelectContent>
              {tours.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0">
            {[
              { key: "month", label: "Month" },
              { key: "30days", label: "30 Days" },
              { key: "all", label: "All" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setDateMode(m.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  dateMode === m.key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {dateMode === "month" && (
            <>
              <div className="flex items-center gap-0.5">
                <button onClick={() => goMonth("prev")} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={15} /></button>
                <span className="text-sm font-semibold text-slate-800 w-24 text-center select-none">{format(currentDate, "MMMM yyyy")}</span>
                <button onClick={() => goMonth("next")} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><ChevronRight size={15} /></button>
              </div>
              <button onClick={() => { const d = new Date(); setCurrentDate(d); syncUrl(selectedTour, d); }} className="text-xs font-medium text-[#044b3b] hover:text-[#033629] transition-colors px-1.5 py-1 rounded-md hover:bg-emerald-50">
                Today
              </button>
            </>
          )}

          {dateMode !== "month" && (
            <span className="text-xs text-slate-400 select-none">
              {dateMode === "30days" ? format(new Date(), "MMM d") + " – " + format(addDays(new Date(), 29), "MMM d, yyyy") : format(subMonths(new Date(), 3), "MMM d") + " – " + format(addMonths(new Date(), 3), "MMM d, yyyy")}
            </span>
          )}

          {availLoading && <RefreshCw size={13} className="animate-spin text-slate-400 shrink-0" />}
          {availError && !availLoading && (
            <button onClick={() => refetchAvail()} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"><RefreshCw size={12} /> Retry</button>
          )}
        </div>
      </div>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Available", value: stats.available, icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200/60", color: "text-emerald-600", bar: "from-emerald-400 to-emerald-300", },
          { label: "Limited", value: stats.limited, icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200/60", color: "text-amber-600", bar: "from-amber-400 to-amber-300", },
          { label: "Full", value: stats.full, icon: XCircle, bg: "bg-red-50", border: "border-red-200/60", color: "text-red-600", bar: "from-red-400 to-red-300", },
          { label: "Blocked", value: stats.blocked, icon: Ban, bg: "bg-slate-50", border: "border-slate-200/60", color: "text-slate-500", bar: "from-slate-400 to-slate-300", },
        ].map((s) => (
          <div key={s.label} className="relative bg-white rounded-xl border border-slate-200 p-3 sm:p-4 group hover:shadow-md hover:border-slate-300 transition-all overflow-hidden">
            <div className="flex items-start gap-2.5 sm:gap-3.5">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className={`text-xl sm:text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight mt-0.5">{s.label}</p>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 bg-linear-to-r ${s.bar} transition-all duration-500 ease-out rounded-full`}
              style={{ width: s.value > 0 ? `${Math.min((s.value / totalDays) * 100, 100)}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* ====== STATUS FILTER + LEGEND ====== */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 flex-wrap">
        {STATUS_ORDER.map((s) => {
          const c = STATUS_CONFIG[s];
          const active = statusFilter[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter((prev) => ({ ...prev, [s]: !prev[s] }))}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition-all ${
                active
                  ? `${s === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : s === "limited" ? "border-amber-200 bg-amber-50 text-amber-700" : s === "full" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600"}`
                  : "border-transparent text-slate-300 hover:text-slate-400"
              }`}
            >
              <c.icon size={11} />
              {c.label}
            </button>
          );
        })}
        <span className="text-[11px] text-slate-300 mx-0.5 sm:mx-1 hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#044b3b]" />
          <span className="text-[11px] text-slate-400">Override</span>
        </div>
      </div>

      {/* ====== CALENDAR ====== */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1.5 sm:py-2 text-center text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {availLoading && !calendar.length ? (
          <div className="py-20 flex items-center justify-center"><LoadingSpinner /></div>
        ) : visibleDays.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CalendarIcon size={32} className="text-slate-300 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-slate-400">No dates match the current filters</p>
            <button onClick={() => setStatusFilter({ available: true, limited: true, full: true, blocked: true })} className="mt-2 text-xs text-[#044b3b] hover:text-[#033629] underline">
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: padStart }).map((_, i) => <div key={`p-${i}`} className="bg-white" />)}

              {visibleDays.map((date) => {
              const day = getDay(date);
              const s = STATUS_CONFIG[day.status] || STATUS_CONFIG.available;
              const today = isToday(date);
              const usage = day.capacity > 0 ? (day.booked / day.capacity) * 100 : 0;
              const filteredOut = !statusFilter[day.status];
              const isBlocked = day.status === "blocked";

              return (
                <button
                  key={format(date, "yyyy-MM-dd")}
                  onClick={() => !filteredOut && openPanel(date)}
                  disabled={filteredOut}
                   className={`relative flex flex-col items-center py-2 sm:py-3 px-0.5 sm:px-1 border-b border-r border-slate-100 transition-colors min-h-[60px] sm:min-h-[80px] ${
                    filteredOut
                      ? "opacity-20 cursor-default bg-white"
                      : isBlocked
                        ? "bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        : day.status === "full"
                          ? "bg-red-50 hover:bg-red-100 cursor-pointer"
                          : "hover:bg-slate-50 active:bg-slate-100 cursor-pointer bg-white"
                  } ${today && !isBlocked && day.status !== "full" ? "bg-emerald-50/40" : ""}`}
                >
                  <span className={`text-xs sm:text-sm font-semibold leading-none mb-1 sm:mb-1.5 ${today && !isBlocked && day.status !== "full" ? "text-[#044b3b]" : isBlocked || day.status === "full" ? "text-slate-400" : "text-slate-700"}`}>
                    {format(date, "d")}
                  </span>

                  {!isBlocked && (
                    <span className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                      {day.status === "available" && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400" />}
                      {day.status === "limited" && (
                        <>
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400" />
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400" />
                        </>
                      )}
                      {day.status === "full" && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-400" />}
                    </span>
                  )}

                  {isBlocked ? (
                    <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-none mt-0.5">Blocked</span>
                  ) : (
                    <>
                      <div className="hidden sm:block w-8 h-1 rounded-full bg-slate-100 overflow-hidden mb-1">
                        <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${Math.min(usage, 100)}%` }} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 leading-none">{day.booked}/{day.capacity}</span>
                    </>
                  )}

                  {day.hasOverride && <span className="absolute top-1.5 right-1.5 sm:right-2 w-1 h-1 rounded-full bg-[#044b3b]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== SIDE PANEL ========== */}
      {panelOpen && selectedDate && selectedDay && (
        <>
          <div className={`fixed inset-0 bg-black/20 z-[70] transition-opacity duration-250 ${panelVisible ? "opacity-100" : "opacity-0"}`} onClick={closePanel} />
          <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[71] flex flex-col transition-all duration-250 ease-out ${panelVisible ? "translate-x-0" : "translate-x-full"}`}>

            {/* === ACCENT BAR at top based on current status === */}
            <div className={`h-1.5 shrink-0 transition-colors duration-300 ${editStatus === "blocked" ? "bg-slate-400" : editStatus === "limited" ? "bg-amber-400" : editStatus === "full" ? "bg-red-400" : "bg-emerald-400"}`} />

            {/* === PANEL HEADER — big date === */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <button onClick={closePanel} className="bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 p-1.5 rounded-lg transition-colors shadow-sm">
                  <ChevronLeft size={16} />
                </button>
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg ? STATUS_CONFIG[editStatus]?.badge?.split(" ")[0] : "text-slate-400"}`}>
                  {cfg?.label || "Available"}
                </span>
              </div>

              <div className="flex items-end gap-3 mt-1">
                <span className="text-5xl font-extralight text-slate-900 leading-none tracking-tight">
                  {format(selectedDate, "d")}
                </span>
                <div className="pb-1">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{format(selectedDate, "EEEE")}</p>
                  <p className="text-xs text-slate-400">{format(selectedDate, "MMMM yyyy")}</p>
                </div>
              </div>
            </div>

            {/* === PANEL BODY === */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* --- Status Pickers as large cards --- */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Set Status</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {STATUS_ORDER.map((s) => {
                    const c = STATUS_CONFIG[s];
                    const active = editStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`relative group flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          active
                            ? `${s === "available" ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm" : s === "limited" ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm" : s === "full" ? "border-red-400 bg-red-50 text-red-700 shadow-sm" : "border-slate-300 bg-slate-50 text-slate-600 shadow-sm"}`
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <c.icon size={20} className={active ? "" : "text-slate-300 group-hover:text-slate-500 transition-colors"} />
                        <span className="text-[13px] font-semibold">{c.label}</span>
                        {active && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-current flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-current" /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- Capacity (hidden for blocked) --- */}
              {editStatus !== "blocked" && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Capacity</p>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(e.target.value)}
                          min="1"
                          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] text-center"
                        />
                        <span className="text-xs text-slate-400">people max</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        <span className="text-slate-800">{selectedDay.booked}</span> booked
                      </span>
                    </div>

                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cfg?.bar || "bg-emerald-400"}`}
                        style={{ width: `${Math.min((selectedDay.booked / (Number(editCapacity) || 1)) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0</span>
                      <span>{Math.max(0, (Number(editCapacity) || selectedDay.capacity) - selectedDay.booked)} remaining</span>
                      <span>{editCapacity || selectedDay.capacity}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Time Slots --- */}
              {editStatus !== "blocked" && selectedDay.slots?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={12} className="text-slate-400" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Time Slots</p>
                  </div>
                  <div className="space-y-2">
                    {selectedDay.slots.map((slot, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3.5 py-2.5 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <span className="text-sm font-medium text-slate-700">{slot.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${slot.booked >= slot.capacity ? "text-red-500" : "text-slate-500"}`}>
                            {slot.booked}/{slot.capacity}
                          </span>
                          <span className="text-[10px] text-slate-400">booked</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- Summary card --- */}
              {editStatus !== "blocked" && (
                <div className="bg-linear-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users size={12} className="text-slate-400" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Booking Summary</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Capacity", value: Number(editCapacity) || selectedDay.capacity, color: "text-slate-900" },
                      { label: "Booked", value: selectedDay.booked, color: selectedDay.booked > 0 ? "text-amber-600" : "text-slate-500" },
                      { label: "Available", value: Math.max(0, (Number(editCapacity) || selectedDay.capacity) - selectedDay.booked), color: "text-emerald-600" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white rounded-lg border border-slate-100 py-2.5 text-center">
                        <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- Override indicator --- */}
              {selectedDay.hasOverride && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>An override is active for this date</span>
                </div>
              )}
            </div>

            {/* === PANEL FOOTER === */}
            <div className="border-t border-slate-100 px-5 py-4 space-y-2 bg-slate-50/50">
              <button
                onClick={handleSave}
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-xl text-sm font-semibold hover:bg-[#033629] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMut.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>

              <div className="flex gap-2">
                {selectedDay.hasOverride && (
                  <button
                    onClick={handleRevert}
                    disabled={pending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Undo2 size={13} /> Revert
                  </button>
                )}
                <button
                  onClick={handleBlockToggle}
                  disabled={pending}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 ${
                    editStatus === "blocked"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  }`}
                >
                  <Ban size={13} />
                  {editStatus === "blocked" ? "Unblock Date" : "Block Date"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
