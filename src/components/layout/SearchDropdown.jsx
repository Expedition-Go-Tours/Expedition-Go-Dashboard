import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, X, CornerDownLeft } from "lucide-react";
import { useTeamRole } from "@/hooks/useTeamRole";
import { cn } from "@/lib/utils";

const allNavItems = [
  { label: "Dashboard", path: "/", iconName: "LayoutDashboard", permission: null, keywords: ["home", "overview"] },
  { label: "Products", path: "/products", iconName: "Package", permission: "tours.view", keywords: ["tour", "listing", "package"] },
  { label: "Bookings", path: "/bookings", iconName: "Ticket", permission: "bookings.view", keywords: ["reservation", "order", "customer booking"] },
  { label: "Pickup Planner", path: "/pickup-planner", iconName: "MapPinned", permission: "bookings.view", keywords: ["pickup", "map", "transport"] },
  { label: "Special Offers", path: "/special-offers", iconName: "BadgePercent", permission: "tours.manage", keywords: ["discount", "deal", "promo", "offer"] },
  { label: "Cancellation", path: "/cancellation-rate", iconName: "CalendarX2", permission: null, keywords: ["cancel", "refund", "rate"] },
  { label: "Availability", path: "/availability", iconName: "CalendarDays", permission: "tours.view", keywords: ["calendar", "slots", "schedule"] },
  { label: "Customers", path: "/chat", iconName: "Users", permission: "chat.view", keywords: ["chat", "messages", "inbox"] },
  {
    label: "Finance", path: "/finance", iconName: "DollarSign", permission: "earnings.view",
    keywords: ["money", "payout", "bank", "paypal", "withdraw", "earnings"],
    children: [
      { label: "Earnings", tab: "earnings", keywords: ["revenue", "income", "commission"] },
      { label: "Payouts", tab: "payouts", keywords: ["paid", "transfer", "payment"] },
      { label: "Payout Methods", tab: "methods", keywords: ["bank", "paypal", "account", "withdraw"] },
    ],
  },
  { label: "Reviews", path: "/reviews", iconName: "Star", permission: "reviews.view", keywords: ["rating", "feedback"] },
  { label: "Notifications", path: "/notifications", iconName: "Bell", permission: null, keywords: ["alerts", "updates"] },
  { label: "Verification", path: "/verification", iconName: "ShieldCheck", permission: null, keywords: ["verify", "identity", "badge"] },
  { label: "Analytics", path: "/analytics", iconName: "BarChart3", permission: null, keywords: ["stats", "reports", "insights"] },
  {
    label: "Settings", path: "/settings", iconName: "Settings", permission: null,
    keywords: ["account", "preferences", "configuration"],
    children: [
      { label: "Profile", tab: "profile", keywords: ["business", "contact", "info"] },
      { label: "Notifications", tab: "notifications", keywords: ["alerts", "email"] },
      { label: "Payout Settings", tab: "payouts", keywords: ["bank", "paypal", "payout", "withdraw"] },
      { label: "Security", tab: "security", keywords: ["password", "two factor", "login"] },
      { label: "Tax Information", tab: "tax", keywords: ["vat", "tin", "registration"] },
      { label: "Booking Rules", tab: "booking-rules", keywords: ["policies", "cancellation"] },
      { label: "Team", tab: "team", keywords: ["members", "roles", "invite", "staff"] },
    ],
  },
];

const SEARCHABLE_TEXT = (item) => [item.label, item.parent, item.keywords || []].flat().join(" ").toLowerCase();

function flattenNavItems(items) {
  const out = [];
  for (const item of items) {
    out.push(item);
    if (item.children) {
      for (const child of item.children) {
        out.push({
          label: child.label,
          parent: item.label,
          path: `${item.path}?tab=${child.tab}`,
          iconName: item.iconName,
          permission: item.permission,
          keywords: [...(item.keywords || []), ...(child.keywords || [])],
        });
      }
    }
  }
  return out;
}

const RECENT_KEY = "supplier-search-recent";
const MAX_RECENT = 6;

function getRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRecent(recent) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

function saveRecent(path, validPaths) {
  if (!validPaths.has(path)) return;
  const recent = getRecent().filter((p) => p !== path);
  recent.unshift(path);
  persistRecent(recent);
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#044b3b]/10 text-[#044b3b] dark:bg-[#00d67f]/20 dark:text-[#00d67f] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchDropdown() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { hasPermission } = useTeamRole();

  const navItems = useMemo(() => {
    const filtered = allNavItems.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
    return flattenNavItems(filtered);
  }, [hasPermission]);

  const validPaths = useMemo(() => new Set(navItems.map((i) => i.path)), [navItems]);

  const recentPaths = useMemo(() => {
    const raw = getRecent();
    const valid = raw.filter((p) => validPaths.has(p));
    if (valid.length !== raw.length) {
      persistRecent(valid);
    }
    return valid;
  }, [open, validPaths]);

  const recentItems = useMemo(() => {
    return recentPaths
      .map((path) => navItems.find((i) => i.path === path))
      .filter(Boolean);
  }, [recentPaths, navItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return navItems.filter((i) => SEARCHABLE_TEXT(i).includes(q));
  }, [navItems, query]);

  const displayItems = query.trim() ? results : recentItems;
  const isEmpty = query.trim() ? results.length === 0 : recentItems.length === 0;

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const goTo = useCallback(
    (path) => {
      if (!validPaths.has(path)) {
        console.warn(`[SearchDropdown] Navigation blocked: path "${path}" not in permission-filtered items`);
        return;
      }
      saveRecent(path, validPaths);
      setOpen(false);
      setQuery("");
      navigate(path);
    },
    [navigate, validPaths],
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, displayItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = displayItems[highlight];
      if (target) goTo(target.path);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-sm transition-all duration-200",
          open
            ? "border-[#044b3b]/40 ring-2 ring-[#044b3b]/10 text-[#1e293b] shadow"
            : "border-[#eaeaea] text-[#64748b] hover:border-[#044b3b]/30 hover:text-[#1e293b]",
        )}
        aria-label="Search pages"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{query || "Search…"}</span>
        {!open && (
          <kbd className="hidden sm:ml-2 sm:inline-block rounded-md border border-[#eaeaea] bg-[#f8fafc] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">
            ⌘K
          </kbd>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-0 top-full mt-2 w-[280px] sm:w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-lg z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Search pages"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-[#eaeaea] px-4">
              <Search className="h-4 w-4 shrink-0 text-[#94a3a0]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, products, bookings…"
                className="h-12 w-full bg-transparent py-3 text-sm text-[#1e293b] placeholder:text-[#94a3a0] outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#94a3a3] hover:bg-[#f1f5f5] hover:text-[#1e293b] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden shrink-0 rounded-md border border-[#eaeaea] bg-[#f8fafc] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b] sm:block">
                ESC
              </kbd>
            </div>

            {/* Results / Recent */}
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8fafc] border border-[#eaeaea] mb-3">
                    <Search className="h-4 w-4 text-[#94a3a3]" />
                  </div>
                  <p className="text-sm font-medium text-[#64748b]">
                    {query.trim() ? `No results for "${query}"` : "No recent searches"}
                  </p>
                  <p className="text-xs text-[#94a3a3] mt-1">
                    {query.trim() ? "Try a different search term" : "Start typing to search pages"}
                  </p>
                </div>
              ) : (
                <>
                  {!query.trim() && recentItems.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Clock className="h-3 w-3 text-[#94a3a3]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3a3]">
                        Recent
                      </span>
                    </div>
                  )}
                  {displayItems.map((item, idx) => {
                    const itemIdx = query.trim() ? results.indexOf(item) : recentItems.indexOf(item);
                    return (
                      <button
                        key={item.path}
                        onClick={() => goTo(item.path)}
                        onMouseEnter={() => setHighlight(itemIdx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                          idx === highlight
                            ? "bg-[#044b3b]/5 text-[#044b3b]"
                            : "text-[#1e293b] hover:bg-[#f8fafc]",
                        )}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate font-medium">
                            {highlightMatch(item.label, query.trim())}
                          </span>
                          {item.parent && (
                            <span className="truncate text-[11px] text-[#94a3a3]">
                              in {item.parent}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-[#94a3a3]">{item.iconName.replace(/([A-Z])/g, " $1").trim()}</span>
                        {idx === highlight && (
                          <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#eaeaea] px-4 py-2.5 bg-[#f8fafc]">
              <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[#eaeaea] bg-white px-1 py-0.5 text-[10px] font-medium">↑</kbd>
                  <kbd className="rounded border border-[#eaeaea] bg-white px-1 py-0.5 text-[10px] font-medium">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[#eaeaea] bg-white px-1 py-0.5 text-[10px] font-medium">↵</kbd>
                  select
                </span>
              </div>
              <span className="text-[10px] text-[#94a3a3]">
                {navItems.length} pages available
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
