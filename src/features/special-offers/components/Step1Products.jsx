import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Package, Loader2, Check, AlertCircle, ChevronRight } from "lucide-react";
import { useSpecialOfferBuilderStore } from "@/features/special-offers/stores/specialOfferBuilderStore";
import { cn } from "@/lib/utils";
import OptimizedImage from "@/components/shared/OptimizedImage";
import api from "@/lib/axios";

export default function Step1Products() {
  const { offer, addTarget, removeTarget, errors } = useSpecialOfferBuilderStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.get("/tours/supplier/my-tours", { params: { search: q, limit: 10 } });
      setResults(res.data?.data?.tours || []);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="space-y-6">
      {errors.targets && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{errors.targets}</p>
        </div>
      )}

      <div className="relative" ref={ref}>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full px-4 py-3 pl-10 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
          />
          {loading && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
          )}
        </div>

        <AnimatePresence>
          {open && query.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto"
            >
              {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Searching products...
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="py-8 text-center">
                  <Package size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No products found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try a different search term</p>
                </div>
              )}
              {results.map((tour) => {
                const alreadyAdded = offer.targets.some((t) => t.tourId === tour.id);
                const price = tour.schedulesAndPricing?.pricingSchedules?.schedules?.[0]?.prices?.[0]?.retailPrice;
                return (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => {
                      if (!alreadyAdded) {
                        addTarget({ tourId: tour.id, tourTitle: tour.title, tourPhotos: tour.photos || [], tourOptionKey: null, tourOptionLabel: null });
                      }
                      setQuery("");
                      setOpen(false);
                    }}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3.5 border-b border-slate-50 last:border-b-0 transition-colors text-left",
                      alreadyAdded
                        ? "bg-emerald-50/50 opacity-60 cursor-not-allowed"
                        : "hover:bg-emerald-50"
                    )}
                  >
                    <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {tour.photos?.[0] ? (
                        <OptimizedImage src={tour.photos[0]} alt="" width={44} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={18} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{tour.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{tour.category || "Tour"}</span>
                        {price && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs font-medium text-slate-500">${price}</span>
                          </>
                        )}
                        {tour.status && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className={cn(
                              "text-[10px] font-medium uppercase tracking-wider",
                              tour.status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"
                            )}>
                              {tour.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Check size={14} /> Added
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-slate-300" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {offer.targets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Selected Products <span className="text-slate-400 font-normal">({offer.targets.length})</span>
              </p>
            </div>
            <div className="space-y-2.5">
              {offer.targets.map((target, index) => (
                <motion.div
                  key={`${target.tourId}-${target.tourOptionKey || "all"}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3.5 p-3.5 bg-white rounded-xl border border-emerald-200 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 overflow-hidden shrink-0">
                    {target.tourPhotos?.[0] ? (
                      <OptimizedImage src={target.tourPhotos[0]} alt="" width={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} className="text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{target.tourTitle || "Tour"}</p>
                    {target.tourOptionLabel && (
                      <p className="text-xs text-emerald-600 mt-0.5">Option: {target.tourOptionLabel}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTarget(index)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="Remove"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {offer.targets.length === 0 && !errors.targets && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Package size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No products selected yet</p>
          <p className="text-xs text-slate-400 mt-1">Search and select products to apply this offer to</p>
        </div>
      )}
    </div>
  );
}
