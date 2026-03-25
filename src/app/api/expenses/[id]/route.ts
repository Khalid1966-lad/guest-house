import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    const { id } = await params

    const expense = await db.expense.findFirst({
      where: { id, guestHouseId },
    })

    if (!expense) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la dépense" },
      { status: 500 }
    )
  }
}

// PUT - Update an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    const { id } = await params
    const data = await request.json()

    // Verify expense belongs to user's guest house
    const existing = await db.expense.findFirst({
      where: { id, guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency,
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        receiptImage: data.receiptImage,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        status: data.status,
        isRecurring: data.isRecurring,
        recurrence: data.recurrence,
        notes: data.notes,
        approvedBy: data.status === "paid" ? session.user.id : undefined,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la dépense" },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (for status changes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    const { id } = await params
    const data = await request.json()

    const existing = await db.expense.findFirst({
      where: { id, guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
      if (data.status === "paid") {
        updateData.paidDate = new Date()
        updateData.approvedBy = session.user.id
      }
    }

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error patching expense:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la dépense" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    const { id } = await params

    const existing = await db.expense.findFirst({
      where: { id, guestHouseId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 })
    }

    await db.expense.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Dépense supprimée" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la dépense" },
      { status: 500 }
    )
  }
}
