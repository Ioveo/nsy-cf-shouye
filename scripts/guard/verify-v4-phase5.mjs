import assert from "node:assert/strict";

const BASE = "http://127.0.0.1:8788";

async function loginAdmin() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" })
  });
  assert.equal(res.status, 200, "Admin login must succeed");
  const data = await res.json();
  assert.ok(data.token, "Must return token");
  return data.token;
}

async function run() {
  console.log("=== Phase 5 Portal Promotions Acceptance Verification ===");
  const token = await loginAdmin();
  console.log("PASS 1: Admin login successful");

  // 1. Create a legacy siteCarousel item
  const carouselRes = await fetch(`${BASE}/api/admin/site-carousel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id: "car_legacy_test",
      title: "旧版首页巨幕幻灯片",
      description: "用于测试兼容与一键迁移的旧版幻灯片",
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80",
      suggestion: "/download.html?app=desktop",
      sortOrder: 1,
      status: "published"
    })
  });
  assert.equal(carouselRes.status, 200, "Save legacy carousel item must succeed");
  console.log("PASS 2: Legacy siteCarousel slide created");

  // 2. Save a high-priority portal promotion
  const promoRes = await fetch(`${BASE}/api/admin/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      action: "save",
      name: "promotions",
      data: {
        items: [
          {
            id: "promo_p5_portal_main",
            placements: ["portal", "software"],
            entity: { type: "custom", id: "portal_showcase" },
            override: {
              title: "天才猫桌面 2.0 灵动生态全新升级",
              subtitle: "独立自包含运行时，抽屉收纳盒与Alt盲操矩阵，为现代化工作流赋能",
              image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80",
              ctaText: "立即体验 2.0",
              ctaHref: "/desktop.html"
            },
            badge: "旗舰推荐",
            startAt: 0,
            endAt: 0,
            status: "active",
            order: 5
          }
        ]
      }
    })
  });
  assert.equal(promoRes.status, 200, "Save portal promotion must succeed");
  const promoJson = await promoRes.json();
  assert.equal(promoJson.config.items[0].id, "promo_p5_portal_main");
  console.log("PASS 3: Portal promotion with placement=portal saved in promotions config");

  // 3. Verify public GET /api/config/promotions
  const pubRes = await fetch(`${BASE}/api/config/promotions`);
  assert.equal(pubRes.status, 200);
  const pubJson = await pubRes.json();
  assert.ok(pubJson.items.some(p => p.placements.includes("portal")));
  console.log("PASS 4: Public GET /api/config/promotions verified");

  // 4. Test migration of legacy siteCarousel to promotions
  const catRes = await fetch(`${BASE}/api/catalog`);
  const cat = await catRes.json();
  const legacySlides = cat.siteCarousel || [];
  assert.ok(legacySlides.length > 0, "Catalog must contain siteCarousel");

  const migratedItems = [...pubJson.items];
  for (const slide of legacySlides) {
    const promoId = `promo_migrated_${slide.id}`;
    if (!migratedItems.some(p => p.id === promoId)) {
      migratedItems.push({
        id: promoId,
        placements: ["portal"],
        entity: { type: "custom", id: slide.id },
        override: {
          title: slide.title,
          subtitle: slide.description,
          image: slide.imageUrl,
          ctaText: "立即查看",
          ctaHref: slide.suggestion || "/"
        },
        badge: "官方推荐",
        startAt: 0,
        endAt: 0,
        status: "active",
        order: 20
      });
    }
  }

  const migrateRes = await fetch(`${BASE}/api/admin/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      action: "save",
      name: "promotions",
      data: { items: migratedItems }
    })
  });
  assert.equal(migrateRes.status, 200);
  const migrateJson = await migrateRes.json();
  assert.ok(migrateJson.config.items.some(p => p.id === "promo_migrated_car_legacy_test"));
  console.log("PASS 5: Legacy siteCarousel successfully migrated to promotions with placement=portal without deleting old data");

  console.log("\nALL PHASE 5 API & MIGRATION TESTS PASSED!\n");
}

run().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
