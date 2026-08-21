import { useState, useCallback, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Loader2,
  MapPinned,
  Phone,
  Clock,
  Pencil,
  X,
  MessageSquareText,
  AlertTriangle,
  CheckCircle2,
  Search,
  CalendarDays,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime, cn } from "@/lib/utils";
import OptimizedImage from "@/components/shared/OptimizedImage";
import AmPmTimePicker from "@/components/shared/AmPmTimePicker";
import LocationMapPicker from "@/components/shared/LocationMapPicker";
import PickupMapPreview from "../components/PickupMapPreview";
import { fetchPickupPlanner, updateBookingPickup } from "../api";
import { getAuthToken } from "@/stores/authStore";
import EmptyState from "@/components/shared/EmptyState";

const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Next 7 days" },
  { key: "30d", label: "Next 30 days" },
];

function toDateKey(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function formatDateHeader(dateKey) {
  if (!dateKey) return "Unknown date";
  const date = new Date(dateKey + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function pickupLabel(pickup) {
  if (!pickup) return "";
  if (pickup.place) return pickup.place;
  if (pickup.areaName) return `Pickup area: ${pickup.areaName}`;
  if (pickup.locationName) return pickup.locationName;
  if (pickup.address?.name) return pickup.address.name;
  if (pickup.address?.address) return pickup.address.address;
  return "Pickup requested";
}

function isPickupIncomplete(pickup) {
  if (!pickup) return true;
  if (!pickup.place && !pickup.areaName && !pickup.locationName && !pickup.address) return true;
  if (!pickup.time) return true;
  if (!pickup.instructions) return true;
  return false;
}

function getPickupCompleteness(pickup) {
  if (!pickup) return { missing: ["place", "time", "instructions"], score: 0 };
  const missing = [];
  if (!pickup.place && !pickup.areaName && !pickup.locationName && !pickup.address) missing.push("place");
  if (!pickup.time) missing.push("time");
  if (!pickup.instructions) missing.push("instructions");
  const score = 3 - missing.length;
  return { missing, score };
}

function sortBookingsByPriority(bookings) {
  return [...bookings].sort((a, b) => {
    const aScore = getPickupCompleteness(a.pickup).score;
    const bScore = getPickupCompleteness(b.pickup).score;
    if (aScore !== bScore) return aScore - bScore;
    return new Date(a.travelDate) - new Date(b.travelDate);
  });
}

function CompletenessIndicator({ pickup }) {
  const { score } = getPickupCompleteness(pickup);
  if (score === 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium">
        <CheckCircle2 size={11} /> Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
      <AlertTriangle size={11} /> {score === 0 ? "No info" : `${score}/3`}
    </span>
  );
}

function BookingCard({ booking, onEdit }) {
  const pickup = booking.pickup || {};
  const incomplete = isPickupIncomplete(pickup);
  const address = pickup.place || pickup.address?.name || pickup.address?.address || "";

  return (
    <div
      className={cn(
        "bg-white border border-emerald-100/60 rounded-xl overflow-hidden transition-all duration-200",
        "hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/5",
        incomplete ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-emerald-500"
      )}
    >
      <div className="p-5">
        {/* Header: Tour photo + Date/Time + Completeness */}
        <div className="flex items-center gap-3 mb-4">
          {booking.tourPhoto ? (
            <OptimizedImage
              src={booking.tourPhoto}
              alt=""
              width={64}
              fit="fill"
              className="w-10 h-10 rounded-lg object-cover border border-emerald-100/60"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
              <MapPinned size={16} className="text-emerald-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {formatDate(booking.travelDate)}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock size={11} /> {formatTime(booking.selectedTime) || "Flexible"}
            </p>
          </div>
          <CompletenessIndicator pickup={pickup} />
        </div>

        {/* Tour name + Customer + Status */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-800 mb-1">{booking.tourName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users size={11} /> {booking.customerName}
            </span>
            {booking.customerPhone && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone size={10} /> {booking.customerPhone}
              </span>
            )}
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Pickup Details Section (inset) */}
        <div
          className={cn(
            "rounded-lg p-4 border",
            incomplete
              ? "bg-amber-50/50 border-amber-200/60"
              : "bg-emerald-50/30 border-emerald-200/40"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "p-1.5 rounded-md",
                incomplete ? "bg-amber-100" : "bg-emerald-100"
              )}
            >
              <MapPinned
                size={13}
                className={incomplete ? "text-amber-600" : "text-emerald-600"}
              />
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                incomplete ? "text-amber-800" : "text-emerald-800"
              )}
            >
              {pickup.place || pickup.areaName || pickup.locationName || pickup.address?.name
                ? pickupLabel(pickup)
                : "No pickup location set"}
            </span>
          </div>

          {pickup.time && (
            <div className="flex items-center gap-2 mb-2 ml-8">
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs text-slate-600">{formatTime(pickup.time)}</span>
            </div>
          )}
          {!pickup.time && incomplete && (
            <div className="flex items-center gap-2 mb-2 ml-8">
              <Clock size={12} className="text-amber-400" />
              <span className="text-xs text-amber-600 font-medium">Time not set</span>
            </div>
          )}

          {pickup.instructions && (
            <div className="flex items-start gap-2 mb-3 ml-8">
              <MessageSquareText size={12} className="text-slate-400 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600 leading-relaxed">
                {pickup.instructions}
              </span>
            </div>
          )}
          {!pickup.instructions && incomplete && (
            <div className="flex items-center gap-2 mb-3 ml-8">
              <MessageSquareText size={12} className="text-amber-400" />
              <span className="text-xs text-amber-600 font-medium">Instructions not set</span>
            </div>
          )}

          <div className="ml-8">
            <PickupMapPreview lat={pickup.lat} lng={pickup.lng} address={address} />
          </div>
        </div>

        {/* Edit button */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => onEdit(booking)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Pencil size={12} />
            Edit pickup
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPickupModal({ booking, onClose, onSaved }) {
  const pickup = booking?.pickup || {};
  const [pickupTime, setPickupTime] = useState(pickup.time || "");
  const [pickupPlace, setPickupPlace] = useState(pickup.place || "");
  const [instructions, setInstructions] = useState(pickup.instructions || "");
  const [lat, setLat] = useState(pickup.lat || null);
  const [lng, setLng] = useState(pickup.lng || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!booking) return;
    setSaving(true);
    try {
      const payload = {};
      if (pickupTime !== pickup.time) payload.pickupTime = pickupTime;
      if (pickupPlace !== pickup.place) payload.pickupPlace = pickupPlace;
      if (instructions !== pickup.instructions) payload.instructions = instructions;
      if (lat !== pickup.lat) payload.lat = lat;
      if (lng !== pickup.lng) payload.lng = lng;

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      await updateBookingPickup(booking.id, payload);
      toast.success("Pickup details saved. The customer has been notified.");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save pickup details");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = useCallback(
    (result) => {
      if (!result) {
        setLat(null);
        setLng(null);
        return;
      }
      setLat(result.latitude || null);
      setLng(result.longitude || null);
      if (result.formatted && !pickupPlace) {
        const parts = result.formatted.split(",");
        setPickupPlace(parts[0]?.trim() || result.formatted);
      }
    },
    [pickupPlace]
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[580px] max-h-[90vh] overflow-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit pickup</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {booking?.tourName} — {booking?.bookingNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Pickup time</label>
              <AmPmTimePicker value={pickupTime} onChange={setPickupTime} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Pickup place <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-emerald-100/60 bg-emerald-50/30 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white resize-vertical transition-all"
                rows={2}
                value={pickupPlace}
                onChange={(e) => setPickupPlace(e.target.value)}
                placeholder="e.g. Main entrance, Marriott Hotel"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Pickup location <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <LocationMapPicker
                onSelect={handleLocationSelect}
                initialLat={lat}
                initialLng={lng}
                label="Pickup location"
                placeholder="Search for pickup address..."
              />
              {lat && lng && (
                <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Instructions for the customer <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-emerald-100/60 bg-emerald-50/30 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white resize-vertical transition-all"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Look for the blue van with our logo at the south entrance"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                The customer receives a notification with the updated details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-emerald-100/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#044b3b] rounded-lg hover:bg-[#033629] shadow-sm transition-all disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save & notify customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PickupPlannerPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("7d");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const computeRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (range === "today") return { from: toDateKey(today), to: toDateKey(today) };
    if (range === "30d")
      return { from: toDateKey(today), to: toDateKey(new Date(today.getTime() + 30 * 86400000)) };
    return { from: toDateKey(today), to: toDateKey(new Date(today.getTime() + 7 * 86400000)) };
  }, [range]);

  const loadPlanner = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { from, to } = computeRange();
      const result = await fetchPickupPlanner({
        from,
        to,
        ...(status ? { status } : {}),
      });
      setBookings(result.bookings);
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, [computeRange, status]);

  useEffect(() => {
    Promise.resolve().then(() => loadPlanner());
  }, [loadPlanner]);

  const { from, to } = computeRange();

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.customerName?.toLowerCase().includes(q) ||
          b.tourName?.toLowerCase().includes(q) ||
          b.bookingNumber?.toLowerCase().includes(q) ||
          pickupLabel(b.pickup)?.toLowerCase().includes(q)
      );
    }

    if (showIncompleteOnly) {
      filtered = filtered.filter((b) => isPickupIncomplete(b.pickup));
    }

    return sortBookingsByPriority(filtered);
  }, [bookings, searchQuery, showIncompleteOnly]);

  const groupedBookings = useMemo(() => {
    const groups = {};
    filteredBookings.forEach((b) => {
      const dateKey = toDateKey(b.travelDate);
      if (!dateKey) return;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(b);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBookings]);

  const incompleteCount = useMemo(
    () => bookings.filter((b) => isPickupIncomplete(b.pickup)).length,
    [bookings]
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pickup Planner</h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate pickup details for every booking that includes pickup.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPlanner}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-emerald-200/60 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Incomplete Alert */}
      {incompleteCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{incompleteCount}</span> booking
            {incompleteCount !== 1 ? "s" : ""} missing pickup details.{" "}
            <button
              type="button"
              onClick={() => setShowIncompleteOnly(true)}
              className="underline font-semibold hover:text-amber-900 transition-colors"
            >
              Show incomplete only
            </button>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-emerald-50/60 border border-emerald-100/60 rounded-xl">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setRange(preset.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                range === preset.key
                  ? "bg-[#044b3b] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-emerald-50/40"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-emerald-100/60 bg-emerald-50/30 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No-show</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-emerald-100/60 bg-emerald-50/30 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all"
          />
        </div>

        {showIncompleteOnly && (
          <button
            type="button"
            onClick={() => setShowIncompleteOnly(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <X size={12} /> Clear filter
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto hidden sm:block">
          {from} → {to}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
          <p className="text-sm">Loading pickups...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      ) : groupedBookings.length === 0 ? (
        <EmptyState
          icon="bookings"
          title={searchQuery || showIncompleteOnly ? "No matching bookings" : "No pickups in this range"}
          description={
            searchQuery || showIncompleteOnly
              ? "Try adjusting your search or filters."
              : "Bookings with a pickup selection will appear here. Switch the date range above to see more."
          }
        />
      ) : (
        <div className="space-y-6">
          {groupedBookings.map(([dateKey, dayBookings]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-[#f8fafc] py-2 px-1 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-slate-400" />
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {formatDateHeader(dateKey)}
                  </h3>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Booking Cards */}
              <div className="space-y-3">
                {dayBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <EditPickupModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadPlanner();
          }}
        />
      )}
    </div>
  );
}
