import api from "@/lib/axios";

export function getTravelerCount(travelers) {
  if (!travelers || typeof travelers !== "object") return 0;
  return (travelers.adults || 0) + (travelers.children || 0) + (travelers.infants || 0);
}

export function mapBookingRow(booking) {
  const travelers = booking.travelers || {};
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    customerId: booking.customer?.id || "",
    customerName: booking.customer?.name || "—",
    customerEmail: booking.customer?.email || "",
    customerPhone: booking.customer?.phone || "",
    customerPhoto: booking.customer?.photoURL || "",
    tourName: booking.tour?.title || "—",
    tourId: booking.tourId,
    tourPhoto: booking.tour?.photos?.[0] || "",
    travelDate: booking.selectedDate,
    bookingDate: booking.createdAt,
    travelers: getTravelerCount(travelers),
    travelersRaw: travelers,
    total: Number(booking.total) || 0,
    subtotal: Number(booking.subtotal) || 0,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    currency: booking.currency || "USD",
    supplierNotes: booking.supplierNotes || "",
    specialRequests: booking.specialRequests || "",
    selectedTime: booking.selectedTime || "",
    pickup: booking.pickup || null,
  };
}

export async function fetchSupplierBookings(params = {}) {
  const response = await api.get("/bookings/supplier/bookings", {
    params,
    skipGlobalErrorHandler: true,
  });
  const payload = response.data?.data || {};
  return {
    bookings: (payload.bookings || []).map(mapBookingRow),
    pagination: payload.pagination || null,
  };
}

export function updateBookingStatus(id, { status, supplierNotes }) {
  return api.patch(
    `/bookings/${id}/status`,
    { status, supplierNotes },
    { skipGlobalErrorHandler: true }
  );
}

export async function fetchCustomerBookings(customerId) {
  const response = await api.get("/bookings/supplier/bookings", {
    params: { customerId },
    skipGlobalErrorHandler: true,
  });
  const payload = response.data?.data || {};
  return (payload.bookings || []).map(mapBookingRow);
}

export async function fetchPickupPlanner(params = {}) {
  const response = await api.get("/bookings/supplier/pickup-planner", {
    params,
    skipGlobalErrorHandler: true,
  });
  const payload = response.data?.data || {};
  return {
    bookings: (payload.bookings || []).map(mapBookingRow),
    pagination: payload.pagination || null,
  };
}

export function updateBookingPickup(id, payload) {
  return api.patch(
    `/bookings/supplier/pickup-planner/${id}`,
    payload,
    { skipGlobalErrorHandler: true }
  );
}
