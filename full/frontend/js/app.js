const API = "";

// ── Helpers ──────────────────────────────────────────────
function toArabicNum(n) {
  return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}
function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove("show"), 3500);
}
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
function showTab(id) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  event.currentTarget.classList.add("active");
  if (id === "tab-list") loadAdminTable();
}
function closeModal() {
  document.getElementById("member-modal").classList.remove("open");
}
function toggleMobileMenu() {
  document.getElementById("mobile-menu").classList.toggle("open");
}

// ── Data store ───────────────────────────────────────────
let allMembers = [];

// ── Init ─────────────────────────────────────────────────
async function init() {
  spawnParticles();
  await loadMembers();
  loadEvents();
  populateSelects();
  checkAdmin();
}

// ── Particles ────────────────────────────────────────────
function spawnParticles() {
  const wrap = document.getElementById("particles");
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const s = Math.random() * 6 + 3;
    p.style.cssText = `
      width:${s}px;height:${s}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*15+10}s;
      animation-delay:${Math.random()*10}s;
    `;
    wrap.appendChild(p);
  }
}

// ── Load members ─────────────────────────────────────────
async function loadMembers() {
  try {
    const res = await fetch(`${API}/api/members/`);
    allMembers = await res.json();

    // Stats
    const countries = [...new Set(allMembers.map(m => m.country).filter(Boolean))];
    animateNum("stat-members", allMembers.length);
    animateNum("stat-countries", countries.length);

    renderMembersGrid();
  } catch (e) {
    document.getElementById("members-grid").innerHTML = `<p style="color:var(--text2)">تعذّر تحميل البيانات</p>`;
  }
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const iv = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = toArabicNum(current);
    if (current >= target) clearInterval(iv);
  }, 40);
}

// ── Members Grid ─────────────────────────────────────────
function renderMembersGrid() {
  const grid = document.getElementById("members-grid");
  const notable = allMembers.filter(m => m.role && m.role.length > 0);
  if (!notable.length) { grid.innerHTML = "<p>لا يوجد أعضاء بعد</p>"; return; }

  grid.innerHTML = notable.map(m => {
    const initial = m.name ? m.name[0] : "؟";
    const genLabel = ["الجد الأكبر","الجيل الأول","الجيل الثاني","الجيل الثالث","الجيل الرابع","الجيل الخامس"][m.generation] || "";
    const flag = countryFlag(m.country);
    return `
    <div class="member-card" onclick="openMember(${m.id})">
      <div class="card-gen-badge">${genLabel}</div>
      <div class="card-avatar">${initial}</div>
      <div class="card-name">${m.name}</div>
      <div class="card-role">${m.role || ""}</div>
      <div class="card-country">${flag} ${m.country || ""}</div>
    </div>`;
  }).join("");
}

function countryFlag(country) {
  const map = { "السعودية":"🇸🇦","الإمارات":"🇦🇪","الكويت":"🇰🇼","البحرين":"🇧🇭","قطر":"🇶🇦","عُمان":"🇴🇲","مصر":"🇪🇬","المملكة المتحدة":"🇬🇧","كندا":"🇨🇦","فرنسا":"🇫🇷","الولايات المتحدة":"🇺🇸" };
  return map[country] || "🌍";
}

// ── Open Member Modal ─────────────────────────────────────
async function openMember(id) {
  try {
    const m = await fetch(`${API}/api/members/${id}`).then(r => r.json());
    document.getElementById("m-name").textContent = m.name;
    document.getElementById("m-role").textContent = m.role || "عضو في القبيلة";

    const meta = [
      { label: "سنة الميلاد", val: m.birth_year ? toArabicNum(m.birth_year) : "—" },
      { label: "مكان الميلاد", val: m.birth_place || "—" },
      { label: "الدولة", val: (countryFlag(m.country) + " " + (m.country || "—")) },
      { label: "الحالة", val: m.is_deceased ? "🕊 توفي إلى رحمة الله" : "🌱 على قيد الحياة" },
    ];
    document.getElementById("m-meta").innerHTML = meta.map(x =>
      `<div class="meta-item"><div class="meta-label">${x.label}</div><div class="meta-val">${x.val}</div></div>`
    ).join("");

    document.getElementById("m-bio").textContent = m.bio || "لا توجد سيرة ذاتية بعد.";

    const achWrap = document.getElementById("m-achievements");
    if (m.achievements) {
      achWrap.style.display = "block";
      document.getElementById("m-ach-text").textContent = m.achievements;
    } else { achWrap.style.display = "none"; }

    const tlWrap = document.getElementById("m-timeline-wrap");
    if (m.timeline && m.timeline.length) {
      tlWrap.style.display = "block";
      document.getElementById("m-timeline").innerHTML = m.timeline.map(t => `
        <div class="timeline-item">
          <div class="timeline-year">${toArabicNum(t.year)}</div>
          <div class="timeline-title">${t.title}</div>
          <div class="timeline-desc">${t.description || ""}</div>
        </div>`).join("");
    } else { tlWrap.style.display = "none"; }

    document.getElementById("member-modal").classList.add("open");
  } catch (e) { toast("تعذّر تحميل بيانات الفرد", "error"); }
}

// ── Events ────────────────────────────────────────────────
const EVENT_ICONS = { news:"📰", birth:"👶", achievement:"🏆", death:"🕊" };

async function loadEvents() {
  try {
    const events = await fetch(`${API}/api/events/`).then(r => r.json());
    const list = document.getElementById("events-list");
    if (!events.length) { list.innerHTML = "<p style='color:var(--text2)'>لا توجد أحداث بعد</p>"; return; }
    list.innerHTML = events.map(e => `
      <div class="event-item" style="animation-delay:${Math.random()*0.4}s">
        <div class="event-icon ${e.event_type}">${EVENT_ICONS[e.event_type] || "📌"}</div>
        <div>
          <div class="event-title">${e.title}</div>
          <div class="event-content">${e.content || ""}</div>
          <div class="event-date">${e.event_date || e.created_at?.substring(0,10) || ""} ${e.member_name ? "· " + e.member_name : ""}</div>
        </div>
      </div>`).join("");
  } catch (e) {}
}

// ── Populate Selects ──────────────────────────────────────
function populateSelects() {
  const selects = ["person1-select","person2-select","f-parent","r-parent","r-child","e-member"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const hasEmpty = el.querySelector("option[value='']");
    allMembers.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      el.appendChild(opt);
    });
  });
}

// ── AI Relationship ───────────────────────────────────────
async function findRelationship() {
  const p1 = document.getElementById("person1-select").value;
  const p2 = document.getElementById("person2-select").value;
  const result = document.getElementById("chat-result");

  if (!p1 || !p2) { toast("يرجى اختيار شخصين", "error"); return; }
  if (p1 === p2) { toast("الشخصان متطابقان!", "error"); return; }

  result.innerHTML = '<div class="spinner"></div>';

  try {
    const data = await fetch(`${API}/api/chat/relationship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person1_id: +p1, person2_id: +p2 })
    }).then(r => r.json());

    if (!data.found) {
      result.innerHTML = `<div class="chat-placeholder"><div class="icon">❌</div><p>${data.message}</p></div>`;
      return;
    }

    const stepsHTML = (data.steps || []).map((s, i) => `
      <div class="step-item">
        <div class="step-num">${i + 1}</div>
        <span>${s}</span>
      </div>`).join("");

    const pathHTML = (data.path_names || []).map((n, i) => {
      const isAncestor = i === data.common_ancestor_idx;
      const nodeClass = isAncestor ? "path-name common-ancestor" : "path-name";
      let html = `<span class="${nodeClass}">${n}</span>`;
      if (i < data.path_names.length - 1) {
        const edgeLabel = data.edge_labels && data.edge_labels[i] ? data.edge_labels[i] : "";
        html += `
          <div class="path-edge">
            <span class="path-label">${edgeLabel}</span>
            <span class="path-arrow">←</span>
          </div>`;
      }
      return html;
    }).join("");

    result.innerHTML = `
      <div class="result-card">
        <div class="result-summary">
          <div class="summary-text">🧬 ${data.summary}</div>
        </div>
        <h4 style="color:var(--text2);font-size:0.85rem;margin-bottom:1.5rem;">مسار العلاقة:</h4>
        <div class="result-path" style="margin-bottom: 2rem;">${pathHTML}</div>
        ${data.steps?.length ? `<div class="result-steps">${stepsHTML}</div>` : ""}
      </div>`;
  } catch (e) {
    result.innerHTML = `<div class="chat-placeholder"><div class="icon">⚠️</div><p>حدث خطأ، يرجى المحاولة لاحقاً</p></div>`;
  }
}

// ── Admin: Add Member ─────────────────────────────────────
async function addMember() {
  const name = document.getElementById("f-name").value.trim();
  if (!name) { toast("الاسم مطلوب", "error"); return; }

  const body = {
    name,
    gender: document.getElementById("f-gender").value,
    birth_year: +document.getElementById("f-birth").value || null,
    death_year: +document.getElementById("f-death").value || null,
    birth_place: document.getElementById("f-birthplace").value,
    country: document.getElementById("f-country").value || "السعودية",
    role: document.getElementById("f-role").value,
    generation: +document.getElementById("f-gen").value || 0,
    bio: document.getElementById("f-bio").value,
    achievements: document.getElementById("f-achievements").value,
    parent_id: +document.getElementById("f-parent").value || null,
    is_deceased: !!document.getElementById("f-death").value,
  };

  try {
    await fetch(`${API}/api/members/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast("✅ تم إضافة الفرد بنجاح");
    clearForm();
    await loadMembers();
    populateSelects();
    renderTree();
  } catch (e) { toast("حدث خطأ أثناء الحفظ", "error"); }
}

function clearForm() {
  ["f-name","f-birth","f-death","f-birthplace","f-country","f-role","f-bio","f-achievements","f-gen","f-parent"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = (id==='f-gen'? '3' : (id==='f-parent'?'':'')); });
}

// ── Admin: Table ─────────────────────────────────────────
async function loadAdminTable() {
  const tbody = document.getElementById("admin-table-body");
  tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;padding:2rem'><div class='spinner'></div></td></tr>";
  const members = await fetch(`${API}/api/members/`).then(r => r.json());
  tbody.innerHTML = members.map(m => `
    <tr>
      <td>${m.id}</td>
      <td>${m.name}</td>
      <td>${m.role || "—"}</td>
      <td>${m.country || "—"}</td>
      <td>${m.generation}</td>
      <td class="action-btns">
        <button class="btn-sm btn-edit" onclick="openMember(${m.id})">👁 عرض</button>
        <button class="btn-sm btn-del" onclick="deleteMember(${m.id}, '${m.name}')">🗑 حذف</button>
      </td>
    </tr>`).join("");
}

async function deleteMember(id, name) {
  if (!confirm(`هل تريد حذف ${name}؟`)) return;
  await fetch(`${API}/api/members/${id}`, { method: "DELETE" });
  toast("تم الحذف");
  loadAdminTable();
  loadMembers();
  renderTree();
}

// ── Admin: Relationship ──────────────────────────────────
async function addRelationship() {
  const parent_id = +document.getElementById("r-parent").value;
  const child_id = +document.getElementById("r-child").value;
  if (!parent_id || !child_id) { toast("اختر الوالد والابن", "error"); return; }
  await fetch(`${API}/api/members/relationship/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent_id, child_id })
  });
  toast("✅ تم ربط العلاقة");
  renderTree();
}

// ── Admin: Post Event ────────────────────────────────────
async function postEvent() {
  const title = document.getElementById("e-title").value.trim();
  if (!title) { toast("عنوان الخبر مطلوب", "error"); return; }
  await fetch(`${API}/api/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      content: document.getElementById("e-content").value,
      event_type: document.getElementById("e-type").value,
      member_id: +document.getElementById("e-member").value || null,
      event_date: document.getElementById("e-date").value || null,
    })
  });
  toast("✅ تم نشر الخبر");
  loadEvents();
}

// ── Import CSV ────────────────────────────────────────────
async function uploadCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const result = document.getElementById("import-result");
  result.style.display = "block";
  result.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await fetch(`${API}/api/import/csv`, { method: "POST", body: fd }).then(r => r.json());
    result.innerHTML = `<div style="background:rgba(39,174,114,0.1);border:1px solid rgba(39,174,114,0.3);border-radius:12px;padding:1rem;color:var(--green2)">✅ ${res.message}</div>`;
    loadMembers(); renderTree();
  } catch (e) {
    result.innerHTML = `<div style="background:rgba(192,57,43,0.1);border-radius:12px;padding:1rem;color:#e74c3c">⚠️ فشل الاستيراد</div>`;
  }
}

// ── Scroll Nav ───────────────────────────────────────────
window.addEventListener("scroll", () => {
  const sections = ["hero","tree-section","chat-section","members-section","events-section","admin-section"];
  const navIds   = ["nav-hero","nav-tree","nav-chat","nav-members","nav-events"];
  let active = 0;
  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && window.scrollY + 100 >= el.offsetTop) active = Math.min(i, navIds.length - 1);
  });
  navIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", i === active);
  });
});

// ── Admin Login Logic ────────────────────────────────────
let isAdmin = localStorage.getItem("is_admin") === "true";

function openAdmin() {
  if (isAdmin) {
    document.getElementById("admin-section").style.display = "block";
    scrollTo("admin-section");
    loadDashboardStats();
  } else {
    document.getElementById("admin-lock").style.display = "flex";
  }
}

async function loginAdmin() {
  const pass = document.getElementById("admin-pass").value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    isAdmin = true;
    localStorage.setItem("is_admin", "true");
    document.getElementById("admin-lock").style.display = "none";
    document.getElementById("admin-section").style.display = "block";
    toast("مرحباً بك يا مدير النظام");
    loadDashboardStats();
    setTimeout(() => scrollTo("admin-section"), 100);
  } catch (e) {
    toast("كلمة المرور غير صحيحة", "error");
  }
}

function logoutAdmin() {
  isAdmin = false;
  localStorage.removeItem("is_admin");
  document.getElementById("admin-section").style.display = "none";
  toast("تم تسجيل الخروج");
}

function checkAdmin() {
  if (isAdmin) {
    document.getElementById("admin-section").style.display = "block";
    loadDashboardStats();
  }
}

async function loadDashboardStats() {
  try {
    const stats = await fetch(`${API}/api/admin/stats`).then(r => r.json());
    animateNum("d-total", stats.total_members);
    animateNum("d-pending", stats.pending_requests);
    animateNum("d-notable", stats.documented_notable);
    animateNum("d-events", stats.total_events);
    loadPendingList();
  } catch (e) {}
}

function showAdminTab(id, el) {
  document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (el) el.classList.add("active");
  if (id === "tab-validation") loadPendingList();
  if (id === "tab-list") loadAdminTable();
}

async function loadPendingList() {
  const list = document.getElementById("pending-table-body");
  const quickList = document.getElementById("quick-pending-list");
  try {
    const pending = await fetch(`${API}/api/admin/pending-list`).then(r => r.json());
    if (!pending.length) {
      list.innerHTML = "<tr><td colspan='5' style='text-align:center;padding:2rem;color:var(--text2)'>لا توجد طلبات معلقة</td></tr>";
      quickList.innerHTML = "<p style='color:var(--text2)'>كل شيء محدث!</p>";
      return;
    }
    
    const rows = pending.map(m => `
      <tr>
        <td>${m.name}</td>
        <td>${m.generation}</td>
        <td>${m.country}</td>
        <td>${m.parent_id || "—"}</td>
        <td><button class="approve-btn" onclick="approveMember(${m.id})">✅ اعتماد</button></td>
      </tr>`).join("");
    
    list.innerHTML = rows;
    quickList.innerHTML = pending.slice(0, 3).map(m => `
      <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:10px;margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
        <span>${m.name}</span>
        <button class="btn-sm btn-success" onclick="approveMember(${m.id})">اعتماد</button>
      </div>`).join("");
  } catch (e) {}
}

async function approveMember(id) {
  try {
    await fetch(`${API}/api/admin/approve/${id}`, { method: "POST" });
    toast("تم اعتماد الفرد ونشره في الشجرة");
    loadDashboardStats();
    loadMembers();
    renderTree();
  } catch (e) { toast("فشل الاعتماد", "error"); }
}

document.addEventListener("DOMContentLoaded", init);
