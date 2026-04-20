"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { publishResource } from "./publish-actions";
import {
  ArrowLeft,
  FileEdit,
  CloudUpload,
  Upload,
  Shield,
  Send,
  Eye,
  Pencil,
} from "lucide-react";

const categories = [
  { value: "anxiete-stress", label: "Anxiété & Stress" },
  { value: "equilibre-vie", label: "Équilibre vie pro/perso" },
  { value: "parentalite", label: "Parentalité" },
  { value: "soutien-crise", label: "Soutien de crise" },
  { value: "sante-mentale", label: "Santé mentale" },
];

const mediaTypes = [
  { value: "article", label: "Article / Texte" },
  { value: "video", label: "Vidéo" },
  { value: "pdf", label: "Document PDF" },
  { value: "exercise", label: "Exercice" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "protocol", label: "Protocole" },
];

export default function PublierPage() {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Back */}
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            Retour au catalogue
          </Link>

          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-4">
            Publier une ressource
          </h1>
          <p className="text-lg text-on-surface-variant mb-10 max-w-2xl">
            Partagez vos connaissances ou votre expérience. Votre contribution
            aide à construire un environnement communautaire solidaire.
          </p>

          <form action={publishResource} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Resource Details */}
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8">
                <h2 className="flex items-center gap-2 text-headline-md text-on-surface mb-6">
                  <FileEdit className="w-6 h-6 text-primary" />
                  Détails de la ressource
                </h2>
                <div className="space-y-6">
                  <Input
                    id="title"
                    name="title"
                    label="Titre de la ressource"
                    placeholder="Entrez un titre descriptif"
                  />
                  <Input
                    id="summary"
                    name="summary"
                    label="Résumé (optionnel)"
                    placeholder="Courte description pour le catalogue..."
                  />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-label-md text-on-surface-variant">
                        Contenu principal
                      </label>
                      <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setPreview(false)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            !preview
                              ? "bg-primary text-on-primary-fixed"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5 inline mr-1" />
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreview(true)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            preview
                              ? "bg-primary text-on-primary-fixed"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Aperçu
                        </button>
                      </div>
                    </div>
                    {preview ? (
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 min-h-[300px]">
                        {content ? (
                          <MarkdownRenderer content={content} />
                        ) : (
                          <p className="text-on-surface-variant text-sm italic">
                            Aucun contenu à afficher...
                          </p>
                        )}
                      </div>
                    ) : (
                      <MarkdownEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Rédigez le contenu de votre ressource en markdown..."
                        minHeight="300px"
                      />
                    )}
                    <input type="hidden" name="content" value={content} />
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8">
                <h2 className="flex items-center gap-2 text-headline-md text-on-surface mb-6">
                  <CloudUpload className="w-6 h-6 text-primary" />
                  Ajouter des médias
                </h2>
                <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-8 text-center bg-surface hover:bg-surface-container-low transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-on-surface-variant mb-4 block" />
                  <p className="text-sm text-on-surface font-semibold mb-1">
                    Glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    ou cliquez pour parcourir (PDF, images, vidéos — max 50 Mo)
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Classification */}
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6">
                <h3 className="text-title-md text-on-surface mb-4">
                  Classification
                </h3>
                <div className="space-y-4">
                  <Select
                    id="category"
                    name="categoryId"
                    label="Catégorie"
                    options={categories}
                    placeholder="Choisir une catégorie..."
                  />
                  <Select
                    id="mediaType"
                    name="mediaType"
                    label="Type de média"
                    options={mediaTypes}
                    defaultValue="article"
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6">
                <h3 className="flex items-center gap-2 text-title-md text-on-surface mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  Confidentialité
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      value: "public",
                      label: "Public",
                      desc: "Visible par tous sur la plateforme.",
                    },
                    {
                      value: "shared",
                      label: "Partagé avec l'équipe de soins",
                      desc: "Seuls vos professionnels assignés peuvent voir.",
                    },
                    {
                      value: "private",
                      label: "Privé",
                      desc: "Seul vous pouvez accéder à cette ressource.",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start gap-3 p-3 rounded-lg cursor-pointer has-checked:border-primary/20 has-checked:bg-surface-container-low transition-colors"
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value={option.value}
                        defaultChecked={option.value === "public"}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-sm text-on-surface">
                          {option.label}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {option.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button type="submit" className="w-full" size="lg">
                  <Send className="w-5 h-5" />
                  Publier la ressource
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) {
                      const input = document.createElement("input");
                      input.type = "hidden";
                      input.name = "isDraft";
                      input.value = "true";
                      form.appendChild(input);
                    }
                  }}
                >
                  Enregistrer comme brouillon
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
