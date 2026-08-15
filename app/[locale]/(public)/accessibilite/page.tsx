import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  ToComplete,
} from "@/components/legal/legal-page";

/**
 * Déclaration d'accessibilité (RGAA 4.1).
 *
 * Le RGAA impose d'annoncer un état de conformité réel, appuyé sur un audit.
 * Aucun audit n'ayant été mené à ce jour, l'état déclaré est « non conforme ».
 * Annoncer une conformité non vérifiée serait une déclaration inexacte, et
 * c'est précisément ce que le référentiel proscrit.
 */
export default function AccessibilitePage() {
  return (
    <LegalPage
      title="Déclaration d'accessibilité"
      intro="État de conformité de (RE)Sources Relationnelles au Référentiel général d'amélioration de l'accessibilité (RGAA 4.1)."
      updatedAt="15 août 2026"
    >
      <LegalSection title="État de conformité">
        <p>
          (RE)Sources Relationnelles est{" "}
          <strong className="text-on-surface">non conforme</strong> au RGAA 4.1.
        </p>
        <p>
          Cet état ne signifie pas que le site est inaccessible, mais
          qu&apos;aucun audit de conformité n&apos;a encore été réalisé : le
          taux de conformité ne peut donc pas être établi. Le référentiel impose
          de déclarer l&apos;état réellement vérifié ; annoncer une conformité
          non auditée constituerait une déclaration inexacte.
        </p>
        <p>
          Un audit RGAA complet est inscrit au plan d&apos;amélioration continue
          du projet, préalable à toute mise en service auprès du public.
        </p>
      </LegalSection>

      <LegalSection title="Dispositions déjà prises">
        <p>
          Les mesures suivantes ont été intégrées dès la conception, sans valoir
          preuve de conformité :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Structuration sémantique des pages (titres hiérarchisés, repères de
            navigation, listes).
          </li>
          <li>
            Langue de la page déclarée et interface disponible en huit langues.
          </li>
          <li>
            Contrastes issus d&apos;un système de couleurs conçu pour un rapport
            de contraste élevé sur les textes courants.
          </li>
          <li>
            Champs de formulaire associés à une étiquette explicite ; boutons
            d&apos;action porteurs d&apos;un intitulé accessible.
          </li>
          <li>
            Interface responsive, lisible sur mobile sans défilement horizontal.
          </li>
          <li>
            Textes alternatifs sur les images porteuses d&apos;information,
            alternative vide sur les images décoratives.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Limitations connues">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            L&apos;éditeur de texte enrichi utilisé pour la publication de
            ressources n&apos;a pas été audité au clavier ni avec un lecteur
            d&apos;écran.
          </li>
          <li>
            Les contenus publiés par les citoyens (textes, images, vidéos)
            échappent au contrôle de l&apos;éditeur : leurs alternatives
            textuelles et leurs sous-titres ne peuvent pas être garantis.
          </li>
          <li>
            Les vidéos intégrées depuis des plateformes tierces dépendent du
            lecteur de ces plateformes.
          </li>
          <li>
            Le parcours de double authentification (lecture d&apos;un QR code)
            nécessite une alternative textuelle : la clé est affichée, mais le
            parcours n&apos;a pas été audité.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Voies de recours">
        <p>
          Si vous constatez un défaut d&apos;accessibilité vous empêchant
          d&apos;accéder à un contenu ou à un service, signalez-le via la{" "}
          <Link href="/contact" className="text-primary hover:underline">
            page de contact
          </Link>
          . Nous nous engageons à vous répondre et à vous orienter vers une
          alternative.
        </p>
        <p>
          Si la réponse apportée ne vous satisfait pas, vous pouvez saisir le
          Défenseur des droits : formulaire en ligne sur{" "}
          <a
            href="https://formulaire.defenseurdesdroits.fr"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            formulaire.defenseurdesdroits.fr
          </a>
          , par courrier au Défenseur des droits, Libre réponse 71120, 75342
          Paris CEDEX 07 (sans affranchissement), ou par téléphone au 09 69 39
          00 00.
        </p>
      </LegalSection>

      <LegalSection title="Technologies et méthode">
        <p>
          Technologies utilisées : HTML5, CSS, JavaScript (React et Next.js).
          Aucun audit n&apos;ayant encore été mené, ni la méthode
          d&apos;évaluation ni l&apos;échantillon de pages testées ne sont
          établis à ce jour :{" "}
          <ToComplete>à compléter après audit</ToComplete>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
