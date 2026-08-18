import Link from "next/link";
import { FeedbackButton } from "@/components/ui/feedback-button";

const footerLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/accessibilite", label: "Accessibilité" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/contact", label: "Contact Support" },
];

export function Footer() {
  // Lu côté serveur : la valeur suit l'environnement d'exécution, sans dépendre
  // de ce qui était défini au moment de la construction de l'image.
  const fiderBoardUrl = process.env.NEXT_PUBLIC_FIDER_URL;

  return (
    <footer className="bg-surface-container-low py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-on-surface-variant">
          © 2024 (RE)Sources Relationnelles. Initiative officielle de santé publique.
        </p>
        <div className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <FeedbackButton boardUrl={fiderBoardUrl} />
        </div>
      </div>
    </footer>
  );
}
