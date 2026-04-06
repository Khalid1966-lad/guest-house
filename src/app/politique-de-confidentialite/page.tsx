"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hotel } from "lucide-react"
import { LandingFooter } from "@/components/layout/footer"

export default function PolitiqueConfidentialitePage() {
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
            Politique de Confidentialité
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Dernière mise à jour : Mars 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                La présente politique de confidentialité décrit comment <strong>Jazel Web Agency</strong> 
                (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;la Société&quot;), en tant qu&apos;éditeur de l&apos;application 
                <strong> PMS Guest House</strong>, collecte, utilise et protège les informations personnelles 
                de ses utilisateurs, conformément à la loi n° 09-08 relative à la protection des données 
                à caractère personnel au Maroc.
              </p>
              <p className="text-gray-700">
                En utilisant notre application, vous consentez à la collecte et à l&apos;utilisation de vos 
                informations conformément à la présente politique.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Responsable du Traitement</h2>
              <p className="text-gray-700 mb-4">Le responsable du traitement des données est :</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">
                  <strong>Jazel Web Agency</strong><br />
                  Adresse : Marrakech, Maroc<br />
                  Email : contact@jazelwebagency.com<br />
                  Téléphone : +212 6 62 42 58 90<br />
                  Site web : jazelwebagency.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Données Collectées</h2>
              <p className="text-gray-700 mb-4">Nous collectons les types de données suivants :</p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Données d&apos;inscription</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Informations de la maison d&apos;hôtes (nom, adresse, etc.)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Données d&apos;utilisation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Données de connexion (logs, adresse IP)</li>
                <li>Historique des actions sur l&apos;application</li>
                <li>Préférences utilisateur</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">3.3 Données des clients de vos maisons d&apos;hôtes</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Informations d&apos;identité des voyageurs (conformément à la réglementation marocaine)</li>
                <li>Coordonnées (email, téléphone)</li>
                <li>Historique des séjours et paiements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Finalités du Traitement</h2>
              <p className="text-gray-700 mb-4">Les données collectées sont utilisées pour :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Fournir et gérer les services de l&apos;application PMS Guest House</li>
                <li>Gérer les réservations et les clients de vos établissements</li>
                <li>Établir les factures et gérer les paiements</li>
                <li>Assurer le support technique</li>
                <li>Envoyer des communications commerciales (avec votre consentement)</li>
                <li>Respecter nos obligations légales (conservation des données voyageurs)</li>
                <li>Améliorer nos services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Base Juridique du Traitement</h2>
              <p className="text-gray-700 mb-4">
                Conformément à la loi n° 09-08, le traitement des données est fondé sur :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>L&apos;exécution du contrat entre vous et notre société</li>
                <li>Votre consentement pour certains traitements spécifiques</li>
                <li>Nos obligations légales (notamment en matière de conservation des données)</li>
                <li>Nos intérêts légitimes (amélioration des services, sécurité)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Destinataires des Données</h2>
              <p className="text-gray-700 mb-4">
                Vos données peuvent être transmises aux catégories de destinataires suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Nos collaborateurs habilités</li>
                <li>Nos prestataires techniques (hébergement, paiement)</li>
                <li>Les autorités compétentes, sur demande légale</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Nous ne vendons jamais vos données personnelles à des tiers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Durée de Conservation</h2>
              <p className="text-gray-700 mb-4">
                Les données sont conservées pour la durée nécessaire aux finalités pour lesquelles elles 
                ont été collectées :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Données de compte : pendant la durée de l&apos;abonnement + 3 ans</li>
                <li>Données clients (voyageurs) : 5 ans conformément à la réglementation touristique</li>
                <li>Factures et documents comptables : 10 ans conformément au Code de commerce</li>
                <li>Logs de connexion : 1 an</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Droits des Personnes Concernées</h2>
              <p className="text-gray-700 mb-4">
                Conformément à la loi n° 09-08, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li><strong>Droit d&apos;accès</strong> : consulter vos données personnelles</li>
                <li><strong>Droit de rectification</strong> : modifier vos données inexactes</li>
                <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
                <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré</li>
              </ul>
              <p className="text-gray-700">
                Pour exercer ces droits, contactez-nous à : <strong>contact@jazelwebagency.com</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Sécurité des Données</h2>
              <p className="text-gray-700 mb-4">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour 
                protéger vos données personnelles contre la perte, l&apos;utilisation abusive, l&apos;accès non 
                autorisé, la divulgation, l&apos;altération ou la destruction :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                <li>Chiffrement des données au repos</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Sauvegardes régulières</li>
                <li>Surveillance et audit de sécurité</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Transfert de Données</h2>
              <p className="text-gray-700">
                Vos données sont hébergées au Maroc ou dans l&apos;Union Européenne. En cas de transfert 
                vers un pays tiers, nous nous assurons que des garanties appropriées sont mises en place 
                conformément à la réglementation applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Cookies</h2>
              <p className="text-gray-700 mb-4">
                Notre application utilise des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Assurer le bon fonctionnement de l&apos;application</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l&apos;utilisation de nos services</li>
              </ul>
              <p className="text-gray-700">
                Vous pouvez configurer vos préférences de cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Réclamation</h2>
              <p className="text-gray-700">
                Si vous estimez que le traitement de vos données personnelles constitue une violation 
                de vos droits, vous pouvez introduire une réclamation auprès de la 
                <strong> Commission Nationale de la Protection des Données à Caractère Personnel (CNPDP)</strong> 
                au Maroc.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Modifications</h2>
              <p className="text-gray-700">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications prendront effet dès leur publication sur cette page. Nous vous informerons 
                des modifications significatives par email ou via l&apos;application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact</h2>
              <p className="text-gray-700">
                Pour toute question relative à cette politique de confidentialité, contactez-nous :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>Jazel Web Agency</strong><br />
                  Email : contact@jazelwebagency.com<br />
                  Téléphone : +212 6 62 42 58 90<br />
                  Adresse : Marrakech, Maroc
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
