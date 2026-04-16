"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useCurrency } from "@/hooks/use-currency"
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Users,
  BedDouble,
  Receipt,
  CreditCard,
  Download,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  RefreshCw,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

interface Statistics {
  rooms: {
    total: number
    available: number
    occupied: number
    maintenance: number
    outOfOrder: number
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
}

export default function StatisticsPage() {
  const { formatAmountCompact } = useCurrency()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [chartType, setChartType] = useState<"revenue" | "occupancy" | "combined">("combined")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const yearParam = period === "year" ? `&year=${selectedYear}` : ""
      const response = await fetch(`/api/statistics?period=${period}${yearParam}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }, [period, selectedYear])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Generate list of years for year selector
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
  }, [])

  const handleExportPDF = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => formatAmountCompact(amount)

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

  const sourceLabels: Record<string, string> = {
    direct: "Direct",
    booking: "Booking.com",
    airbnb: "Airbnb",
    expedia: "Expedia",
    phone: "Téléphone",
    other: "Autre",
  }

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmé",
    checked_in: "En place",
    checked_out: "Terminé",
    cancelled: "Annulé",
    no_show: "No-show",
  }

  // Préparer les données combinées pour le graphique
  const combinedData = stats?.finance.monthlyRevenue?.map((item, index) => ({
    month: item.month,
    revenue: item.revenue,
    expenses: stats.finance.monthlyExpenses?.[index]?.expenses || 0,
    profit: item.revenue - (stats.finance.monthlyExpenses?.[index]?.expenses || 0),
    occupancy: stats.performance.occupancyByMonth?.[index]?.rate || 0,
  })) || []

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
            Statistiques
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Analyse détaillée de votre activité
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPeriod("month")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                period === "month"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                period === "year"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Année
            </button>
          </div>
          {period === "year" && (
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            Rafraîchir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenus</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.finance.revenue || 0)}
                </p>
                <p className={`text-xs mt-1 ${stats?.finance.revenueChange && stats.finance.revenueChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats?.finance.revenueChange && stats.finance.revenueChange >= 0 ? (
                    <><TrendingUp className="inline w-3 h-3 mr-1" />+{stats.finance.revenueChange.toFixed(1)}%</>
                  ) : (
                    <><TrendingDown className="inline w-3 h-3 mr-1" />{stats?.finance.revenueChange?.toFixed(1)}%</>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.finance.expenses || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Payées: {formatCurrency(stats?.finance.paidExpenses || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bénéfice net</p>
                <p className={`text-2xl font-bold ${(stats?.period.profit || 0) >= 0 ? "text-sky-600" : "text-red-600"}`}>
                  {formatCurrency(stats?.period.profit || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Marge: {stats?.finance.revenue ? ((stats.period.profit / stats.finance.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.performance.occupancyRate || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.rooms.occupied}/{stats?.rooms.total} chambres
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <BedDouble className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Analyse financière</CardTitle>
              <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
            </div>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
              <TabsList>
                <TabsTrigger value="combined">Combiné</TabsTrigger>
                <TabsTrigger value="revenue">Revenus</TabsTrigger>
                <TabsTrigger value="occupancy">Occupation</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "combined" ? (
                <BarChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "occupancy") return [`${value}%`, "Taux d'occupation"]
                      return [formatCurrency(value), name === "revenue" ? "Revenus" : name === "expenses" ? "Dépenses" : "Bénéfice"]
                    }}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="expenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="occupancy" name="Occupation" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                </BarChart>
              ) : chartType === "revenue" ? (
                <AreaChart data={stats?.finance.monthlyRevenue || []}>
                  <defs>
                    <linearGradient id="colorRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenus"]} contentStyle={{ borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueGrad)" />
                </AreaChart>
              ) : (
                <AreaChart data={stats?.performance.occupancyByMonth || []}>
                  <defs>
                    <linearGradient id="colorOccupancyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Taux d'occupation"]} contentStyle={{ borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorOccupancyGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques en colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des réservations par source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Sources de réservation
            </CardTitle>
            <CardDescription>Répartition par canal de vente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.bookings.bySource?.map((item, index) => ({
                      name: sourceLabels[item.source] || item.source,
                      value: item._count,
                      fill: COLORS[index % COLORS.length],
                    })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Réservations"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Statut des réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statut des réservations
            </CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.bookings.byStatus?.map((item, index) => ({
                    name: statusLabels[item.status] || item.status,
                    value: item._count,
                    fill: COLORS[index % COLORS.length],
                  })) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip formatter={(value: number) => [value, "Réservations"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dépenses par catégorie et Top chambres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dépenses par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
            <CardDescription>Analyse des coûts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.finance.expensesByCategory?.map((item, index) => {
                const amount = item._sum.amount || 0
                const total = stats?.finance.expenses || 1
                const percentage = (amount / total) * 100

                return (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{categoryLabels[item.category] || item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(amount)}</span>
                        <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
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
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune dépense enregistrée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top chambres */}
        <Card>
          <CardHeader>
            <CardTitle>Top chambres</CardTitle>
            <CardDescription>Les plus réservées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.performance.topRooms?.map((room: any, index: number) => {
                const maxBookings = stats?.performance.topRooms?.[0]?.bookingsCount || 1
                const percentage = (room.bookingsCount / maxBookings) * 100

                return (
                  <div key={room.number} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: COLORS[index] }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Chambre {room.number}</p>
                          {room.name && <p className="text-xs text-gray-500">{room.name}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{room.bookingsCount}</span>
                        <span className="text-xs text-gray-500 ml-1">résa.</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-11">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {(!stats?.performance.topRooms || stats.performance.topRooms.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <BedDouble className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé financier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport financier
          </CardTitle>
          <CardDescription>
            Synthèse {period === "month" ? "mensuelle" : "annuelle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Revenus totaux</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats?.finance.revenue || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Dépenses totales</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats?.finance.expenses || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Bénéfice net</p>
              <p className={`text-xl font-bold ${(stats?.period.profit || 0) >= 0 ? "text-sky-600" : "text-red-600"}`}>
                {formatCurrency(stats?.period.profit || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Marge bénéficiaire</p>
              <p className="text-xl font-bold text-purple-600">
                {stats?.finance.revenue ? ((stats.period.profit / stats.finance.revenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total réservations</p>
              <p className="text-xl font-bold">{stats?.period.bookings || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-xl font-bold text-yellow-600">{stats?.bookings.pending || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total clients</p>
              <p className="text-xl font-bold">{stats?.guests.total || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Nouveaux clients</p>
              <p className="text-xl font-bold text-sky-600">+{stats?.guests.new || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
