"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { WysiwygEditor } from "@/components/editor/wysiwyg-editor";
import { publishResource } from "./publish-actions";
import { X, Paperclip, ImagePlus, Trash2 } from "lucide-react";
const categories = [
  { value: "", label: "Choisir un chemin..." },
  { value: "anxiete-stress", label: "Anxiété & Stress" },
  { value: "equilibre-vie", label: "Équilibre vie pro/perso" },
  { value: "parentalite", label: "Parentalité" },
  { value: "soutien-crise", label: "Soutien de crise" },
  { value: "sante-mentale", label: "Santé mentale" },
];

const formats = [
  { value: "article", label: "Article / Réflexion" },
  { value: "video", label: "Vidéo" },
  { value: "pdf", label: "Document PDF" },
  { value: "exercise", label: "Exercice" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "protocol", label: "Protocole" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface CoverImage {
  url: string;
  previewUrl: string;
}

export default function PublierPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mediaType, setMediaType] = useState("article");
  const [privacy, setPrivacy] = useState("public");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [coverImage, setCoverImage] = useState<CoverImage | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const statusLabel: Record<SaveStatus, string> = {
    idle: "Brouillon...",
    saving: "Enregistrement...",
    saved: "Enregistré ✓",
    error: "Erreur",
  };

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'upload");
        return null;
      }

      const { publicUrl } = await res.json();
      return publicUrl as string;
    } catch {
      alert("Erreur réseau lors de l'upload");
      return null;
    }
  }, []);

  const handleCoverImageSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Veuillez sélectionner une image.");
        return;
      }
      setIsCoverUploading(true);
      const localPreview = URL.createObjectURL(file);
      const url = await uploadFile(file);
      if (url) {
        setCoverImage({ url, previewUrl: localPreview });
      } else {
        URL.revokeObjectURL(localPreview);
      }
      setIsCoverUploading(false);
    },
    [uploadFile]
  );

  const handleCoverInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCoverImageSelect(file);
    e.target.value = "";
  };

  const handleRemoveCover = () => {
    if (coverImage) URL.revokeObjectURL(coverImage.previewUrl);
    setCoverImage(null);
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsUploading(true);
      const results: UploadedFile[] = [];

      for (const file of fileArray) {
        const url = await uploadFile(file);
        if (url) {
          results.push({ name: file.name, url, type: file.type });
        }
      }

      setUploadedFiles((prev) => [...prev, ...results]);
      setIsUploading(false);
    },
    [uploadFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemoveFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url));
  };

  const handleSubmit = async (isDraft = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Le titre et le contenu sont requis.");
      return;
    }

    setIsSubmitting(true);
    setSaveStatus("saving");

    try {
      await publishResource({
        title: title.trim(),
        content,
        summary: "",
        mediaType,
        categoryId: categoryId || null,
        privacy: privacy as "public" | "private",
        isDraft,
        imageUrl: coverImage?.url ?? null,
        attachments: uploadedFiles.map((f) => ({
          url: f.url,
          name: f.name,
          contentType: f.type,
        })),
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
          href="/catalogue"
          className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Quitter le mode rédaction
        </Link>
        <span className="text-xs font-medium text-on-surface-variant/60">
          {statusLabel[saveStatus]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-8 py-16">
        {/* Decorative header */}
        <div className="mb-14 select-none pointer-events-none">
          <h1 className="text-5xl font-extrabold text-on-surface/[0.07] mb-3 leading-tight">
            {title.trim() || "Ressource sans titre"}
          </h1>
          <p className="text-on-surface-variant/30 text-base">
            Commencez à partager vos connaissances. Le monde vous écoute.
          </p>
        </div>

        {/* Title */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Donnez un titre à votre ressource..."
            className="w-full text-xl font-semibold bg-transparent border-0 border-b border-black/10 pb-4 focus:outline-none focus:border-primary/40 text-on-surface placeholder:text-on-surface/20 transition-colors"
          />
        </div>

        {/* WYSIWYG Editor */}
        <div className="mb-12">
          <WysiwygEditor
            value={content}
            onChange={setContent}
            placeholder="Commencez à rédiger votre ressource ici..."
          />
        </div>

        <hr className="border-black/8 mb-10" />

        {/* Metadata */}
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
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
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
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <input
                      type="radio"
                      name="privacy"
                      value={opt.value}
                      checked={privacy === opt.value}
                      onChange={() => setPrivacy(opt.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        privacy === opt.value
                          ? "border-primary bg-primary"
                          : "border-outline-variant group-hover:border-primary/50"
                      }`}
                    >
                      {privacy === opt.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-on-surface font-medium">
                      {opt.label}
                    </span>
                    <span className="text-xs text-on-surface-variant/60 ml-1.5">
                      — {opt.desc}
                    </span>
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
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cover image */}
        <div className="mb-10">
          <label className="block text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/50 mb-3">
            Image de couverture
          </label>
          {coverImage ? (
            <div className="relative rounded-xl overflow-hidden border border-black/10 aspect-16/6">
              <Image
                src={coverImage.previewUrl}
                alt="Couverture"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveCover}
                className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
                title="Supprimer l'image de couverture"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isCoverUploading}
              className="w-full border-2 border-dashed border-black/10 hover:border-primary/30 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5 text-on-surface-variant/30" />
              <span className="text-sm text-on-surface-variant/50">
                {isCoverUploading ? "Chargement..." : "Ajouter une image de couverture"}
              </span>
              <span className="text-xs text-on-surface-variant/30">
                JPG, PNG, WebP — recommandé 1200×400 px
              </span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleCoverInputChange}
            className="sr-only"
          />
        </div>

        {/* File upload */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center mb-10 transition-colors ${
            isDragging
              ? "border-primary/40 bg-primary/5"
              : "border-black/10 hover:border-black/20"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Paperclip className="w-5 h-5 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant/50 mb-4">
            Joignez des documents, vidéos ou fichiers audio
          </p>

          {uploadedFiles.length > 0 && (
            <div className="mb-4 space-y-1.5 text-left max-w-xs mx-auto">
              {uploadedFiles.map((file) => (
                <div
                  key={file.url}
                  className="flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-1.5"
                >
                  <span className="truncate max-w-45">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.url)}
                    className="ml-2 text-on-surface-variant/50 hover:text-error transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-5 py-2 border border-black/15 rounded-lg text-sm text-on-surface hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Envoi en cours..." : "Parcourir les fichiers"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/ogg"
            onChange={handleFileInput}
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
            {isSubmitting ? "Publication en cours..." : "Publier sur (RE)Sources"}
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

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-black/5">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-on-surface-variant/40">
            © 2024 (RE)Sources Relationnelles. Une initiative officielle de santé publique.
          </p>
          <div className="flex items-center gap-6">
            {[["Confidentialité", "Accessibilité", "Assistance"]].flat().map((item) => (
              <button
                key={item}
                type="button"
                className="text-[11px] text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
