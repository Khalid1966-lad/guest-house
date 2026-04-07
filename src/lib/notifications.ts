import { db } from "@/lib/db"

// ─── Types ─────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_booking"
  | "booking_updated"
  | "check_in"
  | "check_out"
  | "booking_cancelled"
  | "new_invoice"
  | "invoice_paid"
  | "payment_received"
  | "new_restaurant_order"
  | "system"

interface CreateNotificationParams {
  guestHouseId: string
  userId?: string | null
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
}

// ─── Create Notification ──────────────────────────────────────────────────

export async function createNotification(params: CreateNotificationParams) {
  const { guestHouseId, userId, type, title, message, entityType, entityId } = params

  return db.notification.create({
    data: {
      guestHouseId,
      userId: userId || undefined,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
    },
  })
}

// ─── Notification helpers by event type ───────────────────────────────────

export async function notifyNewBooking(params: {
  guestHouseId: string
  userId?: string | null
  guestName: string
  roomNumber: string
  checkIn: string
  checkOut: string
  bookingId: string
}) {
  const { guestHouseId, userId, guestName, roomNumber, checkIn, checkOut, bookingId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "new_booking",
    title: "Nouvelle réservation",
    message: `${guestName} a réservé la chambre ${roomNumber} du ${checkIn} au ${checkOut}`,
    entityType: "booking",
    entityId: bookingId,
  })
}

export async function notifyCheckIn(params: {
  guestHouseId: string
  userId?: string | null
  guestName: string
  roomNumber: string
  bookingId: string
}) {
  const { guestHouseId, userId, guestName, roomNumber, bookingId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "check_in",
    title: "Check-in effectué",
    message: `${guestName} a effectué son check-in dans la chambre ${roomNumber}`,
    entityType: "booking",
    entityId: bookingId,
  })
}

export async function notifyCheckOut(params: {
  guestHouseId: string
  userId?: string | null
  guestName: string
  roomNumber: string
  bookingId: string
}) {
  const { guestHouseId, userId, guestName, roomNumber, bookingId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "check_out",
    title: "Check-out effectué",
    message: `${guestName} a effectué son check-out de la chambre ${roomNumber}`,
    entityType: "booking",
    entityId: bookingId,
  })
}

export async function notifyBookingCancelled(params: {
  guestHouseId: string
  userId?: string | null
  guestName: string
  roomNumber: string
  bookingId: string
  reason?: string
}) {
  const { guestHouseId, userId, guestName, roomNumber, bookingId, reason } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "booking_cancelled",
    title: "Réservation annulée",
    message: `La réservation de ${guestName} (chambre ${roomNumber}) a été annulée${reason ? ` : ${reason}` : ""}`,
    entityType: "booking",
    entityId: bookingId,
  })
}

export async function notifyNewInvoice(params: {
  guestHouseId: string
  userId?: string | null
  invoiceNumber: string
  guestName: string
  total: number
  invoiceId: string
}) {
  const { guestHouseId, userId, invoiceNumber, guestName, total, invoiceId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "new_invoice",
    title: "Nouvelle facture",
    message: `Facture ${invoiceNumber} créée pour ${guestName} — ${total.toFixed(2)} €`,
    entityType: "invoice",
    entityId: invoiceId,
  })
}

export async function notifyInvoicePaid(params: {
  guestHouseId: string
  userId?: string | null
  invoiceNumber: string
  guestName: string
  total: number
  invoiceId: string
}) {
  const { guestHouseId, userId, invoiceNumber, guestName, total, invoiceId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "invoice_paid",
    title: "Facture payée",
    message: `La facture ${invoiceNumber} de ${guestName} (${total.toFixed(2)} €) a été payée`,
    entityType: "invoice",
    entityId: invoiceId,
  })
}

export async function notifyNewRestaurantOrder(params: {
  guestHouseId: string
  userId?: string | null
  orderType: string
  guestName?: string
  roomNumber?: string
  total: number
  orderId: string
}) {
  const { guestHouseId, userId, orderType, guestName, roomNumber, total, orderId } = params
  return createNotification({
    guestHouseId,
    userId,
    type: "new_restaurant_order",
    title: "Nouvelle commande restaurant",
    message: `Commande ${orderType}${guestName ? ` de ${guestName}` : ""}${roomNumber ? ` (ch. ${roomNumber})` : ""} — ${total.toFixed(2)} €`,
    entityType: "restaurant_order",
    entityId: orderId,
  })
}
