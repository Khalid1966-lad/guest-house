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
          { error: `Une facture (${existingInvoice.invoiceNumber}) existe déjà pour ce séjour` },
          { status: 400 }
        )
      }
    }

    // Générer le numéro de facture de manière atomique
    const year = new Date().getFullYear()
    const prefix = `FAC-${year}-`

    let invoice: any
    try {
      invoice = await db.$transaction(async (tx) => {
        // Trouver le dernier numéro de facture pour cette année et ce guest house
        const lastInvoice = await tx.invoice.findFirst({
          where: {
            guestHouseId: session.user.guestHouseId,
            invoiceNumber: { startsWith: prefix },
          },
          orderBy: { invoiceNumber: "desc" },
          select: { invoiceNumber: true },
        })

        let nextNum = 1
        if (lastInvoice) {
          // Extraire le numéro depuis FAC-2026-XXXXX
          const parts = lastInvoice.invoiceNumber.split("-")
          const lastNum = parseInt(parts[parts.length - 1], 10)
          nextNum = isNaN(lastNum) ? 1 : lastNum + 1
        }

        const invoiceNumber = `${prefix}${String(nextNum).padStart(5, "0")}`

        // Vérifier que ce numéro n'existe pas déjà
        const existing = await tx.invoice.findUnique({
          where: { invoiceNumber },
        })
        if (existing) {
          // Retrouver un numéro libre en cherchant le max
          const allNumbers = await tx.invoice.findMany({
            where: {
              guestHouseId: session.user.guestHouseId,
              invoiceNumber: { startsWith: prefix },
            },
            select: { invoiceNumber: true },
          })
          const usedNums = new Set(
            allNumbers
              .map((inv) => {
                const p = inv.invoiceNumber.split("-")
                return parseInt(p[p.length - 1], 10)
              })
              .filter((n) => !isNaN(n))
          )
          nextNum = 1
          while (usedNums.has(nextNum)) nextNum++
          const fallbackNumber = `${prefix}${String(nextNum).padStart(5, "0")}`

          return tx.invoice.create({
            data: {
              guestHouseId: session.user.guestHouseId,
              invoiceNumber: fallbackNumber,
              guestId,
              bookingId: bookingId || null,
              subtotal: typeof subtotal === 'number' ? subtotal : parseFloat(subtotal) || 0,
              taxes: typeof taxes === 'number' ? taxes : parseFloat(taxes) || 0,
              discount: typeof discount === 'number' ? discount : parseFloat(discount) || 0,
              total: typeof total === 'number' ? total : parseFloat(total) || 0,
              dueDate: dueDate ? new Date(dueDate) : null,
              notes: notes || null,
              terms: terms || null,
              status: "draft",
              touristTaxApplied: touristTaxApplied || false,
              touristTaxPerNight: parseFloat(touristTaxPerNight) || 0,
              touristTaxNights: parseInt(touristTaxNights) || 0,
              touristTaxAmount: parseFloat(touristTaxAmount) || 0,
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
                  unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
                  total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
                  taxRate: typeof item.taxRate === 'number' ? item.taxRate : parseFloat(item.taxRate) || 0,
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
        }

        return tx.invoice.create({
          data: {
            guestHouseId: session.user.guestHouseId,
            invoiceNumber,
            guestId,
            bookingId: bookingId || null,
            subtotal: typeof subtotal === 'number' ? subtotal : parseFloat(subtotal) || 0,
            taxes: typeof taxes === 'number' ? taxes : parseFloat(taxes) || 0,
            discount: typeof discount === 'number' ? discount : parseFloat(discount) || 0,
            total: typeof total === 'number' ? total : parseFloat(total) || 0,
            dueDate: dueDate ? new Date(dueDate) : null,
            notes: notes || null,
            terms: terms || null,
            status: "draft",
            touristTaxApplied: touristTaxApplied || false,
            touristTaxPerNight: parseFloat(touristTaxPerNight) || 0,
            touristTaxNights: parseInt(touristTaxNights) || 0,
            touristTaxAmount: parseFloat(touristTaxAmount) || 0,
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
                unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
                total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
                taxRate: typeof item.taxRate === 'number' ? item.taxRate : parseFloat(item.taxRate) || 0,
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
      })
    } catch (txError) {
      console.error("Transaction error:", txError)
      return NextResponse.json(
        { error: "Erreur lors de la création de la facture. Veuillez réessayer." },
        { status: 500 }
      )
    }

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
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
    console.error("Full invoice creation error:", JSON.stringify(error, null, 2))

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
