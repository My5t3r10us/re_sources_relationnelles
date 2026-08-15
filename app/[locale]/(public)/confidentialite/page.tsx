import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  ToComplete,
} from "@/components/legal/legal-page";

/**
 * Politique de confidentialité.
 *
 * Les durées annoncées ici doivent rester alignées sur ce que le code applique
 * réellement : 180 jours pour le journal d'authentification correspond à
 * `DEFAULT_AUTH_LOG_RETENTION_DAYS` (`lib/rgpd.ts`), appliqué par la purge de
 * rétention. Une politique qui promet autre chose que le comportement du
 * système est un manquement en soi.
 */
export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Comment (RE)Sources Relationnelles collecte, utilise et protège vos données personnelles, et comment exercer vos droits."
      updatedAt="15 août 2026"
    >
      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable du traitement est l&apos;éditeur de la plateforme,
          identifié dans les{" "}
          <Link
            href="/mentions-legales"
            className="text-primary hover:underline"
          >
            mentions légales
          </Link>
          . Un délégué à la protection des données (DPO) est désigné :{" "}
          <ToComplete>coordonnées à compléter</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Nous collectons uniquement les données nécessaires au service :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-on-surface">Compte</strong> : nom, prénom,
            adresse électronique, mot de passe (haché, jamais stocké en clair),
            image de profil facultative, rôle et état du compte.
          </li>
          <li>
            <strong className="text-on-surface">Contenus</strong> : ressources
            créées, commentaires, favoris, ressources terminées ou mises de
            côté, signalements émis, participations aux sessions collaboratives
            et messages échangés dans ce cadre.
          </li>
          <li>
            <strong className="text-on-surface">Sécurité</strong> : journal des
            connexions et des actions d&apos;administration, comprenant adresse
            IP et agent utilisateur.
          </li>
          <li>
            <strong className="text-on-surface">Double authentification</strong>{" "}
            : secret TOTP et codes de secours, si vous l&apos;activez.
          </li>
        </ul>
        <p>
          Aucune donnée de santé n&apos;est demandée. Nous vous invitons à ne
          pas en faire figurer dans les contenus que vous publiez.
        </p>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Fourniture du service (compte, publication, échanges) — exécution du
            contrat, article 6-1-b du RGPD.
          </li>
          <li>
            Sécurité de la plateforme, prévention des abus, journalisation —
            intérêt légitime, article 6-1-f.
          </li>
          <li>
            Modération des contenus signalés — intérêt légitime et respect
            d&apos;obligations légales, articles 6-1-f et 6-1-c.
          </li>
          <li>
            Statistiques d&apos;usage agrégées, sans identification individuelle
            — intérêt légitime, article 6-1-f.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Durées de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Données de compte : jusqu&apos;à la suppression du compte par son
            titulaire.
          </li>
          <li>
            Journal des connexions et des actions d&apos;administration :{" "}
            <strong className="text-on-surface">180 jours</strong>, puis purge
            automatique.
          </li>
          <li>
            Sessions d&apos;authentification : 24 heures, renouvelées à
            l&apos;usage.
          </li>
          <li>
            Contenus publiés : conservés après suppression du compte, sous forme
            anonymisée (voir ci-dessous).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Destinataires">
        <p>
          Vos données ne sont ni vendues, ni louées, ni transmises à des fins
          commerciales. Y accèdent uniquement : les administrateurs et
          modérateurs de la plateforme dans le cadre de leurs missions, et les
          sous-traitants techniques (hébergement, stockage des fichiers), liés
          par un contrat conforme à l&apos;article 28 du RGPD. Les données sont
          hébergées dans l&apos;Union européenne.
        </p>
        <p>
          Les ressources que vous publiez en mode public sont, par nature,
          visibles de tous les visiteurs.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous disposez des droits d&apos;accès (art. 15), de rectification
          (art. 16), d&apos;effacement (art. 17), de limitation (art. 18), de
          portabilité (art. 20) et d&apos;opposition (art. 21).
        </p>
        <p>
          Les droits d&apos;accès, de portabilité et d&apos;effacement
          s&apos;exercent directement depuis votre{" "}
          <Link href="/profil" className="text-primary hover:underline">
            profil
          </Link>{" "}
          : vous pouvez télécharger l&apos;ensemble de vos données au format
          JSON, et supprimer votre compte.
        </p>
        <p>
          Pour les autres droits, adressez votre demande via la{" "}
          <Link href="/contact" className="text-primary hover:underline">
            page de contact
          </Link>
          . Nous répondons dans un délai d&apos;un mois.
        </p>
      </LegalSection>

      <LegalSection title="Effacement du compte : ce qui est supprimé">
        <p>
          La suppression de votre compte efface définitivement votre identité
          (nom, adresse électronique, mot de passe, image), vos ressources non
          publiées et leurs fichiers, vos favoris, vos ressources terminées ou
          mises de côté, vos signalements, vos participations aux sessions et
          vos jetons de connexion. Votre identifiant est retiré du journal des
          connexions.
        </p>
        <p>
          Vos <strong className="text-on-surface">ressources publiées</strong> et
          vos <strong className="text-on-surface">commentaires visibles</strong>{" "}
          sont conservés sous la mention « Utilisateur supprimé », détachés de
          toute donnée permettant de vous identifier. Cette anonymisation évite
          d&apos;amputer les échanges auxquels d&apos;autres citoyens ont
          participé ; des données anonymisées ne relèvent plus du RGPD.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les communications sont chiffrées en transit (TLS). Les mots de passe
          sont hachés avec un algorithme dédié. La double authentification par
          code temporaire (TOTP) est disponible sur tous les comptes. Les accès
          d&apos;administration sont journalisés, et les tentatives de connexion
          sont limitées en débit.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          La plateforme n&apos;utilise ni cookie publicitaire, ni traceur de
          mesure d&apos;audience tiers. Seuls sont déposés les cookies
          strictement nécessaires au fonctionnement du service — maintien de la
          session authentifiée et choix de la langue — qui sont dispensés de
          consentement au titre de l&apos;article 82 de la loi Informatique et
          Libertés.
        </p>
      </LegalSection>

      <LegalSection title="Réclamation">
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne sont
          pas respectés, vous pouvez introduire une réclamation auprès de la
          Commission nationale de l&apos;informatique et des libertés (CNIL),
          3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
          <a
            href="https://www.cnil.fr"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
