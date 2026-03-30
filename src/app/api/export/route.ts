import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Export all data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    const format = request.nextUrl.searchParams.get("format") || "json"

    // Fetch all data in parallel
    const [
      guestHouse,
      rooms,
      guests,
      bookings,
      invoices,
      expenses,
      amenities,
      users,
    ] = await Promise.all([
      db.guestHouse.findUnique({
        where: { id: guestHouseId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          phone: true,
          email: true,
          website: true,
          currency: true,
          timezone: true,
          taxRate: true,
          createdAt: true,
        },
      }),
      db.room.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          number: true,
          name: true,
          type: true,
          capacity: true,
          bedCount: true,
          bedType: true,
          basePrice: true,
          status: true,
          description: true,
          amenities: true,
          createdAt: true,
        },
      }),
      db.guest.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          idType: true,
          idNumber: true,
          notes: true,
          createdAt: true,
        },
      }),
      db.booking.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          guestId: true,
          roomId: true,
          checkIn: true,
          checkOut: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          notes: true,
          createdAt: true,
        },
      }),
      db.invoice.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          number: true,
          guestId: true,
          bookingId: true,
          amount: true,
          taxAmount: true,
          totalAmount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      db.expense.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          date: true,
          createdAt: true,
        },
      }),
      db.amenity.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          name: true,
          icon: true,
          description: true,
        },
      }),
      db.user.findMany({
        where: { guestHouseId },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      guestHouse,
      rooms,
      guests,
      bookings,
      invoices,
      expenses,
      amenities,
      users,
    }

    if (format === "csv") {
      // For CSV, we'll export just the key data in a simple format
      const csvRows: string[] = []

      // Header
      csvRows.push("Type,Data")
      csvRows.push(`Export Date,${exportData.exportedAt}`)
      csvRows.push(`Guest House,${guestHouse?.name || ""}`)
      csvRows.push("")

      // Rooms
      csvRows.push("ROOMS")
      csvRows.push("ID,Number,Name,Type,Capacity,Base Price,Status")
      rooms.forEach((room) => {
        csvRows.push(
          `"${room.id}","${room.number}","${room.name}","${room.type}","${room.capacity}","${room.basePrice}","${room.status}"`
        )
      })
      csvRows.push("")

      // Guests
      csvRows.push("GUESTS")
      csvRows.push("ID,First Name,Last Name,Email,Phone,Country")
      guests.forEach((guest) => {
        csvRows.push(
          `"${guest.id}","${guest.firstName || ""}","${guest.lastName || ""}","${guest.email || ""}","${guest.phone || ""}","${guest.country || ""}"`
        )
      })
      csvRows.push("")

      // Bookings
      csvRows.push("BOOKINGS")
      csvRows.push("ID,Guest ID,Room ID,Check In,Check Out,Status,Total Amount")
      bookings.forEach((booking) => {
        csvRows.push(
          `"${booking.id}","${booking.guestId}","${booking.roomId}","${booking.checkIn.toISOString()}","${booking.checkOut.toISOString()}","${booking.status}","${booking.totalAmount}"`
        )
      })

      const csv = csvRows.join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="export-csv-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Default: JSON format
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="export-json-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'export des données" },
      { status: 500 }
    )
  }
}
