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
  console.log("=== Phase 4 Playlists Acceptance Verification ===");
  const token = await loginAdmin();
  console.log("PASS 1: Admin login successful");

  // 1. Create or ensure test tracks in music catalog
  const sampleTracks = [
    {
      id: "trk_p4_live_1",
      title: "超燃战歌·电音启航",
      artist: "天才猫声音实验室",
      album: "高燃现场 Vol.1",
      audioUrl: "https://example.com/audio1.mp3",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
      lyric: "[00:00.00]电音启航 - 天才猫\n[00:02.00]欢迎来到直播间\n[00:05.00]气氛拉满，全场聚焦\n[00:10.00]今夜属于每一个热爱代码与音乐的人",
      status: "published",
      featured: true
    },
    {
      id: "trk_p4_live_2",
      title: "爆单节奏·带货加速",
      artist: "天才猫声音实验室",
      album: "电商主播必备",
      audioUrl: "https://example.com/audio2.mp3",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
      lyric: "[00:00.00]爆单节奏\n[00:03.00]倒计时三二一，上链接！\n[00:07.00]手速要快，机不可失",
      status: "published"
    },
    {
      id: "trk_p4_night_1",
      title: "深夜夜聊·赛博思绪",
      artist: "星空旅人",
      album: "深夜代码与咖啡",
      audioUrl: "https://example.com/audio3.mp3",
      coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
      lyric: "[00:00.00]深夜夜聊\n[00:04.00]夜深了，城市的灯火渐次熄灭\n[00:09.00]只有屏幕的微光陪伴着灵感",
      status: "published"
    },
    {
      id: "trk_p4_draft_1",
      title: "未发布草稿歌曲（应被歌单过滤）",
      artist: "草稿歌手",
      audioUrl: "https://example.com/draft.mp3",
      coverUrl: "https://example.com/draft.png",
      status: "draft"
    }
  ];

  for (const t of sampleTracks) {
    const res = await fetch(`${BASE}/api/admin/music`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(t)
    });
    assert.equal(res.status, 200, `Track ${t.title} saved`);
  }
  console.log("PASS 2: Test tracks created in music catalog");

  // 2. Save 2 test playlists with different scenes and ordering
  const testPlaylists = [
    {
      id: "pl_phase4_live",
      title: "直播暖场·极度高燃",
      description: "为主播打造的高能电音开场曲库，瞬间调动直播间热度与氛围",
      cover: "", // Test 2x2 collage fallback
      scene: "live",
      trackIds: ["trk_p4_live_1", "trk_p4_live_2", "trk_p4_draft_1"], // contains 1 draft track
      status: "published",
      order: 10,
      featured: true
    },
    {
      id: "pl_phase4_night",
      title: "沉浸夜聊·代码灵感",
      description: "深夜写代码与思考时倾听的治愈 Lo-Fi 与赛博环境氛围音",
      cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
      scene: "night",
      trackIds: ["trk_p4_night_1", "trk_p4_live_1"],
      status: "published",
      order: 20,
      featured: false
    }
  ];

  const saveRes = await fetch(`${BASE}/api/admin/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      action: "save",
      name: "playlists",
      data: { items: testPlaylists }
    })
  });
  assert.equal(saveRes.status, 200, "Save playlists config must succeed");
  const saveJson = await saveRes.json();
  assert.equal(saveJson.config.items.length, 2, "Must contain 2 playlists");
  console.log("PASS 3: Saved 2 playlists across scenes (live, night)");

  // 3. Public GET /api/config/playlists
  const publicRes = await fetch(`${BASE}/api/config/playlists`);
  assert.equal(publicRes.status, 200, "Public GET playlists must succeed");
  const publicJson = await publicRes.json();
  assert.equal(publicJson.items.length, 2, "Public config has 2 playlists");
  assert.equal(publicJson.items[0].id, "pl_phase4_live");
  assert.equal(publicJson.items[0].featured, true);
  console.log("PASS 4: Public GET /api/config/playlists verified");

  // 4. Test rollback
  const updateRes = await fetch(`${BASE}/api/admin/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      action: "save",
      name: "playlists",
      data: { items: [testPlaylists[0]] } // only 1
    })
  });
  assert.equal(updateRes.status, 200);

  const rollbackRes = await fetch(`${BASE}/api/admin/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ action: "rollback", name: "playlists" })
  });
  assert.equal(rollbackRes.status, 200);
  const rollbackJson = await rollbackRes.json();
  assert.equal(rollbackJson.config.items.length, 2, "Rollback successfully restored 2 playlists");
  console.log("PASS 5: Rollback playlists config verified");

  console.log("\nALL PHASE 4 API & CONFIG TESTS PASSED!\n");
}

run().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
