"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  RefreshCw,
  Receipt,
  CreditCard,
  BarChart3,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

interface Statistics {
  rooms: {
    total: number
    available: number
    reserved: number
    occupied: number
    maintenance: number
    outOfOrder: number
  }
  today: {
    checkIns: number
    checkOuts: number
    checkInsDetails: any[]
    checkOutsDetails: any[]
  }
  period: {
    bookings: number
    revenue: number
    expenses: number
    profit: number
  }
  guests: {
    total: number
    new: number
  }
  bookings: {
    pending: number
    bySource: { source: string; _count: number }[]
    byStatus: { status: string; _count: number }[]
  }
  finance: {
    revenue: number
    revenueChange: number
    expenses: number
    paidExpenses: number
    profit: number
    monthlyRevenue: { month: string; revenue: number }[]
    monthlyExpenses: { month: string; expenses: number }[]
    expensesByCategory: { category: string; _sum: { amount: number | null } }[]
  }
  performance: {
    occupancyRate: number
    occupancyByMonth: { month: string; rate: number }[]
    topRooms: any[]
  }
  recent: {
    bookings: any[]
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { formatAmountCompact } = useCurrency()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/statistics?period=${period}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatCurrency = (amount: number) => formatAmountCompact(amount)

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      confirmed: { label: "Confirmé", className: "bg-sky-100 text-sky-700" },
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
      checked_in: { label: "En place", className: "bg-blue-100 text-blue-700" },
      checked_out: { label: "Terminé", className: "bg-green-100 text-green-700" },
      cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
    }
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bienvenue, {session?.user?.name} 👋
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="year">Année</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchStats}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taux d'occupation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Taux d&apos;occupation
            </CardTitle>
            <BedDouble className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.performance.occupancyRate || 0}%
            </div>
            <Progress value={stats?.performance.occupancyRate || 0} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-2">
              {stats?.rooms.occupied || 0} occupée{((stats?.rooms.occupied || 0) > 1 ? "s" : "")} / {stats?.rooms.reserved || 0} réservée{((stats?.rooms.reserved || 0) > 1 ? "s" : "")}
            </p>
          </CardContent>
        </Card>

        {/* Arrivées aujourd'hui */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Arrivées aujourd&apos;hui
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today.checkIns || 0}</div>
            <p className="text-xs text-sky-600 mt-2">
              <CheckCircle2 className="inline w-3 h-3 mr-1" />
              {stats?.bookings.pending || 0} en attente de confirmation
            </p>
          </CardContent>
        </Card>

        {/* Départs aujourd'hui */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Départs aujourd&apos;hui
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today.checkOuts || 0}</div>
            <p className="text-xs text-blue-600 mt-2">
              <Clock className="inline w-3 h-3 mr-1" />
              Check-out avant 11h00
            </p>
          </CardContent>
        </Card>

        {/* Revenu de la période */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Revenu {period === "month" ? "mensuel" : "annuel"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.finance.revenue || 0)}
            </div>
            <p
              className={`text-xs mt-2 ${
                (stats?.finance.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(stats?.finance.revenueChange || 0) >= 0 ? (
                <>
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +{(stats?.finance.revenueChange || 0).toFixed(1)}% vs période précédente
                </>
              ) : (
                <>
                  <TrendingDown className="inline w-3 h-3 mr-1" />
                  {(stats?.finance.revenueChange || 0).toFixed(1)}% vs période précédente
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Bénéfice net</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(stats?.period.profit || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Dépenses</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(stats?.period.expenses || 0)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Réservations</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats?.period.bookings || 0}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Clients</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {stats?.guests.total || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.finance.monthlyRevenue?.map((item, index) => ({
                  ...item,
                  expenses: stats?.finance.monthlyExpenses?.[index]?.expenses || 0,
                })) || []}>
                  <defs>
                    <linearGradient id="colorRevenueBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "revenue" ? "Revenu" : "Dépenses",
                    ]}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Bar dataKey="revenue" fill="url(#colorRevenueBar)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>État des chambres</CardTitle>
            <CardDescription>Répartition actuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-sky-500 rounded-full" />
                <span className="text-sm">Disponibles</span>
              </div>
              <span className="font-semibold">{stats?.rooms.available || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-violet-500 rounded-full" />
                <span className="text-sm">Réservées</span>
              </div>
              <span className="font-semibold">{stats?.rooms.reserved || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm">Occupées</span>
              </div>
              <span className="font-semibold">{stats?.rooms.occupied || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm">Maintenance</span>
              </div>
              <span className="font-semibold">{stats?.rooms.maintenance || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">Hors service</span>
              </div>
              <span className="font-semibold">{stats?.rooms.outOfOrder || 0}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total clients</span>
                <span className="font-semibold">{stats?.guests.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nouveaux cette période</span>
                <span className="font-semibold text-sky-600">+{stats?.guests.new || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taux d'occupation par mois */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taux d&apos;occupation</CardTitle>
            <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.performance.occupancyByMonth || []}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Taux"]}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOccupancy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sources de réservation */}
        <Card>
          <CardHeader>
            <CardTitle>Sources de réservation</CardTitle>
            <CardDescription>Répartition par canal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.bookings.bySource?.map((item, index) => ({
                      name: item.source,
                      value: item._count,
                      fill: COLORS[index % COLORS.length],
                    })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Réservations"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top chambres et Dépenses par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top chambres */}
        <Card>
          <CardHeader>
            <CardTitle>Chambres les plus réservées</CardTitle>
            <CardDescription>Top 5 des chambres les plus populaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.performance.topRooms?.map((room: any, index: number) => (
                <div key={room.number} className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: COLORS[index] }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Chambre {room.number}</p>
                    {room.name && (
                      <p className="text-sm text-gray-500">{room.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{room.bookingsCount}</p>
                    <p className="text-xs text-gray-500">réservations</p>
                  </div>
                </div>
              ))}
              {(!stats?.performance.topRooms || stats.performance.topRooms.length === 0) && (
                <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dépenses par catégorie */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dépenses par catégorie</CardTitle>
                <CardDescription>Répartition des coûts</CardDescription>
              </div>
              <Link href="/app/expenses">
                <Button variant="outline" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.finance.expensesByCategory?.map((item, index: number) => {
                const categoryLabels: Record<string, string> = {
                  supplies: "Fournitures",
                  maintenance: "Maintenance",
                  utilities: "Services publics",
                  salary: "Salaires",
                  marketing: "Marketing",
                  food: "Nourriture",
                  cleaning: "Nettoyage",
                  equipment: "Équipement",
                  insurance: "Assurance",
                  taxes: "Taxes",
                  other: "Autre",
                }
                const amount = item._sum.amount || 0
                const percentage = stats.finance.expenses > 0
                  ? (amount / stats.finance.expenses) * 100
                  : 0

                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">
                        {categoryLabels[item.category] || item.category}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {(!stats?.finance.expensesByCategory || stats.finance.expensesByCategory.length === 0) && (
                <p className="text-center text-gray-500 py-4">Aucune dépense enregistrée</p>
              )}
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
            <Link href="/app/bookings">
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recent.bookings?.map((booking: any) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {booking.guest.firstName} {booking.guest.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Chambre {booking.room.number} •{" "}
                      {format(new Date(booking.checkIn), "dd MMM", { locale: fr })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
            {(!stats?.recent.bookings || stats.recent.bookings.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune réservation récente</p>
                <Link href="/app/bookings">
                  <Button variant="link" className="mt-2">
                    Créer une réservation
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
