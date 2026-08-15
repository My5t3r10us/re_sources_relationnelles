import { Info } from "lucide-react";

/**
 * Enveloppe commune aux pages légales.
 *
 * Les quatre pages partagent la même charpente : en-tête, date de mise à jour,
 * avertissement de simulation, puis une suite de sections en cartes. Les
 * factoriser évite d'entretenir quatre copies de la même mise en page.
 */

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 md:p-8">
      <h2 className="text-headline-sm text-on-surface mb-4">{title}</h2>
      <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  title,
  intro,
  updatedAt,
  children,
}: {
  title: string;
  intro: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <div className="max-w-3xl mb-12">
        <p className="text-label-md uppercase tracking-widest text-primary mb-3">
          Informations légales
        </p>
        <h1 className="text-display-lg text-on-surface mb-4">{title}</h1>
        <p className="text-on-surface-variant leading-relaxed">{intro}</p>
        <p className="text-sm text-outline mt-4">
          Dernière mise à jour : {updatedAt}
        </p>
      </div>

      {/*
        Le projet est une simulation pédagogique : le mentionner explicitement
        évite de laisser croire à une publication officielle du ministère.
      */}
      <div className="max-w-3xl flex gap-3 rounded-xl bg-surface-container-high p-4 mb-10">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Projet de simulation.</strong>{" "}
          (RE)Sources Relationnelles est une réalisation pédagogique. Elle
          n&apos;émane pas du Ministère des Solidarités et de la Santé et ne
          constitue pas un service public en exploitation. Les mentions
          d&apos;identification signalées comme telles restent à compléter à la
          mise en service réelle.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">{children}</div>
    </main>
  );
}

/** Valeur d'identification à renseigner lors d'une mise en service réelle. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant">
      {children}
    </span>
  );
}
