import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns"
import { Prisma } from "@prisma/client"

// GET - Statistiques complètes (optimisé : toutes les requêtes en parallèle)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    if (!guestHouseId) {
      return NextResponse.json({ error: "Maison d'hôtes non configurée" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"
    const yearParam = searchParams.get("year")

    // Determine reference date: use specified year for yearly, current date otherwise
    const now = new Date()
    let referenceDate = now
    if (period === "year" && yearParam) {
      const y = parseInt(yearParam)
      if (!isNaN(y)) {
        referenceDate = new Date(y, now.getMonth(), now.getDate())
      }
    }

    const startDate = period === "year" ? startOfYear(referenceDate) : startOfMonth(referenceDate)
    const endDate = period === "year" ? endOfYear(referenceDate) : endOfMonth(referenceDate)

    // Plage de 6 mois pour les graphiques (relative to the period end)
    const sixMonthsAgo = startOfMonth(subMonths(endDate, 5))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const lastMonthStart = subMonths(startDate, 1)
    const lastMonthEnd = subMonths(endDate, 1)

    // ─── Toutes les requêtes en parallèle ─────────────────────────────────
    const [
      rooms,
      todayBookings,
      pendingBookings,
      periodBookings,
      totalGuests,
      newGuests,
      periodInvoices,
      lastMonthPaidTotal,
      periodExpenses,
      sixMonthPaidInvoices,
      sixMonthPaidExpenses,
      bookingsBySource,
      bookingsByStatus,
      topRoomsRaw,
      expensesByCategory,
      sixMonthActiveBookings,
      recentBookings,
    ] = await Promise.all([
      // 1. Chambres (uniquement status)
      db.room.findMany({
        where: { guestHouseId, isActive: true },
        select: { status: true },
      }),

      // 2. Réservations du jour
      db.booking.findMany({
        where: {
          guestHouseId,
          OR: [
            { checkIn: { gte: today, lt: tomorrow } },
            { checkOut: { gte: today, lt: tomorrow } },
          ],
        },
        include: {
          guest: { select: { firstName: true, lastName: true } },
          room: { select: { number: true, name: true } },
        },
      }),

      // 3. Réservations en attente (count)
      db.booking.count({ where: { guestHouseId, status: "pending" } }),

      // 4. Réservations de la période
      db.booking.count({
        where: {
          guestHouseId,
          OR: [
            { checkIn: { gte: startDate, lte: endDate } },
            { checkOut: { gte: startDate, lte: endDate } },
          ],
          status: { not: "cancelled" },
        },
      }),

      // 5. Total clients
      db.guest.count({ where: { guestHouseId } }),

      // 6. Nouveaux clients de la période
      db.guest.count({
        where: { guestHouseId, createdAt: { gte: startDate, lte: endDate } },
      }),

      // 7. Factures de la période (pour revenus + paid)
      db.invoice.findMany({
        where: { guestHouseId, invoiceDate: { gte: startDate, lte: endDate } },
        select: { total: true, status: true },
      }),

      // 8. Revenus mois précédent (aggregate direct)
      db.invoice.aggregate({
        _sum: { total: true },
        where: {
          guestHouseId,
          status: "paid",
          invoiceDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),

      // 9. Dépenses de la période
      db.expense.findMany({
        where: { guestHouseId, expenseDate: { gte: startDate, lte: endDate } },
        select: { amount: true, status: true },
      }),

      // 10. Factures payées sur 6 mois (pour graphique mensuel)
      db.invoice.findMany({
        where: {
          guestHouseId,
          status: "paid",
          invoiceDate: { gte: sixMonthsAgo },
        },
        select: { total: true, invoiceDate: true },
      }),

      // 11. Dépenses payées sur 6 mois (pour graphique mensuel)
      db.expense.findMany({
        where: {
          guestHouseId,
          status: "paid",
          expenseDate: { gte: sixMonthsAgo },
        },
        select: { amount: true, expenseDate: true },
      }),

      // 12. Réservations par source
      db.booking.groupBy({
        by: ["source"],
        where: { guestHouseId, status: { not: "cancelled" } },
        _count: true,
      }),

      // 13. Réservations par statut
      db.booking.groupBy({
        by: ["status"],
        where: { guestHouseId },
        _count: true,
      }),

      // 14. Top chambres
      db.booking.groupBy({
        by: ["roomId"],
        where: { guestHouseId, status: { not: "cancelled" } },
        _count: true,
        orderBy: { _count: { roomId: "desc" } },
        take: 5,
      }),

      // 15. Dépenses par catégorie
      db.expense.groupBy({
        by: ["category"],
        where: { guestHouseId, status: "paid" },
        _sum: { amount: true },
      }),

      // 16. Réservations actives sur 6 mois (pour taux d'occupation)
      db.booking.findMany({
        where: {
          guestHouseId,
          status: { in: ["confirmed", "checked_in", "checked_out"] },
          OR: [
            { checkIn: { gte: sixMonthsAgo } },
            { checkOut: { gte: sixMonthsAgo } },
          ],
        },
        select: { checkIn: true, checkOut: true },
      }),

      // 17. Réservations récentes
      db.booking.findMany({
        where: { guestHouseId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          guest: { select: { firstName: true, lastName: true } },
          room: { select: { number: true, name: true } },
        },
      }),
    ])

    // 18. Détails des top chambres (batch)
    const topRoomIds = topRoomsRaw.map(r => r.roomId)
    const topRoomDetails = topRoomIds.length > 0
      ? await db.room.findMany({
          where: { id: { in: topRoomIds } },
          select: { id: true, number: true, name: true },
        })
      : []

    const topRoomMap = new Map(topRoomDetails.map(r => [r.id, r]))
    const topRoomsWithDetails = topRoomsRaw.map(item => ({
      ...topRoomMap.get(item.roomId),
      bookingsCount: item._count,
    }))

    // ─── Calculs ──────────────────────────────────────────────────────────

    // Chambres par statut
    const roomsByStatus = {
      total: rooms.length,
      available: rooms.filter(r => r.status === "available").length,
      occupied: rooms.filter(r => r.status === "occupied").length,
      maintenance: rooms.filter(r => r.status === "maintenance").length,
      outOfOrder: rooms.filter(r => r.status === "out_of_order").length,
    }

    // Check-ins / Check-outs du jour
    const todayCheckIns = todayBookings.filter(b =>
      b.checkIn >= today && b.checkIn < tomorrow && b.status !== "cancelled"
    )
    const todayCheckOuts = todayBookings.filter(b =>
      b.checkOut >= today && b.checkOut < tomorrow && b.status !== "cancelled"
    )

    // Revenus période
    const paidInvoices = periodInvoices.filter(i => i.status === "paid")
    const periodRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0)

    // Revenus mois précédent
    const lastPeriodRevenue = lastMonthPaidTotal._sum.total || 0
    const revenueChange = lastPeriodRevenue > 0
      ? ((periodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100
      : 0

    // Dépenses
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
    const paidExpenses = periodExpenses
      .filter(e => e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0)

    // Revenus par mois (agrégé en mémoire depuis la requête batch)
    const revenueByMonth = new Map<string, number>()
    sixMonthPaidInvoices.forEach(inv => {
      const key = format(startOfMonth(inv.invoiceDate), "MMM")
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + inv.total)
    })
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const key = format(monthStart, "MMM")
      monthlyRevenue.push({ month: key, revenue: revenueByMonth.get(key) || 0 })
    }

    // Dépenses par mois (agrégé en mémoire)
    const expenseByMonth = new Map<string, number>()
    sixMonthPaidExpenses.forEach(exp => {
      const key = format(startOfMonth(exp.expenseDate), "MMM")
      expenseByMonth.set(key, (expenseByMonth.get(key) || 0) + exp.amount)
    })
    const monthlyExpenses: { month: string; expenses: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const key = format(monthStart, "MMM")
      monthlyExpenses.push({ month: key, expenses: expenseByMonth.get(key) || 0 })
    }

    // Taux d'occupation par mois (calculé en mémoire)
    const occupancyByMonth: { month: string; rate: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

      let occupiedNights = 0
      sixMonthActiveBookings.forEach(booking => {
        const checkIn = new Date(Math.max(booking.checkIn.getTime(), monthStart.getTime()))
        const checkOut = new Date(Math.min(booking.checkOut.getTime(), monthEnd.getTime()))
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        if (nights > 0) occupiedNights += nights
      })

      const totalPossibleNights = daysInMonth * rooms.length
      const rate = totalPossibleNights > 0 ? (occupiedNights / totalPossibleNights) * 100 : 0

      occupancyByMonth.push({
        month: format(monthStart, "MMM"),
        rate: Math.round(rate * 10) / 10,
      })
    }

    // ─── Réponse ──────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        rooms: roomsByStatus,
        today: {
          checkIns: todayCheckIns.length,
          checkOuts: todayCheckOuts.length,
          checkInsDetails: todayCheckIns,
          checkOutsDetails: todayCheckOuts,
        },
        period: {
          bookings: periodBookings,
          revenue: periodRevenue,
          expenses: totalExpenses,
          profit: periodRevenue - totalExpenses,
        },
        guests: { total: totalGuests, new: newGuests },
        bookings: { pending: pendingBookings, bySource: bookingsBySource, byStatus: bookingsByStatus },
        finance: {
          revenue: periodRevenue,
          revenueChange,
          expenses: totalExpenses,
          paidExpenses,
          profit: periodRevenue - totalExpenses,
          monthlyRevenue,
          monthlyExpenses,
          expensesByCategory,
        },
        performance: {
          occupancyRate: roomsByStatus.total > 0
            ? Math.round((roomsByStatus.occupied / roomsByStatus.total) * 100)
            : 0,
          occupancyByMonth,
          topRooms: topRoomsWithDetails,
        },
        recent: { bookings: recentBookings },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
