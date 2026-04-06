"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Loader2,
  FileText,
  Send,
  CheckCircle,
  Printer,
  Trash2,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useCurrency } from "@/hooks/use-currency"

// Types
interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate: number
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  paymentDate: string
  transactionId: string | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  subtotal: number
  taxes: number
  discount: number
  total: number
  status: string
  notes: string | null
  paidAt: string | null
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
  }
  booking: {
    id: string
    checkIn: string
    checkOut: string
    room: {
      number: string
      name: string | null
    }
  } | null
  items: InvoiceItem[]
  payments: Payment[]
  paidAmount: number
  remainingAmount: number
}

interface GuestHouseInfo {
  name: string
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  logo?: string | null
  ice?: string | null
  taxId?: string | null
  cnss?: string | null
}

// Status colors and labels
const invoiceStatuses: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "text-gray-700", bg: "bg-gray-100" },
  sent: { label: "Envoyée", color: "text-sky-700", bg: "bg-sky-100" },
  paid: { label: "Payée", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Annulée", color: "text-red-700", bg: "bg-red-100" },
  refunded: { label: "Remboursée", color: "text-orange-700", bg: "bg-orange-100" },
}

// Payment methods
const paymentMethods: Record<string, string> = {
  cash: "Espèces",
  card: "Carte bancaire",
  transfer: "Virement",
  check: "Chèque",
  online: "En ligne",
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession()
  const { currency, symbol, formatAmount } = useCurrency()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [guestHouse, setGuestHouse] = useState<GuestHouseInfo | null>(null)

  // Fetch invoice
  const fetchInvoice = async () => {
    if (!session?.user?.guestHouseId) {
      setIsLoading(false)
      return
    }

    try {
      const [invoiceRes, ghRes] = await Promise.all([
        fetch(`/api/invoices/${invoiceId}`),
        fetch(`/api/settings/establishment`)
      ])
      if (invoiceRes.ok) {
        const data = await invoiceRes.json()
        setInvoice(data.invoice)
      } else {
        router.push("/app/invoices")
      }
      if (ghRes.ok) {
        const ghData = await ghRes.json()
        setGuestHouse(ghData.guestHouse)
      }
    } catch (err) {
      console.error("Erreur chargement:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    fetchInvoice()
  }, [session, status, router, invoiceId])

  // Update status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!invoice) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchInvoice()
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete invoice
  const handleDelete = async () => {
    if (!invoice) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/app/invoices")
      }
    } catch (err) {
      console.error("Erreur suppression:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Print invoice directly
  const handlePrint = () => {
    window.print()
  }

  // Print in new window
  const handlePrintNewWindow = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow || !invoice) return

    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Facture ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            padding: 2cm;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #0ea5e9;
          }
          .logo { display: flex; align-items: center; gap: 0.75rem; }
          .logo-img { 
            width: 120px; 
            height: 120px; 
            border-radius: 12px;
            object-fit: cover;
          }
          .logo-icon { 
            width: 120px; 
            height: 120px; 
            background: #0ea5e9; 
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 2rem;
          }
          .logo-text { font-size: 1.5rem; font-weight: bold; }
          .invoice-info { text-align: right; }
          .invoice-number { font-size: 1.5rem; font-weight: bold; color: #0ea5e9; }
          .invoice-date { color: #666; margin-top: 0.25rem; }
          .section-title { 
            font-size: 0.75rem; 
            text-transform: uppercase; 
            color: #666; 
            margin-bottom: 0.5rem;
            font-weight: 600;
          }
          .client-info { margin-bottom: 2rem; }
          .client-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; }
          .client-detail { color: #444; margin: 0.1rem 0; display: flex; gap: 0.5rem; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 1rem 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 0.75rem; 
            text-align: left; 
          }
          th { background: #f5f5f5; font-weight: 600; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { 
            margin-left: auto; 
            width: 280px; 
            margin-top: 1rem;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 0.25rem 0; 
          }
          .total-row.main { 
            font-size: 1.25rem; 
            font-weight: bold; 
            border-top: 2px solid #000;
            margin-top: 0.5rem;
            padding-top: 0.5rem;
          }
          .total-row.main .amount { color: #0ea5e9; }
          .paid { color: #16a34a; }
          .remaining { color: #ea580c; }
          .notes { 
            margin-top: 2rem; 
            padding: 1rem; 
            background: #f9f9f9;
            border-radius: 4px;
          }
          .notes-title { font-weight: 600; margin-bottom: 0.5rem; }
          .footer { 
            margin-top: 3rem; 
            text-align: center; 
            color: #666;
            font-size: 0.9rem;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }
          .legal-info {
            margin-top: 0.75rem;
            font-size: 0.8rem;
            color: #555;
            line-height: 1.6;
          }
          @media print {
            body { padding: 0; }
            @page { size: A4; margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            ${guestHouse?.logo ? `<img src="${guestHouse.logo}" alt="${guestHouse.name}" class="logo-img">` : `<div class="logo-icon">GH</div>`}
            <div>
              <div class="logo-text">${guestHouse?.name || "Établissement"}</div>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <div class="invoice-date">Date: ${format(parseISO(invoice.invoiceDate), "d MMMM yyyy", { locale: fr })}</div>
            ${invoice.dueDate ? `<div class="invoice-date">Échéance: ${format(parseISO(invoice.dueDate), "d MMMM yyyy", { locale: fr })}</div>` : ""}
          </div>
        </div>

        <div class="client-info">
          <div class="section-title">Facturé à</div>
          <div class="client-name">${invoice.guest.firstName} ${invoice.guest.lastName}</div>
          ${invoice.guest.email ? `<div class="client-detail"><span>📧</span> ${invoice.guest.email}</div>` : ""}
          ${invoice.guest.phone ? `<div class="client-detail"><span>📞</span> ${invoice.guest.phone}</div>` : ""}
          ${invoice.guest.address ? `<div class="client-detail"><span>📍</span> ${invoice.guest.address}${invoice.guest.postalCode ? `, ${invoice.guest.postalCode}` : ""}${invoice.guest.city ? ` ${invoice.guest.city}` : ""}</div>` : ""}
        </div>

        ${invoice.booking ? `
        <div class="client-info">
          <div class="section-title">Réservation</div>
          <div class="client-name">Chambre ${invoice.booking.room.number}${invoice.booking.room.name ? ` - ${invoice.booking.room.name}` : ""}</div>
          <div class="client-detail">📅 ${format(parseISO(invoice.booking.checkIn), "d MMM", { locale: fr })} - ${format(parseISO(invoice.booking.checkOut), "d MMM yyyy", { locale: fr })}</div>
        </div>
        ` : ""}

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-center" style="width: 60px;">Qté</th>
              <th class="text-right" style="width: 100px;">Prix unit.</th>
              <th class="text-right" style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>
                  ${item.description}
                  ${item.taxRate > 0 ? `<br><small style="color: #666;">TVA: ${item.taxRate}%</small>` : ""}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</td>
                <td class="text-right"><strong>${item.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Sous-total</span>
            <span>${invoice.subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ${invoice.taxes > 0 ? `
          <div class="total-row">
            <span>TVA</span>
            <span>${invoice.taxes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ` : ""}
          ${invoice.discount > 0 ? `
          <div class="total-row">
            <span>Remise</span>
            <span style="color: #16a34a;">-${invoice.discount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ` : ""}
          <div class="total-row main">
            <span>Total</span>
            <span class="amount">${invoice.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ${invoice.paidAmount > 0 ? `
          <div class="total-row paid">
            <span>Payé</span>
            <span>${invoice.paidAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ${invoice.remainingAmount > 0 ? `
          <div class="total-row remaining">
            <span>Reste à payer</span>
            <span>${invoice.remainingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${symbol}</span>
          </div>
          ` : ""}
          ` : ""}
        </div>

        ${invoice.notes ? `
        <div class="notes">
          <div class="notes-title">Notes</div>
          <p>${invoice.notes}</p>
        </div>
        ` : ""}

        <div class="footer">
          <p>Merci pour votre confiance !</p>
          <p><strong>${guestHouse?.name || "Établissement"}</strong></p>
          <div class="legal-info">
            ${(guestHouse?.ice || guestHouse?.taxId || guestHouse?.cnss) ? [guestHouse?.ice ? `ICE : ${guestHouse.ice}` : null, guestHouse?.taxId ? `IF : ${guestHouse.taxId}` : null, guestHouse?.cnss ? `CNSS : ${guestHouse.cnss}` : null].filter(Boolean).join(" &nbsp;|&nbsp; ") : ""}
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
        <Button onClick={() => router.push("/app/invoices")}>
          Retour aux factures
        </Button>
      </div>
    )
  }

  const statusInfo = invoiceStatuses[invoice.status] || invoiceStatuses.draft

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/app/invoices")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500">
              Facture du {format(parseISO(invoice.invoiceDate), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <Badge className={cn(statusInfo.bg, statusInfo.color, "text-base px-4 py-1")}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Actions - Hidden on print */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {invoice.status === "draft" && (
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus("sent")}
            disabled={isUpdating}
          >
            <Send className="w-4 h-4 mr-2" />
            Marquer envoyée
          </Button>
        )}
        {(invoice.status === "draft" || invoice.status === "sent") && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleUpdateStatus("paid")}
            disabled={isUpdating}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marquer payée
          </Button>
        )}
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </Button>
        <Button variant="outline" onClick={handlePrintNewWindow}>
          <FileText className="w-4 h-4 mr-2" />
          Aperçu avant impression
        </Button>
        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        )}
      </div>

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-0 print:bg-white">
        <CardContent className="p-8 print-invoice">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 print:mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                {guestHouse?.logo ? (
                  <img src={guestHouse.logo} alt={guestHouse.name} className="w-24 h-24 rounded-xl object-cover print:w-[120px] print:h-[120px] print:rounded-xl" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-sky-600 flex items-center justify-center print:bg-sky-600">
                    <Building className="w-12 h-12 text-white" />
                  </div>
                )}
                <div>
                  <span className="text-2xl font-bold">{guestHouse?.name || session?.user?.guestHouseName || "Établissement"}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-sky-600 print:text-sky-600">{invoice.invoiceNumber}</h2>
              <p className="text-gray-500 text-sm mt-1 print:text-gray-600">
                Date: {format(parseISO(invoice.invoiceDate), "d MMMM yyyy", { locale: fr })}
              </p>
              {invoice.dueDate && (
                <p className="text-gray-500 text-sm print:text-gray-600">
                  Échéance: {format(parseISO(invoice.dueDate), "d MMMM yyyy", { locale: fr })}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6 print:my-4 print:border-gray-300" />

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-8 mb-8 print:mb-6">
            <div>
              <h3 className="font-semibold text-gray-500 mb-2 text-sm uppercase print:text-gray-600">Facturé à</h3>
              <p className="font-medium text-lg print:text-black">
                {invoice.guest.firstName} {invoice.guest.lastName}
              </p>
              {invoice.guest.email && (
                <p className="text-gray-600 flex items-center gap-2 mt-1 print:text-gray-700">
                  <Mail className="w-4 h-4 print:hidden" />
                  {invoice.guest.email}
                </p>
              )}
              {invoice.guest.phone && (
                <p className="text-gray-600 flex items-center gap-2 mt-1 print:text-gray-700">
                  <Phone className="w-4 h-4 print:hidden" />
                  {invoice.guest.phone}
                </p>
              )}
              {invoice.guest.address && (
                <p className="text-gray-600 flex items-start gap-2 mt-1 print:text-gray-700">
                  <MapPin className="w-4 h-4 mt-0.5 print:hidden" />
                  <span>
                    {invoice.guest.address}
                    {invoice.guest.postalCode && `, ${invoice.guest.postalCode}`}
                    {invoice.guest.city && ` ${invoice.guest.city}`}
                    {invoice.guest.country && `, ${invoice.guest.country}`}
                  </span>
                </p>
              )}
            </div>

            {invoice.booking && (
              <div>
                <h3 className="font-semibold text-gray-500 mb-2 text-sm uppercase print:text-gray-600">Réservation</h3>
                <p className="font-medium print:text-black">
                  Chambre {invoice.booking.room.number}
                  {invoice.booking.room.name && ` - ${invoice.booking.room.name}`}
                </p>
                <p className="text-gray-600 flex items-center gap-2 mt-1 print:text-gray-700">
                  <CalendarDays className="w-4 h-4 print:hidden" />
                  {format(parseISO(invoice.booking.checkIn), "d MMM", { locale: fr })} -{" "}
                  {format(parseISO(invoice.booking.checkOut), "d MMM yyyy", { locale: fr })}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden mb-6 print:border-gray-300">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 print:bg-gray-100">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 print:text-gray-600">Description</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500 w-20 print:text-gray-600">Qté</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500 w-28 print:text-gray-600">Prix unit.</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500 w-28 print:text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-t print:border-gray-200">
                    <td className="p-3 print:text-black">
                      <p>{item.description}</p>
                      {item.taxRate > 0 && (
                        <p className="text-xs text-gray-500 print:text-gray-600">TVA: {item.taxRate}%</p>
                      )}
                    </td>
                    <td className="p-3 text-center print:text-black">{item.quantity}</td>
                    <td className="p-3 text-right print:text-black">{formatAmount(item.unitPrice)}</td>
                    <td className="p-3 text-right font-medium print:text-black">{formatAmount(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between print:text-black">
                <span className="text-gray-500 print:text-gray-600">Sous-total</span>
                <span>{formatAmount(invoice.subtotal)}</span>
              </div>
              {invoice.taxes > 0 && (
                <div className="flex justify-between print:text-black">
                  <span className="text-gray-500 print:text-gray-600">TVA</span>
                  <span>{formatAmount(invoice.taxes)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-green-600 print:text-green-700">
                  <span>Remise</span>
                  <span>-{formatAmount(invoice.discount)}</span>
                </div>
              )}
              <Separator className="print:border-gray-300" />
              <div className="flex justify-between text-lg font-bold print:text-black">
                <span>Total</span>
                <span className="text-sky-600 print:text-sky-600">{formatAmount(invoice.total)}</span>
              </div>

              {/* Payment Status */}
              {invoice.paidAmount > 0 && (
                <>
                  <Separator className="print:border-gray-300" />
                  <div className="flex justify-between text-green-600 print:text-green-700">
                    <span>Payé</span>
                    <span>{formatAmount(invoice.paidAmount)}</span>
                  </div>
                  {invoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-orange-600 print:text-orange-700">
                      <span>Reste à payer</span>
                      <span>{formatAmount(invoice.remainingAmount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg print:bg-gray-100 print:border print:border-gray-200">
              <h4 className="font-semibold text-sm text-gray-500 mb-1 print:text-gray-600">Notes</h4>
              <p className="text-gray-700 whitespace-pre-line print:text-black">{invoice.notes}</p>
            </div>
          )}

          {/* Payments History - Hidden on print */}
          {invoice.payments.length > 0 && (
            <div className="mt-8 print:hidden">
              <h4 className="font-semibold mb-3">Historique des paiements</h4>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{formatAmount(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {paymentMethods[payment.method] || payment.method}
                        {payment.transactionId && ` - ${payment.transactionId}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(parseISO(payment.paymentDate), "d MMM yyyy", { locale: fr })}
                      </p>
                      <Badge className={cn(
                        payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {payment.status === "completed" ? "Complété" : payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Screen only */}
          <div className="mt-12 pt-6 border-t text-center text-gray-500 text-sm print:hidden">
            <p>Merci pour votre confiance !</p>
            <p className="mt-1"><strong>{guestHouse?.name || "Établissement"}</strong></p>
            {(guestHouse?.ice || guestHouse?.taxId || guestHouse?.cnss) && (
              <div className="flex justify-center gap-3 text-xs text-gray-400 mt-2">
                {guestHouse?.ice && <span>ICE : {guestHouse.ice}</span>}
                {guestHouse?.taxId && <span>IF : {guestHouse.taxId}</span>}
                {guestHouse?.cnss && <span>CNSS : {guestHouse.cnss}</span>}
              </div>
            )}
          </div>

          {/* Footer - Print only */}
          <div className="hidden print:block mt-12 pt-6 border-t border-gray-300 text-center text-gray-600 text-sm">
            <p>Merci pour votre confiance !</p>
            <p className="mt-1 font-semibold">{guestHouse?.name || "Établissement"}</p>
            {(guestHouse?.ice || guestHouse?.taxId || guestHouse?.cnss) && (
              <div className="flex justify-center gap-3 text-xs text-gray-500 mt-2">
                {guestHouse?.ice && <span>ICE : {guestHouse.ice}</span>}
                {guestHouse?.taxId && <span>IF : {guestHouse.taxId}</span>}
                {guestHouse?.cnss && <span>CNSS : {guestHouse.cnss}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture{" "}
              <strong>{invoice.invoiceNumber}</strong> ?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
