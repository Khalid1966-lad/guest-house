import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Récupérer toutes les factures de la maison d'hôtes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const guestId = searchParams.get("guestId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Prisma.InvoiceWhereInput = {
      guestHouseId: session.user.guestHouseId,
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (guestId) {
      where.guestId = guestId
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            room: {
              select: {
                number: true,
                name: true,
              },
            },
          },
        },
        items: true,
        payments: {
          where: { status: "completed" },
        },
      },
      orderBy: { invoiceDate: "desc" },
    })

    // Calculer le montant payé pour chaque facture
    const invoicesWithPaid = invoices.map((invoice) => {
      const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      return {
        ...invoice,
        paidAmount,
        remainingAmount: invoice.total - paidAmount,
      }
    })

    return NextResponse.json({ invoices: invoicesWithPaid })
  } catch (error) {
    console.error("Erreur récupération factures:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle facture
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.guestHouseId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      guestId,
      bookingId,
      items,
      subtotal,
      taxes,
      discount,
      total,
      dueDate,
      notes,
      terms,
    } = body

    // Validation
    if (!guestId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Le client et les articles sont requis" },
        { status: 400 }
      )
    }

    // Générer le numéro de facture
    const invoiceCount = await db.invoice.count({
      where: { guestHouseId: session.user.guestHouseId },
    })
    const year = new Date().getFullYear()
    const invoiceNumber = `FAC-${year}-${String(invoiceCount + 1).padStart(5, "0")}`

    // Créer la facture avec ses items
    const invoice = await db.invoice.create({
      data: {
        guestHouseId: session.user.guestHouseId,
        invoiceNumber,
        guestId,
        bookingId: bookingId || null,
        subtotal: parseFloat(subtotal) || 0,
        taxes: parseFloat(taxes) || 0,
        discount: parseFloat(discount) || 0,
        total: parseFloat(total) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        terms: terms || null,
        status: "draft",
        items: {
          create: items.map((item: {
            description: string
            quantity: number
            unitPrice: number
            total: number
            taxRate: number
            itemType: string
            referenceId: string
          }) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: parseFloat(item.total) || 0,
            taxRate: parseFloat(item.taxRate) || 0,
            itemType: item.itemType || null,
            referenceId: item.referenceId || null,
          })),
        },
      },
      include: {
        guest: true,
        items: true,
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error("Erreur création facture:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
