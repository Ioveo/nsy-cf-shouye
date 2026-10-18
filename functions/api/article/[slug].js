import { loadCatalog, publicCatalog } from "../../_lib/catalog.js";
import { getArticleBySlug } from "../../_lib/articles-db.js";
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
  return json({ article, relatedSoftware, navigation: catalog.navigation, product: catalog.product });
}
