"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { WysiwygEditor } from "@/components/editor/wysiwyg-editor";
import { updateResource } from "../../../publier/publish-actions";
import { X } from "lucide-react";

const formats = [
  { value: "article", label: "Article / Réflexion" },
  { value: "video", label: "Vidéo" },
  { value: "pdf", label: "Document PDF" },
  { value: "exercise", label: "Exercice" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "protocol", label: "Protocole" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ResourceData {
  id: string;
  title: string;
  content: string;
  mediaType: string;
  privacy: string;
  categoryId: string | null;
  imageUrl: string | null;
  status: string;
}

export function EditResourceClient({
  resource,
  categories,
}: {
  resource: ResourceData;
  categories: Category[];
}) {
  const [title, setTitle] = useState(resource.title);
  const [content, setContent] = useState(resource.content);
  const [categoryId, setCategoryId] = useState(resource.categoryId ?? "");
  const [mediaType, setMediaType] = useState(resource.mediaType);
  const [privacy, setPrivacy] = useState(resource.privacy);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(resource.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusLabel: Record<SaveStatus, string> = {
    idle: "Édition...",
    saving: "Enregistrement...",
    saved: "Enregistré ✓",
    error: "Erreur",
  };

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) return null;
      const { uploadUrl, publicUrl } = await res.json();
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      return upload.ok ? (publicUrl as string) : null;
    } catch {
      return null;
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFile(file);
    if (url) setImageUrl(url);
    setIsUploading(false);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Le titre et le contenu sont requis.");
      return;
    }
    setIsSubmitting(true);
    setSaveStatus("saving");
    try {
      await updateResource(resource.id, {
        title: title.trim(),
        content,
        summary: "",
        mediaType,
        categoryId: categoryId || null,
        privacy: privacy as "public" | "private",
        isDraft,
        imageUrl,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface overflow-auto flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-surface/95 backdrop-blur-sm border-b border-black/5">
        <Link
          href={`/ressource/${resource.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Quitter l&apos;édition
        </Link>
        <span className="text-xs font-medium text-on-surface-variant/60">
          {statusLabel[saveStatus]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-8 py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-4">
            Édition de la ressource
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la ressource..."
            className="w-full text-xl font-semibold bg-transparent border-0 border-b border-black/10 pb-4 focus:outline-none focus:border-primary/40 text-on-surface placeholder:text-on-surface/20 transition-colors"
          />
        </div>

        <div className="mb-12">
          <WysiwygEditor
            value={content}
            onChange={setContent}
            placeholder="Contenu de la ressource..."
          />
        </div>

        <hr className="border-black/8 mb-10" />

        <div className="grid grid-cols-2 gap-10 mb-8">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 mb-3">
              Catégorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-black/10 pb-2 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 mb-3">
              Visibilité
            </label>
            <div className="space-y-2.5">
              {[
                { value: "public", label: "Public", desc: "Visible par toute la communauté" },
                { value: "private", label: "Privé", desc: "Accessible uniquement par vous" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative shrink-0">
                    <input
                      type="radio"
                      name="privacy"
                      value={opt.value}
                      checked={privacy === opt.value}
                      onChange={() => setPrivacy(opt.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${privacy === opt.value ? "border-primary bg-primary" : "border-outline-variant group-hover:border-primary/50"}`}>
                      {privacy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-on-surface font-medium">{opt.label}</span>
                    <span className="text-xs text-on-surface-variant/60 ml-1.5">— {opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Format */}
        <div className="mb-10">
          <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 mb-3">
            Format
          </label>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-black/10 pb-2 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
          >
            {formats.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div className="mb-10">
          <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 mb-3">
            Image de couverture
          </label>
          {imageUrl && (
            <div className="mb-3 flex items-center gap-3">
              <img src={imageUrl} alt="Cover" className="w-16 h-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-sm text-error hover:underline"
              >
                Supprimer
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-5 py-2 border border-black/15 rounded-lg text-sm text-on-surface hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Envoi..." : "Changer l'image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dim transition-colors disabled:opacity-60 text-sm tracking-wide"
          >
            {isSubmitting ? "Mise à jour..." : "Enregistrer et soumettre"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="w-full text-center text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors py-2"
          >
            Enregistrer comme brouillon
          </button>
        </div>
      </div>
    </div>
  );
}
