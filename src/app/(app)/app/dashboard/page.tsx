"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BedDouble,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

// Données fictives pour la démo
const stats = {
  totalRooms: 12,
  occupiedRooms: 8,
  availableRooms: 3,
  maintenanceRooms: 1,
  occupancyRate: 67,
  todayCheckIns: 3,
  todayCheckOuts: 2,
  pendingBookings: 5,
  monthlyRevenue: 24500,
  revenueChange: 12.5,
  totalGuests: 156,
  newGuestsMonth: 23,
}

const recentBookings = [
  { id: 1, guest: "Marie Dupont", room: "101", checkIn: "15 Jan", status: "confirmed" },
  { id: 2, guest: "Jean Martin", room: "205", checkIn: "16 Jan", status: "pending" },
  { id: 3, guest: "Sophie Bernard", room: "302", checkIn: "17 Jan", status: "confirmed" },
  { id: 4, guest: "Pierre Leroy", room: "104", checkIn: "18 Jan", status: "checked_in" },
]

const revenueData = [
  { month: "Jan", revenue: 18500 },
  { month: "Fév", revenue: 22000 },
  { month: "Mar", revenue: 19800 },
  { month: "Avr", revenue: 25600 },
  { month: "Mai", revenue: 28000 },
  { month: "Juin", revenue: 24500 },
]

export default function DashboardPage() {
  const { data: session } = useSession()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-sky-100 text-sky-700">Confirmé</Badge>
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "checked_in":
        return <Badge className="bg-blue-100 text-blue-700">En place</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bienvenue, {session?.user?.name} 👋
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CalendarDays className="w-4 h-4 mr-2" />
            Aujourd'hui
          </Button>
          <Button className="bg-sky-600 hover:bg-sky-700" size="sm">
            + Nouvelle réservation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taux d'occupation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taux d'occupation</CardTitle>
            <BedDouble className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <Progress value={stats.occupancyRate} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {stats.occupiedRooms}/{stats.totalRooms} chambres occupées
            </p>
          </CardContent>
        </Card>

        {/* Arrivées aujourd'hui */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Arrivées aujourd'hui</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
            <p className="text-xs text-sky-600 mt-2">
              <CheckCircle2 className="inline w-3 h-3 mr-1" />
              {stats.pendingBookings} en attente de confirmation
            </p>
          </CardContent>
        </Card>

        {/* Départs aujourd'hui */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Départs aujourd'hui</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckOuts}</div>
            <p className="text-xs text-blue-600 mt-2">
              <Clock className="inline w-3 h-3 mr-1" />
              Check-out avant 11h00
            </p>
          </CardContent>
        </Card>

        {/* Revenu mensuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenu mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} €</div>
            <p className={`text-xs mt-2 ${stats.revenueChange >= 0 ? "text-sky-600" : "text-red-600"}`}>
              {stats.revenueChange >= 0 ? (
                <>
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +{stats.revenueChange}% vs mois dernier
                </>
              ) : (
                <>
                  <TrendingDown className="inline w-3 h-3 mr-1" />
                  {stats.revenueChange}% vs mois dernier
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus</CardTitle>
            <CardDescription>Évolution des revenus sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} €`, "Revenu"]}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Vue rapide</CardTitle>
            <CardDescription>État des chambres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full" />
                <span className="text-sm">Disponibles</span>
              </div>
              <span className="font-semibold">{stats.availableRooms}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Occupées</span>
              </div>
              <span className="font-semibold">{stats.occupiedRooms}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">Maintenance</span>
              </div>
              <span className="font-semibold">{stats.maintenanceRooms}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total clients</span>
                <span className="font-semibold">{stats.totalGuests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nouveaux ce mois</span>
                <span className="font-semibold text-sky-600">+{stats.newGuestsMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Réservations récentes</CardTitle>
              <CardDescription>Les dernières réservations de votre établissement</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">{booking.guest}</p>
                    <p className="text-sm text-gray-500">Chambre {booking.room} • {booking.checkIn}</p>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
