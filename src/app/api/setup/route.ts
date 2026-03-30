import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - Check database status
export async function GET() {
  try {
    // Try to count users to check if DB is initialized
    const userCount = await db.user.count()
    const guestHouseCount = await db.guestHouse.count()
    const roomCount = await db.room.count()
    
    return NextResponse.json({
      status: "connected",
      tables: {
        users: userCount,
        guestHouses: guestHouseCount,
        rooms: roomCount,
      },
      initialized: true,
    })
  } catch (error) {
    console.error("Database check error:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Table doesn't exist
      if (error.code === "P2021") {
        return NextResponse.json({
          status: "connected_but_empty",
          message: "Database connected but tables don't exist.",
          initialized: false,
          instructions: "Run 'bun run db:push' locally with production DATABASE_URL",
        })
      }
    }
    
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      initialized: false,
    }, { status: 500 })
  }
}
