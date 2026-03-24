"use client"

import { useState, Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Hotel, ArrowRight, CheckCircle2, Building2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Étapes de l'onboarding
const STEPS = [
  { id: 1, title: "Informations générales", description: "Nommez votre établissement" },
  { id: 2, title: "Adresse", description: "Où se trouve votre maison d'hôtes ?" },
  { id: 3, title: "Contact", description: "Comment vous joindre ?" },
  { id: 4, title: "Configuration", description: "Derniers réglages" },
]

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    email: "",
    website: "",
    currency: "EUR",
    timezone: "Europe/Paris",
  })

  // Générer le slug automatiquement à partir du nom
  const generatedSlug = useMemo(() => {
    return formData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Supprimer les tirets multiples
      .trim()
  }, [formData.name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "name") {
      // Générer le slug à partir du nom
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      setFormData({ ...formData, name: value, slug })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError("Le nom de l'établissement est requis")
          return false
        }
        if (!formData.slug.trim()) {
          setError("L'identifiant est requis")
          return false
        }
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
          setError("L'identifiant ne peut contenir que des lettres minuscules, chiffres et tirets")
          return false
        }
        break
      case 2:
        if (!formData.city.trim()) {
          setError("La ville est requise")
          return false
        }
        break
      case 3:
        // Optionnel - pas de validation stricte
        break
    }
    return true
  }

  const handleNext = () => {
    setError("")
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setError("")
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateStep(currentStep)) return

    if (!userId) {
      setError("Session invalide. Veuillez vous reconnecter.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/guest-houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ownerId: userId,
          email: formData.email || undefined,
          website: formData.website || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erreur lors de la création")
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      
      // Connecter l'utilisateur automatiquement
      // Note: Dans un vrai scénario, on utiliserait un token de session
      setTimeout(() => {
        router.push("/login?message=account_created")
      }, 3000)
      
    } catch (err) {
      setError("Une erreur inattendue s'est produite")
      setIsLoading(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Félicitations ! 🎉</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Votre maison d'hôtes "<strong>{formData.name}</strong>" a été créée avec succès.
            </p>
            <p className="text-sm text-gray-500">
              Redirection vers la connexion...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Créer votre maison d'hôtes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configurez votre établissement en quelques étapes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  currentStep >= step.id ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <p className="text-xs font-medium hidden sm:block">{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Informations générales */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'établissement *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ex: Villa des Roses"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Identifiant unique *</Label>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">pms.app/</span>
                      <Input
                        id="slug"
                        name="slug"
                        placeholder="villa-des-roses"
                        value={formData.slug}
                        onChange={handleChange}
                        className="h-11 flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Utilisé pour l'URL de votre espace. Peut être modifié plus tard.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Décrivez brièvement votre établissement..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              {/* Step 2: Adresse */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Rue de la Paix"
                      value={formData.address}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Paris"
                        value={formData.city}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="75001"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="France"
                      value={formData.country}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                </>
              )}
              
              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+33 1 23 45 67 89"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de l'établissement</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@villadesroses.fr"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://www.villadesroses.fr"
                      value={formData.website}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                </>
              )}
              
              {/* Step 4: Configuration */}
              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Devise</Label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dollar US (USD)</option>
                        <option value="GBP">Livre Sterling (GBP)</option>
                        <option value="CHF">Franc Suisse (CHF)</option>
                        <option value="MAD">Dirham Marocain (MAD)</option>
                        <option value="XOF">Franc CFA (XOF)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Europe/Paris">Paris (UTC+1)</option>
                        <option value="Europe/London">Londres (UTC)</option>
                        <option value="Africa/Casablanca">Casablanca (UTC+1)</option>
                        <option value="Indian/Reunion">La Réunion (UTC+4)</option>
                        <option value="America/New_York">New York (UTC-5)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg mt-4">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                      Récapitulatif
                    </h4>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                      <p><strong>Établissement:</strong> {formData.name}</p>
                      <p><strong>Identifiant:</strong> {formData.slug}</p>
                      <p><strong>Ville:</strong> {formData.city}</p>
                      <p><strong>Pays:</strong> {formData.country}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
              >
                Retour
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      Créer ma maison d'hôtes
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  )
}
