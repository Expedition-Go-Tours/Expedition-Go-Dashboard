import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Loader2, MapPinned, Phone, Clock, Pencil, X, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime, cn } from "@/lib/utils";
import OptimizedImage from "@/components/shared/OptimizedImage";
import AmPmTimePicker from "@/components/shared/AmPmTimePicker";
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
  return dt.toISOString().slice(0, 10);
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

function EditPickupModal({ booking, onClose, onSaved }) {
  const [pickupTime, setPickupTime] = useState(booking?.pickup?.time || "");
  const [pickupPlace, setPickupPlace] = useState(booking?.pickup?.place || "");
  const [instructions, setInstructions] = useState(booking?.pickup?.instructions || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!booking) return;
    setSaving(true);
    try {
      await updateBookingPickup(booking.id, {
        ...(pickupTime !== booking.pickup?.time ? { pickupTime } : {}),
        ...(pickupPlace !== booking.pickup?.place ? { pickupPlace } : {}),
        ...(instructions !== booking.pickup?.instructions ? { instructions } : {}),
      });
      toast.success("Pickup details saved. The customer has been notified.");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save pickup details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit pickup</h2>
              <p className="text-sm text-slate-500 mt-0.5">{booking?.tourName} — {booking?.bookingNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Pickup time</label>
              <AmPmTimePicker value={pickupTime} onChange={setPickupTime} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Pickup place <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-vertical"
                rows={2}
                value={pickupPlace}
                onChange={(e) => setPickupPlace(e.target.value)}
                placeholder="e.g. Main entrance, Marriott Hotel"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Instructions for the customer <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-vertical"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Look for the blue van with our logo at the south entrance"
              />
              <p className="text-xs text-slate-400 mt-1">The customer receives a notification with the updated details.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
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

  const computeRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (range === "today") return { from: toDateKey(today), to: toDateKey(today) };
    if (range === "30d") return { from: toDateKey(today), to: toDateKey(new Date(today.getTime() + 30 * 86400000)) };
    return { from: toDateKey(today), to: toDateKey(new Date(today.getTime() + 7 * 86400000)) };
  }, [range]);

  const loadPlanner = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { from, to } = computeRange();
      const result = await fetchPickupPlanner({ from, to, ...(status ? { status } : {}) });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pickup Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Coordinate pickup details for every booking that includes pickup.</p>
        </div>
        <button
          type="button"
          onClick={loadPlanner}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setRange(preset.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                range === preset.key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No-show</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="text-xs text-slate-400">{from} → {to}</span>
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
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="bookings"
          title="No pickups in this range"
          description="Bookings with a pickup selection will appear here. Switch the date range above to see more."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const pickup = booking.pickup || {};
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row gap-4 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-3 sm:w-44 shrink-0">
                  {booking.tourPhoto ? (
                    <OptimizedImage src={booking.tourPhoto} alt="" width={64} fit="fill" className="w-11 h-11 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center"><MapPinned size={18} className="text-slate-400" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{formatDate(booking.travelDate)}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {formatTime(booking.selectedTime) || "Flexible"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{booking.tourName}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-slate-500">{booking.customerName}</span>
                    {booking.customerPhone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} /> {booking.customerPhone}</span>
                    )}
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700">
                      <MapPinned size={11} /> {pickupLabel(pickup)}
                    </span>
                    {pickup.time && <span className="text-xs text-slate-500">at {formatTime(pickup.time)}</span>}
                    {pickup.instructions && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400"><MessageSquareText size={11} /> {pickup.instructions}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(booking)}
                  className="shrink-0 inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg border border-emerald-600 text-emerald-600 text-sm font-medium hover:bg-emerald-50 transition-colors"
                >
                  <Pencil size={14} />
                  Edit pickup
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditPickupModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadPlanner(); }}
        />
      )}
    </div>
  );
}