import { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Upload,
  Loader2,
  Car,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CalendarClock,
} from "lucide-react";
import { loadSupplierProfile } from "@/features/auth/api";
import { replaceDocument, addVehicle, removeVehicle, addGuide, removeGuide } from "@/features/supplier/api";
import { formatDate } from "@/lib/utils";

const DOC_LABEL = (type) =>
  (type || "Other").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const DOC_STATUS_STYLES = {
  APPROVED: "bg-[#dcfce7] text-[#166534]",
  REJECTED: "bg-[#fee2e2] text-[#991b1b]",
  REPLACEMENT_REQUESTED: "bg-[#fef3c7] text-[#92400e]",
  EXPIRED: "bg-[#fee2e2] text-[#991b1b]",
  PENDING: "bg-[#dbeafe] text-[#1e40af]",
};

const VEHICLE_DOC_TYPES = [
  { type: "VEHICLE_REGISTRATION", label: "Vehicle registration" },
  { type: "VEHICLE_OWNERSHIP", label: "Ownership document" },
  { type: "VEHICLE_ROADWORTHINESS", label: "Roadworthiness" },
  { type: "VEHICLE_INSURANCE", label: "Insurance" },
];

const GUIDE_DOC_TYPES = [
  { type: "TOUR_GUIDE_LICENCE", label: "Tour guide licence" },
  { type: "DRIVERS_LICENCE", label: "Driver's licence" },
];

function StatusPill({ status }) {
  const style = DOC_STATUS_STYLES[status] || "bg-[#f1f5f9] text-[#64748b]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style}`}>
      {status === "APPROVED" ? <CheckCircle2 size={12} /> :
       status === "REJECTED" ? <XCircle size={12} /> :
       status === "REPLACEMENT_REQUESTED" ? <AlertTriangle size={12} /> :
       status === "EXPIRED" ? <XCircle size={12} /> :
       <Clock size={12} />}
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DocumentRow({ doc, onReplace }) {
  const inputRef = useRef(null);
  const replaceable = ["REJECTED", "REPLACEMENT_REQUESTED", "EXPIRED"].includes(doc.status);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eaeaea] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#1e293b]">{DOC_LABEL(doc.type)}</p>
          <StatusPill status={doc.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748b]">
          {doc.expiryDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={12} /> expires {formatDate(doc.expiryDate)}
            </span>
          )}
          {doc.reviewNote && <span className="text-[#dc2626]">note: {doc.reviewNote}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#334155] transition hover:border-[#044b3b]/40 hover:text-[#044b3b]"
          >
            <FileText size={14} /> View
          </a>
        )}
        {replaceable && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onReplace(doc, file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#044b3b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#033629]"
            >
              <Upload size={14} /> Upload replacement
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const emptyVehicle = { make: "", model: "", year: "", registrationNumber: "", photos: [], docs: {} };
const emptyGuide = { fullName: "", phone: "", email: "", docs: {} };

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [guideForm, setGuideForm] = useState(emptyGuide);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["supplier", "application-status"],
    queryFn: () => loadSupplierProfile(),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["supplier", "application-status"] });
  }, [queryClient]);

  const replaceMutation = useMutation({
    mutationFn: ({ doc, file }) => replaceDocument(doc.id, file),
    onSuccess: () => {
      toast.success("Document re-uploaded — it's back under review");
      refresh();
    },
    onError: () => toast.error("Failed to upload replacement"),
  });

  const handleReplace = (doc, file) => replaceMutation.mutate({ doc, file });

  const handleAddVehicle = async () => {
    const { make, model, registrationNumber } = vehicleForm;
    if (!make.trim() || !model.trim() || !registrationNumber.trim()) {
      toast.error("Vehicle make, model and registration number are required");
      return;
    }
    const documents = VEHICLE_DOC_TYPES.map((dt) => ({ type: dt.type, file: vehicleForm.docs[dt.type] })).filter((d) => d.file);
    const required = VEHICLE_DOC_TYPES.filter((dt) => !vehicleForm.docs[dt.type]);
    if (required.length > 0) {
      toast.error(`Attach ${required[0].label} for this vehicle`);
      return;
    }
    setVehicleSaving(true);
    try {
      await addVehicle({
        data: { key: `vehicle-${Date.now()}`, make, model, year: vehicleForm.year ? parseInt(vehicleForm.year, 10) : null, registrationNumber },
        documents,
        vehiclePhotos: vehicleForm.photos,
      });
      toast.success("Vehicle added — awaiting verification");
      setVehicleForm(emptyVehicle);
      setShowVehicleForm(false);
      refresh();
    } catch {
      toast.error("Failed to add vehicle");
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleRemoveVehicle = async (id) => {
    try {
      await removeVehicle(id);
      toast.success("Vehicle removed");
      refresh();
    } catch {
      toast.error("Failed to remove vehicle");
    }
  };

  const handleAddGuide = async () => {
    if (!guideForm.fullName.trim()) {
      toast.error("Guide full name is required");
      return;
    }
    const documents = GUIDE_DOC_TYPES.map((dt) => ({ type: dt.type, file: guideForm.docs[dt.type] })).filter((d) => d.file);
    const required = GUIDE_DOC_TYPES.filter((dt) => !guideForm.docs[dt.type]);
    if (required.length > 0) {
      toast.error(`Attach ${required[0].label} for this guide`);
      return;
    }
    setGuideSaving(true);
    try {
      await addGuide({
        data: { key: `guide-${Date.now()}`, fullName: guideForm.fullName, phone: guideForm.phone, email: guideForm.email },
        documents,
      });
      toast.success("Guide added — awaiting verification");
      setGuideForm(emptyGuide);
      setShowGuideForm(false);
      refresh();
    } catch {
      toast.error("Failed to add guide");
    } finally {
      setGuideSaving(false);
    }
  };

  const handleRemoveGuide = async (id) => {
    try {
      await removeGuide(id);
      toast.success("Guide removed");
      refresh();
    } catch {
      toast.error("Failed to remove guide");
    }
  };

  const documents = profile?.documents || [];
  const vehicles = profile?.vehicles || [];
  const guides = profile?.guides || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e293b]">
          <ShieldCheck className="text-[#044b3b]" size={20} />
          Verification
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Every document is reviewed individually by our team. Re-upload anything that was rejected or expired to get back online.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#64748b]">
          <Loader2 size={18} className="animate-spin" /> Loading your verification details...
        </div>
      ) : (
        <>
          {/* Documents */}
          <section className="rounded-2xl border border-[#eaeaea] bg-[#f8fafc] p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#044b3b]" />
              <h2 className="text-sm font-bold text-[#1e293b]">Documents ({documents.length})</h2>
            </div>
            {documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4 py-6 text-center text-sm text-[#64748b]">
                No documents on file.
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} onReplace={handleReplace} />
                ))}
              </div>
            )}
          </section>

          {/* Vehicles */}
          <section className="rounded-2xl border border-[#eaeaea] bg-[#f8fafc] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-[#044b3b]" />
                <h2 className="text-sm font-bold text-[#1e293b]">Vehicles ({vehicles.length})</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#044b3b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#033629]"
              >
                <Plus size={14} /> Add vehicle
              </button>
            </div>

            {showVehicleForm && (
              <div className="mb-4 space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={vehicleForm.make} onChange={(e) => setVehicleForm((f) => ({ ...f, make: e.target.value }))} placeholder="Make (e.g. Toyota)" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                  <input value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model (e.g. Hiace)" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                  <input value={vehicleForm.year} onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))} placeholder="Year" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                  <input value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((f) => ({ ...f, registrationNumber: e.target.value }))} placeholder="Registration number" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {VEHICLE_DOC_TYPES.map((dt) => (
                    <label key={dt.type} className="block rounded-lg border border-dashed border-[#cbd5e1] p-3 text-center text-xs text-[#64748b] hover:border-[#044b3b]/40">
                      <span className="mb-1.5 block font-medium text-[#334155]">{dt.label}</span>
                      <input
                        type="file"
                        className="block w-full text-[11px]"
                        accept="image/*,.pdf"
                        onChange={(e) => setVehicleForm((f) => ({ ...f, docs: { ...f.docs, [dt.type]: e.target.files?.[0] || null } }))}
                      />
                    </label>
                  ))}
                </div>
                <label className="block rounded-lg border border-dashed border-[#cbd5e1] p-3 text-center text-xs text-[#64748b] hover:border-[#044b3b]/40">
                  <span className="mb-1.5 block font-medium text-[#334155]">Vehicle photos</span>
                  <input
                    type="file"
                    multiple
                    className="block w-full text-[11px]"
                    accept="image/*"
                    onChange={(e) => setVehicleForm((f) => ({ ...f, photos: Array.from(e.target.files || []) }))}
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowVehicleForm(false)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc]">
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddVehicle} disabled={vehicleSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#044b3b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#033629] disabled:opacity-60">
                    {vehicleSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save vehicle
                  </button>
                </div>
              </div>
            )}

            {vehicles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4 py-6 text-center text-sm text-[#64748b]">
                No vehicles listed.
              </p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eaeaea] bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
                      <Car size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1e293b]">{v.make} {v.model}{v.year ? ` · ${v.year}` : ""}</p>
                        <StatusPill status={v.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748b]">Reg: {v.registrationNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(v.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-1.5 text-xs text-[#64748b] transition hover:border-[#dc2626] hover:text-[#dc2626]"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Guides */}
          <section className="rounded-2xl border border-[#eaeaea] bg-[#f8fafc] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#044b3b]" />
                <h2 className="text-sm font-bold text-[#1e293b]">Guides ({guides.length})</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#044b3b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#033629]"
              >
                <Plus size={14} /> Add guide
              </button>
            </div>

            {showGuideForm && (
              <div className="mb-4 space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={guideForm.fullName} onChange={(e) => setGuideForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                  <input value={guideForm.phone} onChange={(e) => setGuideForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none" />
                  <input value={guideForm.email} onChange={(e) => setGuideForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#044b3b] focus:outline-none sm:col-span-2" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GUIDE_DOC_TYPES.map((dt) => (
                    <label key={dt.type} className="block rounded-lg border border-dashed border-[#cbd5e1] p-3 text-center text-xs text-[#64748b] hover:border-[#044b3b]/40">
                      <span className="mb-1.5 block font-medium text-[#334155]">{dt.label}</span>
                      <input
                        type="file"
                        className="block w-full text-[11px]"
                        accept="image/*,.pdf"
                        onChange={(e) => setGuideForm((f) => ({ ...f, docs: { ...f.docs, [dt.type]: e.target.files?.[0] || null } }))}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowGuideForm(false)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc]">
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddGuide} disabled={guideSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#044b3b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#033629] disabled:opacity-60">
                    {guideSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save guide
                  </button>
                </div>
              </div>
            )}

            {guides.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4 py-6 text-center text-sm text-[#64748b]">
                No guides added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {guides.map((g) => (
                  <div key={g.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eaeaea] bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1e293b]">{g.fullName}</p>
                        <StatusPill status={g.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748b]">{[g.phone, g.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGuide(g.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-1.5 text-xs text-[#64748b] transition hover:border-[#dc2626] hover:text-[#dc2626]"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
