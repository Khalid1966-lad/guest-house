"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hotel } from "lucide-react"
import { LandingFooter } from "@/components/layout/footer"

export default function ConditionsGeneralesPage() {
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
            Conditions Générales d&apos;Utilisation et de Vente
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Dernière mise à jour : Mars 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Objet</h2>
              <p className="text-gray-700">
                Les présentes conditions générales d&apos;utilisation et de vente (ci-après &quot;CGU&quot;) régissent 
                l&apos;accès et l&apos;utilisation de l&apos;application <strong>PMS Guest House</strong> éditée par 
                <strong> Jazel Web Agency</strong>, ainsi que la souscription aux services payants proposés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Définitions</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Application</strong> : L&apos;application PMS Guest House accessible via le web</li>
                <li><strong>Utilisateur</strong> : Toute personne physique ou morale utilisant l&apos;application</li>
                <li><strong>Abonnement</strong> : Le service payant permettant d&apos;accéder aux fonctionnalités avancées</li>
                <li><strong>Établissement</strong> : Maison d&apos;hôtes ou hébergement touristique géré via l&apos;application</li>
                <li><strong>Éditeur</strong> : Jazel Web Agency, société de droit marocain</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Identification de l&apos;Éditeur</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Jazel Web Agency</strong><br />
                  Siège social : Marrakech, Maroc<br />
                  Email : contact@jazelwebagency.com<br />
                  Téléphone : +212 6 62 42 58 90<br />
                  Site web : jazelwebagency.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptation des Conditions</h2>
              <p className="text-gray-700">
                En créant un compte ou en utilisant l&apos;application, l&apos;utilisateur déclare avoir pris 
                connaissance des présentes CGU et les accepter sans réserve. Si l&apos;utilisateur n&apos;accepte 
                pas ces conditions, il ne doit pas utiliser l&apos;application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Description des Services</h2>
              <p className="text-gray-700 mb-4">
                PMS Guest House est une application de gestion destinée aux propriétaires de maisons 
                d&apos;hôtes et d&apos;hébergements touristiques. Elle propose notamment :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Gestion des chambres et des tarifs</li>
                <li>Gestion des réservations et du planning</li>
                <li>Gestion des clients et de leur historique</li>
                <li>Facturation et suivi des paiements</li>
                <li>Module restaurant</li>
                <li>Statistiques et rapports</li>
                <li>Gestion multi-utilisateurs avec droits personnalisés</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Inscription et Compte</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 Création de compte</h3>
              <p className="text-gray-700 mb-4">
                L&apos;utilisateur doit fournir des informations exactes lors de l&apos;inscription et les maintenir 
                à jour. L&apos;utilisateur est responsable de la confidentialité de ses identifiants et de 
                toute activité sur son compte.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 Essai gratuit</h3>
              <p className="text-gray-700 mb-4">
                Un essai gratuit de 14 jours est proposé aux nouveaux utilisateurs. Aucun engagement 
                n&apos;est requis. À la fin de la période d&apos;essai, l&apos;utilisateur doit souscrire un abonnement 
                payant pour continuer à utiliser les services.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.3 Suppression de compte</h3>
              <p className="text-gray-700">
                L&apos;utilisateur peut demander la suppression de son compte à tout moment en nous contactant. 
                Les données seront supprimées conformément à notre politique de confidentialité, sous 
                réserve des obligations légales de conservation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Tarifs et Abonnements</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Tarification</h3>
              <p className="text-gray-700 mb-4">
                Les tarifs des abonnements sont affichés dans l&apos;application et sur notre site web. 
                Les prix sont indiqués en Dirhams marocains (MAD) hors taxes. L&apos;éditeur se réserve 
                le droit de modifier les tarifs avec un préavis de 30 jours.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 Facturation</h3>
              <p className="text-gray-700 mb-4">
                L&apos;abonnement est facturé mensuellement ou annuellement selon le choix de l&apos;utilisateur. 
                Une facture est émise pour chaque paiement et disponible dans l&apos;espace client.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">7.3 Paiement</h3>
              <p className="text-gray-700">
                Le paiement s&apos;effectue par carte bancaire, virement bancaire ou autres moyens mis à 
                disposition. En cas de non-paiement, l&apos;accès aux services peut être suspendu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Engagement et Résiliation</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">8.1 Durée</h3>
              <p className="text-gray-700 mb-4">
                L&apos;abonnement est conclu pour la période choisie (mensuelle ou annuelle) et se renouvelle 
                par tacite reconduction sauf résiliation par l&apos;utilisateur.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">8.2 Résiliation par l&apos;utilisateur</h3>
              <p className="text-gray-700 mb-4">
                L&apos;utilisateur peut résilier son abonnement à tout moment depuis son espace client ou 
                en nous contactant. La résiliation prend effet à la fin de la période en cours. 
                Aucun remboursement n&apos;est effectué pour la période restante.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">8.3 Résiliation par l&apos;éditeur</h3>
              <p className="text-gray-700">
                L&apos;éditeur peut suspendre ou résilier l&apos;abonnement en cas de non-respect des présentes 
                CGU, de comportement frauduleux ou de non-paiement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Obligations de l&apos;Utilisateur</h2>
              <p className="text-gray-700 mb-4">L&apos;utilisateur s&apos;engage à :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Fournir des informations exactes lors de l&apos;inscription</li>
                <li>Utiliser l&apos;application conformément à sa destination et à la réglementation applicable</li>
                <li>Ne pas porter atteinte aux droits de tiers</li>
                <li>Respecter les règles d&apos;utilisation du service</li>
                <li>Assurer la sécurité de son compte et de ses identifiants</li>
                <li>Respecter la législation marocaine en matière de tourisme et d&apos;hébergement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Propriété Intellectuelle</h2>
              <p className="text-gray-700">
                L&apos;application PMS Guest House, son code source, son design, ses textes, images, logos 
                et tous les éléments qui la composent sont la propriété exclusive de Jazel Web Agency. 
                Toute reproduction, représentation ou utilisation non autorisée est interdite et pourra 
                faire l&apos;objet de poursuites judiciaires.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Données Personnelles</h2>
              <p className="text-gray-700">
                Le traitement des données personnelles est décrit dans notre 
                <Link href="/politique-de-confidentialite" className="text-sky-600 hover:underline"> Politique de Confidentialité</Link>, 
                qui fait partie intégrante des présentes CGU.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Limitation de Responsabilité</h2>
              <p className="text-gray-700 mb-4">
                L&apos;éditeur s&apos;efforce d&apos;assurer la disponibilité et le bon fonctionnement de l&apos;application. 
                Toutefois, il ne peut être tenu responsable :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Des interruptions liées à des opérations de maintenance</li>
                <li>Des pannes techniques, grèves, ou cas de force majeure</li>
                <li>Des dommages indirects ou immatériels</li>
                <li>Des pertes de données non imputables à l&apos;éditeur</li>
                <li>De l&apos;utilisation non conforme de l&apos;application par l&apos;utilisateur</li>
              </ul>
              <p className="text-gray-700">
                La responsabilité totale de l&apos;éditeur est limitée au montant des sommes versées par 
                l&apos;utilisateur au cours des 12 derniers mois.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Garantie</h2>
              <p className="text-gray-700">
                L&apos;éditeur s&apos;engage à fournir un service conforme à sa description. En cas de 
                dysfonctionnement majeur non résolu dans un délai raisonnable, l&apos;utilisateur peut 
                demander la résiliation de son abonnement avec remboursement au prorata.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Droit Applicable et Juridiction</h2>
              <p className="text-gray-700">
                Les présentes CGU sont régies par le droit marocain. En cas de litige, et après 
                tentative de résolution amiable, les tribunaux de Marrakech seront seuls compétents.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Médiation</h2>
              <p className="text-gray-700">
                Conformément à la réglementation marocaine, en cas de litige relatif à la conclusion, 
                l&apos;exécution ou la rupture du contrat, l&apos;utilisateur peut recourir à un mode alternatif 
                de règlement des conflits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Modification des CGU</h2>
              <p className="text-gray-700">
                L&apos;éditeur se réserve le droit de modifier les présentes CGU. Les modifications seront 
                notifiées aux utilisateurs par email ou via l&apos;application au moins 30 jours avant leur 
                entrée en vigueur. L&apos;utilisation continue de l&apos;application vaut acceptation des 
                modifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Contact</h2>
              <p className="text-gray-700 mb-4">Pour toute question relative aux présentes CGU :</p>
              <div className="bg-gray-50 p-4 rounded-lg">
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
