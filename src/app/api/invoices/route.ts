import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { notifyNewInvoice } from "@/lib/notifications"

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
                pricingMode: true,
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

// Helper to build invoice create data
function buildInvoiceData(
  guestHouseId: string,
  invoiceNumber: string,
  guestId: string,
  bookingId: string | null,
  subtotal: unknown,
  taxes: unknown,
  discount: unknown,
  total: unknown,
  dueDate: string | null,
  notes: string | null,
  terms: string | null,
  touristTaxApplied: unknown,
  touristTaxPerNight: unknown,
  touristTaxNights: unknown,
  touristTaxAmount: unknown,
  items: unknown[]
) {
  return {
    guestHouseId,
    invoiceNumber,
    guestId,
    bookingId,
    subtotal: typeof subtotal === 'number' ? subtotal : parseFloat(subtotal as string) || 0,
    taxes: typeof taxes === 'number' ? taxes : parseFloat(taxes as string) || 0,
    discount: typeof discount === 'number' ? discount : parseFloat(discount as string) || 0,
    total: typeof total === 'number' ? total : parseFloat(total as string) || 0,
    dueDate: dueDate ? new Date(dueDate) : null,
    notes,
    terms,
    status: "draft" as const,
    touristTaxApplied: !!touristTaxApplied,
    touristTaxPerNight: parseFloat(touristTaxPerNight as string) || 0,
    touristTaxNights: parseInt(touristTaxNights as string) || 0,
    touristTaxAmount: parseFloat(touristTaxAmount as string) || 0,
    items: {
      create: (items as Array<{
        description: string
        quantity: number
        unitPrice: number
        total: number
        taxRate: number
        itemType?: string
        referenceId?: string
      }>).map((item) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice as unknown as string) || 0,
        total: typeof item.total === 'number' ? item.total : parseFloat(item.total as unknown as string) || 0,
        taxRate: typeof item.taxRate === 'number' ? item.taxRate : parseFloat(item.taxRate as unknown as string) || 0,
        itemType: item.itemType || null,
        referenceId: item.referenceId || null,
      })),
    },
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
      touristTaxApplied,
      touristTaxPerNight,
      touristTaxNights,
      touristTaxAmount,
    } = body

    // Validation
    if (!guestId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Le client et les articles sont requis" },
        { status: 400 }
      )
    }

    // Check for duplicate invoice (one invoice per booking)
    if (bookingId) {
      const existingInvoice = await db.invoice.findFirst({
        where: {
          bookingId,
          guestHouseId: session.user.guestHouseId,
          status: { notIn: ['cancelled'] },
        },
      })
      if (existingInvoice) {
        return NextResponse.json(
          { error: "Une facture (" + existingInvoice.invoiceNumber + ") existe déjà pour ce séjour" },
          { status: 400 }
        )
      }
    }

    const year = new Date().getFullYear()
    const prefix = "FAC-" + year + "-"
    const ghId = session.user.guestHouseId

    // Retry loop to handle race conditions on invoice number
    const MAX_RETRIES = 5
    let invoice: any = null
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        invoice = await db.$transaction(async (tx) => {
          // Find all used numbers for this guest house & year in one query
          const existingInvoices = await tx.invoice.findMany({
            where: {
              guestHouseId: ghId,
              invoiceNumber: { startsWith: prefix },
            },
            select: { invoiceNumber: true },
          })

          const usedNums = new Set<number>()
          for (const inv of existingInvoices) {
            const p = inv.invoiceNumber.split("-")
            const n = parseInt(p[p.length - 1], 10)
            if (!isNaN(n)) usedNums.add(n)
          }

          // Find next available number
          let nextNum = 1
          while (usedNums.has(nextNum)) nextNum++

          const invoiceNumber = prefix + String(nextNum).padStart(5, "0")

          return tx.invoice.create({
            data: buildInvoiceData(
              ghId,
              invoiceNumber,
              guestId,
              bookingId || null,
              subtotal,
              taxes,
              discount,
              total,
              dueDate,
              notes || null,
              terms || null,
              touristTaxApplied,
              touristTaxPerNight,
              touristTaxNights,
              touristTaxAmount,
              items
            ),
            include: {
              guest: true,
              items: true,
            },
          })
        })
        // Success — break out of retry loop
        break
      } catch (txError: unknown) {
        lastError = txError instanceof Error ? txError : new Error(String(txError))

        // Check if it's a unique constraint error on invoiceNumber (P2002)
        const isConstraintError =
          lastError.message.includes("Unique constraint") &&
          lastError.message.includes("invoiceNumber")

        if (isConstraintError && attempt < MAX_RETRIES - 1) {
          // Another request created the same number — retry with a new number
          console.warn("Invoice number collision on attempt " + (attempt + 1) + ", retrying...")
          continue
        }

        // Not a constraint error or max retries exceeded — propagate
        throw lastError
      }
    }

    if (!invoice) {
      throw lastError || new Error("Impossible de générer un numéro de facture unique après " + MAX_RETRIES + " tentatives")
    }

    // Trigger notification (fire-and-forget)
    notifyNewInvoice({
      guestHouseId: ghId,
      userId: session.user.id,
      invoiceNumber: invoice.invoiceNumber,
      guestName: invoice.guest.firstName + " " + invoice.guest.lastName,
      total: invoice.total,
      invoiceId: invoice.id,
    }).catch(console.error)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error: unknown) {
    console.error("Erreur création facture:", error)

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: Record<string, unknown> }

      if (prismaError.code === 'P2002') {
        // Unique constraint violation (duplicate invoice number)
        const target = Array.isArray(prismaError.meta?.target) ? prismaError.meta.target : []
        if (target.includes('invoiceNumber')) {
          return NextResponse.json(
            { error: "Un numéro de facture identique existe déjà. Veuillez réessayer." },
            { status: 409 }
          )
        }
      }

      if (prismaError.code === 'P2003') {
        // Foreign key constraint violation
        return NextResponse.json(
          { error: "Référence invalide : le client ou le séjour sélectionné n'existe pas." },
          { status: 400 }
        )
      }
    }

    // Log full error for debugging
    const fullMsg = error instanceof Error ? error.message : String(error)
    console.error("Full invoice creation error:", fullMsg, JSON.stringify(error, null, 2))

    return NextResponse.json(
      { error: "Erreur interne: " + fullMsg },
      { status: 500 }
    )
  }
}
