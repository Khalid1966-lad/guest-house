import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Récupérer une seule facture
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const invoice = await db.invoice.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: {
        guest: true,
        booking: {
          include: {
            room: true,
          },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }

    // Calculer les montants
    const paidAmount = invoice.payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      invoice: {
        ...invoice,
        paidAmount,
        remainingAmount: invoice.total - paidAmount,
      },
    })
  } catch (error) {
    console.error("Erreur récupération facture:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour une facture
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
      include: { items: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }

    // Ne pas permettre la modification d'une facture payée
    if (existingInvoice.status === "paid") {
      return NextResponse.json(
        { error: "Impossible de modifier une facture payée" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { items, subtotal, taxes, discount, total, dueDate, notes, terms, guestId } = body

    // Supprimer les anciens items et créer les nouveaux
    await db.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        guestId: guestId || existingInvoice.guestId,
        subtotal: parseFloat(subtotal) || existingInvoice.subtotal,
        taxes: parseFloat(taxes) || existingInvoice.taxes,
        discount: parseFloat(discount) || existingInvoice.discount,
        total: parseFloat(total) || existingInvoice.total,
        dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        terms: terms !== undefined ? terms : existingInvoice.terms,
        items: items
          ? {
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
            }
          : undefined,
      },
      include: {
        guest: true,
        items: true,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Erreur mise à jour facture:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PATCH - Mettre à jour le statut de la facture
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }

    const body = await request.json()
    const { status, paidAt } = body

    const updateData: {
      status?: string
      paidAt?: Date
    } = {}

    if (status) {
      updateData.status = status
      if (status === "paid") {
        updateData.paidAt = paidAt ? new Date(paidAt) : new Date()
      }
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        guest: true,
        items: true,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Erreur mise à jour statut facture:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une facture
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.guestHouseId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        guestHouseId: session.user.guestHouseId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }

    // Ne pas supprimer une facture payée
    if (existingInvoice.status === "paid") {
      return NextResponse.json(
        { error: "Impossible de supprimer une facture payée" },
        { status: 400 }
      )
    }

    // Supprimer les items d'abord
    await db.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    // Supprimer la facture
    await db.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression facture:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
