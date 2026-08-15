import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  ToComplete,
} from "@/components/legal/legal-page";

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Informations relatives à l'éditeur, à l'hébergeur et aux conditions d'utilisation de la plateforme (RE)Sources Relationnelles."
      updatedAt="15 août 2026"
    >
      <LegalSection title="Éditeur du site">
        <p>
          La plateforme (RE)Sources Relationnelles est éditée dans le cadre d&apos;un
          projet de simulation de marché public, à destination du Ministère des
          Solidarités et de la Santé.
        </p>
        <ul className="space-y-1">
          <li>
            Raison sociale du prestataire : <ToComplete>à compléter</ToComplete>
          </li>
          <li>
            Forme juridique et capital social :{" "}
            <ToComplete>à compléter</ToComplete>
          </li>
          <li>
            Siège social : <ToComplete>à compléter</ToComplete>
          </li>
          <li>
            SIRET / RCS : <ToComplete>à compléter</ToComplete>
          </li>
          <li>
            Courriel de contact :{" "}
            <Link href="/contact" className="text-primary hover:underline">
              voir la page Contact
            </Link>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          Le directeur de la publication est le représentant légal du
          prestataire : <ToComplete>à compléter</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          L&apos;application est déployée sur une infrastructure administrée via
          Dokploy, adossée à un serveur privé virtuel localisé dans
          l&apos;Union européenne. Les fichiers déposés par les utilisateurs sont
          stockés sur un service de stockage objet compatible S3.
        </p>
        <ul className="space-y-1">
          <li>
            Hébergeur : <ToComplete>à compléter</ToComplete>
          </li>
          <li>
            Localisation des données : Union européenne
          </li>
        </ul>
        <p>
          Le détail de l&apos;architecture de déploiement et des environnements
          figure dans le plan de déploiement du projet.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          La structure générale du site, les textes rédigés par l&apos;éditeur,
          les éléments graphiques et l&apos;identité visuelle sont protégés par
          le droit de la propriété intellectuelle. Toute reproduction ou
          représentation, totale ou partielle, sans autorisation préalable est
          interdite.
        </p>
        <p>
          Les ressources publiées par les citoyens restent la propriété de leurs
          auteurs. En les publiant sur la plateforme, l&apos;auteur concède un
          droit d&apos;usage non exclusif permettant leur diffusion aux
          utilisateurs, dans le respect des paramètres de confidentialité
          qu&apos;il a choisis.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Les ressources mises à disposition ont une vocation informative et de
          soutien. Elles ne constituent en aucun cas un avis médical, un
          diagnostic ou une prescription, et ne remplacent pas la consultation
          d&apos;un professionnel de santé.
        </p>
        <p>
          En cas de situation d&apos;urgence ou de détresse, consultez la{" "}
          <Link href="/urgence" className="text-primary hover:underline">
            page d&apos;urgence
          </Link>{" "}
          et composez le 15, le 112 ou le 3114.
        </p>
        <p>
          L&apos;éditeur met en œuvre les moyens raisonnables pour assurer
          l&apos;exactitude des informations diffusées, sans pouvoir garantir
          l&apos;exhaustivité des contenus publiés par les utilisateurs. Les
          contenus signalés font l&apos;objet d&apos;une modération.
        </p>
      </LegalSection>

      <LegalSection title="Liens hypertextes">
        <p>
          La plateforme peut renvoyer vers des sites tiers. L&apos;éditeur
          n&apos;exerce aucun contrôle sur ces sites et décline toute
          responsabilité quant à leur contenu.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions légales sont soumises au droit français. Tout
          litige relatif à leur interprétation ou à leur exécution relève des
          juridictions françaises compétentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
