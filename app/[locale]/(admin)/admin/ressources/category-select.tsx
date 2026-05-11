"use client";

interface CategorySelectProps {
  categories: { id: string; name: string }[];
  defaultValue: string;
}

export function CategorySelect({ categories, defaultValue }: CategorySelectProps) {
  return (
    <select
      name="categoryId"
      defaultValue={defaultValue}
      className="bg-surface-container-high rounded-xl px-3 py-2 text-sm focus:outline-none"
      onChange={(e) => e.currentTarget.form?.submit()}
    >
      <option value="">Toutes catégories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
