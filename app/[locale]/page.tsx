import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, MessageSquare, Search, Clock, Bookmark, FileText, Video, FileType2, Activity, Headphones, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getHomeData, type HomeResourceCard } from "@/lib/home-data";

const mediaTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  article: FileText,
  video: Video,
  pdf: FileType2,
  exercise: Activity,
  audio: Headphones,
  protocol: BookOpen,
};

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ResourceTile({ res, save }: { res: HomeResourceCard; save: string }) {
  const Icon = mediaTypeIcons[res.mediaType] ?? FileText;
  return (
    <Link href={`/ressource/${res.id}`} className="group">
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col">
        <div
          className="aspect-[4/3] bg-surface-container-high relative overflow-hidden"
          style={
            res.imageUrl
              ? { backgroundImage: `url(${res.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {res.categoryName && (
            <div className="absolute top-3 left-3">
              <span className="bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-on-surface">
                {res.categoryName}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-title-md text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {res.title}
          </h3>
          {res.summary && (
            <p className="text-sm text-on-surface-variant line-clamp-3 flex-1">
              {res.summary}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="flex items-center gap-1 text-xs text-on-surface-variant">
              {res.readingTime ? (
                <>
                  <Clock className="w-4 h-4" />
                  {res.readingTime} min
                </>
              ) : (
                <>
                  <Icon className="w-4 h-4" />
                  {res.mediaType}
                </>
              )}
            </span>
            <span className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
              <Bookmark className="w-5 h-5" />
              {save}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const t = await getTranslations("Home");
  const data = await getHomeData();

  const heroResources = data.featured.length > 0 ? data.featured : data.recent.slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-display-lg text-on-surface mb-6">
                {t("heroHeadline")}{" "}
                <span className="text-primary">{t("heroHighlight")}</span>
              </h1>
              <p className="text-lg text-on-surface-variant mb-8 max-w-lg">
                {t("heroDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/catalogue"
                  className="gradient-primary text-on-primary-fixed rounded-xl px-8 py-4 text-base font-semibold inline-flex items-center justify-center gap-2"
                >
                  {t("exploreCatalogue")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/communaute"
                  className="bg-surface-container-highest text-primary rounded-xl px-8 py-4 text-base font-semibold inline-flex items-center justify-center"
                >
                  {t("joinCommunity")}
                </Link>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 h-100 md:h-125">
              <div className="bg-surface-container-high rounded-4xl row-span-2 overflow-hidden relative">
                <Image
                  src="/assets/images/accueil-verticale.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="bg-surface-container-high rounded-3xl overflow-hidden relative">
                <Image
                  src="/assets/images/accueil-horizontale.png"
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="rounded-3xl overflow-hidden relative flex flex-col justify-end">
                <Image
                  src="/assets/images/accueil-carre.jpg"
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="relative z-10 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <MessageSquare className="w-6 h-6 text-white mb-2" />
                  <p className="font-bold text-white text-sm">{t("activeNetwork")}</p>
                  <p className="text-xs text-white/80">
                    {t("resourcesShared", { count: data.stats.totalResources })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="bg-surface-container-low py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-headline-lg text-on-surface mb-8">
              {t("searchHeading")}
            </h2>
            <div className="flex items-center bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
              <Search className="w-5 h-5 text-on-surface-variant ml-4" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none text-on-surface placeholder:text-outline"
              />
              <Link
                href="/catalogue"
                className="gradient-primary text-on-primary-fixed px-6 py-3 m-1.5 rounded-lg font-semibold text-sm"
              >
                {t("searchButton")}
              </Link>
            </div>
            {data.popularCategories.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                  {t("popular")}
                </span>
                {data.popularCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogue?category=${cat.slug}`}
                    className="px-3 py-1 rounded-full bg-surface-container-lowest text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Resources */}
        {heroResources.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-headline-lg text-on-surface">
                  {t("featuredHeading")}
                </h2>
                <p className="text-on-surface-variant mt-1">
                  {t("featuredSubheading")}
                </p>
              </div>
              <Link
                href="/catalogue"
                className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
              >
                {t("seeAll")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {heroResources.map((res) => (
                <ResourceTile key={res.id} res={res} save={t("save")} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Resources */}
        {data.recent.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-headline-lg text-on-surface">
                  {t("recentHeading")}
                </h2>
                <p className="text-on-surface-variant mt-1">
                  {t("recentSubheading")}
                </p>
              </div>
              <span className="text-xs text-on-surface-variant">
                {formatViews(data.stats.totalResources)} {t("publishedShort")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.recent.map((res) => (
                <ResourceTile key={res.id} res={res} save={t("save")} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
