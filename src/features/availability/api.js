import api from "@/lib/axios";

export function mapCalendarDay(day) {
  return {
    date: day.date,
    dayOfWeek: day.dayOfWeek,
    isOperatingDay: day.isOperatingDay,
    status: (day.status || "available").toLowerCase(),
    capacity: day.capacity,
    booked: day.booked,
    remaining: day.remaining,
    capacityUnit: day.capacityUnit === "groups" ? "groups" : "people",
    groupsPerSlot: day.groupsPerSlot ?? null,
    maxGroupSize: day.maxGroupSize ?? null,
    slots: (day.timeSlots || []).map((s) => ({
      time: s.time,
      capacity: s.capacity,
      booked: s.booked || 0,
      groupsBooked: s.groupsBooked ?? 0,
      groupsRemaining: s.groupsRemaining ?? null,
    })),
    hasOverride: day.hasOverride,
    overrideStatus: day.overrideStatus ? day.overrideStatus.toLowerCase() : null,
  };
}

export async function fetchTourAvailability(tourId, startDate, endDate) {
  const response = await api.get(`/tours/${tourId}/availability`, {
    params: { startDate, endDate },
    skipGlobalErrorHandler: true,
  });

  const payload = response.data?.data || {};
  return {
    tour: payload.tour || null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    calendar: (payload.calendar || []).map(mapCalendarDay),
  };
}

export function updateDateAvailability(tourId, date, payload) {
  return api.patch(`/tours/${tourId}/availability/${date}`, payload, {
    skipGlobalErrorHandler: true,
  });
}

export function removeDateOverride(tourId, date) {
  return api.delete(`/tours/${tourId}/availability/${date}`, {
    skipGlobalErrorHandler: true,
  });
}

export function batchUpdateAvailability(tourId, updates) {
  return api.post(`/tours/${tourId}/availability/batch`, { updates }, {
    skipGlobalErrorHandler: true,
  });
}
