import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List all expenses
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
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    const where: any = { guestHouseId }

    if (category && category !== "all") {
      where.category = category
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (startDate || endDate) {
      where.expenseDate = {}
      if (startDate) where.expenseDate.gte = new Date(startDate)
      if (endDate) where.expenseDate.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
    })

    // Calculate stats
    const stats = {
      total: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      paid: expenses.filter(e => e.status === "paid").length,
      paidAmount: expenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0),
      pending: expenses.filter(e => e.status === "pending").length,
      pendingAmount: expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
      byCategory: {} as Record<string, number>,
    }

    expenses.forEach(e => {
      if (!stats.byCategory[e.category]) {
        stats.byCategory[e.category] = 0
      }
      stats.byCategory[e.category] += e.amount
    })

    return NextResponse.json({ expenses, stats })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dépenses" },
      { status: 500 }
    )
  }
}

// POST - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const guestHouseId = session.user.guestHouseId
    if (!guestHouseId) {
      return NextResponse.json({ error: "Maison d'hôtes non configurée" }, { status: 400 })
    }

    const data = await request.json()

    const expense = await db.expense.create({
      data: {
        guestHouseId,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency || "EUR",
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        receiptImage: data.receiptImage,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        status: data.status || "pending",
        isRecurring: data.isRecurring || false,
        recurrence: data.recurrence,
        notes: data.notes,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la dépense" },
      { status: 500 }
    )
  }
}
