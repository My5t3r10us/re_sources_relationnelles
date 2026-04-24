"use client";

import { useState, useTransition } from "react";
import { createCategory, updateCategory, deleteCategory } from "../actions";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { EmojiPicker } from "@/components/ui/emoji-picker";

export function CategoryForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const autoSlug = (n: string) =>
    n
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(autoSlug(v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Le nom et le slug sont requis.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await createCategory({ name: name.trim(), slug: slug.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined });
        setName(""); setSlug(""); setDescription(""); setIcon("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur lors de la création");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm mb-8">
      <h2 className="text-title-md text-on-surface mb-4 font-semibold">Ajouter une catégorie</h2>
      {error && <p className="text-error text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nom *</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="ex: Santé mentale"
            className="w-full bg-surface-container-high rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Slug *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ex: sante-mentale"
            className="w-full bg-surface-container-high rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte"
            className="w-full bg-surface-container-high rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Icône</label>
          <EmojiPicker value={icon} onChange={setIcon} />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="gradient-primary text-on-primary-fixed rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer la catégorie"}
      </button>
    </form>
  );
}

export function CategoryRow({
  id,
  name: initialName,
  slug: initialSlug,
  description: initialDescription,
  icon: initialIcon,
  resourceCount,
}: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  resourceCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [icon, setIcon] = useState(initialIcon ?? "");
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateCategory(id, { name, slug, description: description || undefined, icon: icon || undefined });
      setEditing(false);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Supprimer la catégorie "${name}" ? Les ressources associées perdront leur catégorie.`)) return;
    startTransition(() => deleteCategory(id));
  };

  if (editing) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient-sm flex items-center gap-3 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-surface-container-high rounded-lg px-3 py-1.5 text-sm flex-1 min-w-30 focus:outline-none"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="bg-surface-container-high rounded-lg px-3 py-1.5 text-sm font-mono flex-1 min-w-30 focus:outline-none"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="bg-surface-container-high rounded-lg px-3 py-1.5 text-sm flex-1 min-w-30 focus:outline-none"
        />
        <div className="w-44 shrink-0">
          <EmojiPicker value={icon} onChange={setIcon} placeholder="Icône" />
        </div>
        <div className="flex gap-1">
          <button onClick={handleSave} disabled={pending} className="p-1.5 rounded-lg text-tertiary hover:bg-tertiary/10 transition-colors disabled:opacity-50">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient-sm flex items-center gap-4 hover:shadow-ambient transition-all">
      {icon && <span className="text-2xl shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface">{name}</p>
        <p className="text-xs text-on-surface-variant font-mono">{slug}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      <span className="text-sm text-on-surface-variant shrink-0">{resourceCount} ressource{resourceCount !== 1 ? "s" : ""}</span>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} disabled={pending} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors disabled:opacity-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
