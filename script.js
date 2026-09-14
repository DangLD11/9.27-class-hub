function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function initials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function studentByName(name) {
  return students.find(s => s.name === name);
}

function renderHomework() {
  const el = document.getElementById("homeworkList");
  if (!el) return;
  const list = Array.isArray(homework) ? homework : [];
  if (!list.length) {
    el.innerHTML = `<div class="duty-empty"><div class="empty-hero"><div class="empty-icon">📚</div><h2>Chưa có bài tập</h2><p>Khi admin cập nhật, bài tập sẽ xuất hiện tại đây.</p></div></div>`;
    return;
  }
  el.innerHTML = list.map(day => `
    <section class="homework-day">
      <div class="day-head"><div><span class="eyebrow">NGÀY</span><h2>${escapeHtml(day.day)}</h2></div><span class="date-pill">${escapeHtml(day.date)}</span></div>
      <div class="homework-cards">
        ${(day.items || []).map((item, i) => `
          <article class="homework-card">
            <div class="subject-icon">${escapeHtml(item.icon || "📚")}</div>
            <div class="homework-main"><span class="subject">${escapeHtml(item.subject)}</span><p>${escapeHtml(item.text)}</p></div>
            <span class="task-number">${String(i+1).padStart(2,"0")}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function currentSeatPlan() {
  return window.remoteSeatPlan || seatPlan;
}

function renderSeats() {
  const el = document.getElementById("seatGrid");
  if (!el) return;
  const plan = currentSeatPlan();
  let html = "";
  plan.forEach((row, r) => {
    row.forEach((name, c) => {
      if (!name) {
        html += `<div class="seat empty-seat"><span>Chỗ trống</span></div>`;
        return;
      }
      const s = studentByName(name);
      html += `
        <button class="seat" onclick="showStudent('${encodeURIComponent(name)}')" title="Xem ${escapeHtml(name)}">
          <span class="seat-num">${r+1}.${c+1}</span>
          <span class="avatar">${escapeHtml(initials(name))}</span>
          <strong>${escapeHtml(name)}</strong>
          <small>STT ${s ? s.stt : ""}</small>
        </button>`;
    });
  });
  el.innerHTML = html;
}

async function loadRemoteSeatPlan() {
  if (!supabaseReady()) return false;
  try {
    const {data, error} = await window.supabaseClient
      .from("seat_assignments")
      .select("row_no,col_no,student_id,students(name)")
      .order("row_no").order("col_no");
    if (error) throw error;
    const plan = Array.from({length: 6}, () => Array(8).fill(null));
    (data || []).forEach(item => {
      const r = Number(item.row_no) - 1, c = Number(item.col_no) - 1;
      if (r >= 0 && r < 6 && c >= 0 && c < 8) plan[r][c] = item.students?.name || null;
    });
    window.remoteSeatPlan = plan;
    renderSeats();
    renderSeatEditor();
    return true;
  } catch (e) {
    window.remoteSeatPlan = null;
    if (document.getElementById("seatSyncStatus")) {
      document.getElementById("seatSyncStatus").textContent = "Chưa đọc được sơ đồ online. Hãy chạy supabase-seat-plan.sql một lần trong Supabase.";
    }
    renderSeats();
    renderSeatEditor();
    return false;
  }
}

function renderSeatEditor() {
  const el = document.getElementById("seatEditor");
  if (!el) return;
  const plan = currentSeatPlan();
  const used = new Set();
  plan.flat().filter(Boolean).forEach(n => used.add(n));
  let html = `<div class="seat-editor-grid">`;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const selected = plan[r][c] || "";
      html += `<label class="seat-editor-cell"><span>Bàn ${r+1}.${c+1}</span><select class="admin-input seat-select" data-seat-row="${r+1}" data-seat-col="${c+1}"><option value="">Chỗ trống</option>${students.map(st => `<option value="${escapeHtml(st.name)}" ${selected === st.name ? "selected" : ""}>${escapeHtml(st.stt + ". " + st.name)}</option>`).join("")}</select></label>`;
    }
  }
  html += `</div>`;
  el.innerHTML = html;
}

async function saveSeatPlan() {
  if (!supabaseReady()) return alert("Chưa kết nối Supabase.");
  const selects = [...document.querySelectorAll(".seat-select")];
  const assignments = [];
  const used = new Set();
  for (const select of selects) {
    const name = select.value.trim();
    if (!name) continue;
    if (used.has(name)) return alert("Một học sinh đang được xếp ở nhiều chỗ. Hãy kiểm tra lại sơ đồ.");
    used.add(name);
    const student = students.find(s => s.name === name);
    if (!student) return alert("Không tìm thấy học sinh: " + name);
    assignments.push({row_no:Number(select.dataset.seatRow), col_no:Number(select.dataset.seatCol), student_id:student._remoteId});
  }
  if (assignments.some(x => !x.student_id)) {
    try { await ensureRemoteStudentIds(); } catch(e) {}
    for (const item of assignments) {
      if (!item.student_id) {
        const st = students.find(s => s._remoteId && s.name === document.querySelector(`[data-seat-row="${item.row_no}"][data-seat-col="${item.col_no}"]`).value);
        item.student_id = st?._remoteId;
      }
    }
  }
  if (assignments.some(x => !x.student_id)) return alert("Không tìm thấy ID học sinh trên Supabase. Hãy đồng bộ danh sách học sinh trước.");
  const btn = document.getElementById("saveSeatBtn");
  if (btn) btn.disabled = true;
  try {
    const {error: delError} = await window.supabaseClient.from("seat_assignments").delete().gte("row_no", 1);
    if (delError) throw delError;
    if (assignments.length) {
      const {error} = await window.supabaseClient.from("seat_assignments").insert(assignments);
      if (error) throw error;
    }
    await loadRemoteSeatPlan();
    const status = document.getElementById("seatSyncStatus");
    if (status) status.textContent = "Đã lưu sơ đồ chỗ ngồi online.";
  } catch (e) {
    alert("Không lưu được sơ đồ chỗ ngồi: " + (e.message || e));
  } finally { if (btn) btn.disabled = false; }
}

async function ensureRemoteStudentIds() {
  if (!supabaseReady()) return;
  const {data, error} = await window.supabaseClient.from("students").select("id,name");
  if (error) throw error;
  const byName = new Map((data || []).map(s => [s.name, s.id]));
  students.forEach(s => { s._remoteId = byName.get(s.name) || null; });
}

function renderStudents() {
  const list = document.getElementById("studentList");
  const search = document.getElementById("studentSearch");
  const count = document.getElementById("studentCount");
  if (!list) return;

  function paint(query = "") {
    const q = query.trim().toLowerCase();
    const filtered = students.filter(s => s.name.toLowerCase().includes(q) || String(s.stt) === q);
    count.textContent = `${filtered.length} / ${students.length} học sinh`;
    list.innerHTML = filtered.map(s => `
      <button class="student-row" onclick="showStudent('${encodeURIComponent(s.name)}')">
        <span class="student-number">${String(s.stt).padStart(2,"0")}</span>
        <span class="avatar small">${escapeHtml(initials(s.name))}</span>
        <span class="student-name">${escapeHtml(s.name)}</span>
        <span class="arrow">›</span>
      </button>
    `).join("") || `<div class="empty-box">Không tìm thấy học sinh.</div>`;
  }
  search.addEventListener("input", e => paint(e.target.value));
  paint();
  showStudent(encodeURIComponent(students[0].name));
}

function showStudent(encodedName) {
  const name = decodeURIComponent(encodedName);
  const detail = document.getElementById("studentDetail");
  if (!detail) return;
  const s = studentByName(name);
  if (!s) return;

  const g = grades[name] || {};
  const gradeEntries = Object.entries(g);
  const week1 = (violations.week1 && violations.week1.items || []).filter(v => String(v).startsWith(name + ":"));

  detail.innerHTML = `
    <div class="detail-top">
      <div class="avatar detail-avatar">${escapeHtml(initials(name))}</div>
      <div><span class="eyebrow">HỌC SINH #${s.stt}</span><h2>${escapeHtml(name)}</h2><p>Thông tin học tập & nề nếp</p></div>
    </div>
    <div class="detail-section">
      <div class="section-label">📊 BẢNG ĐIỂM</div>
      ${gradeEntries.length ? `
        <div class="grade-table">
          ${gradeEntries.map(([subject, vals]) => `<div><span>${escapeHtml(subject)}</span><strong>${vals.map(escapeHtml).join(" · ")}</strong></div>`).join("")}
        </div>` : `<div class="empty-state">Chưa có dữ liệu điểm.<br><small>Cập nhật trong file <code>data.js</code>.</small></div>`}
    </div>
    <div class="detail-section">
      <div class="section-label">⚠️ VI PHẠM — TUẦN 1</div>
      ${week1.length ? `<ul class="violation-list">${week1.map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>` : `<div class="clean-state">✓ Chưa có vi phạm</div>`}
    </div>
  `;
  detail.scrollIntoView({behavior:"smooth", block:"nearest"});
}

function renderDuty() {
  const el = document.getElementById("dutyContent");
  if (!el) return;
  const list = Array.isArray(duty?.schedule) ? duty.schedule : [];
  if (!list.length) {
    el.innerHTML = `<div class="empty-hero"><div class="empty-icon">🧹</div><h2>${escapeHtml(duty?.status || "Chưa có lịch")}</h2><p>Khi có lịch mới, admin sẽ cập nhật theo từng tuần. Mỗi tuần chỉ có 1 tổ.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="duty-grid">${list.map((d,i) => `
    <article class="duty-card"><span class="duty-index">${String(i+1).padStart(2,"0")}</span><span class="eyebrow">TUẦN ${escapeHtml(d.weekLabel || "")}</span><h3>${escapeHtml(d.group)}</h3><p>${escapeHtml(d.members)}</p></article>
  `).join("")}</div>`;
}

const ADMIN_PASSWORD = "Gaynhulong2012@";
const ADMIN_EMAIL = "admin@9-27.local";
const STORAGE_KEY = "class927Data";
const ADMIN_SESSION_KEY = "927_admin";

function getAppData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return {homework, grades, violations, duty};
  try { return JSON.parse(saved); } catch(e) { return {homework, grades, violations, duty}; }
}
function saveAppData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function data() { return getAppData(); }
function applyStoredData() {
  const d = data();
  window.homework = d.homework;
  window.grades = d.grades;
  window.violations = d.violations;
  window.duty = d.duty;
}
applyStoredData();

function supabaseReady() {
  return !!window.supabaseClient;
}

async function loadRemoteData() {
  if (!supabaseReady()) return false;
  try {
    const [{ data: remoteStudents, error: studentsError }, { data: remoteScores, error: scoresError }, { data: remoteViolations, error: violationsError }, { data: remoteHomework, error: homeworkError }, { data: remoteDuty, error: dutyError }] = await Promise.all([
      window.supabaseClient.from("students").select("id,stt,name").order("stt"),
      window.supabaseClient.from("scores").select("id,student_id,subject,score,created_at").order("created_at"),
      window.supabaseClient.from("violations").select("id,student_id,violation_date,description,penalty,week_label,created_at").order("violation_date", { ascending: false, nullsFirst: false }),
      window.supabaseClient.from("homework").select("id,homework_date,subject,icon,description,created_at").order("homework_date", { ascending: false }).order("created_at", { ascending: false }),
      window.supabaseClient.from("duty_schedule").select("id,week_start,group_name,members,created_at").order("week_start", { ascending: false })
    ]);
    if (studentsError || scoresError || violationsError || homeworkError || dutyError) return false;

    const studentRows = remoteStudents || [];
    const byId = new Map(studentRows.map(s => [String(s.id), s.name]));
    const remoteGrades = {};
    (remoteScores || []).forEach(row => {
      const name = byId.get(String(row.student_id));
      if (!name) return;
      if (!remoteGrades[name]) remoteGrades[name] = {};
      if (!remoteGrades[name][row.subject]) remoteGrades[name][row.subject] = [];
      remoteGrades[name][row.subject].push(Number(row.score));
    });

    const remoteViolationsByWeek = {};
    (remoteViolations || []).forEach(row => {
      const name = byId.get(String(row.student_id));
      if (!name) return;
      const label = row.week_label || "Tuần 1";
      const key = label.toLowerCase().replace(/\s+/g, "");
      if (!remoteViolationsByWeek[key]) remoteViolationsByWeek[key] = {label, items: []};
      const date = row.violation_date ? new Date(row.violation_date + "T00:00:00").toLocaleDateString("vi-VN") : "";
      const penalty = Number(row.penalty || 0);
      const suffix = `${date ? date + " — " : ""}${row.description}${penalty ? ` (${penalty > 0 ? "+" : ""}${penalty})` : ""}`;
      remoteViolationsByWeek[key].items.push(`${name}: ${suffix}`);
    });

    // Bài tập: chỉ hiển thị 14 ngày gần nhất tính từ hôm nay.
    const cutoff = new Date();
    cutoff.setHours(0,0,0,0);
    cutoff.setDate(cutoff.getDate() - 13);
    const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}`;
    const homeworkRows = (remoteHomework || []).filter(r => r.homework_date >= cutoffISO);
    const groupedHomework = {};
    homeworkRows.forEach(row => {
      const iso = row.homework_date;
      if (!groupedHomework[iso]) groupedHomework[iso] = {iso, day:"", date:"", items:[]};
      groupedHomework[iso].items.push({id:row.id, subject:row.subject, icon:row.icon || "📚", text:row.description});
    });
    const weekday = ["Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
    window.homework = Object.values(groupedHomework).sort((a,b) => b.iso.localeCompare(a.iso)).map(day => {
      const d = new Date(day.iso + "T00:00:00");
      return {...day, day: weekday[d.getDay()], date: d.toLocaleDateString("vi-VN")};
    });
    if (!window.homework.length && !remoteHomework?.length) window.homework = homework;

    window.duty = remoteDuty?.length ? {
      status: "Đã có lịch",
      schedule: remoteDuty.map(row => {
        const d = new Date(row.week_start + "T00:00:00");
        const end = new Date(d); end.setDate(end.getDate()+6);
        return {id:row.id, weekStart:row.week_start, weekLabel:`${d.toLocaleDateString("vi-VN")} – ${end.toLocaleDateString("vi-VN")}`, group:row.group_name, members:row.members};
      })
    } : duty;

    window.grades = Object.keys(remoteGrades).length ? remoteGrades : grades;
    window.violations = Object.keys(remoteViolationsByWeek).length ? remoteViolationsByWeek : violations;
    return true;
  } catch (e) {
    console.warn("Supabase load failed:", e);
    return false;
  }
}

function refreshPublicViews() {
  if (document.getElementById("studentList")) renderStudents();
  if (document.getElementById("dutyContent")) renderDuty();
  if (document.getElementById("homeworkList")) renderHomework();
}

async function adminLogin() {
  const input = document.getElementById("adminPassword");
  const p = input ? input.value : "";
  const error = document.getElementById("adminLoginError");
  if (error) error.textContent = "";
  if (p !== ADMIN_PASSWORD) {
    if (error) error.textContent = "Mật khẩu không đúng.";
    else alert("Mật khẩu không đúng.");
    return;
  }
  if (!supabaseReady()) {
    if (error) error.textContent = "Chưa cấu hình Supabase.";
    return;
  }
  const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({email: ADMIN_EMAIL, password: p});
  if (authError || !authData?.user || authData.user.email !== ADMIN_EMAIL) {
    if (error) error.textContent = "Không thể đăng nhập ADMIN. Hãy kiểm tra tài khoản Supabase.";
    else alert("Không thể đăng nhập ADMIN. Hãy kiểm tra tài khoản Supabase.");
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  showAdmin();
}

async function adminLogout() {
  if (supabaseReady()) await window.supabaseClient.auth.signOut();
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  location.reload();
}

async function showAdmin() {
  const box = document.getElementById("loginBox");
  const panel = document.getElementById("adminPanel");
  if (box) box.style.display = "none";
  if (panel) panel.style.display = "block";
  await loadRemoteData();
  await ensureRemoteStudentIds();
  fillStudentSelects();
  const today = new Date();
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const hwDate = document.getElementById("hwDate");
  if (hwDate && !hwDate.value) hwDate.value = todayISO;
  const dutyWeekStart = document.getElementById("dutyWeekStart");
  if (dutyWeekStart && !dutyWeekStart.value) {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    dutyWeekStart.value = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  renderSeatEditor();
  await loadRemoteSeatPlan();
  await refreshAdminLists();
}

async function initAdmin() {
  applyStoredData();
  if (!supabaseReady()) return;
  const { data } = await window.supabaseClient.auth.getSession();
  const user = data?.session?.user;
  if (user?.email === ADMIN_EMAIL && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") showAdmin();
}

function fillStudentSelects() {
  ["viStudent","gradeStudent"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = students.map(s => `<option value="${escapeHtml(s.name)}">${s.stt}. ${escapeHtml(s.name)}</option>`).join("");
  });
}

function persist() { saveAppData({homework, grades, violations, duty}); }

async function getStudentIdByName(name) {
  const { data: row, error } = await window.supabaseClient.from("students").select("id").eq("name", name).single();
  if (error || !row) throw new Error("Không tìm thấy học sinh trong Supabase.");
  return row.id;
}

async function addHomework() {
  if (!supabaseReady()) return alert("Chưa kết nối Supabase.");
  const date = document.getElementById("hwDate")?.value || new Date().toISOString().slice(0,10);
  const subject = document.getElementById("hwSubject").value.trim();
  const text = document.getElementById("hwText").value.trim();
  if (!subject || !text) return alert("Hãy nhập ngày, môn và nội dung.");
  try {
    const {error} = await window.supabaseClient.from("homework").insert({homework_date:date, subject, icon:"📚", description:text});
    if (error) throw error;
    document.getElementById("hwSubject").value=""; document.getElementById("hwText").value="";
    await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
  } catch (e) { alert("Không lưu được bài tập: " + (e.message || e)); }
}

async function addViolation() {
  const student = document.getElementById("viStudent").value;
  const week = document.getElementById("viWeek").value.trim() || "Tuần 1";
  const text = document.getElementById("viText").value.trim();
  const date = document.getElementById("viDate")?.value || null;
  const penaltyRaw = document.getElementById("viPenalty")?.value.trim() || "0";
  const penalty = Number(penaltyRaw);
  if (!text) return alert("Hãy nhập nội dung vi phạm.");
  if (!Number.isFinite(penalty)) return alert("Điểm trừ không hợp lệ.");
  try {
    const studentId = await getStudentIdByName(student);
    const { error } = await window.supabaseClient.from("violations").insert({student_id: studentId, violation_date: date || null, description: text, penalty, week_label: week});
    if (error) throw error;
    document.getElementById("viText").value="";
    if (document.getElementById("viDate")) document.getElementById("viDate").value="";
    if (document.getElementById("viPenalty")) document.getElementById("viPenalty").value="";
    await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
  } catch (e) { alert("Không lưu được vi phạm: " + (e.message || e)); }
}

async function addGrade() {
  const student = document.getElementById("gradeStudent").value;
  const subject = document.getElementById("gradeSubject").value.trim();
  const value = document.getElementById("gradeValue").value.trim();
  const score = Number(value);
  if (!subject || value === "") return alert("Hãy nhập môn và điểm.");
  if (!Number.isFinite(score) || score < 0 || score > 10) return alert("Điểm phải từ 0 đến 10.");
  try {
    const studentId = await getStudentIdByName(student);
    const { error } = await window.supabaseClient.from("scores").insert({student_id: studentId, subject, score});
    if (error) throw error;
    document.getElementById("gradeValue").value="";
    await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
  } catch (e) { alert("Không lưu được điểm: " + (e.message || e)); }
}

async function addDuty() {
  if (!supabaseReady()) return alert("Chưa kết nối Supabase.");
  const weekStart = document.getElementById("dutyWeekStart")?.value;
  const group = document.getElementById("dutyGroup").value.trim();
  const members = document.getElementById("dutyMembers").value.trim();
  if (!weekStart || !group || !members) return alert("Hãy nhập đủ tuần, tổ và thành viên.");
  try {
    const {data: existing, error: findError} = await window.supabaseClient.from("duty_schedule").select("id").eq("week_start",weekStart).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const {error} = await window.supabaseClient.from("duty_schedule").update({group_name:group,members}).eq("id",existing.id);
      if (error) throw error;
    } else {
      const {error} = await window.supabaseClient.from("duty_schedule").insert({week_start:weekStart,group_name:group,members});
      if (error) throw error;
    }
    document.getElementById("dutyGroup").value=""; document.getElementById("dutyMembers").value="";
    await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
  } catch (e) { alert("Không lưu được lịch trực: " + (e.message || e)); }
}

async function refreshAdminLists() {
  const h=document.getElementById("adminHomework"), v=document.getElementById("adminViolations"), g=document.getElementById("adminGrades"), d=document.getElementById("adminDuty");
  if (h) {
    try {
      const {data: rows, error} = await window.supabaseClient.from("homework").select("id,homework_date,subject,description").order("homework_date", {ascending:false}).order("created_at", {ascending:false});
      if (error) throw error;
      h.innerHTML=(rows||[]).map(row=>`<div class="admin-item-row"><span><strong>${escapeHtml(new Date(row.homework_date+"T00:00:00").toLocaleDateString("vi-VN"))}</strong> — ${escapeHtml(row.subject)} — ${escapeHtml(row.description)}</span><span class="admin-actions"><button type="button" class="btn btn-ghost btn-small" onclick="editHomework(${row.id})">Sửa</button><button type="button" class="btn btn-ghost btn-small" onclick="deleteHomework(${row.id})">Xóa</button></span></div>`).join("") || "<em>Chưa có.</em>";
    } catch(e) { h.innerHTML="<em>Chưa kết nối được Supabase.</em>"; }
  }
  if (v || g) {
    try {
      const [{data: scoreRows, error: scoreError}, {data: violationRows, error: violationError}, {data: studentRows, error: studentError}] = await Promise.all([
        window.supabaseClient.from("scores").select("id,student_id,subject,score,created_at").order("created_at", {ascending:false}),
        window.supabaseClient.from("violations").select("id,student_id,violation_date,description,penalty,week_label,created_at").order("created_at", {ascending:false}),
        window.supabaseClient.from("students").select("id,name,stt").order("stt")
      ]);
      if (scoreError || violationError || studentError) throw (scoreError || violationError || studentError);
      const names = new Map((studentRows || []).map(s => [String(s.id), s.name]));
      if (v) v.innerHTML=(violationRows||[]).map(row=>{
        const date=row.violation_date ? new Date(row.violation_date+"T00:00:00").toLocaleDateString("vi-VN") : "Chưa ghi ngày";
        const penalty=Number(row.penalty||0);
        return `<div class="admin-item-row"><span><strong>${escapeHtml(names.get(String(row.student_id))||"?")}</strong> — ${escapeHtml(date)} — ${escapeHtml(row.description)}${penalty ? ` — ${penalty}` : ""}</span><span class="admin-actions"><button type="button" class="btn btn-ghost btn-small" onclick="editViolation(${row.id})">Sửa</button><button type="button" class="btn btn-ghost btn-small" onclick="deleteViolation(${row.id})">Xóa</button></span></div>`;
      }).join("") || "<em>Chưa có.</em>";
      if (g) g.innerHTML=(scoreRows||[]).map(row=>`<div class="admin-item-row"><span><strong>${escapeHtml(names.get(String(row.student_id))||"?")}</strong> — ${escapeHtml(row.subject)}: ${escapeHtml(row.score)}</span><span class="admin-actions"><button type="button" class="btn btn-ghost btn-small" onclick="editScore(${row.id})">Sửa</button><button type="button" class="btn btn-ghost btn-small" onclick="deleteScore(${row.id})">Xóa</button></span></div>`).join("") || "<em>Chưa có.</em>";
    } catch (e) {
      if (v) v.innerHTML = "<em>Chưa kết nối được Supabase.</em>";
      if (g) g.innerHTML = "<em>Chưa kết nối được Supabase.</em>";
    }
  }
  if(d) {
    try {
      const {data: rows, error} = await window.supabaseClient.from("duty_schedule").select("id,week_start,group_name,members").order("week_start", {ascending:false});
      if (error) throw error;
      d.innerHTML=(rows||[]).map(row=>{const ds=new Date(row.week_start+"T00:00:00"); const end=new Date(ds); end.setDate(end.getDate()+6); return `<div class="admin-item-row"><span><strong>${escapeHtml(ds.toLocaleDateString("vi-VN"))} – ${escapeHtml(end.toLocaleDateString("vi-VN"))}</strong> — ${escapeHtml(row.group_name)}: ${escapeHtml(row.members)}</span><span class="admin-actions"><button type="button" class="btn btn-ghost btn-small" onclick="editDuty(${row.id})">Sửa</button><button type="button" class="btn btn-ghost btn-small" onclick="deleteDuty(${row.id})">Xóa</button></span></div>`;}).join("") || "<em>Chưa có.</em>";
    } catch(e) { d.innerHTML="<em>Chưa kết nối được Supabase.</em>"; }
  }
}

async function editHomework(id) {
  const {data: row,error}=await window.supabaseClient.from("homework").select("id,homework_date,subject,description").eq("id",id).single();
  if(error||!row) return alert("Không tìm thấy bài tập.");
  const date=prompt("Ngày (YYYY-MM-DD):",row.homework_date); if(date===null)return;
  const subject=prompt("Môn học:",row.subject); if(subject===null)return;
  const description=prompt("Nội dung:",row.description); if(description===null)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!subject.trim()||!description.trim()) return alert("Dữ liệu không hợp lệ.");
  const {error:updateError}=await window.supabaseClient.from("homework").update({homework_date:date,subject:subject.trim(),description:description.trim()}).eq("id",id);
  if(updateError)return alert("Không sửa được bài tập: "+updateError.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function deleteHomework(id) {
  if(!confirm("Xóa bài tập này?"))return;
  const {error}=await window.supabaseClient.from("homework").delete().eq("id",id);
  if(error)return alert("Không xóa được bài tập: "+error.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function editDuty(id) {
  const {data: row,error}=await window.supabaseClient.from("duty_schedule").select("id,week_start,group_name,members").eq("id",id).single();
  if(error||!row)return alert("Không tìm thấy lịch trực.");
  const weekStart=prompt("Ngày bắt đầu tuần (YYYY-MM-DD):",row.week_start); if(weekStart===null)return;
  const group=prompt("Tổ:",row.group_name); if(group===null)return;
  const members=prompt("Thành viên:",row.members); if(members===null)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)||!group.trim()||!members.trim())return alert("Dữ liệu không hợp lệ.");
  const {error:updateError}=await window.supabaseClient.from("duty_schedule").update({week_start:weekStart,group_name:group.trim(),members:members.trim()}).eq("id",id);
  if(updateError)return alert("Không sửa được lịch trực: "+updateError.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function deleteDuty(id) {
  if(!confirm("Xóa lịch trực của tuần này?"))return;
  const {error}=await window.supabaseClient.from("duty_schedule").delete().eq("id",id);
  if(error)return alert("Không xóa được lịch trực: "+error.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function editScore(id) {
  const {data: row, error} = await window.supabaseClient.from("scores").select("id,subject,score").eq("id",id).single();
  if (error || !row) return alert("Không tìm thấy điểm.");
  const subject = prompt("Môn học:", row.subject);
  if (subject === null) return;
  const value = prompt("Điểm (0-10):", row.score);
  if (value === null) return;
  const score = Number(value);
  if (!subject.trim() || !Number.isFinite(score) || score < 0 || score > 10) return alert("Dữ liệu không hợp lệ.");
  const {error: updateError} = await window.supabaseClient.from("scores").update({subject:subject.trim(), score}).eq("id",id);
  if (updateError) return alert("Không sửa được điểm: " + updateError.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function deleteScore(id) {
  if (!confirm("Xóa điểm này?")) return;
  const {error} = await window.supabaseClient.from("scores").delete().eq("id",id);
  if (error) return alert("Không xóa được điểm: " + error.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function editViolation(id) {
  const {data: row, error} = await window.supabaseClient.from("violations").select("id,violation_date,description,penalty,week_label").eq("id",id).single();
  if (error || !row) return alert("Không tìm thấy vi phạm.");
  const description = prompt("Nội dung vi phạm:", row.description);
  if (description === null) return;
  const date = prompt("Ngày (YYYY-MM-DD), để trống nếu không có:", row.violation_date || "");
  if (date === null) return;
  const penaltyRaw = prompt("Điểm trừ:", row.penalty ?? 0);
  if (penaltyRaw === null) return;
  const penalty = Number(penaltyRaw);
  if (!description.trim() || !Number.isFinite(penalty)) return alert("Dữ liệu không hợp lệ.");
  const {error: updateError} = await window.supabaseClient.from("violations").update({description:description.trim(), violation_date:date.trim() || null, penalty}).eq("id",id);
  if (updateError) return alert("Không sửa được vi phạm: " + updateError.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function deleteViolation(id) {
  if (!confirm("Xóa vi phạm này?")) return;
  const {error} = await window.supabaseClient.from("violations").delete().eq("id",id);
  if (error) return alert("Không xóa được vi phạm: " + error.message);
  await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
}

async function migrateLegacyData() {
  const btn = document.getElementById("migrateBtn");
  const status = document.getElementById("syncStatus");
  if (btn) btn.disabled = true;
  if (status) status.textContent = "Đang đồng bộ...";
  try {
    const {data: remoteStudents, error: studentError} = await window.supabaseClient.from("students").select("id,name,stt").order("stt");
    if (studentError) throw studentError;
    const byName = new Map((remoteStudents || []).map(s => [s.name, s.id]));
    let scoreCount = 0, violationCount = 0, homeworkCount = 0, dutyCount = 0;
    const scoreRows = [];
    Object.entries(grades || {}).forEach(([name, subjects]) => {
      const studentId = byName.get(name);
      if (!studentId) return;
      Object.entries(subjects || {}).forEach(([subject, vals]) => (vals || []).forEach(score => scoreRows.push({student_id:studentId, subject, score:Number(score)})));
    });
    if (scoreRows.length) {
      const {error} = await window.supabaseClient.from("scores").insert(scoreRows);
      if (error) throw error;
      scoreCount = scoreRows.length;
    }
    const violationRows = [];
    Object.values(violations || {}).forEach(group => {
      const week = group.label || "Tuần 1";
      (group.items || []).forEach(item => {
        const match = String(item).match(/^([^:]+):\s*(.*)$/);
        if (!match) return;
        const studentId = byName.get(match[1].trim());
        if (!studentId) return;
        violationRows.push({student_id:studentId, description:match[2].trim(), penalty:0, week_label:week, violation_date:null});
      });
    });
    if (violationRows.length) {
      const {error} = await window.supabaseClient.from("violations").insert(violationRows);
      if (error) throw error;
      violationCount = violationRows.length;
    }
    const homeworkRows = [];
    (homework || []).forEach(day => {
      let date = null;
      const raw = String(day.date || "");
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw;
      else if (raw === "Hôm nay" || raw === "Hôm Nay") date = new Date().toISOString().slice(0,10);
      if (!date) return;
      (day.items || []).forEach(item => homeworkRows.push({homework_date:date, subject:String(item.subject || "").trim(), icon:item.icon || "📚", description:String(item.text || "").trim()}));
    });
    const validHomework = homeworkRows.filter(r => r.subject && r.description);
    if (validHomework.length) {
      const {error} = await window.supabaseClient.from("homework").insert(validHomework);
      if (error) throw error;
      homeworkCount = validHomework.length;
    }
    const dutyRows = (duty?.schedule || []).map(x => {
      const raw = String(x.weekStart || x.week_start || "");
      return /^\d{4}-\d{2}-\d{2}$/.test(raw) && x.group && x.members ? {week_start:raw, group_name:String(x.group).trim(), members:String(x.members).trim()} : null;
    }).filter(Boolean);
    if (dutyRows.length) {
      const {error} = await window.supabaseClient.from("duty_schedule").upsert(dutyRows, {onConflict:"week_start"});
      if (error) throw error;
      dutyCount = dutyRows.length;
    }
    localStorage.setItem("927_legacy_migrated", "1");
    await loadRemoteData(); await refreshAdminLists(); refreshPublicViews();
    if (status) status.textContent = `Đồng bộ xong: ${remoteStudents?.length || 0} học sinh, ${scoreCount} điểm, ${violationCount} vi phạm, ${homeworkCount} bài tập, ${dutyCount} tuần trực.`;
  } catch (e) {
    if (status) status.textContent = "Đồng bộ thất bại.";
    alert("Không đồng bộ được dữ liệu: " + (e.message || e));
  } finally { if (btn) btn.disabled = false; }
}

function resetClassData() {
  if (!confirm("Khôi phục dữ liệu ban đầu trên thiết bị này? Dữ liệu Supabase online sẽ KHÔNG bị xóa.")) return;
  localStorage.removeItem(STORAGE_KEY); location.reload();
}

// Public pages start from data.js, then transparently replace scores/violations with online data.
loadRemoteData().then(async () => { await loadRemoteSeatPlan(); refreshPublicViews(); });
