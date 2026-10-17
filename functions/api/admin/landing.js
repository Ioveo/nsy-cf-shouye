import { requireAdmin } from "./_lib.js";
import { BUILTIN_PAGES, loadLanding, saveLanding, validatePagePath, validateContent } from "../../_landing/store.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const action = body.action || "get";
  const landing = await loadLanding(env);
  const allPages = [...BUILTIN_PAGES, ...landing.pages];

  if (action === "get") {
    return json({
      success: true,
      homeLanding: landing.homeLanding,
      pages: allPages,
      content: landing.content,
      updatedAt: landing.updatedAt
    });
  }

  if (action === "setHome") {
    const targetId = String(body.homeLanding || "").trim();
    if (!targetId || !allPages.some(p => p.id === targetId)) {
      return json({ success: false, msg: `未知落地页：${targetId}` }, 400);
    }
    landing.homeLanding = targetId;
    await saveLanding(env, landing);
    return json({ success: true, homeLanding: landing.homeLanding });
  }

  if (action === "saveContent") {
    const pageId = String(body.pageId || "").trim();
    if (!pageId || !allPages.some(p => p.id === pageId)) {
      return json({ success: false, msg: `未知落地页：${pageId}` }, 400);
    }
    const pageContent = body.content || {};
    landing.content[pageId] = validateContent({ [pageId]: pageContent })[pageId] || {};
    await saveLanding(env, landing);
    return json({ success: true, content: landing.content });
  }

  if (action === "addPage") {
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const path = String(body.path || "").trim();

    if (!id || !title || !path) {
      return json({ success: false, msg: "请填写页面标识、标题和路径" }, 400);
    }
    if (allPages.some(p => p.id === id)) {
      return json({ success: false, msg: `页面标识 ${id} 已存在` }, 400);
    }
    if (!validatePagePath(path)) {
      return json({ success: false, msg: "路径不合法，必须以 / 开头并以 .html 结尾，且不能是受保护路径" }, 400);
    }

    landing.pages.push({ id, title, path });
    await saveLanding(env, landing);
    return json({ success: true, pages: [...BUILTIN_PAGES, ...landing.pages] });
  }

  if (action === "removePage") {
    const id = String(body.id || "").trim();
    if (BUILTIN_PAGES.some(p => p.id === id)) {
      return json({ success: false, msg: "内置落地页不可删除" }, 400);
    }
    if (landing.homeLanding === id) {
      return json({ success: false, msg: "当前首页落地页不可直接删除，请先切换首页" }, 400);
    }
    const initialLen = landing.pages.length;
    landing.pages = landing.pages.filter(p => p.id !== id);
    if (landing.pages.length === initialLen) {
      return json({ success: false, msg: "未找到该自定义落地页" }, 404);
    }
    delete landing.content[id];
    await saveLanding(env, landing);
    return json({ success: true, pages: [...BUILTIN_PAGES, ...landing.pages] });
  }

  return json({ success: false, msg: `未知操作：${action}` }, 400);
}
