import { loadCatalog, publicCatalog } from "../../_lib/catalog.js";
import { getArticleBySlug, listArticles } from "../../_lib/articles-db.js";
import { json, text } from "../../_lib/releases.js";

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);
  const isPreview = url.searchParams.get("preview") === "1";
  const rawSlug = params.slug || "";
  let decodedSlug = rawSlug;
  try { decodedSlug = decodeURIComponent(rawSlug); } catch {}

  const catalog = publicCatalog(await loadCatalog(env));
  let dbArticle = await getArticleBySlug(env, decodedSlug);
  if (!dbArticle && decodedSlug !== rawSlug) {
    dbArticle = await getArticleBySlug(env, rawSlug);
  }

  let article = null;
  if (dbArticle && (dbArticle.status === "published" || isPreview)) {
    article = dbArticle;
  }
  if (!article) {
    const catArticle = (catalog.articles || []).find(
      item => item.slug === decodedSlug || item.id === decodedSlug || item.slug === rawSlug || item.id === rawSlug
    );
    if (catArticle && (catArticle.status === "published" || isPreview)) {
      article = catArticle;
    }
  }
  if (!article) return text("Article not found", 404);
  const relatedSoftware = (article.softwareIds || [])
    .map(id => catalog.software.find(item => item.id === id))
    .filter(Boolean);

  // 获取相邻文章与相关推荐文章
  let allArticles = await listArticles(env, { publicOnly: true });
  if (!allArticles || !allArticles.length) {
    allArticles = (catalog.articles || []).filter(item => item.status === "published");
  }

  let prevArticle = null;
  let nextArticle = null;
  let relatedArticles = [];

  if (allArticles && allArticles.length) {
    const currentIndex = allArticles.findIndex(
      item => item.id === article.id || item.slug === article.slug
    );
    if (currentIndex > 0) {
      const prev = allArticles[currentIndex - 1];
      prevArticle = { id: prev.id, slug: prev.slug, title: prev.title, category: prev.category };
    }
    if (currentIndex >= 0 && currentIndex < allArticles.length - 1) {
      const next = allArticles[currentIndex + 1];
      nextArticle = { id: next.id, slug: next.slug, title: next.title, category: next.category };
    }

    relatedArticles = allArticles
      .filter(item => item.id !== article.id && item.slug !== article.slug)
      .sort((a, b) => {
        const aCat = a.category && a.category === article.category ? 1 : 0;
        const bCat = b.category && b.category === article.category ? 1 : 0;
        return bCat - aCat;
      })
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        coverUrl: item.coverUrl,
        category: item.category,
        publishedAt: item.publishedAt || item.createdAt
      }));
  }

  return json({
    article,
    relatedSoftware,
    navigation: catalog.navigation,
    product: catalog.product,
    prevArticle,
    nextArticle,
    relatedArticles
  });
}
