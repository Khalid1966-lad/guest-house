import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns"

// GET - Statistiques complètes
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
    const period = searchParams.get("period") || "month" // month, year

    const now = new Date()
    const startDate = period === "year" ? startOfYear(now) : startOfMonth(now)
    const endDate = period === "year" ? endOfYear(now) : endOfMonth(now)

    // Statistiques des chambres
    const rooms = await db.room.findMany({
      where: { guestHouseId, isActive: true },
    })

    const roomsByStatus = {
      total: rooms.length,
      available: rooms.filter(r => r.status === "available").length,
      occupied: rooms.filter(r => r.status === "occupied").length,
      maintenance: rooms.filter(r => r.status === "maintenance").length,
      outOfOrder: rooms.filter(r => r.status === "out_of_order").length,
    }

    // Réservations du jour
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayBookings = await db.booking.findMany({
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
    })

    const todayCheckIns = todayBookings.filter(b =>
      b.checkIn >= today && b.checkIn < tomorrow && b.status !== "cancelled"
    )
    const todayCheckOuts = todayBookings.filter(b =>
      b.checkOut >= today && b.checkOut < tomorrow && b.status !== "cancelled"
    )

    // Réservations en attente
    const pendingBookings = await db.booking.count({
      where: { guestHouseId, status: "pending" },
    })

    // Réservations de la période
    const periodBookings = await db.booking.findMany({
      where: {
        guestHouseId,
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } },
        ],
        status: { not: "cancelled" },
      },
    })

    // Clients
    const totalGuests = await db.guest.count({
      where: { guestHouseId },
    })

    const newGuests = await db.guest.count({
      where: {
        guestHouseId,
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    // Factures et revenus
    const invoices = await db.invoice.findMany({
      where: {
        guestHouseId,
        invoiceDate: { gte: startDate, lte: endDate },
      },
    })

    const paidInvoices = invoices.filter(i => i.status === "paid")
    const periodRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0)

    // Revenus du mois précédent pour comparaison
    const lastMonthStart = subMonths(startDate, 1)
    const lastMonthEnd = subMonths(endDate, 1)

    const lastMonthInvoices = await db.invoice.findMany({
      where: {
        guestHouseId,
        status: "paid",
        invoiceDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    })
    const lastPeriodRevenue = lastMonthInvoices.reduce((sum, i) => sum + i.total, 0)

    const revenueChange = lastPeriodRevenue > 0
      ? ((periodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100
      : 0

    // Dépenses
    const expenses = await db.expense.findMany({
      where: {
        guestHouseId,
        expenseDate: { gte: startDate, lte: endDate },
      },
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const paidExpenses = expenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0)

    // Revenus par mois (pour graphique)
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))

      const monthInvoices = await db.invoice.findMany({
        where: {
          guestHouseId,
          status: "paid",
          invoiceDate: { gte: monthStart, lte: monthEnd },
        },
      })

      const monthRevenue = monthInvoices.reduce((sum, i) => sum + i.total, 0)

      monthlyRevenue.push({
        month: format(monthStart, "MMM", { locale: undefined }),
        revenue: monthRevenue,
      })
    }

    // Dépenses par mois
    const monthlyExpenses: { month: string; expenses: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))

      const monthExpenses = await db.expense.findMany({
        where: {
          guestHouseId,
          status: "paid",
          expenseDate: { gte: monthStart, lte: monthEnd },
        },
      })

      const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

      monthlyExpenses.push({
        month: format(monthStart, "MMM", { locale: undefined }),
        expenses: monthExpenseTotal,
      })
    }

    // Réservations par source
    const bookingsBySource = await db.booking.groupBy({
      by: ["source"],
      where: {
        guestHouseId,
        status: { not: "cancelled" },
      },
      _count: true,
    })

    // Réservations par statut
    const bookingsByStatus = await db.booking.groupBy({
      by: ["status"],
      where: { guestHouseId },
      _count: true,
    })

    // Top chambres (les plus réservées)
    const topRooms = await db.booking.groupBy({
      by: ["roomId"],
      where: {
        guestHouseId,
        status: { not: "cancelled" },
      },
      _count: true,
      orderBy: { _count: { roomId: "desc" } },
      take: 5,
    })

    const topRoomsWithDetails = await Promise.all(
      topRooms.map(async (item) => {
        const room = await db.room.findUnique({
          where: { id: item.roomId },
          select: { number: true, name: true },
        })
        return {
          ...room,
          bookingsCount: item._count,
        }
      })
    )

    // Dépenses par catégorie
    const expensesByCategory = await db.expense.groupBy({
      by: ["category"],
      where: {
        guestHouseId,
        status: "paid",
      },
      _sum: { amount: true },
    })

    // Taux d'occupation par mois
    const occupancyByMonth: { month: string; rate: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))

      // Nombre total de jours dans le mois
      const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

      // Nuits réservées dans le mois
      const monthBookings = await db.booking.findMany({
        where: {
          guestHouseId,
          status: { in: ["confirmed", "checked_in", "checked_out"] },
          OR: [
            { checkIn: { gte: monthStart, lte: monthEnd } },
            { checkOut: { gte: monthStart, lte: monthEnd } },
          ],
        },
      })

      let occupiedNights = 0
      monthBookings.forEach(booking => {
        const checkIn = new Date(Math.max(booking.checkIn.getTime(), monthStart.getTime()))
        const checkOut = new Date(Math.min(booking.checkOut.getTime(), monthEnd.getTime()))
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        if (nights > 0) occupiedNights += nights
      })

      const totalPossibleNights = daysInMonth * rooms.length
      const occupancyRate = totalPossibleNights > 0 ? (occupiedNights / totalPossibleNights) * 100 : 0

      occupancyByMonth.push({
        month: format(monthStart, "MMM", { locale: undefined }),
        rate: Math.round(occupancyRate * 10) / 10,
      })
    }

    // Réservations récentes
    const recentBookings = await db.booking.findMany({
      where: { guestHouseId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        guest: { select: { firstName: true, lastName: true } },
        room: { select: { number: true, name: true } },
      },
    })

    return NextResponse.json({
      // Chambres
      rooms: roomsByStatus,

      // Aujourd'hui
      today: {
        checkIns: todayCheckIns.length,
        checkOuts: todayCheckOuts.length,
        checkInsDetails: todayCheckIns,
        checkOutsDetails: todayCheckOuts,
      },

      // Période
      period: {
        bookings: periodBookings.length,
        revenue: periodRevenue,
        expenses: totalExpenses,
        profit: periodRevenue - totalExpenses,
      },

      // Clients
      guests: {
        total: totalGuests,
        new: newGuests,
      },

      // Réservations
      bookings: {
        pending: pendingBookings,
        bySource: bookingsBySource,
        byStatus: bookingsByStatus,
      },

      // Financier
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

      // Performance
      performance: {
        occupancyRate: roomsByStatus.total > 0
          ? Math.round((roomsByStatus.occupied / roomsByStatus.total) * 100)
          : 0,
        occupancyByMonth,
        topRooms: topRoomsWithDetails,
      },

      // Activité récente
      recent: {
        bookings: recentBookings,
      },
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
