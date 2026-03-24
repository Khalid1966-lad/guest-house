"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Hotel, Eye, EyeOff } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard"
  const message = searchParams.get("message")
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(message === "account_created" ? "" : "")
  const [success, setSuccess] = useState(message === "account_created" ? "Compte créé avec succès ! Connectez-vous pour continuer." : "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Connexion réussie - vérifier si l'utilisateur a une maison d'hôtes
      // Récupérer la session pour vérifier
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      
      if (session?.user?.guestHouseId) {
        // L'utilisateur a une maison d'hôtes, rediriger vers le dashboard
        router.push(callbackUrl)
      } else {
        // L'utilisateur n'a pas de maison d'hôtes, rediriger vers l'onboarding
        router.push("/onboarding")
      }
      router.refresh()
    } catch (err) {
      setError("Une erreur inattendue s'est produite")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600 text-white mb-4">
            <Hotel className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            PMS Guest House
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connectez-vous à votre espace
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-0">
              <Button
                type="submit"
                className="w-full h-11 bg-sky-600 hover:bg-sky-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
              
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Pas encore de compte ?{" "}
                <Link
                  href="/register"
                  className="text-sky-600 hover:text-sky-700 font-medium dark:text-sky-400"
                >
                  Créer un compte
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 PMS Guest House. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
