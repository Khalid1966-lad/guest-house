"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hotel } from "lucide-react"
import { LandingFooter } from "@/components/layout/footer"

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PMS Guest House</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-sky-600 hover:bg-sky-700" size="sm">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Mentions Légales
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Dernière mise à jour : Mars 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du Site</h2>
              <p className="text-gray-700 mb-4">
                Le site <strong>pms-guesthouse.com</strong> et l&apos;application <strong>PMS Guest House</strong> 
                sont édités par :
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  <strong>Jazel Web Agency</strong><br />
                  Statut : Société de droit marocain<br />
                  Siège social : Marrakech, Maroc<br />
                  <br />
                  <strong>Coordonnées :</strong><br />
                  Email : contact@jazelwebagency.com<br />
                  Téléphone : +212 6 62 42 58 90<br />
                  Site web : jazelwebagency.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Propriété Intellectuelle</h2>
              <p className="text-gray-700 mb-4">
                L&apos;ensemble du contenu du site (textes, images, vidéos, logos, icônes, sons, logiciels, 
                etc.) est la propriété exclusive de <strong>Jazel Web Agency</strong> ou de ses partenaires 
                et est protégé par les lois marocaines et internationales relatives à la propriété intellectuelle.
              </p>
              <p className="text-gray-700 mb-4">
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
                des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf 
                autorisation écrite préalable de Jazel Web Agency.
              </p>
              <p className="text-gray-700">
                Toute exploitation non autorisée du site ou de l&apos;un quelconque des éléments qu&apos;il 
                contient sera considérée comme constitutive d&apos;une contrefaçon et poursuivie conformément 
                aux dispositions de la loi n° 31-05 relative à la protection des œuvres littéraires et 
                artistiques au Maroc.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Marques</h2>
              <p className="text-gray-700">
                <strong>PMS Guest House</strong> et le logo associé sont des marques déposées par 
                Jazel Web Agency. Toute utilisation non autorisée de ces marques est interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Protection des Données Personnelles</h2>
              <p className="text-gray-700 mb-4">
                Conformément à la loi n° 09-08 relative à la protection des personnes physiques à 
                l&apos;égard du traitement des données à caractère personnel, vous disposez d&apos;un droit 
                d&apos;accès, de rectification et d&apos;opposition sur vos données personnelles.
              </p>
              <p className="text-gray-700 mb-4">
                Pour plus d&apos;informations, veuillez consulter notre 
                <Link href="/politique-de-confidentialite" className="text-sky-600 hover:underline"> Politique de Confidentialité</Link>.
              </p>
              <p className="text-gray-700">
                Vous pouvez également introduire une réclamation auprès de la 
                <strong> Commission Nationale de la Protection des Données à Caractère Personnel (CNPDP)</strong> 
                si vous estimez que le traitement de vos données constitue une violation de vos droits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies</h2>
              <p className="text-gray-700 mb-4">
                Le site utilise des cookies pour améliorer l&apos;expérience utilisateur et analyser le 
                trafic. En continuant à naviguer sur ce site, vous acceptez l&apos;utilisation de cookies.
              </p>
              <p className="text-gray-700">
                Vous pouvez configurer vos préférences de cookies dans les paramètres de votre navigateur. 
                Pour plus d&apos;informations, consultez notre politique de confidentialité.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation de Responsabilité</h2>
              <p className="text-gray-700 mb-4">
                Jazel Web Agency s&apos;efforce de fournir des informations aussi précises que possible. 
                Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes et 
                des carences dans la mise à jour, qu&apos;elles soient de son fait ou du fait des tiers 
                partenaires qui lui fournissent ces informations.
              </p>
              <p className="text-gray-700">
                Toutes les informations indiquées sur le site sont données à titre indicatif et sont 
                susceptibles d&apos;évoluer. Par ailleurs, les renseignements figurant sur ce site ne sont 
                pas exhaustifs. Ils sont donnés sous réserve de modifications ayant été apportées depuis 
                leur mise en ligne.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Liens Hypertextes</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Liens sortants</h3>
              <p className="text-gray-700 mb-4">
                Le site peut contenir des liens vers d&apos;autres sites internet. Jazel Web Agency 
                n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur 
                contenu.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 Liens entrants</h3>
              <p className="text-gray-700">
                La mise en place d&apos;un lien hypertexte vers le site est soumise à l&apos;accord préalable 
                de Jazel Web Agency. Toute demande de lien doit être adressée à : contact@jazelwebagency.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Droit Applicable</h2>
              <p className="text-gray-700">
                Les présentes mentions légales sont régies par le droit marocain. En cas de litige, 
                les tribunaux marocains seront seuls compétents.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact</h2>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant les présentes mentions légales, vous pouvez nous contacter :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Jazel Web Agency</strong><br />
                  Email : contact@jazelwebagency.com<br />
                  Téléphone : +212 6 62 42 58 90<br />
                  Adresse : Marrakech, Maroc<br />
                  Site web : jazelwebagency.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Crédits</h2>
              <p className="text-gray-700">
                <strong>Conception et développement :</strong> Jazel Web Agency<br />
                <strong>Design :</strong> Jazel Web Agency
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
