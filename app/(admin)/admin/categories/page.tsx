import { db } from "@/db";
import { category, resource } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { CategoryForm, CategoryRow } from "./category-actions";

export default async function CategoriesPage() {
  const categoriesWithCount = await db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      createdAt: category.createdAt,
      resourceCount: count(resource.id),
    })
    .from(category)
    .leftJoin(resource, eq(resource.categoryId, category.id))
    .groupBy(category.id)
    .orderBy(category.name);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-display-lg text-on-surface mb-2">Gestion des catégories</h1>
      <p className="text-lg text-on-surface-variant mb-8">
        Créez, modifiez et supprimez les catégories de ressources de la plateforme.
      </p>

      <CategoryForm />

      <div className="space-y-2">
        {categoriesWithCount.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-ambient-sm">
            <p className="text-on-surface-variant">Aucune catégorie. Créez-en une ci-dessus.</p>
          </div>
        ) : (
          categoriesWithCount.map((cat) => (
            <CategoryRow
              key={cat.id}
              id={cat.id}
              name={cat.name}
              slug={cat.slug}
              description={cat.description}
              icon={cat.icon}
              resourceCount={cat.resourceCount}
            />
          ))
        )}
      </div>
    </div>
  );
}
