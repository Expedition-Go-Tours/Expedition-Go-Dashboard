const BACKEND_TYPE_TO_UI = {
  BOOKING_CONFIRMED: "booking",
  BOOKING_CANCELLED: "booking",
  PAYMENT_RECEIVED: "payment",
  REVIEW_RECEIVED: "review",
  SUPPLIER_APPROVED: "system",
  SUPPLIER_REJECTED: "alert",
  PAYOUT_PROCESSED: "payment",
  PAYOUT_APPROVED: "payment",
  SYSTEM_ALERT: "system",
  NEW_MESSAGE: "message",
  TOUR_SUBMITTED: "product",
  TOUR_APPROVED: "product",
  TOUR_FLAGGED: "product",
};

function getNotificationRoute(type, data = {}) {
  if (data.bookingId) {
    return { path: `/bookings?bookingId=${data.bookingId}`, label: "View Booking" };
  }
  if (data.reviewId) {
    return { path: `/reviews?reviewId=${data.reviewId}`, label: "View Review" };
  }
  if (data.tourId) {
    return { path: `/products/${data.tourId}`, label: "View Product" };
  }
  if (data.payoutId) {
    return { path: `/finance?tab=payouts&payoutId=${data.payoutId}`, label: "View Payout" };
  }

  switch (type) {
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
      return { path: "/bookings", label: "View Bookings" };
    case "REVIEW_RECEIVED":
      return { path: "/reviews", label: "View Review" };
    case "PAYMENT_RECEIVED":
    case "PAYOUT_PROCESSED":
    case "PAYOUT_APPROVED":
      return { path: "/finance", label: "View Finance" };
    case "SUPPLIER_APPROVED":
    case "SUPPLIER_REJECTED":
      return { path: "/supplier/status", label: "View Status" };
    case "NEW_MESSAGE":
      return { path: "/chat", label: "View Message" };
    default:
      return { path: null, label: null };
  }
}

export function mapBackendNotification(notification) {
  const route = getNotificationRoute(notification.type, notification.data || {});

  return {
    id: notification.id,
    type: BACKEND_TYPE_TO_UI[notification.type] || "system",
    title: notification.title,
    message: notification.message,
    date: notification.createdAt,
    read: Boolean(notification.read),
    action: route.path,
    actionLabel: route.label,
    backendType: notification.type,
    data: notification.data || {},
  };
}

export function parseNotificationsResponse(response) {
  const payload = response?.data?.data ?? response?.data ?? {};
  const notifications = Array.isArray(payload.notifications) ? payload.notifications : [];

  return {
    notifications: notifications.map(mapBackendNotification),
    unreadCount: payload.unreadCount ?? payload.pagination?.unreadCount ?? 0,
    pagination: payload.pagination ?? null,
  };
}

