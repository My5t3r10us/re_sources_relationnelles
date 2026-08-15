<!--
  Le titre suit Conventional Commits, en français avec accents.
  Exemple : fix(securite): valide le rôle à l'exécution dans updateUserRole
-->

## Objet

<!-- Le POURQUOI : quel problème cette évolution résout-elle ? Le diff dit déjà le QUOI. -->

closes #

## Type

- [ ] `feat` — nouvelle fonctionnalité
- [ ] `fix` — correction
- [ ] `docs` — documentation
- [ ] `test` — tests
- [ ] `refactor` — restructuration sans changement de comportement
- [ ] `perf` — performance
- [ ] `ci` — chaîne d'intégration
- [ ] `chore` — outillage, dépendances
- [ ] **`BREAKING CHANGE`** — rupture de compatibilité (incrément MAJEUR)

## Vérifications

- [ ] `bun run lint` — 0 erreur
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] Testé manuellement en local

## Grille de revue

- [ ] **Autorisation** — chaque point d'entrée vérifie le rôle, relu en base
- [ ] **Validation** — toute entrée passe par un schéma Zod (`lib/validation.ts`)
- [ ] **Journalisation** — les actions d'administration sont tracées
- [ ] **Secrets** — aucune valeur sensible dans le code, les tests ou les journaux
- [ ] **Tests** — le comportement nouveau est couvert ; toute correction de sécurité s'accompagne d'un test de non-régression
- [ ] **Commentaires** — ils expliquent le *pourquoi*, pas le *quoi*

## Impacts

- [ ] **Migration de base** — SQL relu, vérifié sur une base vierge
- [ ] **Migration destructive** — déroulée en deux mises en production (ajouter et alimenter, puis supprimer)
- [ ] **Contrat `/api/v1` modifié** — impact sur l'application mobile évalué
- [ ] **Données personnelles** — analyse RGPD faite, politique de confidentialité à jour
- [ ] **Nouvelle variable d'environnement** — documentée dans `.env.example` et renseignée dans Dokploy
- [ ] **`CHANGELOG.md` mis à jour**

## Recette

<!-- Comment vérifier en préproduction : parcours, comptes, jeux de données. -->

## Retour arrière

<!-- Précautions particulières, ou « Retour arrière standard sur le tag précédent ». -->
