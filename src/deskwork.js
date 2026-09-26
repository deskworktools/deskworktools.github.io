// ==============================================================================
// Deskwork Tools - Complete Client-Side Utilities Engine
// 100% Private, Client-Side Browser Processing with IndexedDB & LocalStorage
// ==============================================================================

// ---- Safe Media IndexedDB Store ----
const DeskworkDB = {
  dbName: "deskwork_tools_media_db",
  storeName: "media",
  _db: null,
  async getDB() {
    if (this._db) return this._db;
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        req.onsuccess = (e) => {
          this._db = e.target.result;
          resolve(this._db);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  },
  async get(key) {
    const db = await this.getDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, "readonly");
        const req = tx.objectStore(this.storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  },
  async set(key, val) {
    const db = await this.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).put(val, key);
    } catch (err) {
      console.warn("DeskworkDB set error", err);
    }
  },
  async remove(key) {
    const db = await this.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).delete(key);
    } catch (err) {}
  },
  async clear() {
    const db = await this.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).clear();
    } catch (err) {}
  }
};

// Top-Level State Variables
let photoDataUrl = null;
let signatureDataUrl = null;
let jpPhotoDataUrl = null;
let bwCoverDataUrl = null;
let toastTimer = null;
let resumeTemplate = 'classic';

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function syncResumePhotoUI() {
  const thumbWrap = document.getElementById('r-photo-thumb-wrap');
  const thumbImg = document.getElementById('r-photo-thumb');
  const promptWrap = document.getElementById('r-photo-prompt');
  const removeBtn = document.getElementById('btn-remove-r-photo');
  if (photoDataUrl) {
    if (thumbWrap) thumbWrap.style.display = 'flex';
    if (thumbImg) thumbImg.src = photoDataUrl;
    if (promptWrap) promptWrap.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    if (thumbWrap) thumbWrap.style.display = 'none';
    if (thumbImg) thumbImg.src = '';
    if (promptWrap) promptWrap.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

function removeResumePhoto() {
  photoDataUrl = null;
  DeskworkDB.remove("photoDataUrl");
  const input = document.getElementById("r-photo");
  if (input) input.value = "";
  syncResumePhotoUI();
  renderAll();
}

function syncResumeSigUI() {
  const thumbWrap = document.getElementById('r-sig-thumb-wrap');
  const thumbImg = document.getElementById('r-sig-thumb');
  const promptWrap = document.getElementById('r-sig-prompt');
  const removeBtn = document.getElementById('btn-remove-r-sig');
  if (signatureDataUrl) {
    if (thumbWrap) thumbWrap.style.display = 'flex';
    if (thumbImg) thumbImg.src = signatureDataUrl;
    if (promptWrap) promptWrap.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    if (thumbWrap) thumbWrap.style.display = 'none';
    if (thumbImg) thumbImg.src = '';
    if (promptWrap) promptWrap.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

function removeResumeSig() {
  signatureDataUrl = null;
  DeskworkDB.remove("signatureDataUrl");
  const input = document.getElementById("r-signature");
  if (input) input.value = "";
  syncResumeSigUI();
  saveDataImmediate();
  renderAll();
}

function setExpDescMode(btn, mode) {
  const block = btn.closest('.repeat-block');
  if (!block) return;
  const textarea = block.querySelector('.exp-desc');
  const pills = block.querySelectorAll('.desc-mode-group .btn-mode-pill');
  pills.forEach(p => p.classList.toggle('active', p.dataset.mode === mode));
  if (textarea) {
    textarea.dataset.mode = mode;
    textarea.placeholder = mode === 'list'
      ? 'Enter one bullet point per line (e.g. Prepared technical drawings)'
      : 'What did you do / achieve? (Paragraph summary)';
  }
  renderPreview();
  saveDataImmediate();
}

function setStrengthsMode(mode) {
  const ta = document.getElementById('r-strengths');
  const btnSummary = document.getElementById('btn-strengths-mode-summary');
  const btnList = document.getElementById('btn-strengths-mode-list');
  if (btnSummary) btnSummary.classList.toggle('active', mode === 'summary');
  if (btnList) btnList.classList.toggle('active', mode === 'list');
  if (ta) {
    ta.dataset.mode = mode;
    ta.placeholder = mode === 'summary'
      ? 'Strong communication and teamwork skills with the ability to adapt quickly to new working environments.'
      : 'Ability to work under pressure\nSelf-motivated and goal-driven\nHabituated with teamwork';
  }
  renderPreview();
  saveDataImmediate();
}

let skillsDisplayMode = 'list';

function setSkillsDisplayMode(mode) {
  skillsDisplayMode = (mode === 'summary') ? 'summary' : 'list';
  const btnSummary = document.getElementById('btn-skills-mode-summary');
  const btnList = document.getElementById('btn-skills-mode-list');
  if (btnSummary) btnSummary.classList.toggle('active', skillsDisplayMode === 'summary');
  if (btnList) btnList.classList.toggle('active', skillsDisplayMode === 'list');
  const skillsInput = document.getElementById('r-skills');
  if (skillsInput) skillsInput.dataset.skillsMode = skillsDisplayMode;
  renderPreview();
  saveDataImmediate();
}

function removeJapanPhoto() {
  jpPhotoDataUrl = null;
  DeskworkDB.remove("jpPhotoDataUrl");
  const input = document.getElementById("jp-photo");
  if (input) input.value = "";
  const btn = document.getElementById("btn-remove-jp-photo");
  if (btn) btn.style.display = "none";
  renderJapan();
}

function confirmResetResume() {
  if (confirm("Are you sure you want to reset your resume? This will clear all entered details and remove saved drafts. This action cannot be undone.")) {
    try { localStorage.removeItem("deskwork_draft_v1"); } catch(e){}
    removeResumePhoto();
    removeResumeSig();
    const inputs = document.querySelectorAll("#resume input, #resume textarea, #resume select");
    inputs.forEach(el => {
      if (el.type === "checkbox" || el.type === "radio") el.checked = false;
      else if (el.tagName === "SELECT") el.selectedIndex = 0;
      else if (el.type !== "file") el.value = "";
    });
    const expList = document.getElementById("exp-list");
    if (expList) expList.innerHTML = "";
    const eduList = document.getElementById("edu-list");
    if (eduList) eduList.innerHTML = "";
    renderAll();
    showToast("Resume form has been reset.");
  }
}

function confirmResetJapan() {
  if (confirm("Are you sure you want to reset the Japanese Rirekisho form? All entered information will be cleared.")) {
    removeJapanPhoto();
    const inputs = document.querySelectorAll("#japan input, #japan textarea, #japan select");
    inputs.forEach(el => {
      if (el.type === "checkbox" || el.type === "radio") el.checked = false;
      else if (el.tagName === "SELECT") el.selectedIndex = 0;
      else if (el.type !== "file") el.value = "";
    });
    const eduList = document.getElementById('jp-edu-list');
    if (eduList) eduList.innerHTML = "";
    const workList = document.getElementById('jp-work-list');
    if (workList) workList.innerHTML = "";
    const famList = document.getElementById('jp-family-list');
    if (famList) famList.innerHTML = "";
    const certList = document.getElementById('jp-lang-cert-list');
    if (certList) certList.innerHTML = "";
    renderJapan();
    showToast("Japanese Rirekisho form has been reset.");
  }
}

// ---- Tabs ----
function switchDeskworkTab(panelId) {
  const btn = document.querySelector(`.tab-btn[data-panel="${panelId}"]`);
  const panel = document.getElementById(panelId);
  if (btn && panel) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    panel.classList.add('active');
    updateFieldVisibility();
  }
}

function handleDeskworkHashNavigation() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  const target = document.getElementById(hash);
  if (target) {
    const panel = target.closest('.panel');
    if (panel) {
      switchDeskworkTab(panel.id);
    }
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
}

// ---- Resume builder dynamic repeatable rows ----
let expCount = 0, eduCount = 0;

function addExp() {
  expCount++;
  const id = 'exp' + expCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <div class="row2">
      <div><label>Role</label><input type="text" class="exp-role" oninput="renderPreview()" placeholder="Software Engineer"></div>
      <div><label>Company</label><input type="text" class="exp-company" oninput="renderPreview()" placeholder="Acme Inc."></div>
    </div>
    <div class="row2">
      <div><label>Dates</label><input type="text" class="exp-dates" oninput="renderPreview()" placeholder="2022 - Present"></div>
      <div><label>Location</label><input type="text" class="exp-loc" oninput="renderPreview()" placeholder="Remote"></div>
    </div>
    <div class="exp-desc-header" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;margin-bottom:4px;">
      <label style="margin:0;font-size:0.82rem;font-weight:600;">Description</label>
      <div class="desc-mode-group" style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;">
        <span style="color:var(--ink-soft);font-size:0.72rem;margin-right:2px;">Format:</span>
        <button type="button" class="btn-mode-pill active" data-mode="summary" onclick="setExpDescMode(this, 'summary')">Summary</button>
        <button type="button" class="btn-mode-pill" data-mode="list" onclick="setExpDescMode(this, 'list')">List</button>
      </div>
    </div>
    <textarea class="exp-desc" data-mode="summary" oninput="renderPreview()" placeholder="What did you do / achieve?"></textarea>
  `;
  const list = document.getElementById('exp-list');
  if (list) list.appendChild(div);
}

function addEdu() {
  eduCount++;
  const id = 'edu' + eduCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <div class="row2">
      <div><label>Degree</label><input type="text" class="edu-degree" oninput="renderPreview()" placeholder="B.Sc. Computer Science"></div>
      <div><label>Institution</label><input type="text" class="edu-inst" oninput="renderPreview()" placeholder="State University"></div>
    </div>
    <label>Dates</label>
    <input type="text" class="edu-dates" oninput="renderPreview()" placeholder="2020 - 2024">
    <div class="row2">
      <div><label>Scale</label>
        <select class="edu-scale" onchange="onEduScaleChange(this)">
          <option value="5">GPA (out of 5.00)</option>
          <option value="4">CGPA (out of 4.00)</option>
        </select>
      </div>
      <div><label>Result</label><input type="number" class="edu-gpa" min="0" max="5" step="0.01" placeholder="e.g. 4.83" oninput="onEduGpaInput(this)"></div>
    </div>
    <div class="edu-extra-fields">
      <div class="edu-class-field">
        <label>Class/Division <span style="font-weight:400;color:var(--ink-soft);">(optional - e.g. "1st Class", used by Bangladesh Classic template)</span></label>
        <input type="text" class="edu-class" oninput="renderPreview()" placeholder="1st Class">
      </div>
      <div class="row2 edu-group-board-row" style="margin-top:14px;">
        <div class="edu-group-field"><label>Group/Major <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label><input type="text" class="edu-group" oninput="renderPreview()" placeholder="Science"></div>
        <div class="edu-board-field"><label>Board <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label><input type="text" class="edu-board" oninput="renderPreview()" placeholder="Dhaka"></div>
      </div>
      <div class="edu-note-field" style="margin-top:14px;">
        <label>Achievement/Note <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label>
        <input type="text" class="edu-note" oninput="renderPreview()" placeholder="Thesis on rural distribution reach">
      </div>
    </div>
    <div class="edu-loc-field">
      <label>Institution Location <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label>
      <input type="text" class="edu-loc" oninput="renderPreview()" placeholder="Sydney, NSW">
    </div>
  `;
  const list = document.getElementById('edu-list');
  if (list) list.appendChild(div);
  updateFieldVisibility();
}

let jpEduCount = 0, jpWorkCount = 0, jpFamilyCount = 0, jpLangCertCount = 0;

function addJpEdu() {
  jpEduCount++;
  const id = 'jpedu' + jpEduCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderJapan();">remove</button>
    <div class="row2">
      <div><label>Start year</label><input type="text" class="jp-edu-start" oninput="renderJapan()" placeholder="2018"></div>
      <div><label>End year</label><input type="text" class="jp-edu-end" oninput="renderJapan()" placeholder="2020"></div>
    </div>
    <label>School name</label>
    <input type="text" class="jp-edu-school" oninput="renderJapan()" placeholder="High School / College">
    <div class="row2">
      <div><label>Specialty</label><input type="text" class="jp-edu-specialty" oninput="renderJapan()" placeholder="Science"></div>
      <div><label>License/Qualification</label><input type="text" class="jp-edu-license" oninput="renderJapan()" placeholder="SSC"></div>
    </div>
    <label>Result <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label>
    <div class="row2">
      <div><input type="text" class="jp-edu-result" oninput="renderJapan()" placeholder="e.g. 3.62"></div>
      <div><select class="jp-edu-result-scale" onchange="renderJapan()">
        <option value="4">Out of CGPA 4.00</option>
        <option value="5">Out of GPA 5.00</option>
        <option value="running">Running (not finished yet)</option>
      </select></div>
    </div>
  `;
  const list = document.getElementById('jp-edu-list');
  if (list) list.appendChild(div);
}

function addJpLangCert() {
  jpLangCertCount++;
  const id = 'jplangcert' + jpLangCertCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderJapan();">remove</button>
    <label>Test</label>
    <select class="jp-langcert-test" onchange="renderJapan()">
      <option value="JLPT N5">JLPT N5</option>
      <option value="JLPT N4">JLPT N4</option>
      <option value="JLPT N3">JLPT N3</option>
      <option value="JLPT N2">JLPT N2</option>
      <option value="JLPT N1">JLPT N1</option>
      <option value="JFT-Basic">JFT-Basic</option>
      <option value="JPT Test">JPT Test</option>
      <option value="NAT Test">NAT Test</option>
      <option value="J-Test">J-Test</option>
    </select>
    <label>Result <span style="font-weight:400;color:var(--ink-soft);">(optional)</span></label>
    <div class="row2">
      <div><input type="text" class="jp-langcert-value" oninput="renderJapan()" placeholder="e.g. 250"></div>
      <div><input type="text" class="jp-langcert-max" oninput="renderJapan()" placeholder="out of e.g. 300"></div>
    </div>
  `;
  const list = document.getElementById('jp-lang-cert-list');
  if (list) list.appendChild(div);
}

function addJpWork() {
  jpWorkCount++;
  const id = 'jpwork' + jpWorkCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderJapan();">remove</button>
    <div class="row2">
      <div><label>Start year</label><input type="text" class="jp-work-start" oninput="renderJapan()" placeholder="2025"></div>
      <div><label>End year</label><input type="text" class="jp-work-end" oninput="renderJapan()" placeholder="2026 or Running"></div>
    </div>
    <label>Company name</label>
    <input type="text" class="jp-work-company" oninput="renderJapan()" placeholder="Company / Hospital">
    <label>Role / Duties</label>
    <input type="text" class="jp-work-role" oninput="renderJapan()" placeholder="Reception duties">
  `;
  const list = document.getElementById('jp-work-list');
  if (list) list.appendChild(div);
}

function addJpFamily() {
  jpFamilyCount++;
  const id = 'jpfam' + jpFamilyCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderJapan();">remove</button>
    <div class="row2">
      <div><label>Name</label><input type="text" class="jp-fam-name" oninput="renderJapan()" placeholder="Name"></div>
      <div><label>Relationship</label><input type="text" class="jp-fam-relation" oninput="renderJapan()" placeholder="Father"></div>
    </div>
    <div class="row2">
      <div><label>Age</label><input type="text" class="jp-fam-age" oninput="renderJapan()" placeholder="58"></div>
      <div><label>Occupation</label><input type="text" class="jp-fam-occupation" oninput="renderJapan()" placeholder="Retired"></div>
    </div>
    <label>Living together?</label>
    <select class="jp-fam-living" onchange="renderJapan()"><option value="Yes">Yes</option><option value="No">No</option></select>
  `;
  const list = document.getElementById('jp-family-list');
  if (list) list.appendChild(div);
}

function normalizeEuropassLangLevel(val) {
  if (!val) return 'Good';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (/^(5|5\/5|100%|native|fluent|bilingual|c2|c1|mastery|proficient|excellent)$/i.test(lower)) return 'Excellent';
  if (/^(4|4\/5|80%|advanced|very\s*good|b2|upper[- ]intermediate)$/i.test(lower)) return 'Very Good';
  if (/^(3|3\/5|60%|intermediate|good|b1|working|professional)$/i.test(lower)) return 'Good';
  if (/^(2|2\/5|40%|fair|conversational|a2|elementary|limited)$/i.test(lower)) return 'Fair';
  if (/^(1|1\/5|20%|basic|beginner|a1|fundamental|novice)$/i.test(lower)) return 'Basic';
  const exact = ['Excellent', 'Very Good', 'Good', 'Fair', 'Basic'].find(l => l.toLowerCase() === lower);
  if (exact) return exact;
  return 'Good';
}

let langCount = 0;
function addLangRow() {
  langCount++;
  const id = 'lang' + langCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  const levelOpts = '<option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Fair">Fair</option><option value="Beginner">Beginner</option>';
  const epLevelOpts = '<option value="Excellent">Excellent</option><option value="Very Good">Very Good</option><option value="Good" selected>Good</option><option value="Fair">Fair</option><option value="Basic">Basic</option>';
  const isEp = typeof resumeTemplate !== 'undefined' && resumeTemplate === 'europass';
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <label>Language</label>
    <input type="text" class="lang-name" oninput="renderPreview()" placeholder="English">
    <div class="lang-ep-level-wrap" style="margin-top:6px;${isEp ? '' : 'display:none;'}">
      <label>Proficiency / Level</label>
      <select class="lang-level-ep" onchange="renderPreview()">${epLevelOpts}</select>
    </div>
    <div class="lang-standard-details" style="${isEp ? 'display:none;' : ''}">
      <div class="row2">
        <div><label>Reading</label><select class="lang-reading" onchange="renderPreview()">${levelOpts}</select></div>
        <div><label>Writing</label><select class="lang-writing" onchange="renderPreview()">${levelOpts}</select></div>
      </div>
      <label>Speaking</label>
      <select class="lang-speaking" onchange="renderPreview()">${levelOpts}</select>
    </div>
  `;
  const list = document.getElementById('lang-list');
  if (list) list.appendChild(div);
}

let pubCount = 0, confCount = 0;
function addPubRow() {
  pubCount++;
  const id = 'pub' + pubCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <label>Publication title</label>
    <input type="text" class="pub-title" oninput="renderPreview()" placeholder="Title of the paper">
    <div class="row2">
      <div><label>Journal/Venue</label><input type="text" class="pub-venue" oninput="renderPreview()" placeholder="Journal name"></div>
      <div><label>Year</label><input type="text" class="pub-year" oninput="renderPreview()" placeholder="2024"></div>
    </div>
  `;
  const list = document.getElementById('pub-list');
  if (list) list.appendChild(div);
}

function addConfRow() {
  confCount++;
  const id = 'conf' + confCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <label>Presentation/Talk title</label>
    <input type="text" class="conf-title" oninput="renderPreview()" placeholder="Title of talk">
    <div class="row2">
      <div><label>Conference</label><input type="text" class="conf-venue" oninput="renderPreview()" placeholder="Conference name"></div>
      <div><label>Year</label><input type="text" class="conf-year" oninput="renderPreview()" placeholder="2024"></div>
    </div>
  `;
  const list = document.getElementById('conf-list');
  if (list) list.appendChild(div);
}

let swSkillCount = 0, gulfLangCount = 0;
function levelSelectOptions() {
  return '<option value="6">6/6</option><option value="5">5/6</option><option value="4">4/6</option><option value="3">3/6</option><option value="2">2/6</option><option value="1">1/6</option>';
}

function addSwSkillRow() {
  swSkillCount++;
  const id = 'swskill' + swSkillCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <div class="row2">
      <div><label>Skill</label><input type="text" class="sw-name" oninput="renderPreview()" placeholder="Microsoft Word"></div>
      <div><label>Level</label><select class="sw-level" onchange="renderPreview()">${levelSelectOptions()}</select></div>
    </div>
  `;
  const list = document.getElementById('sw-skill-list');
  if (list) list.appendChild(div);
}

function addGulfLangRow() {
  gulfLangCount++;
  const id = 'gulflang' + gulfLangCount;
  const div = document.createElement('div');
  div.className = 'repeat-block';
  div.id = id;
  div.innerHTML = `
    <button type="button" class="remove" onclick="document.getElementById('${id}').remove();renderPreview();">remove</button>
    <div class="row2">
      <div><label>Language</label><input type="text" class="glang-name" oninput="renderPreview()" placeholder="English"></div>
      <div><label>Level</label><select class="glang-level" onchange="renderPreview()">${levelSelectOptions()}</select></div>
    </div>
  `;
  const list = document.getElementById('gulf-lang-list');
  if (list) list.appendChild(div);
}

function onEduScaleChange(sel) {
  const block = sel.closest('.repeat-block');
  if (!block) return;
  const gpaInput = block.querySelector('.edu-gpa');
  const max = parseFloat(sel.value);
  if (gpaInput) {
    gpaInput.max = sel.value;
    gpaInput.placeholder = sel.value === '4' ? 'e.g. 3.75' : 'e.g. 4.83';
    if (gpaInput.value && parseFloat(gpaInput.value) > max) {
      gpaInput.value = max.toFixed(2);
      showToast(`Adjusted - max for this scale is ${max.toFixed(2)}.`);
    }
  }
  renderPreview();
}

function onEduGpaInput(inp) {
  const max = parseFloat(inp.max) || 5;
  const v = parseFloat(inp.value);
  if (!isNaN(v) && v > max) {
    inp.value = max.toFixed(2);
    showToast(`Max for this scale is ${max.toFixed(2)}.`);
  }
  renderPreview();
}

const templateInfoMap = {
  classic: 'Clean, traditional single-column layout suitable for all industries. High ATS compatibility.',
  modern: 'Contemporary layout with dark accent header and structured sections.',
  compact: 'Dense, streamlined single-column format maximizing content density for ATS scanning.',
  intl: 'Two-column international design with profile photo, progress bars for skills, and rating dots for languages.',
  bd: 'Official Bangladesh format with passport photo box, detailed personal information, and academic board/division records.',
  bd2: 'Bangladesh Classic format with gray section dividers, per-degree credentials, language table, and signed declaration.',
  sidebar: 'Clean two-column layout featuring dark left sidebar with photo and contact details.',
  europass: 'Standard European Union Europass layout with navy blue header, CEFR language levels, and digital competence.',
  gulf: 'Middle East / Gulf format with navy header bar, passport and visa details, skill rating meters, and certified courses.',
  academic: 'Curriculum Vitae (CV) format optimized for researchers, scholars, and professors, with publications and conferences.'
};

function setTemplate(t) {
  resumeTemplate = t;
  document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.toggle('active', b.dataset.tmpl === t));
  const banner = document.getElementById('tmpl-info-banner');
  if (banner && templateInfoMap[t]) {
    banner.innerHTML = `<strong>${esc(t.toUpperCase())}:</strong> ${esc(templateInfoMap[t])}`;
  }
  updateFieldVisibility();
  renderPreview();
}

function updateFieldVisibility() {
  const relevantMap = {
    'bd-fields-section': ['bd', 'bd2'],
    'gulf-fields-section': ['gulf'],
    'skills-langs-hobbies-section': ['gulf', 'intl'],
    'academic-fields-section': ['academic'],
    'langskills-section': ['bd2', 'europass'],
    'training-section': ['bd', 'gulf', 'compact', 'modern'],
    'signature-section': ['bd2'],
    'photo-section': ['intl', 'bd', 'bd2', 'gulf', 'sidebar', 'europass'],
    'dob-nat-section': ['bd', 'bd2', 'gulf'],
    'languages-section': ['compact', 'sidebar', 'academic'],
    'skills-section': ['classic', 'modern', 'compact', 'sidebar', 'bd', 'bd2', 'academic', 'gulf']
  };
  const japanPanel = document.getElementById('japan');
  const japanTabActive = Boolean(japanPanel && japanPanel.classList.contains('active'));
  const japanDependent = ['bd-fields-section'];

  Object.keys(relevantMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const shouldShow = relevantMap[id].includes(resumeTemplate) || (japanDependent.includes(id) && japanTabActive);
    el.style.display = shouldShow ? '' : 'none';
  });

  const skillsDisplayOpt = document.getElementById('skills-display-option');
  if (skillsDisplayOpt) {
    skillsDisplayOpt.style.display = (resumeTemplate === 'compact' || resumeTemplate === 'modern') ? 'inline-flex' : 'none';
  }

  // LinkedIn field: visible for modern and others, hidden for classic and bd
  const linkedinSec = document.getElementById('linkedin-field-section');
  if (linkedinSec) {
    linkedinSec.style.display = (resumeTemplate === 'classic' || resumeTemplate === 'bd') ? 'none' : '';
  }

  // Summary label customization for Classic (About Me)
  const summaryLbl = document.querySelector('label[for="r-summary"]');
  if (summaryLbl) {
    summaryLbl.textContent = resumeTemplate === 'classic' ? 'Summary / About Me' : 'Summary';
  }

  // International template specific exclusion: exclude ONLY the duplicate plain-text skills & languages fields
  if (resumeTemplate === 'intl') {
    const intlExcludedIds = [
      'languages-section',
      'skills-section',
      'langskills-section'
    ];
    intlExcludedIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Ensure the original rated skills & languages section with proficiency bars is displayed
    const ratedSec = document.getElementById('skills-langs-hobbies-section');
    if (ratedSec) ratedSec.style.display = '';
  }

  // Professional Title: removed from Bangladesh Standard, Europass / EU template, Sidebar template, and Bangladesh Classic; kept for Gulf and others
  const titleSec = document.getElementById('title-field-section');
  if (titleSec) {
    titleSec.style.display = (resumeTemplate === 'bd' || resumeTemplate === 'europass' || resumeTemplate === 'sidebar' || resumeTemplate === 'bd2') ? 'none' : '';
  }

  // Europass / EU template specific form customizations
  const isEp = resumeTemplate === 'europass';
  const langSkillsSec = document.getElementById('langskills-section');
  if (langSkillsSec) {
    langSkillsSec.classList.toggle('tmpl-europass-mode', isEp);
  }
  const langSkillsHeading = document.getElementById('langskills-section-heading');
  if (langSkillsHeading) {
    langSkillsHeading.innerHTML = isEp
      ? `Languages, Digital Competence &amp; Skills <span style="font-weight:400;font-size:.8rem;color:var(--ink-soft);">(Europass / EU Format)</span>`
      : `Language Proficiency, Computing &amp; Strengths <span style="font-weight:400;font-size:.8rem;color:var(--ink-soft);">(optional — used by Bangladesh Classic and Europass templates)</span>`;
  }
  const langSkillsDesc = document.getElementById('langskills-desc');
  if (langSkillsDesc) {
    langSkillsDesc.textContent = isEp
      ? 'Add languages and select proficiency level (e.g. English — Excellent).'
      : 'Rate each language you speak.';
  }

  // Toggle Europass vs standard language controls within repeat blocks
  document.querySelectorAll('#lang-list .lang-ep-level-wrap').forEach(el => {
    el.style.display = isEp ? '' : 'none';
  });
  document.querySelectorAll('#lang-list .lang-standard-details').forEach(el => {
    el.style.display = isEp ? 'none' : '';
  });

  const strengthsLbl = document.getElementById('lbl-strengths');
  const strengthsEl = document.getElementById('r-strengths');
  const strengthsHint = document.getElementById('strengths-hint');
  if (strengthsLbl) {
    strengthsLbl.innerHTML = isEp
      ? `Skills / Capabilities <span style="font-weight:400;color:var(--ink-soft);">(enter ONE skill per line — becomes a bullet list)</span>`
      : `Capabilities / Strengths <span style="font-weight:400;color:var(--ink-soft);">(one per line — becomes a bullet list)</span>`;
  }
  if (strengthsEl) {
    if (isEp) {
      strengthsEl.placeholder = 'Marketing\nWebsite Development\nAutoCAD\nComputer Programming\nCommunication';
      strengthsEl.style.minHeight = '130px';
      strengthsEl.style.lineHeight = '1.6';
    } else {
      strengthsEl.placeholder = 'Ability to work under pressure\nSelf-motivated and goal-driven\nHabituated with teamwork';
      strengthsEl.style.minHeight = '';
      strengthsEl.style.lineHeight = '';
    }
  }
  if (strengthsHint) {
    strengthsHint.style.display = isEp ? 'block' : 'none';
  }

  // Handle existing or newly created education extra fields
  document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
    const groupInput = b.querySelector('.edu-group');
    if (groupInput && !groupInput.parentElement.classList.contains('edu-group-field')) {
      groupInput.parentElement.classList.add('edu-group-field');
    }
    const boardInput = b.querySelector('.edu-board');
    if (boardInput && !boardInput.parentElement.classList.contains('edu-board-field')) {
      boardInput.parentElement.classList.add('edu-board-field');
    }
    const noteInput = b.querySelector('.edu-note');
    if (noteInput && !noteInput.closest('.edu-note-field')) {
      const prevLabel = noteInput.previousElementSibling;
      const wrap = document.createElement('div');
      wrap.className = 'edu-note-field';
      wrap.style.marginTop = '14px';
      noteInput.parentNode.insertBefore(wrap, prevLabel && prevLabel.tagName === 'LABEL' ? prevLabel : noteInput);
      if (prevLabel && prevLabel.tagName === 'LABEL') wrap.appendChild(prevLabel);
      wrap.appendChild(noteInput);
    }
  });

  const eduExtraShow = ['bd', 'bd2', 'classic'].includes(resumeTemplate);
  document.querySelectorAll('.edu-extra-fields').forEach(el => { el.style.display = eduExtraShow ? '' : 'none'; });
  const eduClassShow = resumeTemplate === 'bd2';
  document.querySelectorAll('.edu-class-field').forEach(el => { el.style.display = eduClassShow ? '' : 'none'; });
  const eduBoardShow = ['bd', 'bd2'].includes(resumeTemplate);
  document.querySelectorAll('.edu-board-field').forEach(el => { el.style.display = eduBoardShow ? '' : 'none'; });
  const eduGroupShow = ['bd', 'bd2', 'classic'].includes(resumeTemplate);
  document.querySelectorAll('.edu-group-field').forEach(el => {
    el.style.display = eduGroupShow ? '' : 'none';
    el.style.gridColumn = resumeTemplate === 'classic' ? '1 / -1' : '';
  });
  const eduNoteShow = ['bd', 'bd2', 'classic'].includes(resumeTemplate);
  document.querySelectorAll('.edu-note-field').forEach(el => { el.style.display = eduNoteShow ? '' : 'none'; });
  const eduLocShow = resumeTemplate === 'compact' || resumeTemplate === 'europass' || resumeTemplate === 'modern';
  document.querySelectorAll('.edu-loc-field').forEach(el => { el.style.display = eduLocShow ? '' : 'none'; });
}

function renderAll() {
  renderPreview();
  renderJapan();
}

function renderPreview(targetEl, tmplKey) {
  const preview = targetEl || document.getElementById('preview');
  if (!preview) return;

  const currentTmpl = tmplKey || (typeof resumeTemplate !== 'undefined' ? resumeTemplate : 'classic');

  const name = val('r-name') || 'Your Name';
  const email = val('r-email'), phone = val('r-phone'), loc = val('r-location');
  const contact = [email, phone, loc].filter(Boolean).join(' • ');
  const summary = val('r-summary');
  const skills = val('r-skills');

  let expHtml = '';
  document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
    const role = b.querySelector('.exp-role')?.value || '';
    const company = b.querySelector('.exp-company')?.value || '';
    const dates = b.querySelector('.exp-dates')?.value || '';
    const locv = b.querySelector('.exp-loc')?.value || '';
    const desc = b.querySelector('.exp-desc')?.value || '';
    if (!role && !company) return;
    expHtml += `<div class="entry"><div class="top"><span>${esc(role)}${company ? ' - ' + esc(company) : ''}</span><span>${esc(dates)}</span></div>
      <div class="sub">${esc(locv)}</div><p>${esc(desc)}</p></div>`;
  });

  let eduHtml = '';
  document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
    const degree = b.querySelector('.edu-degree')?.value || '';
    const inst = b.querySelector('.edu-inst')?.value || '';
    const dates = b.querySelector('.edu-dates')?.value || '';
    const gpa = b.querySelector('.edu-gpa')?.value || '';
    const scale = b.querySelector('.edu-scale')?.value || '5';
    const classDiv = b.querySelector('.edu-class')?.value || '';
    if (!degree && !inst) return;
    let gpaLine = '';
    if (gpa) {
      const label = scale === '4' ? 'CGPA' : 'GPA';
      gpaLine = ` • ${label}: ${esc(gpa)}/${parseFloat(scale || 5).toFixed(2)}`;
      if (classDiv) gpaLine += ` (${esc(classDiv)})`;
    }
    eduHtml += `<div class="entry"><div class="top"><span>${esc(degree)}${gpaLine}</span><span>${esc(dates)}</span></div>
      <div class="sub">${esc(inst)}</div></div>`;
  });

  let bodyHtml = `<h3>${esc(name)}</h3><div class="contact">${esc(contact)}</div>`;
  if (summary) bodyHtml += `<div class="section-title">Summary</div><p>${esc(summary)}</p>`;
  if (expHtml) bodyHtml += `<div class="section-title">Experience</div>${expHtml}`;
  if (eduHtml) bodyHtml += `<div class="section-title">Education</div>${eduHtml}`;
  if (skills) bodyHtml += `<div class="section-title">Skills</div><div class="skills-list">${esc(skills)}</div>`;

  preview.className = 'resume-preview tmpl-' + currentTmpl;
  preview.style.cssText = '';

  if (currentTmpl === 'intl') {
    const linkedinI = val('r-linkedin');
    const titleI = val('r-title');
    const photoHtmlI = photoDataUrl
      ? `<img class="i2-photo" src="${photoDataUrl}" alt="${esc(name)}" width="88" height="88" style="width:88px;height:88px;min-width:88px;max-width:88px;min-height:88px;max-height:88px;border-radius:50%;object-fit:cover;border:3px solid #ffffff;display:inline-block;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : `<div class="i2-photo placeholder">Photo</div>`;

    let sideHtml = `<div class="i2-photo-wrap">${photoHtmlI}</div>`;
    sideHtml += `<div class="i2-side-heading">Contact</div>`;
    if (email) sideHtml += `<div class="i2-contact-row">✉ ${esc(email)}</div>`;
    if (phone) sideHtml += `<div class="i2-contact-row">☎ ${esc(phone)}</div>`;
    if (loc) sideHtml += `<div class="i2-contact-row">⚲ ${esc(loc)}</div>`;
    if (linkedinI) sideHtml += `<div class="i2-contact-row">in ${esc(linkedinI)}</div>`;

    let skillBars = '';
    document.querySelectorAll('#sw-skill-list .repeat-block').forEach(b => {
      const nm = b.querySelector('.sw-name')?.value || '';
      if (!nm) return;
      const lvl = parseInt(b.querySelector('.sw-level')?.value) || 0;
      const pct = Math.round(lvl / 6 * 100);
      skillBars += `<div class="i2-skill-item"><div class="i2-skill-name">${esc(nm)}</div><div class="i2-bar-track"><div class="i2-bar-fill" style="width:${pct}%;"></div></div></div>`;
    });
    if (skillBars) sideHtml += `<div class="i2-side-heading">Skills</div>${skillBars}`;

    let langDots = '';
    document.querySelectorAll('#gulf-lang-list .repeat-block').forEach(b => {
      const nm = b.querySelector('.glang-name')?.value || '';
      if (!nm) return;
      const lvl = parseInt(b.querySelector('.glang-level')?.value) || 0;
      let dots = '';
      for (let i = 1; i <= 6; i++) dots += `<span class="${i <= lvl ? 'filled' : ''}"></span>`;
      langDots += `<div class="i2-lang-item"><span class="i2-lang-name">${esc(nm)}</span><div class="i2-dot-row">${dots}</div></div>`;
    });
    if (langDots) sideHtml += `<div class="i2-side-heading">Languages</div>${langDots}`;

    const hobbiesI = val('r-hobbies');
    if (hobbiesI) {
      const items = hobbiesI.split(',').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        sideHtml += `<div class="i2-side-heading">Hobbies</div>` + items.map(i => `<div class="i2-hobby-item">${esc(i)}</div>`).join('');
      }
    }

    let mainI = `<div class="i2-header"><h3>${esc(name)}</h3><div class="i2-header-rule"></div>${titleI ? `<div class="i2-subtitle">${esc(titleI)}</div>` : ''}</div><div class="i2-body">`;
    if (summary) mainI += `<div class="i2-sec-title">Summary</div><p style="font-size:.82rem;">${esc(summary)}</p>`;
    if (expHtml) mainI += `<div class="i2-sec-title">Experience</div>${expHtml}`;
    if (eduHtml) mainI += `<div class="i2-sec-title">Education</div>${eduHtml}`;
    mainI += `</div>`;
    preview.innerHTML = `<div class="i2-sidebar">${sideHtml}</div><div class="i2-main">${mainI}</div>`;

  } else if (currentTmpl === 'bd') {
    const dob = val('r-dob'), nat = val('r-nationality') || 'Bangladeshi (by birth)';
    const father = val('r-father'), mother = val('r-mother'), marital = document.getElementById('r-marital')?.value || '';
    const nid = val('r-nid'), presentAddr = val('r-present-addr'), permanentAddr = val('r-permanent-addr');
    const linkedin = val('r-linkedin');
    const website = val('r-website');
    const portfolio = val('r-portfolio');

    // Build contact rows: clean horizontal 2-row structure
    const allContacts = [];
    if (phone) allContacts.push(phone);
    if (email) allContacts.push(email);
    if (loc) allContacts.push(loc);
    if (linkedin) allContacts.push(linkedin);
    if (website) allContacts.push(website);
    if (portfolio && portfolio !== website) allContacts.push(portfolio);

    const contactRows = [];
    if (allContacts.length >= 4) {
      if (allContacts.length === 4) {
        // Balance 4 items across 2 clean horizontal rows (2 and 2)
        contactRows.push(allContacts.slice(0, 2));
        contactRows.push(allContacts.slice(2));
      } else if (allContacts.length === 5) {
        // 3 on row 1, 2 on row 2
        contactRows.push(allContacts.slice(0, 3));
        contactRows.push(allContacts.slice(3));
      } else {
        // 3 on row 1, remainder on row 2
        contactRows.push(allContacts.slice(0, 3));
        contactRows.push(allContacts.slice(3));
      }
    } else if (allContacts.length === 3) {
      contactRows.push(allContacts.slice(0, 2));
      contactRows.push(allContacts.slice(2));
    } else if (allContacts.length === 2) {
      contactRows.push([allContacts[0]]);
      contactRows.push([allContacts[1]]);
    } else if (allContacts.length === 1) {
      contactRows.push([allContacts[0]]);
    }

    let contactTableHtml = '';
    if (contactRows.length > 0) {
      const trs = contactRows.map((row, rIdx) => {
        const isLastRow = (rIdx === contactRows.length - 1);
        const pb = isLastRow ? '0' : '4px';
        const cells = [];
        row.forEach((item, cIdx) => {
          if (cIdx > 0) {
            cells.push(`<td class="bd-contact-sep" style="padding:0 10px ${pb} 10px;border:none;color:#888;font-weight:400;user-select:none;vertical-align:middle;text-align:center;">|</td>`);
          }
          cells.push(`<td class="bd-contact-item" style="padding:0 0 ${pb} 0;border:none;white-space:nowrap;font-size:0.82rem;color:#333;vertical-align:middle;line-height:1.45;">${esc(item)}</td>`);
        });
        return `<tr>${cells.join('')}</tr>`;
      }).join('');
      contactTableHtml = `<table class="bd-contact-table" style="border-collapse:collapse;border:none;margin-top:4px;padding:0;"><tbody>${trs}</tbody></table>`;
    }

    // Photo: hide completely when no photo selected (no box, no placeholder, no reserved space/column)
    const hasPhoto = Boolean(photoDataUrl && typeof photoDataUrl === 'string' && photoDataUrl.trim().length > 0);
    let topHtml = '';
    if (hasPhoto) {
      topHtml = `<table class="bd-top" style="width:100%;border-collapse:collapse;border:none;margin-bottom:20px;">
        <tbody>
          <tr>
            <td class="bd-header-text" style="vertical-align:top;border:none;padding:0 20px 0 0;text-align:left;">
              <h3 style="font-family:'IBM Plex Sans',sans-serif;font-size:1.7rem;font-weight:700;margin:0 0 6px 0;color:#111;text-align:left;">${esc(name)}</h3>
              ${contactTableHtml ? `<div class="bd-contact" style="font-size:0.82rem;color:#333;line-height:1.45;">${contactTableHtml}</div>` : ''}
            </td>
            <td class="bd-photo-cell" style="vertical-align:top;width:110px;min-width:110px;max-width:110px;text-align:right;border:none;padding:0;">
              <div class="bd-photo-box" style="width:110px;height:135px;border:1.5px dashed #999;box-sizing:border-box;display:inline-block;overflow:hidden;">
                <img src="${photoDataUrl}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover;display:block;">
              </div>
            </td>
          </tr>
        </tbody>
      </table>`;
    } else {
      topHtml = `<div class="bd-header bd-no-photo" style="width:100%;margin-bottom:20px;text-align:left;">
        <h3 style="font-family:'IBM Plex Sans',sans-serif;font-size:1.7rem;font-weight:700;margin:0 0 6px 0;color:#111;text-align:left;">${esc(name)}</h3>
        ${contactTableHtml ? `<div class="bd-contact" style="font-size:0.82rem;color:#333;line-height:1.45;">${contactTableHtml}</div>` : ''}
      </div>`;
    }

    let html = topHtml;
    if (summary) html += `<div class="bd-sec-title">Career Objective</div><p style="font-size:.82rem;">${esc(summary)}</p>`;

    let personalKvBd = '';
    if (father) personalKvBd += `<div class="bd-kv"><span class="k">Father's Name</span><span class="v">: ${esc(father)}</span></div>`;
    if (mother) personalKvBd += `<div class="bd-kv"><span class="k">Mother's Name</span><span class="v">: ${esc(mother)}</span></div>`;
    if (dob) personalKvBd += `<div class="bd-kv"><span class="k">Date of Birth</span><span class="v">: ${esc(dob)}</span></div>`;
    personalKvBd += `<div class="bd-kv"><span class="k">Nationality</span><span class="v">: ${esc(nat)}</span></div>`;
    if (marital) personalKvBd += `<div class="bd-kv"><span class="k">Marital Status</span><span class="v">: ${esc(marital)}</span></div>`;
    if (nid) personalKvBd += `<div class="bd-kv"><span class="k">NID No.</span><span class="v">: ${esc(nid)}</span></div>`;
    if (presentAddr) personalKvBd += `<div class="bd-kv"><span class="k">Present Address</span><span class="v">: ${esc(presentAddr)}</span></div>`;
    if (permanentAddr) personalKvBd += `<div class="bd-kv"><span class="k">Permanent Address</span><span class="v">: ${esc(permanentAddr)}</span></div>`;
    if (personalKvBd) html += `<div class="bd-sec-title">Personal Details</div>${personalKvBd}`;

    let eduHtmlBd = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value || '';
      const inst = b.querySelector('.edu-inst')?.value || '';
      const dates = b.querySelector('.edu-dates')?.value || '';
      const gpa = b.querySelector('.edu-gpa')?.value || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value || '';
      const group = b.querySelector('.edu-group')?.value || '';
      const board = b.querySelector('.edu-board')?.value || '';
      const note = b.querySelector('.edu-note')?.value || '';
      if (!degree && !inst) return;

      const degreeMajor = [degree, group ? `Major in ${group}` : ''].filter(Boolean).join(' — ');
      const label = scale === '4' ? 'CGPA' : 'GPA';
      const gpaLine = gpa ? `${label}: ${gpa} out of ${parseFloat(scale || 5).toFixed(2)}` : (classDiv ? classDiv : '');

      let yearLine = '';
      if (dates) {
        yearLine = dates.toLowerCase().startsWith('year') ? dates : `Year: ${dates}`;
      }

      let instLine = inst;
      if (board) {
        const boardSuffix = board.toLowerCase().includes('board') ? '' : ' Board';
        instLine = inst ? `${inst} — ${board}${boardSuffix}` : `${board}${boardSuffix}`;
      }

      const noteBits = [note].filter(Boolean).map(esc);
      eduHtmlBd += `<div class="bd-entry bd-edu-entry" style="margin-bottom:12px;">
        <div class="bd-edu-title" style="font-weight:700;font-size:0.85rem;color:#111;margin-bottom:2px;line-height:1.4;">${esc(degreeMajor)}</div>
        ${gpaLine ? `<div class="bd-edu-grade" style="font-size:0.82rem;color:#333;margin-bottom:2px;line-height:1.4;">${esc(gpaLine)}</div>` : ''}
        ${yearLine ? `<div class="bd-edu-year" style="font-size:0.82rem;color:#333;margin-bottom:2px;line-height:1.4;">${esc(yearLine)}</div>` : ''}
        ${instLine ? `<div class="bd-edu-inst" style="font-size:0.82rem;color:#444;margin-bottom:2px;line-height:1.4;">${esc(instLine)}</div>` : ''}
        ${noteBits.length ? `<ul style="margin:3px 0 0 0;padding-left:18px;font-size:0.80rem;list-style-type:disc;"><li>${noteBits.join(' · ')}</li></ul>` : ''}
      </div>`;
    });
    if (eduHtmlBd) html += `<div class="bd-sec-title">Educational Qualifications</div>${eduHtmlBd}`;

    let expHtmlBd = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value || '';
      const company = b.querySelector('.exp-company')?.value || '';
      const locv = b.querySelector('.exp-loc')?.value || '';
      const dates = b.querySelector('.exp-dates')?.value || '';
      const desc = b.querySelector('.exp-desc')?.value || '';
      if (!role && !company) return;

      const rawLines = desc ? desc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      // Clean leading bullets/markers so each list item has exactly one bullet
      const cleanBullets = rawLines.map(s => s.replace(/^[-•*✓✔■·\s]+/, '').trim()).filter(Boolean);

      const topRow = (role && dates)
        ? `<table class="bd-entry-top-tbl" style="width:100%;border-collapse:collapse;border:none;margin-bottom:2px;">
            <tbody>
              <tr>
                <td style="font-weight:700;font-size:0.85rem;color:#111;padding:0;border:none;text-align:left;">${esc(role)}</td>
                <td style="font-weight:600;font-size:0.82rem;color:#444;padding:0;border:none;text-align:right;white-space:nowrap;">${esc(dates)}</td>
              </tr>
            </tbody>
          </table>`
        : `<div class="bd-entry-top" style="font-weight:700;font-size:0.85rem;color:#111;margin-bottom:2px;"><span>${esc(role || dates)}</span></div>`;

      expHtmlBd += `<div class="bd-entry" style="margin-bottom:12px;">
        ${topRow}
        <div class="bd-entry-sub" style="font-style:italic;color:#555;font-size:0.82rem;margin:2px 0 4px 0;">${esc(company)}${locv ? ' — ' + esc(locv) : ''}</div>
        ${cleanBullets.length ? `<ul style="margin:3px 0 0 0;padding-left:18px;font-size:0.82rem;list-style-type:disc;">${cleanBullets.map(x => `<li style="margin-bottom:2px;line-height:1.45;">${esc(x)}</li>`).join('')}</ul>` : ''}
      </div>`;
    });
    if (expHtmlBd) html += `<div class="bd-sec-title">Employment History</div>${expHtmlBd}`;

    if (skills) {
      const skillItems = skills
        .split(/[\n,]/)
        .map(s => s.replace(/^[-•*✓✔■·\s]+/, '').trim())
        .filter(Boolean);
      if (skillItems.length > 0) {
        html += `<div class="bd-sec-title">Skills</div><ul class="bd-plain-list" style="margin:4px 0 10px 0;padding-left:20px;font-size:0.82rem;list-style-type:disc;">${skillItems.map(i => `<li style="margin-bottom:3px;line-height:1.45;">${esc(i)}</li>`).join('')}</ul>`;
      }
    }

    const training = val('r-training');
    if (training) {
      const items = training.split('\n').map(s => s.trim()).filter(Boolean);
      html += `<div class="bd-sec-title">Training & Certifications</div><ul class="bd-plain-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    }
    preview.innerHTML = html;

  } else if (currentTmpl === 'bd2') {
    const email2 = val('r-email'), phone2 = val('r-phone'), presentAddr2 = val('r-present-addr') || val('r-location');
    const dob2 = val('r-dob'), religion2 = val('r-religion'), nat2 = val('r-nationality') || 'Bangladeshi';
    const father2 = val('r-father'), mother2 = val('r-mother'), gender2 = document.getElementById('r-gender')?.value || '';
    const permanentAddr2 = val('r-permanent-addr');
    const photoHtml2 = photoDataUrl
      ? `<img class="bd2-photo" src="${photoDataUrl}" alt="${esc(name)}" width="85" height="102" style="width:85px;height:102px;min-width:85px;max-width:85px;min-height:102px;max-height:102px;object-fit:cover;display:block;border:1px solid #777777;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : `<div class="bd2-photo placeholder" style="display:flex;align-items:center;justify-content:center;width:85px;height:102px;min-width:85px;max-width:85px;min-height:102px;max-height:102px;background:#F0F0F0;color:#888888;font-size:0.65rem;border:1px dashed #999999;box-sizing:border-box;">Photo</div>`;

    const barStyle = `style="background-color:#D9D9D9;background:#D9D9D9;box-shadow:inset 0 0 0 1000px #D9D9D9;font-weight:700;font-size:0.84rem;padding:4px 8px;margin:10px 0 6px 0;color:#111827;letter-spacing:0.02em;-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-after:avoid;break-after:avoid;"`;
    const kvRowStyle = `style="display:flex;font-size:0.80rem;margin-bottom:2px;line-height:1.4;page-break-inside:avoid;break-inside:avoid;"`;
    const kvKeyStyle = `style="width:160px;min-width:160px;max-width:160px;flex-shrink:0;color:#333333;font-weight:500;"`;
    const kvValStyle = `style="flex:1;color:#111827;word-break:break-word;"`;

    let html = `<div class="bd2-title" style="text-align:center;font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:1.35rem;margin:0 0 10px 0;color:#111827;letter-spacing:0.02em;">Resume</div>`;
    html += `<table class="bd2-top-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 10px 0;border:none;page-break-inside:avoid;break-inside:avoid;">
      <tr>
        <td class="bd2-contact" style="vertical-align:top;font-size:0.80rem;line-height:1.5;color:#111827;padding:0;border:none;">
          <strong style="display:block;margin-bottom:3px;font-size:0.84rem;font-weight:700;color:#111827;">Contact Address:</strong>
          ${presentAddr2 ? esc(presentAddr2) + '<br>' : ''}
          ${email2 ? 'Email: ' + esc(email2) + '<br>' : ''}
          ${phone2 ? 'Mobile: ' + esc(phone2) : ''}
        </td>
        <td class="bd2-photo-cell" style="vertical-align:top;width:95px;min-width:95px;max-width:95px;text-align:right;padding:0;border:none;">
          <div class="bd2-photo-wrap" style="display:inline-flex;gap:6px;align-items:stretch;text-align:left;">
            <div class="bd2-photo-accent" style="width:4px;min-width:4px;background-color:#2b6cb0;background:#2b6cb0;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
            ${photoHtml2}
          </div>
        </td>
      </tr>
    </table>`;
    html += `<div class="bd2-name" style="text-align:center;font-weight:700;font-size:1.08rem;margin:6px 0 10px 0;color:#111827;letter-spacing:0.02em;page-break-after:avoid;break-after:avoid;">${esc(name)}</div>`;
    if (summary) html += `<div class="bd2-bar" ${barStyle}>Career Objective</div><p style="font-size:0.80rem;line-height:1.45;margin:3px 0 0 0;color:#111827;">${esc(summary)}</p>`;

    let eduHtml2 = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value || '';
      const inst = b.querySelector('.edu-inst')?.value || '';
      const dates = b.querySelector('.edu-dates')?.value || '';
      const gpa = b.querySelector('.edu-gpa')?.value || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value || '';
      const group = b.querySelector('.edu-group')?.value || '';
      const board = b.querySelector('.edu-board')?.value || '';
      const note = b.querySelector('.edu-note')?.value || '';
      if (!degree && !inst) return;
      const label = scale === '4' ? 'CGPA' : 'GPA';
      let itemHtml = `<div class="bd2-degree-title" style="font-weight:700;text-decoration:underline;font-size:0.84rem;margin:6px 0 3px 0;color:#111827;page-break-after:avoid;break-after:avoid;">${esc(degree)}</div>`;
      if (inst) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Name of the Institute</span><span class="v" ${kvValStyle}>: ${esc(inst)}</span></div>`;
      if (group) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Group/Major</span><span class="v" ${kvValStyle}>: ${esc(group)}</span></div>`;
      if (board) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Board</span><span class="v" ${kvValStyle}>: ${esc(board)}</span></div>`;
      if (gpa) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>${label}</span><span class="v" ${kvValStyle}>: ${esc(gpa)} (out of ${parseFloat(scale || 5).toFixed(2)})${classDiv ? ' — ' + esc(classDiv) : ''}</span></div>`;
      if (dates) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Year of Completion</span><span class="v" ${kvValStyle}>: ${esc(dates)}</span></div>`;
      if (note) itemHtml += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Achievement/Note</span><span class="v" ${kvValStyle}>: ${esc(note)}</span></div>`;
      eduHtml2 += `<div class="bd2-edu-entry" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;">${itemHtml}</div>`;
    });
    if (eduHtml2) html += `<div class="bd2-bar" ${barStyle}>Educational Background</div>${eduHtml2}`;

    let expHtml2 = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value || '';
      const company = b.querySelector('.exp-company')?.value || '';
      const locv = b.querySelector('.exp-loc')?.value || '';
      const dates = b.querySelector('.exp-dates')?.value || '';
      const desc = b.querySelector('.exp-desc')?.value || '';
      if (!role && !company) return;

      let descHtml = '';
      if (desc) {
        const descMode = b.querySelector('.exp-desc')?.dataset.mode || (desc.includes('\n') ? 'list' : 'summary');
        if (descMode === 'list') {
          const lines = desc.split('\n').map(l => l.trim().replace(/^[-•*✓✔]\s*/, '')).filter(Boolean);
          if (lines.length) {
            descHtml = `<ul class="bd2-bullets" style="margin:3px 0 0 0;padding-left:18px;list-style-type:disc;font-size:0.80rem;color:#222222;">${lines.map(l => `<li style="margin-bottom:2px;line-height:1.45;">${esc(l)}</li>`).join('')}</ul>`;
          }
        } else {
          descHtml = `<p style="margin:3px 0 0 0;font-size:0.80rem;line-height:1.45;color:#222222;">${esc(desc).replace(/\n/g, '<br>')}</p>`;
        }
      }

      expHtml2 += `<div class="bd2-exp-entry" style="margin-bottom:7px;font-size:0.80rem;page-break-inside:avoid;break-inside:avoid;">
        <div class="role" style="font-weight:700;font-size:0.84rem;color:#111827;">${esc(role)} — ${esc(company)}${locv ? ' (' + esc(locv) + ')' : ''}</div>
        <div style="font-size:0.76rem;color:#555555;margin-top:1px;">${esc(dates)}</div>
        ${descHtml}
      </div>`;
    });
    if (expHtml2) html += `<div class="bd2-bar" ${barStyle}>Experience</div>${expHtml2}`;

    let langRows = '';
    document.querySelectorAll('#lang-list .repeat-block').forEach(b => {
      const lname = b.querySelector('.lang-name')?.value || '';
      if (!lname) return;
      const r = b.querySelector('.lang-reading')?.value || '', w = b.querySelector('.lang-writing')?.value || '', s = b.querySelector('.lang-speaking')?.value || '';
      langRows += `<tr><td style="border:1px solid #777777;padding:3px 6px;text-align:left;">${esc(lname)}</td><td style="border:1px solid #777777;padding:3px 6px;text-align:left;">${esc(r)}</td><td style="border:1px solid #777777;padding:3px 6px;text-align:left;">${esc(w)}</td><td style="border:1px solid #777777;padding:3px 6px;text-align:left;">${esc(s)}</td></tr>`;
    });
    const computingOs = val('r-computing-os'), computingSw = val('r-computing-software');
    if (langRows || skills || computingOs || computingSw) {
      html += `<div class="bd2-bar" ${barStyle}>Skills</div>`;
      if (langRows) html += `<table class="bd2-lang" style="width:100%;border-collapse:collapse;font-size:0.78rem;margin:4px 0 6px 0;page-break-inside:avoid;break-inside:avoid;"><thead><tr><th style="border:1px solid #777777;padding:3px 6px;text-align:left;background-color:#f1f5f9;background:#f1f5f9;font-weight:700;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Language</th><th style="border:1px solid #777777;padding:3px 6px;text-align:left;background-color:#f1f5f9;background:#f1f5f9;font-weight:700;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Reading</th><th style="border:1px solid #777777;padding:3px 6px;text-align:left;background-color:#f1f5f9;background:#f1f5f9;font-weight:700;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Writing</th><th style="border:1px solid #777777;padding:3px 6px;text-align:left;background-color:#f1f5f9;background:#f1f5f9;font-weight:700;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Speaking</th></tr></thead><tbody>${langRows}</tbody></table>`;
      if (skills) html += `<p style="font-size:0.80rem;margin:4px 0 0 0;line-height:1.4;color:#111827;"><strong>Skills:</strong> ${esc(skills)}</p>`;
      if (computingOs) html += `<p style="font-size:0.80rem;margin:2px 0 0 0;line-height:1.4;color:#111827;"><strong>Operating skills:</strong> ${esc(computingOs)}</p>`;
      if (computingSw) html += `<p style="font-size:0.80rem;margin:2px 0 0 0;line-height:1.4;color:#111827;"><strong>Application software:</strong> ${esc(computingSw)}</p>`;
    }

    const strengths = val('r-strengths');
    if (strengths) {
      const sMode = document.getElementById('r-strengths')?.dataset.mode || (strengths.includes('\n') ? 'list' : 'summary');
      if (sMode === 'list') {
        const items = strengths.split('\n').map(s => s.trim().replace(/^[-•*✓✔]\s*/, '')).filter(Boolean);
        if (items.length) {
          html += `<div class="bd2-bar" ${barStyle}>Capabilities and Interests</div><ul class="bd2-bullets" style="margin:3px 0 0 0;padding-left:18px;list-style-type:disc;font-size:0.80rem;color:#222222;">${items.map(i => `<li style="margin-bottom:2px;line-height:1.45;">${esc(i)}</li>`).join('')}</ul>`;
        }
      } else {
        html += `<div class="bd2-bar" ${barStyle}>Capabilities and Interests</div><p style="font-size:0.80rem;line-height:1.45;margin:3px 0 0 0;color:#111827;">${esc(strengths).replace(/\n/g, '<br>')}</p>`;
      }
    }

    let personalKv = '';
    if (father2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Father Name</span><span class="v" ${kvValStyle}>: ${esc(father2)}</span></div>`;
    if (mother2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Mother Name</span><span class="v" ${kvValStyle}>: ${esc(mother2)}</span></div>`;
    if (dob2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Date of Birth</span><span class="v" ${kvValStyle}>: ${esc(dob2)}</span></div>`;
    if (religion2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Religion</span><span class="v" ${kvValStyle}>: ${esc(religion2)}</span></div>`;
    if (gender2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Sex</span><span class="v" ${kvValStyle}>: ${esc(gender2)}</span></div>`;
    if (nat2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Nationality</span><span class="v" ${kvValStyle}>: ${esc(nat2)}</span></div>`;
    if (permanentAddr2) personalKv += `<div class="bd2-kv" ${kvRowStyle}><span class="k" ${kvKeyStyle}>Permanent Address</span><span class="v" ${kvValStyle}>: ${esc(permanentAddr2)}</span></div>`;
    if (personalKv) html += `<div class="bd2-bar" ${barStyle}>Personal Information</div>${personalKv}`;

    const sigInner = signatureDataUrl
      ? `<img class="bd2-sig-img" src="${signatureDataUrl}" alt="Signature" width="140" height="42" style="max-width:140px;max-height:42px;width:auto;height:auto;object-fit:contain;display:block;margin:0 auto 3px auto;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : `<div style="height:32px;"></div>`;
    html += `<div class="bd2-declaration-block" style="margin-top:8px;page-break-inside:avoid;break-inside:avoid;">
      <div class="bd2-bar" ${barStyle}>Declaration</div>
      <p style="font-size:0.80rem;line-height:1.45;margin:4px 0 0 0;color:#111827;">I hereby declare that all the information given above is absolutely true and correct.</p>
      <div class="bd2-declaration-sig" style="margin-top:12px;display:flex;justify-content:flex-end;align-items:flex-end;width:100%;page-break-inside:avoid;break-inside:avoid;">
        <div class="bd2-sig-box" style="margin-left:auto;width:160px;min-width:160px;text-align:center;display:flex;flex-direction:column;align-items:center;">
          ${sigInner}
          <div class="bd2-sig-line" style="border-top:1.2px solid #111827;width:160px;margin-top:3px;padding-top:3px;font-size:0.80rem;font-weight:700;text-align:center;color:#111827;">${esc(name)}</div>
        </div>
      </div>
    </div>`;
    preview.innerHTML = html;

  } else if (currentTmpl === 'sidebar') {
    const photoHtml = photoDataUrl
      ? `<img class="intl-photo sb-photo" src="${photoDataUrl}" alt="${esc(name)}" width="90" height="90" style="display:block;width:90px;height:90px;min-width:90px;max-width:90px;min-height:90px;max-height:90px;object-fit:cover;border-radius:6px;border:2px solid #ffffff;margin:0 auto 14px auto;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : `<div class="intl-photo placeholder sb-photo" style="display:flex;align-items:center;justify-content:center;width:90px;height:90px;min-width:90px;max-width:90px;min-height:90px;max-height:90px;border-radius:6px;border:2px dashed rgba(255,255,255,0.4);color:#CBD3DC;font-size:0.72rem;margin:0 auto 14px auto;box-sizing:border-box;">Photo</div>`;

    const emailSb = val('r-email'), phoneSb = val('r-phone'), locSb = val('r-location'), linkedinSb = val('r-linkedin');
    const contactRows = [];
    if (emailSb) {
      contactRows.push(`<div class="sb-contact-row" style="margin-bottom:6px;word-break:break-word;overflow-wrap:anywhere;display:flex;align-items:flex-start;gap:6px;">
        <span class="sb-c-icon" style="flex-shrink:0;opacity:0.85;font-size:0.75rem;line-height:1.4;">✉</span>
        <span class="sb-c-val" style="flex:1;min-width:0;word-break:break-word;overflow-wrap:anywhere;line-height:1.4;">${esc(emailSb)}</span>
      </div>`);
    }
    if (phoneSb) {
      contactRows.push(`<div class="sb-contact-row" style="margin-bottom:6px;word-break:break-word;overflow-wrap:anywhere;display:flex;align-items:flex-start;gap:6px;">
        <span class="sb-c-icon" style="flex-shrink:0;opacity:0.85;font-size:0.75rem;line-height:1.4;">☎</span>
        <span class="sb-c-val" style="flex:1;min-width:0;word-break:break-word;overflow-wrap:anywhere;line-height:1.4;">${esc(phoneSb)}</span>
      </div>`);
    }
    if (locSb) {
      contactRows.push(`<div class="sb-contact-row" style="margin-bottom:6px;word-break:break-word;overflow-wrap:anywhere;display:flex;align-items:flex-start;gap:6px;">
        <span class="sb-c-icon" style="flex-shrink:0;opacity:0.85;font-size:0.75rem;line-height:1.4;">⚲</span>
        <span class="sb-c-val" style="flex:1;min-width:0;word-break:break-word;overflow-wrap:anywhere;line-height:1.4;">${esc(locSb)}</span>
      </div>`);
    }
    if (linkedinSb) {
      contactRows.push(`<div class="sb-contact-row" style="margin-bottom:6px;word-break:break-word;overflow-wrap:anywhere;display:flex;align-items:flex-start;gap:6px;">
        <span class="sb-c-icon" style="flex-shrink:0;opacity:0.85;font-size:0.75rem;line-height:1.4;">in</span>
        <span class="sb-c-val" style="flex:1;min-width:0;word-break:break-word;overflow-wrap:anywhere;line-height:1.4;">${esc(linkedinSb)}</span>
      </div>`);
    }

    const contactHtml = contactRows.length ? `<div class="sb-contact" style="font-size:0.70rem;color:#CBD3DC;margin-bottom:18px;text-align:left;line-height:1.4;">${contactRows.join('')}</div>` : '';

    const skillItems = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langsRaw = val('r-languages');
    const langItems = langsRaw ? langsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    let sideHtml = `${photoHtml}<h3 style="color:#ffffff;font-size:1.15rem;font-weight:700;text-align:center;margin:0 0 10px 0;line-height:1.25;letter-spacing:-0.01em;font-family:'Fraunces',serif;">${esc(name)}</h3>${contactHtml}`;

    if (skillItems.length) {
      sideHtml += `<div class="sb-heading" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#F2C94C;border-bottom:1px solid #4B5563;padding-bottom:3px;margin:16px 0 8px 0;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Skills</div>`;
      skillItems.forEach(s => {
        sideHtml += `<div class="sb-skill-item" style="font-size:0.74rem;color:#E5E7EB;margin-bottom:4px;line-height:1.35;word-break:break-word;">• ${esc(s)}</div>`;
      });
    }

    if (langItems.length) {
      sideHtml += `<div class="sb-heading" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:#F2C94C;border-bottom:1px solid #4B5563;padding-bottom:3px;margin:16px 0 8px 0;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Languages</div>`;
      langItems.forEach(l => {
        sideHtml += `<div class="sb-skill-item" style="font-size:0.74rem;color:#E5E7EB;margin-bottom:4px;line-height:1.35;word-break:break-word;">• ${esc(l)}</div>`;
      });
    }

    let expHtmlSb = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value || '';
      const company = b.querySelector('.exp-company')?.value || '';
      const dates = b.querySelector('.exp-dates')?.value || '';
      const locv = b.querySelector('.exp-loc')?.value || '';
      const desc = b.querySelector('.exp-desc')?.value || '';
      if (!role && !company) return;
      const bullets = desc ? desc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      let descContent = '';
      if (bullets.length > 1) {
        descContent = `<ul style="margin:4px 0 0 0;padding-left:18px;font-size:0.80rem;color:#333333;line-height:1.5;">${bullets.map(bu => `<li style="margin-bottom:2px;">${esc(bu)}</li>`).join('')}</ul>`;
      } else if (desc) {
        descContent = `<p style="margin:4px 0 0 0;font-size:0.82rem;color:#333333;line-height:1.5;">${esc(desc)}</p>`;
      }
      expHtmlSb += `<div class="entry sb-entry" style="margin-bottom:12px;break-inside:avoid;page-break-inside:avoid;">
        <div class="top" style="display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:0.86rem;color:#111827;">
          <span>${esc(role)}${company ? ' - ' + esc(company) : ''}</span>
          <span style="font-size:0.78rem;font-weight:500;color:#6B7280;white-space:nowrap;margin-left:8px;">${esc(dates)}</span>
        </div>
        ${locv ? `<div class="sub" style="font-size:0.78rem;color:#4B5563;margin-top:1px;">${esc(locv)}</div>` : ''}
        ${descContent}
      </div>`;
    });

    let eduHtmlSb = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value || '';
      const inst = b.querySelector('.edu-inst')?.value || '';
      const dates = b.querySelector('.edu-dates')?.value || '';
      const gpa = b.querySelector('.edu-gpa')?.value || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value || '';
      if (!degree && !inst) return;
      let gpaLine = '';
      if (gpa) {
        const label = scale === '4' ? 'CGPA' : 'GPA';
        gpaLine = ` • ${label}: ${esc(gpa)}/${parseFloat(scale || 5).toFixed(2)}`;
        if (classDiv) gpaLine += ` (${esc(classDiv)})`;
      }
      eduHtmlSb += `<div class="entry sb-entry" style="margin-bottom:10px;break-inside:avoid;page-break-inside:avoid;">
        <div class="top" style="display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:0.86rem;color:#111827;">
          <span>${esc(degree)}${gpaLine}</span>
          <span style="font-size:0.78rem;font-weight:500;color:#6B7280;white-space:nowrap;margin-left:8px;">${esc(dates)}</span>
        </div>
        ${inst ? `<div class="sub" style="font-size:0.78rem;color:#4B5563;margin-top:1px;">${esc(inst)}</div>` : ''}
      </div>`;
    });

    let mainHtml = '';
    let isFirstSec = true;
    const makeSbTitle = (titleText) => {
      const mt = isFirstSec ? '0' : '16px';
      isFirstSec = false;
      return `<div class="section-title" style="font-size:0.76rem;letter-spacing:0.06em;text-transform:uppercase;color:#9E362F;border-bottom:1.5px solid #E2E8F0;margin:${mt} 0 10px 0;padding-bottom:4px;font-weight:700;page-break-after:avoid;break-after:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${titleText}</div>`;
    };

    if (summary) {
      mainHtml += `${makeSbTitle('Summary')}<p style="font-size:0.84rem;color:#333333;line-height:1.55;margin:0 0 16px 0;">${esc(summary)}</p>`;
    }
    if (expHtmlSb) {
      mainHtml += `${makeSbTitle('Experience')}${expHtmlSb}`;
    }
    if (eduHtmlSb) {
      mainHtml += `${makeSbTitle('Education')}${eduHtmlSb}`;
    }

    preview.className = 'resume-preview tmpl-sidebar';
    preview.style.cssText = 'display:table;width:100%;table-layout:fixed;border-collapse:collapse;padding:0;background:#ffffff;box-sizing:border-box;';
    preview.innerHTML = `<div class="sb-side" style="display:table-cell;width:215px;min-width:215px;max-width:215px;vertical-align:top;background-color:#1B2430;background:#1B2430;color:#ffffff;padding:24px 18px;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${sideHtml}</div><div class="sb-main" style="display:table-cell;vertical-align:top;background-color:#ffffff;background:#ffffff;padding:24px 26px;box-sizing:border-box;">${mainHtml}</div>`;

  } else if (currentTmpl === 'compact') {
    const linkedinC = val('r-linkedin');
    const titleC = val('r-title');
    const contactC = [loc, email, phone, linkedinC].filter(Boolean).join(' | ');
    let html = `<h3>${esc(name)}</h3>`;
    if (titleC) html += `<div class="cp-subtitle">${esc(titleC)}</div>`;
    if (contactC) html += `<div class="cp-contact">${esc(contactC)}</div>`;
    if (summary) html += `<div class="cp-sec-title">Professional Summary</div><p style="font-size:.82rem;">${esc(summary)}</p>`;

    let expHtmlC = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value || '';
      const company = b.querySelector('.exp-company')?.value || '';
      const locv = b.querySelector('.exp-loc')?.value || '';
      const dates = b.querySelector('.exp-dates')?.value || '';
      const desc = b.querySelector('.exp-desc')?.value || '';
      if (!role && !company) return;
      const orgLine = locv ? `${esc(company)}, ${esc(locv)}` : esc(company);
      const bullets = desc ? desc.split('\n').map(s => s.trim()).filter(Boolean) : [];
      expHtmlC += `<div class="cp-entry">
        <div class="cp-role">${esc(role)}</div>
        <div class="cp-org-row"><span>${orgLine}</span><span>${esc(dates)}</span></div>
        ${bullets.length ? '<ul>' + bullets.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : ''}
      </div>`;
    });
    if (expHtmlC) html += `<div class="cp-sec-title">Work Experience</div>${expHtmlC}`;

    let eduHtmlC = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value?.trim() || '';
      const inst = b.querySelector('.edu-inst')?.value?.trim() || '';
      const locv = b.querySelector('.edu-loc')?.value?.trim() || '';
      const dates = b.querySelector('.edu-dates')?.value?.trim() || '';
      const gpa = b.querySelector('.edu-gpa')?.value?.trim() || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value?.trim() || '';
      if (!degree && !inst) return;
      const orgLine = locv ? `${esc(inst)}, ${esc(locv)}` : esc(inst);
      let gpaLine = '';
      if (gpa) {
        const label = scale === '4' ? 'CGPA' : 'GPA';
        const maxScale = parseFloat(scale || 5).toFixed(2);
        gpaLine = `${label}: ${esc(gpa)} / ${maxScale}`;
        if (classDiv) gpaLine += ` (${esc(classDiv)})`;
      } else if (classDiv) {
        gpaLine = esc(classDiv);
      }
      const roleText = degree ? `${esc(degree)}${gpaLine ? ' • ' + gpaLine : ''}` : gpaLine;
      eduHtmlC += `<div class="cp-entry">
        <div class="cp-role">${roleText}</div>
        <div class="cp-org-row"><span>${orgLine}</span><span>${dates ? 'Graduated: ' + esc(dates) : ''}</span></div>
      </div>`;
    });
    if (eduHtmlC) html += `<div class="cp-sec-title">Education</div>${eduHtmlC}`;

    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (skillList.length) {
        const currentSkillsMode = skillsDisplayMode || document.getElementById('r-skills')?.dataset.skillsMode || 'list';
        if (currentSkillsMode === 'summary') {
          html += `<div class="cp-sec-title">Skills</div><p class="cp-skills-summary">${skillList.map(esc).join(', ')}</p>`;
        } else {
          let skillItems = skillList.map(s => `<li>${esc(s)}</li>`).join('');
          html += `<div class="cp-sec-title">Skills</div><ul class="cp-plain-list">${skillItems}</ul>`;
        }
      }
    }

    const trainingC = val('r-training');
    if (trainingC) {
      const items = trainingC.split('\n').map(s => s.trim()).filter(Boolean);
      if (items.length) {
        html += `<div class="cp-sec-title">Certifications</div><ul class="cp-plain-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
      }
    }

    const languagesC = val('r-languages');
    if (languagesC) {
      let langItems = [];
      if (languagesC.includes('\n')) {
        langItems = languagesC.split('\n').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      } else {
        langItems = languagesC.split(',').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      }
      if (langItems.length) {
        html += `<div class="cp-sec-title">Languages</div><ul class="cp-plain-list">${langItems.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
      }
    }
    preview.innerHTML = html;

  } else if (currentTmpl === 'europass') {
    const email3 = val('r-email'), phone3 = val('r-phone');
    const loc3 = val('r-location') || val('r-present-addr');
    const linkedin3 = val('r-linkedin');
    const photoHtml3 = photoDataUrl
      ? `<img class="intl-photo ep-photo" src="${photoDataUrl}" alt="${esc(name)}" width="80" height="100" style="width:80px;height:100px;min-width:80px;max-width:80px;min-height:100px;max-height:100px;object-fit:cover;border-radius:2px;border:1px solid rgba(255,255,255,0.45);display:inline-block;vertical-align:middle;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : '';

    // Contact details lines horizontally under the name: Line 1: Email | Phone, Line 2: Location | LinkedIn
    const contactLine1 = [];
    if (email3) contactLine1.push(`<span class="ep-contact-item" style="display:inline-block;white-space:nowrap;"><strong class="ep-contact-label" style="color:#ffffff;font-weight:600;margin-right:4px;">Email:</strong><span style="color:#E8EEF7;">${esc(email3)}</span></span>`);
    if (phone3) contactLine1.push(`<span class="ep-contact-item" style="display:inline-block;white-space:nowrap;"><strong class="ep-contact-label" style="color:#ffffff;font-weight:600;margin-right:4px;">Phone:</strong><span style="color:#E8EEF7;">${esc(phone3)}</span></span>`);

    const contactLine2 = [];
    if (loc3) contactLine2.push(`<span class="ep-contact-item" style="display:inline-block;white-space:nowrap;"><strong class="ep-contact-label" style="color:#ffffff;font-weight:600;margin-right:4px;">Location:</strong><span style="color:#E8EEF7;">${esc(loc3)}</span></span>`);
    if (linkedin3) contactLine2.push(`<span class="ep-contact-item" style="display:inline-block;white-space:nowrap;"><strong class="ep-contact-label" style="color:#ffffff;font-weight:600;margin-right:4px;">LinkedIn:</strong><span style="color:#E8EEF7;">${esc(linkedin3)}</span></span>`);

    const sepSpan = '<span class="ep-contact-sep" style="display:inline-block;margin:0 12px;color:#A9C5EC;font-weight:400;">|</span>';
    const line1Html = contactLine1.join(sepSpan);
    const line2Html = contactLine2.join(sepSpan);

    let contactBlockHtml = '';
    if (line1Html || line2Html) {
      contactBlockHtml = `<div class="ep-contacts" style="margin-top:6px;line-height:1.55;font-size:0.76rem;color:#E8EEF7;">
        ${line1Html ? `<div class="ep-contact-row" style="margin-bottom:3px;color:#E8EEF7;">${line1Html}</div>` : ''}
        ${line2Html ? `<div class="ep-contact-row" style="color:#E8EEF7;">${line2Html}</div>` : ''}
      </div>`;
    }

    const epBarStyle = `style="background-color:#E8EEF7;background:#E8EEF7;color:#004494;font-weight:700;font-size:0.78rem;padding:5px 9px;margin:12px 0 7px 0;text-transform:uppercase;letter-spacing:0.04em;border-left:4px solid #004494;-webkit-print-color-adjust:exact;print-color-adjust:exact;break-after:avoid;page-break-after:avoid;"`;

    // Professional Title, Nationality, and Personal Information heading are strictly excluded from Europass / EU template
    let htmlEp = `<div class="ep-header" style="background-color:#004494;background:#004494;color:#ffffff;padding:16px 22px;box-sizing:border-box;width:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <table class="ep-header-table" style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;">
        <tr>
          <td class="ep-header-left" style="vertical-align:middle;padding:0;border:none;">
            <h3 class="ep-name" style="color:#ffffff;font-family:'IBM Plex Sans',sans-serif;font-size:1.35rem;font-weight:700;margin:0 0 6px 0;line-height:1.2;letter-spacing:0.01em;">${esc(name)}</h3>
            ${contactBlockHtml}
          </td>
          ${photoHtml3 ? `<td class="ep-header-photo-cell" style="vertical-align:middle;width:88px;min-width:88px;max-width:88px;text-align:right;padding:0 0 0 16px;border:none;">
            ${photoHtml3}
          </td>` : ''}
        </tr>
      </table>
    </div>
    <div class="ep-body" style="padding:14px 22px 18px 22px;">`;

    // Personal Statement / Summary
    if (summary) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Personal Statement</div><p style="font-size:0.80rem;line-height:1.55;color:#222222;margin:4px 0 10px 0;">${esc(summary)}</p>`;
    }

    // Work Experience
    let expHtmlEp = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value || '';
      const company = b.querySelector('.exp-company')?.value || '';
      const dates = b.querySelector('.exp-dates')?.value || '';
      const locv = b.querySelector('.exp-loc')?.value || '';
      const desc = b.querySelector('.exp-desc')?.value || '';
      if (!role && !company) return;
      expHtmlEp += `<div class="entry" style="margin-bottom:9px;break-inside:avoid;page-break-inside:avoid;">
        <div class="top" style="display:flex;justify-content:space-between;font-weight:600;font-size:0.85rem;color:#111111;line-height:1.35;">
          <span>${esc(role)}${company ? ' — ' + esc(company) : ''}</span>
          <span>${esc(dates)}</span>
        </div>
        ${locv ? `<div class="sub" style="font-size:0.80rem;color:#444444;margin-top:1px;">${esc(locv)}</div>` : ''}
        ${desc ? `<p style="margin:3px 0 0 0;font-size:0.80rem;line-height:1.5;color:#222222;">${esc(desc).replace(/\n/g, '<br>')}</p>` : ''}
      </div>`;
    });
    if (expHtmlEp) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Work Experience</div>${expHtmlEp}`;
    }

    // Education and Training with Institution Location
    let eduHtmlEp = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value || '';
      const inst = b.querySelector('.edu-inst')?.value || '';
      const dates = b.querySelector('.edu-dates')?.value || '';
      const gpa = b.querySelector('.edu-gpa')?.value || '';
      const scale = b.querySelector('.edu-scale')?.value || '4';
      const locv = b.querySelector('.edu-loc')?.value || '';
      if (!degree && !inst) return;

      const gpaStr = gpa ? (scale === '5' ? `GPA ${gpa}/5.00` : `CGPA ${gpa}/4.00`) : '';
      const rightCol = [dates, gpaStr].filter(Boolean).join(' • ');

      eduHtmlEp += `<div class="entry" style="margin-bottom:9px;break-inside:avoid;page-break-inside:avoid;">
        <div class="top" style="display:flex;justify-content:space-between;font-weight:600;font-size:0.85rem;color:#111111;line-height:1.35;">
          <span>${esc(degree)}</span><span>${esc(rightCol)}</span>
        </div>
        <div class="sub" style="font-size:0.80rem;color:#444444;margin-top:1px;">${esc(inst)}</div>
        ${locv ? `<div class="ep-edu-loc" style="font-size:0.78rem;color:#555555;margin:1px 0 2px 0;">${esc(locv)}</div>` : ''}
      </div>`;
    });
    if (eduHtmlEp) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Education and Training</div>${eduHtmlEp}`;
    }

    // Languages: formatted as "Language — Level" (e.g. English — Excellent) in clean individual bullets
    const langMapEp = new Map();

    document.querySelectorAll('#lang-list .repeat-block').forEach(b => {
      const lname = b.querySelector('.lang-name')?.value?.trim();
      if (!lname) return;
      const key = lname.toLowerCase();
      const epLvlEl = b.querySelector('.lang-level-ep');
      let lvl = epLvlEl ? epLvlEl.value : '';
      if (!lvl) {
        const spk = b.querySelector('.lang-speaking')?.value || '';
        const rd = b.querySelector('.lang-reading')?.value || '';
        lvl = normalizeEuropassLangLevel(spk || rd || 'Good');
      } else {
        lvl = normalizeEuropassLangLevel(lvl);
      }
      if (!langMapEp.has(key)) {
        langMapEp.set(key, { name: lname, level: lvl });
      }
    });

    document.querySelectorAll('#gulf-lang-list .repeat-block').forEach(b => {
      const glname = b.querySelector('.glang-name')?.value?.trim();
      if (!glname) return;
      const key = glname.toLowerCase();
      if (!langMapEp.has(key)) {
        const glvl = b.querySelector('.glang-level')?.value || '3';
        const lvl = normalizeEuropassLangLevel(glvl);
        langMapEp.set(key, { name: glname, level: lvl });
      }
    });

    const rawLangsEp = val('r-languages');
    if (rawLangsEp) {
      rawLangsEp.split(/[\n,]/).forEach(item => {
        const clean = item.trim().replace(/^[-•*✓✔■]\s*/, '');
        if (!clean) return;
        let lname = clean;
        let lvl = 'Good';
        const m = clean.match(/^([A-Za-z\s]+?)\s*(?:[-—:–]|\((?:Level\s*|Score:?\s*)?)\s*([A-Za-z0-9/%\s]+?)\)?$/);
        if (m) {
          lname = m[1].trim();
          lvl = normalizeEuropassLangLevel(m[2]);
        }
        const key = lname.toLowerCase();
        if (key && !langMapEp.has(key)) {
          langMapEp.set(key, { name: lname, level: lvl });
        }
      });
    }

    const langBulletsEp = Array.from(langMapEp.values()).map(item => `${esc(item.name)} — ${esc(item.level)}`);
    if (langBulletsEp.length > 0) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Languages</div>
        <ul class="ep-list" style="margin:4px 0 8px 0;padding-left:0;list-style:none;">
          ${langBulletsEp.map(l => `<li style="margin-bottom:3px;font-size:0.80rem;line-height:1.5;color:#222222;display:flex;align-items:flex-start;break-inside:avoid;page-break-inside:avoid;">
            <span style="color:#004494;font-size:1.1rem;line-height:1;margin-right:8px;display:inline-block;flex-shrink:0;">&bull;</span>
            <span>${l}</span>
          </li>`).join('')}
        </ul>`;
    }

    // Digital Competence if any
    const digitalOs = val('r-computing-os'), digitalSw = val('r-computing-software');
    if (digitalOs || digitalSw) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Digital Competence</div>`;
      if (digitalOs) htmlEp += `<div class="ep-row" style="display:flex;font-size:0.78rem;margin-bottom:3px;line-height:1.5;"><span class="ep-label" style="width:145px;flex-shrink:0;font-weight:600;color:#333333;">Operating systems</span><span style="color:#222222;">${esc(digitalOs)}</span></div>`;
      if (digitalSw) htmlEp += `<div class="ep-row" style="display:flex;font-size:0.78rem;margin-bottom:3px;line-height:1.5;"><span class="ep-label" style="width:145px;flex-shrink:0;font-weight:600;color:#333333;">Software</span><span style="color:#222222;">${esc(digitalSw)}</span></div>`;
    }

    // Skills / Capabilities: each line becomes one clean individual bullet item
    const skillItemsEp = [];
    const skillSetEp = new Set();
    const addSkillEp = (raw) => {
      if (!raw) return;
      const clean = raw.trim().replace(/^[-•*✓✔■\d+.)\s]+/, '').trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (skillSetEp.has(key)) return;
      skillSetEp.add(key);
      skillItemsEp.push(clean);
    };

    const strengthsEp = val('r-strengths');
    if (strengthsEp) {
      strengthsEp.split('\n').forEach(addSkillEp);
    }
    if (skills) {
      skills.split(/[\n,]/).forEach(addSkillEp);
    }
    if (skillItemsEp.length > 0) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>Skills / Capabilities</div>
        <ul class="ep-list" style="margin:4px 0 8px 0;padding-left:0;list-style:none;">
          ${skillItemsEp.map(s => `<li style="margin-bottom:3px;font-size:0.80rem;line-height:1.5;color:#222222;display:flex;align-items:flex-start;break-inside:avoid;page-break-inside:avoid;">
            <span style="color:#004494;font-size:1.1rem;line-height:1;margin-right:8px;display:inline-block;flex-shrink:0;">&bull;</span>
            <span>${esc(s)}</span>
          </li>`).join('')}
        </ul>`;
    }

    // References if included
    const referencesEp = val('r-references');
    const incRefElEp = document.getElementById('r-include-references');
    const showRefsEp = incRefElEp ? incRefElEp.checked : (referencesEp.trim().length > 0);
    if (referencesEp && showRefsEp) {
      htmlEp += `<div class="ep-bar" ${epBarStyle}>References</div><p style="font-size:0.80rem;line-height:1.55;color:#333333;margin:4px 0 8px 0;">${esc(referencesEp).replace(/\n/g, '<br>')}</p>`;
    }

    htmlEp += `</div>`;
    preview.innerHTML = htmlEp;

  } else if (currentTmpl === 'gulf') {
    const dobG = val('r-dob'), natG = val('r-nationality');
    const titleG = val('r-title'), passportG = val('r-passport'), drivingG = document.getElementById('r-driving-license')?.value || '';
    const visaG = val('r-visa-status'), linkedinG = val('r-linkedin');

    const photoHtmlG = photoDataUrl
      ? `<div class="gulf-photo-wrap" style="display:inline-block;width:90px;height:115px;min-width:90px;min-height:115px;max-width:90px;max-height:115px;border-radius:4px;overflow:hidden;box-sizing:border-box;"><img class="gulf-photo" src="${photoDataUrl}" alt="${esc(name)}" width="90" height="115" style="display:block;width:90px;height:115px;min-width:90px;min-height:115px;max-width:90px;max-height:115px;border-radius:4px;object-fit:cover;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.25);box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>`
      : `<div class="gulf-photo-wrap" style="display:inline-block;width:90px;height:115px;min-width:90px;min-height:115px;max-width:90px;max-height:115px;border-radius:4px;overflow:hidden;box-sizing:border-box;"><div class="gulf-photo placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:90px;height:115px;min-width:90px;min-height:115px;max-width:90px;max-height:115px;border-radius:4px;background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.45);color:#DCE4EC;font-size:0.72rem;text-align:center;box-sizing:border-box;"><span style="font-size:1.15rem;margin-bottom:2px;">📷</span><span>Photo</span></div></div>`;

    const contactItems = [];
    if (phone) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Phone:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(phone)}</span></span>`);
    if (email) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Email:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(email)}</span></span>`);
    if (loc) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Location:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(loc)}</span></span>`);
    if (linkedinG) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">LinkedIn:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(linkedinG)}</span></span>`);
    if (natG) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Nationality:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(natG)}</span></span>`);
    if (dobG) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">DOB:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(dobG)}</span></span>`);
    if (passportG) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Passport:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(passportG)}</span></span>`);
    if (visaG) contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Visa Status:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(visaG)}</span></span>`);
    if (drivingG && drivingG.toLowerCase() !== 'no') {
      contactItems.push(`<span class="gulf-contact-item" style="display:inline-block;margin-right:18px;margin-bottom:4px;white-space:nowrap;font-size:0.75rem;color:#DCE4EC;"><strong class="gulf-c-lbl" style="color:#B9C6D4;font-weight:600;">Driving License:</strong>&nbsp;<span class="gulf-c-val" style="color:#ffffff;">${esc(drivingG)}</span></span>`);
    }

    let html = `<div class="gulf-header" style="background-color:#22405C;background:#22405C;color:#ffffff;padding:20px 24px;box-sizing:border-box;width:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <table class="gulf-header-table" style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;">
        <tr>
          <td class="gulf-header-info-cell" style="vertical-align:top;padding:0 16px 0 0;border:none;">
            <h3 class="gulf-name" style="color:#ffffff;font-family:'IBM Plex Sans',sans-serif;font-size:1.55rem;font-weight:700;margin:0 0 3px 0;letter-spacing:0.02em;line-height:1.2;">${esc(name)}</h3>
            ${titleG ? `<div class="gulf-title" style="color:#B9C6D4;font-size:0.88rem;font-weight:600;margin-bottom:8px;letter-spacing:0.03em;text-transform:uppercase;">${esc(titleG)}</div>` : ''}
            ${contactItems.length ? `<div class="gulf-contact-grid" style="margin-top:8px;line-height:1.6;">${contactItems.join('')}</div>` : ''}
          </td>
          <td class="gulf-header-photo-cell" style="vertical-align:top;width:95px;min-width:95px;max-width:95px;text-align:right;padding:0;border:none;">
            ${photoHtmlG}
          </td>
        </tr>
      </table>
    </div><div class="gulf-body" style="padding:20px 26px;">`;

    // 1. Profile section
    if (summary) {
      html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Profile</div><p class="gulf-summary" style="font-size:0.82rem;line-height:1.55;color:#2D3748;margin:0 0 14px 0;">${esc(summary)}</p>`;
    }

    // 2. Education section
    let eduHtmlG = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value.trim() || '';
      const inst = b.querySelector('.edu-inst')?.value.trim() || '';
      const dates = b.querySelector('.edu-dates')?.value.trim() || '';
      const gpa = b.querySelector('.edu-gpa')?.value.trim() || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      if (!degree && !inst) return;
      let gpaLine = '';
      if (gpa) {
        const label = scale === '4' ? 'CGPA' : 'GPA';
        gpaLine = ` • ${label}: ${esc(gpa)}/${parseFloat(scale || 5).toFixed(2)}`;
      }
      eduHtmlG += `<div class="gulf-edu-entry" style="margin-bottom:10px;">
        <table style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;">
          <tr>
            <td class="gulf-edu-dates" style="width:120px;min-width:120px;max-width:120px;vertical-align:top;padding:0 12px 4px 0;font-weight:700;font-size:0.78rem;color:#4A5568;white-space:nowrap;border:none;">
              ${esc(dates)}
            </td>
            <td class="gulf-edu-content" style="vertical-align:top;padding:0 0 4px 0;border:none;">
              <div class="gulf-edu-degree" style="font-weight:700;font-size:0.84rem;color:#1A202C;">${esc(degree)}${gpaLine}</div>
              <div class="gulf-edu-inst" style="font-size:0.80rem;color:#555555;margin-top:2px;">${esc(inst)}</div>
            </td>
          </tr>
        </table>
      </div>`;
    });
    if (eduHtmlG) {
      html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Education</div>${eduHtmlG}`;
    }

    // 3. Personal Skills section
    const skillsRaw = val('r-skills') || val('r-strengths');
    if (skillsRaw) {
      const items = skillsRaw
        .split(/[,;\n]/)
        .map(s => s.trim().replace(/^[-•*✓✔■]\s*/, ''))
        .filter(Boolean);
      if (items.length > 0) {
        html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Personal Skills</div><div class="gulf-personal-skills" style="margin:0 0 10px 0;">${items.map(i => `<span class="gulf-skill-pill" style="display:inline-block;margin-right:18px;margin-bottom:6px;font-size:0.80rem;color:#222222;white-space:nowrap;"><span style="color:#2E9E4F;font-weight:700;margin-right:6px;">✓</span><span>${esc(i)}</span></span>`).join('')}</div>`;
      }
    }

    // 4. Software Skills section
    let swRows = '';
    document.querySelectorAll('#sw-skill-list .repeat-block').forEach(b => {
      const swName = b.querySelector('.sw-name')?.value || '';
      if (!swName) return;
      const lvl = parseInt(b.querySelector('.sw-level')?.value) || 0;
      let segs = '';
      for (let i = 1; i <= 6; i++) {
        segs += `<span class="${i <= lvl ? 'filled' : ''}" style="width:14px;height:8px;border-radius:1px;background:${i <= lvl ? '#22405C' : '#DDDDDD'};display:inline-block;margin-right:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></span>`;
      }
      swRows += `<div class="gulf-bar-row" style="display:flex;align-items:center;margin-bottom:6px;font-size:0.78rem;"><span class="lbl" style="width:150px;min-width:150px;flex-shrink:0;">${esc(swName)}</span><div class="gulf-bar-segs" style="display:inline-flex;">${segs}</div></div>`;
    });
    if (swRows) {
      html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Software Skills</div>${swRows}`;
    }

    // 5. Language Proficiency section
    let glangRows = '';
    document.querySelectorAll('#gulf-lang-list .repeat-block').forEach(b => {
      const lname = b.querySelector('.glang-name')?.value || '';
      if (!lname) return;
      const lvl = parseInt(b.querySelector('.glang-level')?.value) || 0;
      let dots = '';
      for (let i = 1; i <= 6; i++) {
        dots += `<span class="${i <= lvl ? 'filled' : ''}" style="width:9px;height:9px;border-radius:50%;background:${i <= lvl ? '#22405C' : '#DDDDDD'};display:inline-block;margin-right:4px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></span>`;
      }
      glangRows += `<div class="gulf-bar-row" style="display:flex;align-items:center;margin-bottom:6px;font-size:0.78rem;"><span class="lbl" style="width:150px;min-width:150px;flex-shrink:0;">${esc(lname)}</span><div class="gulf-dot-segs" style="display:inline-flex;">${dots}</div></div>`;
    });
    if (glangRows) {
      html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Language Proficiency</div>${glangRows}`;
    }

    // 6. Hobbies section
    const hobbiesG = val('r-hobbies');
    if (hobbiesG) {
      const items = hobbiesG.split(/[,;\n]/).map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (items.length > 0) {
        html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Hobbies</div><div class="gulf-hobbies-row" style="margin-bottom:10px;font-size:0.80rem;">${items.map(i => `<span style="display:inline-block;margin-right:18px;margin-bottom:4px;"><span style="color:#22405C;font-weight:700;margin-right:4px;">✓</span>${esc(i)}</span>`).join('')}</div>`;
      }
    }

    // 7. Training Courses section
    const trainingG = val('r-training');
    if (trainingG) {
      const items = trainingG.split('\n').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (items.length > 0) {
        html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Training Courses</div><ul class="gulf-square-list" style="list-style:none;margin:0 0 10px 0;padding:0;font-size:0.80rem;">${items.map(i => `<li style="margin-bottom:4px;padding-left:16px;position:relative;"><span style="color:#22405C;margin-right:6px;">■</span>${esc(i)}</li>`).join('')}</ul>`;
      }
    }

    // 8. Experience section (if present)
    let expHtmlG = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value.trim() || '';
      const company = b.querySelector('.exp-company')?.value.trim() || '';
      const dates = b.querySelector('.exp-dates')?.value.trim() || '';
      const locv = b.querySelector('.exp-loc')?.value.trim() || '';
      const desc = b.querySelector('.exp-desc')?.value.trim() || '';
      if (!role && !company) return;

      const subLine = [company, locv].filter(Boolean).join(' • ');
      let descFormatted = '';
      if (desc) {
        const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 1 || lines[0].startsWith('-') || lines[0].startsWith('•') || lines[0].startsWith('*')) {
          descFormatted = `<ul class="gulf-exp-bullets" style="list-style:none;margin:4px 0 0 0;padding:0;font-size:0.80rem;color:#333333;">${lines.map(l => `<li style="position:relative;padding-left:14px;margin-bottom:3px;line-height:1.45;"><span style="position:absolute;left:2px;color:#22405C;font-weight:700;">•</span>${esc(l.replace(/^[-•*✓]\s*/, ''))}</li>`).join('')}</ul>`;
        } else {
          descFormatted = `<p class="gulf-exp-desc" style="font-size:0.80rem;line-height:1.5;color:#333333;margin:4px 0 0 0;">${esc(desc)}</p>`;
        }
      }

      expHtmlG += `<div class="gulf-exp-entry" style="margin-bottom:12px;">
        <div class="gulf-exp-top" style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
          <span class="gulf-exp-role" style="font-weight:700;font-size:0.84rem;color:#1A202C;">${esc(role)}</span>
          <span class="gulf-exp-dates" style="font-weight:600;font-size:0.78rem;color:#4A5568;white-space:nowrap;">${esc(dates)}</span>
        </div>
        ${subLine ? `<div class="gulf-exp-company" style="font-size:0.82rem;font-weight:600;color:#22405C;margin:2px 0 4px 0;">${esc(subLine)}</div>` : ''}
        ${descFormatted}
      </div>`;
    });
    if (expHtmlG) {
      html += `<div class="gulf-sec-title" style="font-weight:700;font-size:0.86rem;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1.5px solid #22405C;padding-bottom:4px;margin:16px 0 10px 0;color:#22405C;">Work Experience</div>${expHtmlG}`;
    }

    html += `</div>`;
    preview.innerHTML = html;

  } else if (currentTmpl === 'academic') {
    const researchInterests = val('r-research-interests');
    const awardsRaw = val('r-awards');
    let pubHtml = '';
    document.querySelectorAll('#pub-list .repeat-block').forEach(b => {
      const t = b.querySelector('.pub-title')?.value || '', v = b.querySelector('.pub-venue')?.value || '', y = b.querySelector('.pub-year')?.value || '';
      if (!t) return;
      pubHtml += `<div class="ac-pub-entry">${esc(t)}${v ? '. ' + esc(v) : ''}${y ? ' (' + esc(y) + ')' : ''}.</div>`;
    });
    let confHtmlAc = '';
    document.querySelectorAll('#conf-list .repeat-block').forEach(b => {
      const t = b.querySelector('.conf-title')?.value || '', v = b.querySelector('.conf-venue')?.value || '', y = b.querySelector('.conf-year')?.value || '';
      if (!t) return;
      confHtmlAc += `<div class="ac-pub-entry">${esc(t)}${v ? '. ' + esc(v) : ''}${y ? ' (' + esc(y) + ')' : ''}.</div>`;
    });

    // LinkedIn details in Academic template
    const linkedin = val('r-linkedin');
    const contactAc = [email, phone, loc, linkedin].filter(Boolean).join(' • ');

    // Photo for Academic template if provided (kept strictly within dimensions)
    let photoHtmlAc = '';
    if (photoDataUrl) {
      photoHtmlAc = `<div class="ac-photo-wrap" style="float:right;margin:0 0 12px 16px;width:80px;height:100px;overflow:hidden;border-radius:3px;border:1px solid #D9E1E8;"><img src="${photoDataUrl}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`;
    }

    // Do NOT display Professional Title anywhere in Academic preview
    let htmlAc = `${photoHtmlAc}<h3>${esc(name)}</h3><div class="contact">${esc(contactAc)}</div>`;

    if (researchInterests) {
      const rParas = researchInterests.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const rContent = rParas.length > 0
        ? rParas.map(p => `<p class="ac-research-para">${esc(p)}</p>`).join('')
        : `<p class="ac-research-para">${esc(researchInterests)}</p>`;
      htmlAc += `<div class="section-title">Research Interests</div>${rContent}`;
    }
    if (summary) {
      const summaryParas = summary.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const summaryContent = summaryParas.length > 0
        ? summaryParas.map(p => `<p class="ac-summary-para">${esc(p)}</p>`).join('')
        : `<p class="ac-summary-para">${esc(summary)}</p>`;
      htmlAc += `<div class="section-title">Profile</div>${summaryContent}`;
    }
    if (eduHtml) htmlAc += `<div class="section-title">Education</div>${eduHtml}`;
    if (expHtml) htmlAc += `<div class="section-title">Academic & Professional Experience</div>${expHtml}`;
    if (pubHtml) htmlAc += `<div class="section-title">Publications</div>${pubHtml}`;
    if (confHtmlAc) htmlAc += `<div class="section-title">Conferences & Presentations</div>${confHtmlAc}`;
    if (awardsRaw) {
      const items = awardsRaw.split('\n').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (items.length > 0) {
        htmlAc += `<div class="section-title">Grants & Awards</div><ul class="ac-awards-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
      }
    }
    if (skills) {
      const skillItems = skills
        .split(/[\n,]/)
        .map(s => s.trim().replace(/^[-•*✓✔■]\s*/, ''))
        .filter(Boolean);
      if (skillItems.length > 0) {
        htmlAc += `<div class="section-title">Skills</div><ul class="ac-skills-list">${skillItems.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
      }
    }

    // Languages in Academic template: clean list, NO scores, NO proficiency ratings/levels/dots, NO duplicates
    const langSetAc = new Set();
    const cleanLangsAc = [];

    const addLangAc = (raw) => {
      if (!raw) return;
      let clean = raw
        .replace(/^[-•*✓✔■]\s*/, '')
        .replace(/\s*\((?:Level\s*\d+|\d+\/\d+|\d+%\s*|Score:[^)]*|Reading:[^)]*)\)/gi, '')
        .trim();
      if (!clean) return;
      const key = clean.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
      if (!key || langSetAc.has(key)) return;
      langSetAc.add(key);
      cleanLangsAc.push(clean);
    };

    const rawLangsAc = val('r-languages');
    if (rawLangsAc) {
      rawLangsAc.split(/[\n,]/).forEach(item => addLangAc(item));
    }
    document.querySelectorAll('#lang-list .repeat-block').forEach(b => {
      const n = b.querySelector('.lang-name')?.value?.trim() || '';
      addLangAc(n);
    });
    document.querySelectorAll('#gulf-lang-list .repeat-block').forEach(b => {
      const n = b.querySelector('.glang-name')?.value?.trim() || '';
      addLangAc(n);
    });

    if (cleanLangsAc.length > 0) {
      htmlAc += `<div class="section-title">Languages</div><ul class="ac-languages-list">${cleanLangsAc.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    }

    const referencesAc = val('r-references');
    const incRefElAc = document.getElementById('r-include-references');
    const showRefsAc = incRefElAc ? incRefElAc.checked : (referencesAc.trim().length > 0);
    if (referencesAc && showRefsAc) {
      const refParas = referencesAc.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const refContent = refParas.length > 0
        ? refParas.map(p => `<p class="ac-references-para">${esc(p)}</p>`).join('')
        : `<p class="ac-references-para">${esc(referencesAc)}</p>`;
      htmlAc += `<div class="section-title">References</div>${refContent}`;
    }
    preview.innerHTML = htmlAc;

  } else if (currentTmpl === 'modern') {
    const titleM = val('r-title');
    const linkedinM = val('r-linkedin');
    const summaryM = val('r-summary');
    const skillsM = val('r-skills');
    const trainingM = val('r-training');
    const referencesM = val('r-references');
    const incRefElM = document.getElementById('r-include-references');
    const showRefsM = incRefElM ? incRefElM.checked : (referencesM.trim().length > 0);

    // Modern Header
    let contactItems = [];
    if (email) contactItems.push(esc(email));
    if (phone) contactItems.push(esc(phone));
    if (loc) contactItems.push(esc(loc));
    if (linkedinM) {
      const cleanLi = linkedinM.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      contactItems.push(`LinkedIn: ${esc(cleanLi)}`);
    }

    let headerHtml = `<div class="modern-header">`;
    headerHtml += `<h3 class="modern-name">${esc(name)}</h3>`;
    if (titleM) {
      headerHtml += `<div class="modern-title">${esc(titleM)}</div>`;
    }
    if (contactItems.length > 0) {
      headerHtml += `<div class="modern-contact">${contactItems.join(' &bull; ')}</div>`;
    }
    headerHtml += `</div>`;

    let htmlM = headerHtml;

    // Summary
    if (summaryM) {
      htmlM += `<div class="modern-sec-header">Summary</div>`;
      htmlM += `<p class="modern-summary">${esc(summaryM)}</p>`;
    }

    // Experience
    let expHtmlM = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value?.trim() || '';
      const company = b.querySelector('.exp-company')?.value?.trim() || '';
      const dates = b.querySelector('.exp-dates')?.value?.trim() || '';
      const locv = b.querySelector('.exp-loc')?.value?.trim() || '';
      const desc = b.querySelector('.exp-desc')?.value?.trim() || '';
      if (!role && !company) return;

      let descHtml = '';
      if (desc) {
        const lines = desc.split('\n').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
        if (lines.length > 1 || desc.startsWith('-') || desc.startsWith('•') || desc.startsWith('*')) {
          descHtml = `<ul class="modern-bullets">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
        } else {
          descHtml = `<p class="modern-desc">${esc(desc)}</p>`;
        }
      }

      expHtmlM += `<div class="modern-entry">
        <table class="modern-entry-tbl" style="width:100%;border-collapse:collapse;border:none;margin:0 0 2px 0;">
          <tr>
            <td style="border:none;padding:0;text-align:left;font-weight:700;font-size:0.88rem;color:#111827;">${esc(role)}</td>
            <td style="border:none;padding:0;text-align:right;font-size:0.80rem;color:#4B5563;white-space:nowrap;">${esc(dates)}</td>
          </tr>
        </table>
        ${(company || locv) ? `<table class="modern-entry-sub-tbl" style="width:100%;border-collapse:collapse;border:none;margin:0 0 4px 0;">
          <tr>
            <td style="border:none;padding:0;text-align:left;font-weight:600;font-size:0.82rem;color:#374151;">${esc(company)}</td>
            <td style="border:none;padding:0;text-align:right;font-size:0.78rem;color:#6B7280;white-space:nowrap;">${esc(locv)}</td>
          </tr>
        </table>` : ''}
        ${descHtml}
      </div>`;
    });

    if (expHtmlM) {
      htmlM += `<div class="modern-sec-header">Experience</div>${expHtmlM}`;
    }

    // Education
    let eduHtmlM = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value?.trim() || '';
      const inst = b.querySelector('.edu-inst')?.value?.trim() || '';
      const locv = b.querySelector('.edu-loc')?.value?.trim() || '';
      const dates = b.querySelector('.edu-dates')?.value?.trim() || '';
      const gpa = b.querySelector('.edu-gpa')?.value?.trim() || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value?.trim() || '';
      if (!degree && !inst) return;

      let gpaLine = '';
      if (gpa) {
        const label = scale === '4' ? 'CGPA' : 'GPA';
        const maxScale = parseFloat(scale || 5).toFixed(2);
        gpaLine = `${label}: ${esc(gpa)} / ${maxScale}`;
        if (classDiv) gpaLine += ` (${esc(classDiv)})`;
      } else if (classDiv) {
        gpaLine = esc(classDiv);
      }

      eduHtmlM += `<div class="modern-entry">
        <table class="modern-entry-tbl" style="width:100%;border-collapse:collapse;border:none;margin:0 0 2px 0;">
          <tr>
            <td style="border:none;padding:0;text-align:left;font-weight:700;font-size:0.88rem;color:#111827;">${esc(degree)}</td>
            <td style="border:none;padding:0;text-align:right;font-size:0.80rem;color:#4B5563;white-space:nowrap;">${esc(dates)}</td>
          </tr>
        </table>
        <table class="modern-entry-sub-tbl" style="width:100%;border-collapse:collapse;border:none;margin:0 0 4px 0;">
          <tr>
            <td style="border:none;padding:0;text-align:left;font-weight:600;font-size:0.82rem;color:#374151;">${locv ? `${esc(inst)}, ${esc(locv)}` : esc(inst)}</td>
            <td style="border:none;padding:0;text-align:right;font-size:0.78rem;color:#4B5563;white-space:nowrap;">${gpaLine}</td>
          </tr>
        </table>
      </div>`;
    });

    if (eduHtmlM) {
      htmlM += `<div class="modern-sec-header">Education</div>${eduHtmlM}`;
    }

    // Skills
    if (skillsM) {
      const skillList = skillsM.split(/[\n,]/).map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (skillList.length > 0) {
        const currentSkillsMode = skillsDisplayMode || document.getElementById('r-skills')?.dataset.skillsMode || 'list';
        htmlM += `<div class="modern-sec-header">Skills</div>`;
        if (currentSkillsMode === 'summary') {
          htmlM += `<p class="modern-skills-summary">${skillList.map(esc).join(', ')}</p>`;
        } else {
          htmlM += `<ul class="modern-skills-list">${skillList.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
        }
      }
    }

    // Training & Certifications
    if (trainingM) {
      const certItems = trainingM.split('\n').map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean);
      if (certItems.length > 0) {
        htmlM += `<div class="modern-sec-header">Certifications</div>`;
        htmlM += `<ul class="modern-cert-list">${certItems.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
      }
    }

    // References
    if (referencesM && showRefsM) {
      const refParas = referencesM.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      if (refParas.length > 0) {
        htmlM += `<div class="modern-sec-header">References</div>`;
        htmlM += `<div class="modern-references">${refParas.map(p => `<p class="modern-ref-para">${esc(p)}</p>`).join('')}</div>`;
      }
    }

    preview.innerHTML = htmlM;

  } else {
    // classic template (matching reference image)
    const nameCl = name || 'Your Name';
    const titleCl = val('r-title');

    // Classic Header: Candidate Name, Title, and Contact Row
    const contactItemsCl = [];
    if (phone) {
      contactItemsCl.push({
        icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle;display:inline-block;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        text: phone
      });
    }
    if (loc) {
      contactItemsCl.push({
        icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle;display:inline-block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        text: loc
      });
    }
    if (email) {
      contactItemsCl.push({
        icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle;display:inline-block;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
        text: email
      });
    }

    let contactRowHtml = '';
    if (contactItemsCl.length > 0) {
      let cells = '';
      if (contactItemsCl.length === 3) {
        cells = `
          <td style="width:33.33%;text-align:left;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[0].icon}<span>${esc(contactItemsCl[0].text)}</span></span>
          </td>
          <td style="width:33.33%;text-align:center;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[1].icon}<span>${esc(contactItemsCl[1].text)}</span></span>
          </td>
          <td style="width:33.33%;text-align:right;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[2].icon}<span>${esc(contactItemsCl[2].text)}</span></span>
          </td>`;
      } else if (contactItemsCl.length === 2) {
        cells = `
          <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[0].icon}<span>${esc(contactItemsCl[0].text)}</span></span>
          </td>
          <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[1].icon}<span>${esc(contactItemsCl[1].text)}</span></span>
          </td>`;
      } else {
        cells = `
          <td style="width:100%;text-align:center;border:none;padding:0;vertical-align:middle;">
            <span class="classic-contact-item">${contactItemsCl[0].icon}<span>${esc(contactItemsCl[0].text)}</span></span>
          </td>`;
      }
      contactRowHtml = `
        <div class="classic-contact-wrap">
          <table class="classic-contact-tbl" style="width:100%;border-collapse:collapse;border:none;">
            <tr>${cells}</tr>
          </table>
        </div>`;
    }

    // Helper for Classic Section Header with horizontal rule
    const renderClassicSecHeader = (title) => `
      <div class="classic-sec-header">
        <div class="classic-sec-title">${esc(title)}</div>
        <div class="classic-sec-rule"></div>
      </div>`;

    // 1. ABOUT ME (mapped from summary)
    let aboutMeHtmlCl = '';
    if (summary) {
      aboutMeHtmlCl = renderClassicSecHeader('ABOUT ME') +
        `<div class="classic-about-para">${esc(summary)}</div>`;
    }

    // 2. EDUCATION (two-column structural alignment)
    let eduEntriesHtmlCl = '';
    document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
      const degree = b.querySelector('.edu-degree')?.value?.trim() || '';
      const inst = b.querySelector('.edu-inst')?.value?.trim() || '';
      const dates = b.querySelector('.edu-dates')?.value?.trim() || '';
      const gpa = b.querySelector('.edu-gpa')?.value?.trim() || '';
      const scale = b.querySelector('.edu-scale')?.value || '5';
      const classDiv = b.querySelector('.edu-class')?.value?.trim() || '';
      const group = b.querySelector('.edu-group')?.value?.trim() || '';
      const note = b.querySelector('.edu-note')?.value?.trim() || '';
      if (!degree && !inst) return;

      const extraBits = [];
      if (group) extraBits.push(`Major: ${esc(group)}`);
      if (gpa) {
        const label = scale === '4' ? 'CGPA' : 'GPA';
        const maxScale = parseFloat(scale || 5).toFixed(2);
        extraBits.push(`${label}: ${esc(gpa)} / ${maxScale}${classDiv ? ` (${esc(classDiv)})` : ''}`);
      } else if (classDiv) {
        extraBits.push(esc(classDiv));
      }
      if (note) extraBits.push(esc(note));

      const detailsHtml = extraBits.length > 0
        ? `<div class="classic-entry-desc">${extraBits.join(' &bull; ')}</div>`
        : '';

      eduEntriesHtmlCl += `
        <table class="classic-entry-tbl" style="width:100%;table-layout:fixed;border-collapse:collapse;border:none;margin-bottom:12px;">
          <tbody>
            <tr>
              <td class="classic-entry-left" style="width:205px;vertical-align:top;padding:0 18px 0 0;border:none;">
                <div class="classic-entry-dates">${esc(dates)}</div>
                <div class="classic-entry-inst">${esc(inst)}</div>
              </td>
              <td class="classic-entry-right" style="vertical-align:top;padding:0;border:none;">
                <div class="classic-entry-title">${esc(degree)}</div>
                ${detailsHtml}
              </td>
            </tr>
          </tbody>
        </table>`;
    });

    let eduSecHtmlCl = '';
    if (eduEntriesHtmlCl) {
      eduSecHtmlCl = renderClassicSecHeader('EDUCATION') + eduEntriesHtmlCl;
    }

    // 3. EXPERIENCE (two-column structural alignment)
    let expEntriesHtmlCl = '';
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value?.trim() || '';
      const company = b.querySelector('.exp-company')?.value?.trim() || '';
      const dates = b.querySelector('.exp-dates')?.value?.trim() || '';
      const locv = b.querySelector('.exp-loc')?.value?.trim() || '';
      const desc = b.querySelector('.exp-desc')?.value?.trim() || '';
      if (!role && !company) return;

      let descHtml = '';
      if (desc) {
        const rawLines = desc.split('\n').map(s => s.trim()).filter(Boolean);
        const cleanBullets = rawLines.map(s => s.replace(/^[-•*✓✔■·\s]+/, '').trim()).filter(Boolean);
        if (cleanBullets.length > 1 || desc.startsWith('-') || desc.startsWith('•') || desc.startsWith('*')) {
          descHtml = `<ul class="classic-bullets" style="margin:3px 0 0 0;padding-left:16px;list-style-type:disc;">
            ${cleanBullets.map(x => `<li style="font-size:0.80rem;color:#374151;margin-bottom:2px;line-height:1.45;">${esc(x)}</li>`).join('')}
          </ul>`;
        } else {
          descHtml = `<p class="classic-entry-desc" style="margin:2px 0 0 0;font-size:0.80rem;color:#374151;line-height:1.45;">${esc(cleanBullets[0] || desc)}</p>`;
        }
      }

      expEntriesHtmlCl += `
        <table class="classic-entry-tbl" style="width:100%;table-layout:fixed;border-collapse:collapse;border:none;margin-bottom:12px;">
          <tbody>
            <tr>
              <td class="classic-entry-left" style="width:205px;vertical-align:top;padding:0 18px 0 0;border:none;">
                <div class="classic-entry-dates">${esc(dates)}</div>
                <div class="classic-entry-inst">${esc(company)}${locv ? `<div class="classic-entry-subloc" style="font-size:0.77rem;color:#6b7280;margin-top:1px;">${esc(locv)}</div>` : ''}</div>
              </td>
              <td class="classic-entry-right" style="vertical-align:top;padding:0;border:none;">
                <div class="classic-entry-title">${esc(role)}</div>
                ${descHtml}
              </td>
            </tr>
          </tbody>
        </table>`;
    });

    let expSecHtmlCl = '';
    if (expEntriesHtmlCl) {
      expSecHtmlCl = renderClassicSecHeader('EXPERIENCE') + expEntriesHtmlCl;
    }

    // 4. SKILLS (clean 4-column bullet layout)
    let skillsSecHtmlCl = '';
    if (skills) {
      const skillListCl = skills
        .split(/[\n,]/)
        .map(s => s.replace(/^[-•*✓✔■·\s]+/, '').trim())
        .filter(Boolean);
      if (skillListCl.length > 0) {
        const numCols = 4;
        const numRows = Math.ceil(skillListCl.length / numCols);
        let rowsHtml = '';
        for (let r = 0; r < numRows; r++) {
          let cellsHtml = '';
          for (let c = 0; c < numCols; c++) {
            const idx = r * numCols + c;
            if (idx < skillListCl.length) {
              cellsHtml += `
                <td style="width:25%;vertical-align:top;padding:2px 8px 3px 0;border:none;">
                  <div class="classic-skill-bullet" style="display:flex;align-items:flex-start;gap:6px;font-size:0.80rem;color:#111827;line-height:1.4;">
                    <span style="font-size:0.95rem;line-height:1.1;color:#111827;">&bull;</span>
                    <span style="font-weight:500;">${esc(skillListCl[idx])}</span>
                  </div>
                </td>`;
            } else {
              cellsHtml += `<td style="width:25%;border:none;padding:0;"></td>`;
            }
          }
          rowsHtml += `<tr>${cellsHtml}</tr>`;
        }
        skillsSecHtmlCl = renderClassicSecHeader('SKILLS') +
          `<table class="classic-skills-tbl" style="width:100%;table-layout:fixed;border-collapse:collapse;border:none;margin-top:4px;">
            <tbody>${rowsHtml}</tbody>
          </table>`;
      }
    }

    // 5. REFERENCES (Optional - multi-column side-by-side)
    let refSecHtmlCl = '';
    const referencesCl = val('r-references');
    const incRefElCl = document.getElementById('r-include-references');
    const showRefsCl = incRefElCl ? incRefElCl.checked : (referencesCl.trim().length > 0);

    if (referencesCl && showRefsCl) {
      const refBlocks = referencesCl
        .split(/\n\s*\n/)
        .map(b => b.trim())
        .filter(Boolean);

      if (refBlocks.length > 0) {
        const numRefCols = Math.min(refBlocks.length, 3);
        const colWidth = numRefCols === 1 ? '100%' : numRefCols === 2 ? '50%' : '33.33%';

        let refRowsHtml = '';
        for (let i = 0; i < refBlocks.length; i += numRefCols) {
          const rowBlocks = refBlocks.slice(i, i + numRefCols);
          let cellsHtml = '';
          rowBlocks.forEach((block, bIdx) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            const refName = lines[0] || '';
            const refTitle = lines[1] || '';
            const refOthers = lines.slice(2);
            const pr = bIdx < rowBlocks.length - 1 ? '20px' : '0';
            cellsHtml += `
              <td style="width:${colWidth};vertical-align:top;padding:0 ${pr} 8px 0;border:none;">
                <div class="classic-ref-name" style="font-size:0.85rem;font-weight:700;color:#111827;line-height:1.35;">${esc(refName)}</div>
                ${refTitle ? `<div class="classic-ref-sub" style="font-size:0.79rem;color:#374151;margin-top:1px;line-height:1.35;">${esc(refTitle)}</div>` : ''}
                ${refOthers.map(o => `<div class="classic-ref-contact" style="font-size:0.78rem;color:#4b5563;margin-top:1px;line-height:1.35;">${esc(o)}</div>`).join('')}
              </td>`;
          });
          while (rowBlocks.length < numRefCols) {
            cellsHtml += `<td style="width:${colWidth};border:none;padding:0;"></td>`;
            rowBlocks.push('');
          }
          refRowsHtml += `<tr>${cellsHtml}</tr>`;
        }

        refSecHtmlCl = renderClassicSecHeader('REFERENCES') +
          `<table class="classic-ref-tbl" style="width:100%;table-layout:fixed;border-collapse:collapse;border:none;margin-top:4px;">
            <tbody>${refRowsHtml}</tbody>
          </table>`;
      }
    }

    // Outer frame enclosing all Classic resume content
    preview.innerHTML = `
      <div class="classic-frame">
        <h1 class="classic-name">${esc(nameCl)}</h1>
        ${titleCl ? `<div class="classic-title">${esc(titleCl)}</div>` : ''}
        ${contactRowHtml}
        ${aboutMeHtmlCl}
        ${eduSecHtmlCl}
        ${expSecHtmlCl}
        ${skillsSecHtmlCl}
        ${refSecHtmlCl}
      </div>`;
  }

  if (!targetEl) saveData();
}

// Auto-save & Restore with full integrity
let saveTimer;
let isRestoringData = false;

function saveDataImmediate() {
  if (isRestoringData) return;
  clearTimeout(saveTimer);
  try {
    const data = collectData();
    localStorage.setItem('deskwork_draft_v1', JSON.stringify(data));
  } catch (e) {
    console.warn('Draft save warning:', e);
  }
}

function saveData() {
  if (isRestoringData) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDataImmediate();
  }, 400);
}

function collectData() {
  const exp = [];
  document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
    exp.push({
      role: b.querySelector('.exp-role')?.value || '',
      company: b.querySelector('.exp-company')?.value || '',
      dates: b.querySelector('.exp-dates')?.value || '',
      loc: b.querySelector('.exp-loc')?.value || '',
      desc: b.querySelector('.exp-desc')?.value || '',
      descMode: b.querySelector('.exp-desc')?.dataset.mode || 'summary'
    });
  });

  const edu = [];
  document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
    edu.push({
      degree: b.querySelector('.edu-degree')?.value || '',
      inst: b.querySelector('.edu-inst')?.value || '',
      dates: b.querySelector('.edu-dates')?.value || '',
      gpa: b.querySelector('.edu-gpa')?.value || '',
      scale: b.querySelector('.edu-scale')?.value || '5',
      classDiv: b.querySelector('.edu-class')?.value || '',
      group: b.querySelector('.edu-group')?.value || '',
      board: b.querySelector('.edu-board')?.value || '',
      note: b.querySelector('.edu-note')?.value || '',
      loc: b.querySelector('.edu-loc')?.value || ''
    });
  });

  const langList = [];
  document.querySelectorAll('#lang-list .repeat-block').forEach(b => {
    langList.push({
      name: b.querySelector('.lang-name')?.value || '',
      reading: b.querySelector('.lang-reading')?.value || 'Good',
      writing: b.querySelector('.lang-writing')?.value || 'Good',
      speaking: b.querySelector('.lang-speaking')?.value || 'Good',
      epLevel: b.querySelector('.lang-level-ep')?.value || ''
    });
  });

  const gulfLangList = [];
  document.querySelectorAll('#gulf-lang-list .repeat-block').forEach(b => {
    gulfLangList.push({
      name: b.querySelector('.glang-name')?.value || '',
      level: b.querySelector('.glang-level')?.value || '3'
    });
  });

  const pubList = [];
  document.querySelectorAll('#pub-list .repeat-block').forEach(b => {
    pubList.push({
      title: b.querySelector('.pub-title')?.value || '',
      venue: b.querySelector('.pub-venue')?.value || '',
      year: b.querySelector('.pub-year')?.value || ''
    });
  });

  const confList = [];
  document.querySelectorAll('#conf-list .repeat-block').forEach(b => {
    confList.push({
      title: b.querySelector('.conf-title')?.value || '',
      venue: b.querySelector('.conf-venue')?.value || '',
      year: b.querySelector('.conf-year')?.value || ''
    });
  });

  const swSkillList = [];
  document.querySelectorAll('#sw-skill-list .repeat-block').forEach(b => {
    swSkillList.push({
      name: b.querySelector('.sw-name')?.value || '',
      level: b.querySelector('.sw-level')?.value || '3'
    });
  });

  const incRefEl = document.getElementById('r-include-references');
  const includeReferences = incRefEl ? incRefEl.checked : (val('r-references').trim().length > 0);

  return {
    template: resumeTemplate,
    name: val('r-name'),
    title: val('r-title'),
    email: val('r-email'),
    phone: val('r-phone'),
    location: val('r-location'),
    linkedin: val('r-linkedin'),
    summary: val('r-summary'),
    skills: val('r-skills'),
    dob: val('r-dob'),
    nationality: val('r-nationality'),
    father: val('r-father'),
    mother: val('r-mother'),
    marital: document.getElementById('r-marital')?.value || '',
    religion: val('r-religion'),
    gender: document.getElementById('r-gender')?.value || '',
    nid: val('r-nid'),
    presentAddr: val('r-present-addr'),
    permanentAddr: val('r-permanent-addr'),
    training: val('r-training'),
    languages: val('r-languages'),
    references: val('r-references'),
    includeReferences: includeReferences,
    passport: val('r-passport'),
    visaStatus: val('r-visa-status'),
    drivingLicense: document.getElementById('r-driving-license')?.value || '',
    hobbies: val('r-hobbies'),
    researchInterests: val('r-research-interests'),
    awards: val('r-awards'),
    computingOs: val('r-computing-os'),
    computingSoftware: val('r-computing-software'),
    strengths: val('r-strengths'),
    strengthsMode: document.getElementById('r-strengths')?.dataset.mode || 'list',
    skillsDisplayMode: skillsDisplayMode || document.getElementById('r-skills')?.dataset.skillsMode || 'list',
    photoDataUrl: photoDataUrl || '',
    signatureDataUrl: signatureDataUrl || '',
    exp,
    edu,
    langList,
    gulfLangList,
    pubList,
    confList,
    swSkillList
  };
}

function loadSavedData() {
  let raw;
  try {
    raw = localStorage.getItem('deskwork_draft_v1');
  } catch (e) {
    return false;
  }
  if (!raw) return false;

  let d;
  try {
    d = JSON.parse(raw);
  } catch (e) {
    return false;
  }

  isRestoringData = true;
  try {
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el && v !== undefined && v !== null) el.value = v;
    };

    setVal('r-name', d.name);
    setVal('r-title', d.title);
    setVal('r-email', d.email);
    setVal('r-phone', d.phone);
    setVal('r-location', d.location);
    setVal('r-linkedin', d.linkedin);
    setVal('r-summary', d.summary);
    setVal('r-skills', d.skills);
    setVal('r-dob', d.dob);
    setVal('r-nationality', d.nationality);
    setVal('r-father', d.father);
    setVal('r-mother', d.mother);
    if (d.marital !== undefined) {
      const maritalEl = document.getElementById('r-marital');
      if (maritalEl) maritalEl.value = d.marital;
    }
    setVal('r-religion', d.religion);
    if (d.gender !== undefined) {
      const genderEl = document.getElementById('r-gender');
      if (genderEl) genderEl.value = d.gender;
    }
    setVal('r-nid', d.nid);
    setVal('r-present-addr', d.presentAddr);
    setVal('r-permanent-addr', d.permanentAddr);
    setVal('r-training', d.training);
    setVal('r-languages', d.languages);
    setVal('r-references', d.references);
    setVal('r-passport', d.passport);
    setVal('r-visa-status', d.visaStatus);
    if (d.drivingLicense !== undefined) {
      const dlEl = document.getElementById('r-driving-license');
      if (dlEl) dlEl.value = d.drivingLicense;
    }
    setVal('r-hobbies', d.hobbies);
    setVal('r-research-interests', d.researchInterests);
    setVal('r-awards', d.awards);
    setVal('r-computing-os', d.computingOs);
    setVal('r-computing-software', d.computingSoftware);
    setVal('r-strengths', d.strengths);
    if (d.strengthsMode && typeof setStrengthsMode === 'function') {
      setStrengthsMode(d.strengthsMode);
    }
    if (d.skillsDisplayMode && typeof setSkillsDisplayMode === 'function') {
      setSkillsDisplayMode(d.skillsDisplayMode);
    }

    const incRefEl = document.getElementById('r-include-references');
    if (incRefEl && d.includeReferences !== undefined) {
      incRefEl.checked = !!d.includeReferences;
    }

    if (d.photoDataUrl) {
      photoDataUrl = d.photoDataUrl;
      syncResumePhotoUI();
    }
    if (d.signatureDataUrl) {
      signatureDataUrl = d.signatureDataUrl;
      syncResumeSigUI();
    }

    // Restore exp
    const expList = document.getElementById('exp-list');
    if (expList && d.exp && d.exp.length) {
      expList.innerHTML = '';
      d.exp.forEach(item => {
        addExp();
        const block = expList.lastElementChild;
        if (block) {
          if (block.querySelector('.exp-role')) block.querySelector('.exp-role').value = item.role || '';
          if (block.querySelector('.exp-company')) block.querySelector('.exp-company').value = item.company || '';
          if (block.querySelector('.exp-dates')) block.querySelector('.exp-dates').value = item.dates || '';
          if (block.querySelector('.exp-loc')) block.querySelector('.exp-loc').value = item.loc || '';
          if (block.querySelector('.exp-desc')) {
            const descEl = block.querySelector('.exp-desc');
            descEl.value = item.desc || '';
            const mode = item.descMode || (item.desc && item.desc.includes('\n') ? 'list' : 'summary');
            descEl.dataset.mode = mode;
            const pills = block.querySelectorAll('.desc-mode-group .btn-mode-pill');
            pills.forEach(p => p.classList.toggle('active', p.dataset.mode === mode));
          }
        }
      });
    }

    // Restore edu
    const eduList = document.getElementById('edu-list');
    if (eduList && d.edu && d.edu.length) {
      eduList.innerHTML = '';
      d.edu.forEach(item => {
        addEdu();
        const block = eduList.lastElementChild;
        if (block) {
          if (block.querySelector('.edu-degree')) block.querySelector('.edu-degree').value = item.degree || '';
          if (block.querySelector('.edu-inst')) block.querySelector('.edu-inst').value = item.inst || '';
          if (block.querySelector('.edu-dates')) block.querySelector('.edu-dates').value = item.dates || '';
          if (block.querySelector('.edu-scale')) block.querySelector('.edu-scale').value = item.scale || '5';
          if (block.querySelector('.edu-gpa')) block.querySelector('.edu-gpa').value = item.gpa || '';
          if (block.querySelector('.edu-class')) block.querySelector('.edu-class').value = item.classDiv || '';
          if (block.querySelector('.edu-group')) block.querySelector('.edu-group').value = item.group || '';
          if (block.querySelector('.edu-board')) block.querySelector('.edu-board').value = item.board || '';
          if (block.querySelector('.edu-note')) block.querySelector('.edu-note').value = item.note || '';
          if (block.querySelector('.edu-loc')) block.querySelector('.edu-loc').value = item.loc || '';
        }
      });
    }

    // Restore langList (#lang-list)
    const langListEl = document.getElementById('lang-list');
    if (langListEl && d.langList && d.langList.length) {
      langListEl.innerHTML = '';
      d.langList.forEach(item => {
        addLangRow();
        const block = langListEl.lastElementChild;
        if (block) {
          if (block.querySelector('.lang-name')) block.querySelector('.lang-name').value = item.name || '';
          if (block.querySelector('.lang-reading')) block.querySelector('.lang-reading').value = item.reading || 'Good';
          if (block.querySelector('.lang-writing')) block.querySelector('.lang-writing').value = item.writing || 'Good';
          if (block.querySelector('.lang-speaking')) block.querySelector('.lang-speaking').value = item.speaking || 'Good';
          if (block.querySelector('.lang-level-ep')) block.querySelector('.lang-level-ep').value = item.epLevel || normalizeEuropassLangLevel(item.speaking || item.reading || 'Good');
        }
      });
    }

    // Restore gulfLangList (#gulf-lang-list)
    const gulfLangListEl = document.getElementById('gulf-lang-list');
    if (gulfLangListEl && d.gulfLangList && d.gulfLangList.length) {
      gulfLangListEl.innerHTML = '';
      d.gulfLangList.forEach(item => {
        addGulfLangRow();
        const block = gulfLangListEl.lastElementChild;
        if (block) {
          if (block.querySelector('.glang-name')) block.querySelector('.glang-name').value = item.name || '';
          if (block.querySelector('.glang-level')) block.querySelector('.glang-level').value = item.level || '3';
        }
      });
    }

    // Restore pubList (#pub-list)
    const pubListEl = document.getElementById('pub-list');
    if (pubListEl && d.pubList && d.pubList.length) {
      pubListEl.innerHTML = '';
      d.pubList.forEach(item => {
        addPubRow();
        const block = pubListEl.lastElementChild;
        if (block) {
          if (block.querySelector('.pub-title')) block.querySelector('.pub-title').value = item.title || '';
          if (block.querySelector('.pub-venue')) block.querySelector('.pub-venue').value = item.venue || '';
          if (block.querySelector('.pub-year')) block.querySelector('.pub-year').value = item.year || '';
        }
      });
    }

    // Restore confList (#conf-list)
    const confListEl = document.getElementById('conf-list');
    if (confListEl && d.confList && d.confList.length) {
      confListEl.innerHTML = '';
      d.confList.forEach(item => {
        addConfRow();
        const block = confListEl.lastElementChild;
        if (block) {
          if (block.querySelector('.conf-title')) block.querySelector('.conf-title').value = item.title || '';
          if (block.querySelector('.conf-venue')) block.querySelector('.conf-venue').value = item.venue || '';
          if (block.querySelector('.conf-year')) block.querySelector('.conf-year').value = item.year || '';
        }
      });
    }

    // Restore swSkillList (#sw-skill-list)
    const swListEl = document.getElementById('sw-skill-list');
    if (swListEl && d.swSkillList && d.swSkillList.length) {
      swListEl.innerHTML = '';
      d.swSkillList.forEach(item => {
        addSwSkillRow();
        const block = swListEl.lastElementChild;
        if (block) {
          if (block.querySelector('.sw-name')) block.querySelector('.sw-name').value = item.name || '';
          if (block.querySelector('.sw-level')) block.querySelector('.sw-level').value = item.level || '3';
        }
      });
    }

    if (d.template) {
      setTemplate(d.template);
    }
  } finally {
    isRestoringData = false;
  }

  updateFieldVisibility();
  renderAll();
  return true;
}

window.addEventListener('beforeunload', saveDataImmediate);
window.addEventListener('pagehide', saveDataImmediate);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveDataImmediate();
});

// Auto-drafting
function autoDraftSummary() {
  const roles = [], degrees = [];
  document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
    const role = b.querySelector('.exp-role')?.value.trim();
    if (role) roles.push(role);
  });
  document.querySelectorAll('#edu-list .repeat-block').forEach(b => {
    const degree = b.querySelector('.edu-degree')?.value.trim();
    if (degree) degrees.push(degree);
  });
  const skillsRaw = val('r-skills');
  const skillList = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (roles.length === 0 && degrees.length === 0 && skillList.length === 0) {
    showToast('Add a role, education, or a few skills first, then try again.');
    return;
  }
  let opening = roles.length > 0 ? `${roles[0]} with hands-on experience` : (degrees.length > 0 ? `${degrees[0]} graduate` : 'Motivated professional');
  let skillsPart = skillList.length > 0 ? ` Skilled in ${skillList.slice(0, 3).join(', ')}.` : '';
  let eduPart = (degrees.length > 0 && roles.length > 0) ? ` Holds a ${degrees[0]}.` : '';
  const closer = ' Focused on delivering measurable results and growing within a collaborative team.';
  const draft = opening + '.' + eduPart + skillsPart + closer;
  const el = document.getElementById('r-summary');
  if (el) el.value = draft.replace(/\s+/g, ' ').trim();
  renderPreview();
  showToast('Draft added - feel free to customize it.');
}

function autoDraftStrengths() {
  if (resumeTemplate === 'europass') {
    const roles = [];
    document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
      const role = b.querySelector('.exp-role')?.value.trim();
      if (role) roles.push(role);
    });
    const skillsRaw = val('r-skills');
    const skillList = skillsRaw ? skillsRaw.split(/[\n,]/).map(s => s.trim().replace(/^[-•*✓✔■]\s*/, '')).filter(Boolean) : [];
    const bullets = [];
    skillList.forEach(s => { if (!bullets.includes(s)) bullets.push(s); });
    roles.forEach(r => { if (!bullets.includes(r)) bullets.push(r); });
    if (bullets.length === 0) {
      bullets.push('Project Management', 'Team Leadership', 'Communication', 'Problem Solving');
    }
    const el = document.getElementById('r-strengths');
    if (el) el.value = bullets.join('\n');
    renderAll();
    showToast('Skills drafted.');
    return;
  }
  const roles = [];
  document.querySelectorAll('#exp-list .repeat-block').forEach(b => {
    const role = b.querySelector('.exp-role')?.value.trim();
    if (role) roles.push(role);
  });
  const skillsRaw = val('r-skills');
  const skillList = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const bullets = [];
  if (roles.length > 0) bullets.push(`Proven track record as a ${roles[0]}, delivering high-quality results.`);
  if (skillList.length > 0) bullets.push(`Proficient with ${skillList.slice(0, 3).join(', ')}, applied in real projects.`);
  bullets.push('Strong ability to manage deadlines, collaborate cross-functionally, and solve complex problems.');
  const el = document.getElementById('r-strengths');
  if (el) el.value = bullets.join('\n');
  renderAll();
  showToast('Strengths drafted.');
}

// ---- Document Preview Modal & PDF Generation Engine ----
let currentPreviewDocType = null;
let previewOriginalFocusElement = null;
let isDocPreviewZoomFit = false;

function applyDocPreviewZoom() {
  const paper = document.getElementById('doc-preview-paper');
  const viewport = document.getElementById('doc-preview-viewport');
  const stage = document.querySelector('.doc-preview-paper-stage');
  const btn = document.getElementById('doc-preview-zoom-btn');
  if (!paper || !viewport) return;

  if (isDocPreviewZoomFit) {
    const padX = 32;
    const padY = 48;
    const availW = Math.max(200, viewport.clientWidth - padX);
    const availH = Math.max(200, viewport.clientHeight - padY);
    const paperW = 794;
    const paperH = Math.max(1123, paper.scrollHeight || 1123);

    // Calculate scale to fit width and single-page height nicely
    const scaleW = availW / paperW;
    const scaleH = availH / 1123;
    const fitScale = Math.min(scaleW, scaleH, 1.0);
    const scale = Math.max(0.3, Math.round(fitScale * 100) / 100);

    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = 'top center';
    paper.style.transition = 'transform 0.15s ease-out';
    if (stage) {
      stage.style.width = Math.round(paperW * scale) + 'px';
      stage.style.height = Math.round(paperH * scale) + 'px';
      stage.style.transition = 'width 0.15s ease-out, height 0.15s ease-out';
    }
    if (btn) {
      btn.innerHTML = '🔍 100% Size';
      btn.title = 'Switch to actual 100% size';
    }
  } else {
    paper.style.transform = '';
    paper.style.transformOrigin = '';
    paper.style.transition = '';
    if (stage) {
      stage.style.width = '';
      stage.style.height = '';
      stage.style.transition = '';
    }
    if (btn) {
      btn.innerHTML = '🔍 Fit to Screen';
      btn.title = 'Fit document preview to screen';
    }
  }
}

function toggleDocPreviewZoom() {
  isDocPreviewZoomFit = !isDocPreviewZoomFit;
  applyDocPreviewZoom();
}

window.addEventListener('resize', () => {
  if (isDocPreviewZoomFit) {
    applyDocPreviewZoom();
  }
});

function renderPageBoundaries() {
  const paper = document.getElementById('doc-preview-paper');
  const content = document.getElementById('doc-preview-content');
  if (!paper || !content) return;

  // Clear existing page break indicators
  document.querySelectorAll('.doc-page-break-indicator').forEach(el => el.remove());

  // A4 printable height at 96 DPI is ~1123px (297mm)
  const pageHeight = 1123;
  const contentHeight = content.offsetHeight;

  // If content spans beyond standard single A4 page height (with small buffer)
  if (contentHeight > (pageHeight + 40)) {
    const totalPages = Math.ceil(contentHeight / pageHeight);
    for (let p = 1; p < totalPages; p++) {
      const breakY = p * pageHeight;
      const indicator = document.createElement('div');
      indicator.className = 'doc-page-break-indicator';
      indicator.style.top = `${breakY}px`;
      indicator.innerHTML = `<span class="doc-page-badge">Page ${p} End &bull; Page ${p + 1} Start</span>`;
      paper.appendChild(indicator);
    }
  }
}

function openDocumentPreview(type) {
  try {
    const modal = document.getElementById('doc-preview-modal');
    const content = document.getElementById('doc-preview-content');
    const titleEl = document.getElementById('doc-preview-title');
    const subtitleEl = document.getElementById('doc-preview-subtitle');
    if (!modal || !content) return;

    currentPreviewDocType = type || 'resume';
    previewOriginalFocusElement = document.activeElement;

    let sourceEl = null;
    let title = 'Document Preview';
    let subtitle = 'A4 Paper • Print-Ready';

    if (currentPreviewDocType === 'resume') {
      renderAll();
      sourceEl = document.getElementById('preview');
      const tmplName = (typeof resumeTemplate !== 'undefined' && resumeTemplate) ? resumeTemplate.toUpperCase() : 'CLASSIC';
      title = 'Resume Document Preview';
      subtitle = `Template: ${tmplName} • A4 Format`;
    } else if (currentPreviewDocType === 'japan') {
      renderJapan();
      sourceEl = document.getElementById('jp-preview');
      title = 'Japanese Rirekisho Preview';
      subtitle = 'JIS Standard (履歴書) • A4 Format';
    } else if (currentPreviewDocType === 'letter') {
      renderLetter();
      sourceEl = document.getElementById('letter-preview');
      title = 'Formal Letter Preview';
      subtitle = 'Standard A4 • Print-Ready Format';
    }

    if (!sourceEl) {
      showToast('The preview could not be generated. Please check the form and try again.');
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    // Deep clone the source element content and preserve all inline styles and classes
    content.className = sourceEl.className;
    content.style.cssText = sourceEl.style.cssText;
    content.innerHTML = sourceEl.innerHTML;

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    isDocPreviewZoomFit = false;
    applyDocPreviewZoom();

    // Delay boundary calculation slightly to allow fonts & layout rendering to settle
    setTimeout(() => {
      renderPageBoundaries();
      const downloadBtn = document.getElementById('doc-modal-btn-download');
      if (downloadBtn && typeof downloadBtn.focus === 'function') {
        downloadBtn.focus();
      }
    }, 60);

  } catch (err) {
    console.error('Failed to open document preview:', err);
    showToast('The preview could not be generated. Please check the form and try again.');
  }
}

function closeDocumentPreview() {
  const modal = document.getElementById('doc-preview-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.querySelectorAll('.doc-page-break-indicator').forEach(el => el.remove());
  const content = document.getElementById('doc-preview-content');
  if (content) {
    content.innerHTML = '';
    content.className = '';
    content.removeAttribute('style');
  }
  isDocPreviewZoomFit = false;
  applyDocPreviewZoom();
  if (previewOriginalFocusElement && typeof previewOriginalFocusElement.focus === 'function') {
    try { previewOriginalFocusElement.focus(); } catch (e) {}
  }
}

// Mutex lock / Promise chain to guarantee fully serialized PDF export operations
let pdfExportPromiseChain = Promise.resolve();
let isPdfExportInProgress = false;

// Helper: Ensure all template web fonts are fully fetched and rasterization is ready
async function ensureAllFontsReady() {
  if (!document.fonts) return;
  try {
    const fontFaces = [
      '400 14px "IBM Plex Sans"',
      '500 14px "IBM Plex Sans"',
      '600 14px "IBM Plex Sans"',
      '700 14px "IBM Plex Sans"',
      '400 16px "Fraunces"',
      '500 16px "Fraunces"',
      '600 16px "Fraunces"',
      '700 16px "Fraunces"'
    ];
    await Promise.allSettled(fontFaces.map(f => document.fonts.load(f)));
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font readiness notice:', e);
  }
}

// Helper: Ensure all images within the container are completely loaded and decoded into GPU/compositor
async function ensureContainerImagesReady(container) {
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length === 0) return;

  await Promise.all(imgs.map(img => {
    return new Promise(resolve => {
      const finish = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(resolve).catch(resolve);
        } else {
          resolve();
        }
      };

      if (img.complete && img.naturalWidth > 0) {
        finish();
      } else {
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 1500); // Safety fallback timeout
      }
    });
  }));
}

// Helper: Deterministic Layout Stability Check
// Verifies that critical container, image, and text block measurements remain strictly stable across consecutive animation frames
async function ensureLayoutStability(container, maxCycles = 30) {
  // Guarantee browser has processed DOM insertion and performed initial layout
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const getSnapshot = () => {
    const rect = container.getBoundingClientRect();
    const imgs = Array.from(container.querySelectorAll('img')).map(img => {
      const r = img.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    }).join('|');

    // Structural child element positions and dimensions to catch text reflows or font shifts
    const keyElements = Array.from(container.querySelectorAll('h1, h2, h3, .section-title, .entry, table, .i2-sidebar, .sb-side, .classic-frame, .bd-top, .bd2-bar, .gulf-header, .ep-header'));
    const elementsGeo = keyElements.slice(0, 15).map(el => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.top - rect.top)}:${Math.round(r.height)}`;
    }).join(';');

    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      offsetHeight: container.offsetHeight,
      scrollHeight: container.scrollHeight,
      imgs,
      elementsGeo
    };
  };

  let consecutiveStable = 0;
  let lastSnapshot = null;

  for (let i = 0; i < maxCycles; i++) {
    // Force layout reflow calculation
    void container.offsetHeight;
    const snap = getSnapshot();

    // Verify images are constrained to realistic layout dimensions (not raw unstyled natural dimensions)
    const imgsUnconstrained = Array.from(container.querySelectorAll('img')).some(img => {
      const r = img.getBoundingClientRect();
      return r.width > 250 || r.height > 250 || r.width === 0 || r.height === 0;
    });

    if (lastSnapshot) {
      const isSame =
        snap.width === lastSnapshot.width &&
        snap.height === lastSnapshot.height &&
        snap.offsetHeight === lastSnapshot.offsetHeight &&
        snap.scrollHeight === lastSnapshot.scrollHeight &&
        snap.imgs === lastSnapshot.imgs &&
        snap.elementsGeo === lastSnapshot.elementsGeo;

      if (isSame && snap.height > 0 && snap.width === 794 && !imgsUnconstrained) {
        consecutiveStable++;
        if (consecutiveStable >= 3) {
          return snap;
        }
      } else {
        consecutiveStable = 0;
      }
    }

    lastSnapshot = snap;
    await new Promise(r => requestAnimationFrame(r));
  }
  return lastSnapshot;
}

// Internal core PDF export implementation
async function executeDownloadPdfInternal(overrideDocType, overrideTemplate, isTestMode = false) {
  isPdfExportInProgress = true;

  const targetDocType = overrideDocType || currentPreviewDocType || 'resume';
  const targetTemplate = overrideTemplate || (typeof resumeTemplate !== 'undefined' ? resumeTemplate : 'classic');

  // 1. Ensure state updates are committed and UI DOM preview is refreshed
  if (targetDocType === 'resume') {
    resumeTemplate = targetTemplate;
    renderAll();
  } else if (targetDocType === 'japan') {
    renderJapan();
  } else if (targetDocType === 'letter') {
    renderLetter();
  }

  const btn = document.getElementById('doc-modal-btn-download');
  const oldText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Preparing PDF...</span>`;
  }
  if (!isTestMode) {
    showToast('Generating high-resolution PDF...');
  }

  let sandbox = null;

  try {
    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass || typeof window.html2canvas !== 'function') {
      throw new Error('PDF generation libraries not loaded');
    }

    // 2. Pre-fetch and await all core web fonts before building export DOM
    await ensureAllFontsReady();

    // 3. Create isolated clean export container with full visibility and zero transforms/transitions
    // We attach it at highest z-index without negative positioning to guarantee full rasterization & compositing priority
    sandbox = document.createElement('div');
    sandbox.id = 'clean-pdf-export-sandbox';
    sandbox.style.cssText = 'position:fixed;top:0;left:0;width:794px;min-width:794px;max-width:794px;margin:0;padding:0;background:#ffffff;z-index:999999;box-sizing:border-box;overflow:visible;pointer-events:none;visibility:visible;opacity:1;transform:none;transition:none;';

    const exportPaper = document.createElement('div');
    exportPaper.className = 'clean-pdf-export-paper';
    exportPaper.style.cssText = 'width:794px;min-width:794px;max-width:794px;margin:0;padding:0;background:#ffffff;box-sizing:border-box;border:none;box-shadow:none;transform:none;transition:none;';

    const exportContent = document.createElement('div');
    exportContent.id = 'clean-pdf-export-content';
    exportContent.className = 'resume-preview tmpl-' + targetTemplate;
    exportContent.style.cssText = 'width:794px;min-width:794px;max-width:794px;margin:0;box-sizing:border-box;background:#ffffff;border:none;box-shadow:none;transform:none;transition:none;';

    exportPaper.appendChild(exportContent);
    sandbox.appendChild(exportPaper);
    document.body.appendChild(sandbox);

    // 4. Render clean template instance into the export container
    if (targetDocType === 'resume') {
      renderPreview(exportContent, targetTemplate);
    } else if (targetDocType === 'japan') {
      renderJapan(exportContent);
      exportContent.className = 'resume-preview tmpl-jp';
    } else if (targetDocType === 'letter') {
      renderLetter(exportContent);
      exportContent.className = 'letter-preview';
    }

    // 5. Apply pristine styling rules for the target template
    if (targetTemplate === 'classic') {
      exportContent.style.padding = '24px';
      const classicStyleTag = document.createElement('style');
      classicStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-classic {
          font-family: 'IBM Plex Sans', sans-serif !important;
          color: #111827 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 24px !important;
        }
        #clean-pdf-export-content.tmpl-classic .classic-frame {
          border: 1.2px solid #111827 !important;
          padding: 28px 32px !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          min-height: 1040px !important;
        }
        #clean-pdf-export-content.tmpl-classic .classic-name {
          font-family: 'IBM Plex Sans', sans-serif !important;
          font-weight: 700 !important;
          font-size: 1.85rem !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          color: #111827 !important;
          margin: 0 0 6px 0 !important;
          line-height: 1.2 !important;
          text-align: center !important;
        }
        #clean-pdf-export-content.tmpl-classic .classic-title {
          font-family: 'IBM Plex Sans', sans-serif !important;
          font-weight: 500 !important;
          font-size: 0.88rem !important;
          letter-spacing: 0.22em !important;
          text-transform: uppercase !important;
          color: #374151 !important;
          margin: 0 0 14px 0 !important;
          line-height: 1.3 !important;
          text-align: center !important;
        }
        #clean-pdf-export-content.tmpl-classic .classic-contact-wrap { border-top: 1px solid #111827 !important; border-bottom: 1px solid #111827 !important; }
        #clean-pdf-export-content.tmpl-classic .classic-sec-header { margin: 16px 0 10px 0 !important; }
        #clean-pdf-export-content.tmpl-classic .classic-sec-title {
          font-family: 'IBM Plex Sans', sans-serif !important;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          color: #111827 !important;
          margin: 0 0 3px 0 !important;
          line-height: 1.2 !important;
        }
        #clean-pdf-export-content.tmpl-classic .classic-sec-rule { width: 100% !important; height: 1px !important; background-color: #111827 !important; }
      `;
      exportContent.prepend(classicStyleTag);

    } else if (targetTemplate === 'academic') {
      exportContent.style.padding = '34px 38px';
      const academicStyleTag = document.createElement('style');
      academicStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-academic {
          font-family: 'IBM Plex Sans', sans-serif !important;
          color: #111827 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 34px 38px !important;
        }
      `;
      exportContent.prepend(academicStyleTag);

    } else if (targetTemplate === 'bd') {
      exportContent.style.padding = '28px 32px';
      exportContent.style.fontFamily = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      exportContent.style.color = '#111827';
      const bdStyleTag = document.createElement('style');
      bdStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-bd {
          font-family: 'IBM Plex Sans', sans-serif !important;
          color: #111827 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          padding: 28px 32px !important;
          border: none !important;
          box-shadow: none !important;
        }
        #clean-pdf-export-content.tmpl-bd .bd-top { width: 100% !important; margin-bottom: 20px !important; }
        #clean-pdf-export-content.tmpl-bd table.bd-top { width: 100% !important; border-collapse: collapse !important; margin: 0 0 20px 0 !important; }
        #clean-pdf-export-content.tmpl-bd h3 { font-size: 1.7rem !important; font-weight: 700 !important; margin: 0 0 6px 0 !important; }
        #clean-pdf-export-content.tmpl-bd table.bd-contact-table { border-collapse: collapse !important; margin: 4px 0 0 0 !important; }
        #clean-pdf-export-content.tmpl-bd td.bd-contact-item { white-space: nowrap !important; font-size: 0.82rem !important; }
        #clean-pdf-export-content.tmpl-bd td.bd-contact-sep { padding: 0 10px !important; }
        #clean-pdf-export-content.tmpl-bd .bd-photo-box { width: 110px !important; height: 135px !important; border: 1.5px dashed #999999 !important; }
      `;
      exportContent.prepend(bdStyleTag);

    } else if (targetTemplate === 'bd2') {
      exportContent.style.fontFamily = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      exportContent.style.color = '#111827';
      exportContent.style.padding = '26px 30px';
      const bd2StyleTag = document.createElement('style');
      bd2StyleTag.textContent = `
        #clean-pdf-export-content.tmpl-bd2 {
          font-family: 'IBM Plex Sans', sans-serif !important;
          color: #111827 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          padding: 26px 30px !important;
          border: none !important;
          box-shadow: none !important;
        }
        #clean-pdf-export-content.tmpl-bd2 h3 { display: none !important; }
        #clean-pdf-export-content.tmpl-bd2 .bd2-title { text-align: center !important; font-family: 'Fraunces', Georgia, serif !important; font-weight: 700 !important; font-size: 1.35rem !important; margin: 0 0 10px 0 !important; color: #111827 !important; }
        #clean-pdf-export-content.tmpl-bd2 .bd2-top-table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; margin: 0 0 10px 0 !important; }
        #clean-pdf-export-content.tmpl-bd2 .bd2-bar { background: #D9D9D9 !important; font-weight: 700 !important; font-size: 0.84rem !important; padding: 4px 8px !important; margin: 10px 0 6px 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #clean-pdf-export-content.tmpl-bd2 table.bd2-lang { width: 100% !important; border-collapse: collapse !important; font-size: 0.78rem !important; }
        #clean-pdf-export-content.tmpl-bd2 table.bd2-lang th, #clean-pdf-export-content.tmpl-bd2 table.bd2-lang td { border: 1px solid #777777 !important; padding: 3px 6px !important; }
        #clean-pdf-export-content.tmpl-bd2 .bd2-photo { width: 85px !important; height: 102px !important; min-width: 85px !important; max-width: 85px !important; min-height: 102px !important; max-height: 102px !important; object-fit: cover !important; display: block !important; border: 1px solid #777777 !important; box-sizing: border-box !important; }
      `;
      exportContent.prepend(bd2StyleTag);

    } else if (targetTemplate === 'sidebar') {
      exportContent.style.padding = '0';
      exportContent.style.margin = '0';
      exportContent.style.display = 'table';
      exportContent.style.tableLayout = 'fixed';
      exportContent.style.borderCollapse = 'collapse';

      const sbSide = exportContent.querySelector('.sb-side');
      const sbMain = exportContent.querySelector('.sb-main');
      if (sbSide) {
        sbSide.style.display = 'table-cell';
        sbSide.style.width = '215px';
        sbSide.style.minWidth = '215px';
        sbSide.style.maxWidth = '215px';
        sbSide.style.verticalAlign = 'top';
        sbSide.style.backgroundColor = '#1B2430';
        sbSide.style.color = '#ffffff';
        sbSide.style.padding = '24px 18px';
        sbSide.style.boxSizing = 'border-box';
      }
      if (sbMain) {
        sbMain.style.display = 'table-cell';
        sbMain.style.verticalAlign = 'top';
        sbMain.style.backgroundColor = '#ffffff';
        sbMain.style.padding = '24px 26px';
        sbMain.style.boxSizing = 'border-box';
      }

    } else if (targetTemplate === 'modern') {
      exportContent.style.borderTop = '6px solid #1B2430';
      exportContent.style.padding = '32px 36px';
      const modernStyleTag = document.createElement('style');
      modernStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-modern {
          font-family: 'IBM Plex Sans', sans-serif !important;
          color: #111827 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          border-top: 6px solid #1B2430 !important;
          box-shadow: none !important;
          padding: 32px 36px !important;
        }
        #clean-pdf-export-content.tmpl-modern .modern-header { border-bottom: 2px solid #E5E7EB !important; padding-bottom: 12px !important; margin-bottom: 16px !important; }
        #clean-pdf-export-content.tmpl-modern .modern-sec-header { color: #ffffff !important; background: #1B2430 !important; padding: 3px 10px !important; margin: 16px 0 10px 0 !important; display: inline-block !important; border-radius: 2px !important; }
      `;
      exportContent.prepend(modernStyleTag);

    } else if (targetTemplate === 'compact') {
      exportContent.style.padding = '30px 34px';
      exportContent.style.fontFamily = "'IBM Plex Sans', Arial, sans-serif";
      exportContent.style.color = '#000000';
      const compactStyleTag = document.createElement('style');
      compactStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-compact {
          font-family: 'IBM Plex Sans', Arial, sans-serif !important;
          color: #000000 !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 30px 34px !important;
        }
        #clean-pdf-export-content.tmpl-compact h3 { text-align: center !important; font-size: 1.65rem !important; font-weight: 700 !important; margin: 0 0 4px 0 !important; }
        #clean-pdf-export-content.tmpl-compact .cp-subtitle { text-align: center !important; font-weight: 700 !important; font-size: .85rem !important; margin-bottom: 6px !important; }
        #clean-pdf-export-content.tmpl-compact .cp-contact { text-align: center !important; font-size: .8rem !important; margin-bottom: 16px !important; }
        #clean-pdf-export-content.tmpl-compact .cp-sec-title { font-size: .85rem !important; font-weight: 700 !important; text-transform: uppercase !important; border-bottom: 1.5px solid #000 !important; margin: 14px 0 8px 0 !important; padding-bottom: 2px !important; }
        #clean-pdf-export-content.tmpl-compact .cp-entry { margin-bottom: 10px !important; font-size: .82rem !important; }
        #clean-pdf-export-content.tmpl-compact .cp-org-row { display: flex !important; justify-content: space-between !important; font-weight: 700 !important; margin-bottom: 3px !important; }
      `;
      exportContent.prepend(compactStyleTag);

    } else if (targetTemplate === 'intl') {
      exportContent.style.padding = '0';
      exportContent.style.margin = '0';
      exportContent.style.display = 'flex';
      const intlStyleTag = document.createElement('style');
      intlStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-intl {
          font-family: 'IBM Plex Sans', sans-serif !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          display: flex !important;
        }
        #clean-pdf-export-content.tmpl-intl .i2-sidebar { width: 220px !important; min-width: 220px !important; max-width: 220px !important; background: #222e3c !important; color: #fff !important; padding: 24px 18px !important; box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #clean-pdf-export-content.tmpl-intl .i2-main { flex: 1 !important; min-width: 0 !important; background: #ffffff !important; }
        #clean-pdf-export-content.tmpl-intl .i2-header { background: #F4F5F6 !important; padding: 26px 30px !important; text-align: center !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #clean-pdf-export-content.tmpl-intl .i2-body { padding: 22px 30px !important; }
        #clean-pdf-export-content.tmpl-intl .i2-photo-wrap { text-align: center !important; margin-bottom: 18px !important; }
        #clean-pdf-export-content.tmpl-intl .i2-photo { width: 88px !important; height: 88px !important; min-width: 88px !important; max-width: 88px !important; min-height: 88px !important; max-height: 88px !important; border-radius: 50% !important; object-fit: cover !important; border: 3px solid #ffffff !important; display: inline-block !important; }
      `;
      exportContent.prepend(intlStyleTag);

    } else if (targetTemplate === 'gulf') {
      exportContent.style.padding = '0';
      exportContent.style.margin = '0';
      const gulfStyleTag = document.createElement('style');
      gulfStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-gulf {
          font-family: 'IBM Plex Sans', sans-serif !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        #clean-pdf-export-content.tmpl-gulf .gulf-header { background: #22405C !important; color: #ffffff !important; padding: 20px 24px !important; box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #clean-pdf-export-content.tmpl-gulf .gulf-body { padding: 20px 24px !important; }
        #clean-pdf-export-content.tmpl-gulf .gulf-photo { width: 90px !important; height: 115px !important; min-width: 90px !important; max-width: 90px !important; min-height: 115px !important; max-height: 115px !important; border-radius: 4px !important; object-fit: cover !important; border: 2px solid #ffffff !important; display: block !important; }
      `;
      exportContent.prepend(gulfStyleTag);

    } else if (targetTemplate === 'europass') {
      exportContent.style.padding = '0';
      exportContent.style.margin = '0';
      const europassStyleTag = document.createElement('style');
      europassStyleTag.textContent = `
        #clean-pdf-export-content.tmpl-europass {
          font-family: 'IBM Plex Sans', sans-serif !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          width: 794px !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          color: #222222 !important;
        }
        #clean-pdf-export-content.tmpl-europass .ep-header { background-color: #004494 !important; background: #004494 !important; box-shadow: inset 0 0 0 1000px #004494 !important; color: #ffffff !important; padding: 16px 22px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: block !important; width: 100% !important; box-sizing: border-box !important; }
        #clean-pdf-export-content.tmpl-europass .ep-header-table { width: 100% !important; border-collapse: collapse !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        #clean-pdf-export-content.tmpl-europass .ep-photo { width: 80px !important; height: 100px !important; min-width: 80px !important; max-width: 80px !important; min-height: 100px !important; max-height: 100px !important; object-fit: cover !important; border-radius: 2px !important; border: 1px solid rgba(255,255,255,0.45) !important; display: inline-block !important; vertical-align: middle !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportContent.prepend(europassStyleTag);
    }

    // 6. Ensure all images inside export container are fully loaded and decoded
    await ensureContainerImagesReady(exportContent);

    // 7. Ensure layout stability across consecutive animation frames before spacer calculations
    await ensureLayoutStability(exportContent);

    // 8. Apply smart multi-page boundary spacers now that typography & image geometry are verified stable
    const pageHeightPx = 1123;

    if (targetTemplate === 'academic') {
      if (exportContent.offsetHeight > pageHeightPx) {
        const cTop = exportContent.getBoundingClientRect().top;
        const blocks = exportContent.querySelectorAll('.section-title, .entry, .ac-pub-entry, .ac-list > li, .ac-skills-list > li, .ac-languages-list > li, .ac-awards-list > li, .ac-summary-para, .ac-research-para, .ac-references-para');
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isH = el.classList.contains('section-title') || el.tagName === 'H3';
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isH && top < boundary && (boundary - top) < 65) || (!isH && top < boundary && bottom > boundary && elHeight < 360)) {
            const spacerH = Math.ceil(boundary - top) + 4;
            const spacer = document.createElement('div');
            spacer.className = 'ac-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }

    } else if (targetTemplate === 'europass') {
      if (exportContent.offsetHeight > pageHeightPx) {
        const cTop = exportContent.getBoundingClientRect().top;
        const blocks = exportContent.querySelectorAll('.ep-bar, .entry, .ep-row, .ep-list > li, .ep-body > p');
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isBar = el.classList.contains('ep-bar');
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isBar && top < boundary && (boundary - top) < 65) || (!isBar && top < boundary && bottom > boundary && elHeight < 360)) {
            const spacerH = Math.ceil(boundary - top) + 2;
            const spacer = document.createElement('div');
            spacer.className = 'ep-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }

    } else if (targetTemplate === 'bd2') {
      const curH = exportContent.offsetHeight;
      if (curH > pageHeightPx && curH <= 1180) {
        exportContent.style.padding = '18px 24px';
        exportContent.querySelectorAll('.bd2-bar').forEach(b => {
          b.style.marginTop = '7px';
          b.style.marginBottom = '4px';
        });
      } else if (curH > 1180) {
        const cTop = exportContent.getBoundingClientRect().top;
        const allBlocks = Array.from(exportContent.querySelectorAll('.bd2-bar, .bd2-edu-entry, .bd2-exp-entry, .bd2-lang, .bd2-declaration-block'));
        const blocks = allBlocks.filter(el => !el.closest('.bd2-declaration-block') || el.classList.contains('bd2-declaration-block'));
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isBar = el.classList.contains('bd2-bar');
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isBar && top < boundary && (boundary - top) < 45) || (!isBar && top < boundary && bottom > boundary && elHeight < 280)) {
            const spacerH = Math.ceil(boundary - top) + 4;
            const spacer = document.createElement('div');
            spacer.className = 'bd2-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }

    } else if (targetTemplate === 'sidebar') {
      const sbSide = exportContent.querySelector('.sb-side');
      const sbMain = exportContent.querySelector('.sb-main');
      if (exportContent.offsetHeight > pageHeightPx && sbMain) {
        const cTop = exportContent.getBoundingClientRect().top;
        const blocks = sbMain.querySelectorAll('.section-title, .entry, .sb-entry, p, li');
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isH = el.classList.contains('section-title') || el.tagName === 'H3';
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isH && top < boundary && (boundary - top) < 65) || (!isH && top < boundary && bottom > boundary && elHeight < 360)) {
            const spacerH = Math.ceil(boundary - top) + 2;
            const spacer = document.createElement('div');
            spacer.className = 'sb-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }

      const totalPages = Math.max(1, Math.ceil(exportContent.offsetHeight / pageHeightPx));
      const targetHeightPx = totalPages * pageHeightPx;
      exportContent.style.height = `${targetHeightPx}px`;
      exportContent.style.minHeight = `${targetHeightPx}px`;
      if (sbSide) {
        sbSide.style.height = `${targetHeightPx}px`;
        sbSide.style.minHeight = `${targetHeightPx}px`;
      }
      if (sbMain) {
        sbMain.style.height = `${targetHeightPx}px`;
        sbMain.style.minHeight = `${targetHeightPx}px`;
      }

    } else if (targetTemplate === 'modern') {
      if (exportContent.offsetHeight > pageHeightPx) {
        const cTop = exportContent.getBoundingClientRect().top;
        const blocks = exportContent.querySelectorAll('.modern-sec-header, .modern-entry, .modern-summary, .modern-skills-list > li, .modern-cert-list > li, .modern-bullets > li, .modern-ref-para');
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isHeader = el.classList.contains('modern-sec-header');
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isHeader && top < boundary && (boundary - top) < 65) || (!isHeader && top < boundary && bottom > boundary && elHeight < 360)) {
            const spacerH = Math.ceil(boundary - top) + 4;
            const spacer = document.createElement('div');
            spacer.className = 'modern-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }

    } else if (targetTemplate === 'classic') {
      if (exportContent.offsetHeight > pageHeightPx) {
        const cTop = exportContent.getBoundingClientRect().top;
        const blocks = exportContent.querySelectorAll('.classic-sec-header, table.classic-entry-tbl, table.classic-ref-tbl, table.classic-skills-tbl tr, .classic-about-para');
        let curPage = 1;
        let boundary = curPage * pageHeightPx;
        blocks.forEach(el => {
          const r = el.getBoundingClientRect();
          const top = r.top - cTop;
          const bottom = r.bottom - cTop;
          const elHeight = bottom - top;
          const isHeader = el.classList.contains('classic-sec-header');
          while (top >= boundary) {
            curPage++;
            boundary = curPage * pageHeightPx;
          }
          if ((isHeader && top < boundary && (boundary - top) < 70) || (!isHeader && top < boundary && bottom > boundary && elHeight < 360)) {
            const spacerH = Math.ceil(boundary - top) + 4;
            const spacer = document.createElement('div');
            spacer.className = 'classic-pdf-spacer';
            spacer.style.cssText = `height:${spacerH}px;width:100%;margin:0;padding:0;border:none;display:block;`;
            el.parentNode.insertBefore(spacer, el);
            curPage++;
            boundary = curPage * pageHeightPx;
          }
        });
      }
    }

    // 9. Re-verify layout stability after spacer adjustments to guarantee final settled dimensions
    const finalStableLayout = await ensureLayoutStability(exportContent, 8);

    // 10. Capture high-fidelity canvas with strictly locked geometry
    const canvas = await html2canvas(exportContent, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        clonedDoc.body.style.width = '794px';
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.overflow = 'visible';
        const clonedExport = clonedDoc.getElementById('clean-pdf-export-content');
        if (clonedExport) {
          clonedExport.style.width = '794px';
          clonedExport.style.minWidth = '794px';
          clonedExport.style.maxWidth = '794px';
          clonedExport.style.boxSizing = 'border-box';
          clonedExport.style.border = 'none';
          clonedExport.style.boxShadow = 'none';
          clonedExport.style.background = '#ffffff';
          clonedExport.style.backgroundColor = '#ffffff';
        }
      }
    });

    // 11. Compile multi-page PDF document
    const pdf = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgHeight;
    let position = 0;
    let totalExportPages = 1;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    const pageThreshold = targetTemplate === 'bd2' ? 10 : 5;
    while (heightLeft > pageThreshold) {
      position -= pageHeight;
      pdf.addPage();
      totalExportPages++;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    let fileName = 'Document.pdf';
    if (targetDocType === 'resume') {
      const rawName = val('r-name') || 'Resume';
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Resume';
      fileName = `${cleanName}-${targetTemplate.toUpperCase()}-Resume.pdf`;
    } else if (targetDocType === 'japan') {
      const rawName = val('jp-fullname') || val('r-name') || 'Rirekisho';
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Rirekisho';
      fileName = `${cleanName}-Japanese-Rirekisho.pdf`;
    } else if (targetDocType === 'letter') {
      const rawName = val('l-yourname') || val('r-name') || 'Letter';
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Letter';
      fileName = `${cleanName}-Formal-Letter.pdf`;
    }

    if (!isTestMode) {
      pdf.save(fileName);
      showToast('PDF downloaded successfully!');
    }

    return {
      success: true,
      template: targetTemplate,
      height: finalStableLayout ? finalStableLayout.offsetHeight : exportContent.offsetHeight,
      width: finalStableLayout ? finalStableLayout.width : 794,
      pages: totalExportPages,
      imgs: finalStableLayout ? finalStableLayout.imgs : ''
    };

  } catch (err) {
    console.error('PDF export error:', err);
    if (!isTestMode) {
      showToast('Direct export encountered an issue. You can use the Print button to Save as PDF.');
    }
    return {
      success: false,
      template: targetTemplate,
      error: err.message
    };
  } finally {
    // 12. Clean up export DOM sandbox and reset button state
    if (sandbox && sandbox.parentNode) {
      sandbox.remove();
    }
    isPdfExportInProgress = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  }
}

// Serialized Export Wrapper: All exports pass through this mutex promise chain
function executeDownloadPdf(overrideDocType, overrideTemplate, isTestMode = false) {
  const task = async () => {
    return await executeDownloadPdfInternal(overrideDocType, overrideTemplate, isTestMode);
  };
  const op = pdfExportPromiseChain.then(task, task);
  pdfExportPromiseChain = op.catch(() => {});
  return op;
}

// Deterministic Stress Test across all 10 templates (3 full cycles + mixed-order cycle)
async function runPdfDeterministicStressTest(downloadFiles = false) {
  const standardSequence = [
    'classic',
    'modern',
    'compact',
    'intl',
    'academic',
    'bd',
    'bd2',
    'gulf',
    'sidebar',
    'europass'
  ];
  const mixedSequence = [
    'academic',
    'sidebar',
    'classic',
    'bd',
    'intl',
    'compact',
    'modern',
    'academic',
    'sidebar',
    'classic'
  ];

  console.log('===============================================================');
  console.log('STARTING DETERMINISTIC PDF EXPORT STRESS TEST (3 CYCLES + MIXED)');
  console.log('===============================================================');

  const cycleResults = {};
  const isTestMode = !downloadFiles;

  // Run 3 Complete Cycles
  for (let c = 1; c <= 3; c++) {
    console.log(`\n>>> [CYCLE ${c} OF 3] EXECUTING 10 TEMPLATES IN STANDARD ORDER >>>`);
    cycleResults[`cycle_${c}`] = {};
    for (const tmpl of standardSequence) {
      setTemplate(tmpl);
      const res = await executeDownloadPdf('resume', tmpl, isTestMode);
      cycleResults[`cycle_${c}`][tmpl] = res;
      console.log(`Cycle ${c} | ${tmpl.toUpperCase()}: height=${res.height}px, pages=${res.pages}, imgDims=${res.imgs || 'none'}`);
    }
  }

  // Run Mixed-Order Cycle
  console.log('\n>>> [MIXED ORDER CYCLE] EXECUTING IN ALTERNATING SEQUENCE >>>');
  cycleResults['mixed'] = [];
  for (let i = 0; i < mixedSequence.length; i++) {
    const tmpl = mixedSequence[i];
    setTemplate(tmpl);
    const res = await executeDownloadPdf('resume', tmpl, isTestMode);
    cycleResults['mixed'].push({ step: i + 1, tmpl, ...res });
    console.log(`Mixed #${i + 1} | ${tmpl.toUpperCase()}: height=${res.height}px, pages=${res.pages}`);
  }

  // Determinism Verification: Compare Cycle 1 vs Cycle 2 vs Cycle 3
  console.log('\n===============================================================');
  console.log('STRESS TEST VERIFICATION (CYCLE 1 vs CYCLE 2 vs CYCLE 3)');
  console.log('===============================================================');

  let isDeterministic = true;
  const discrepancies = [];

  for (const tmpl of standardSequence) {
    const c1 = cycleResults['cycle_1'][tmpl];
    const c2 = cycleResults['cycle_2'][tmpl];
    const c3 = cycleResults['cycle_3'][tmpl];

    const match12 = (c1.height === c2.height && c1.pages === c2.pages && c1.imgs === c2.imgs);
    const match23 = (c2.height === c3.height && c2.pages === c3.pages && c2.imgs === c3.imgs);

    if (!match12 || !match23) {
      isDeterministic = false;
      discrepancies.push({
        template: tmpl,
        cycle1: `${c1.height}px (${c1.pages}p, img:${c1.imgs})`,
        cycle2: `${c2.height}px (${c2.pages}p, img:${c2.imgs})`,
        cycle3: `${c3.height}px (${c3.pages}p, img:${c3.imgs})`
      });
      console.error(`❌ DISCREPANCY DETECTED for ${tmpl}:`, { c1, c2, c3 });
    } else {
      console.log(`✅ 100% DETERMINISTIC: ${tmpl.toUpperCase()} — identical across all 3 cycles (height: ${c1.height}px, pages: ${c1.pages}, images: ${c1.imgs || 'none'})`);
    }
  }

  if (isDeterministic) {
    console.log('\n🎉 ALL 10 TEMPLATES ARE 100% DETERMINISTIC FROM THE VERY FIRST DOWNLOAD!');
  } else {
    console.warn('\n⚠️ Discrepancies found:', discrepancies);
  }

  return { isDeterministic, discrepancies, cycleResults };
}

window.executeDownloadPdf = executeDownloadPdf;
window.runPdfDeterministicStressTest = runPdfDeterministicStressTest;
window.stressTestPdfExports = runPdfDeterministicStressTest;

function executePrintDoc() {
  window.print();
}

// PDF Export triggers preview first
function downloadResumePdf() {
  openDocumentPreview('resume');
}

// ---- Japan Format (Rirekisho) ----
function jpCheck(selected, valA, labelA, valB, labelB) {
  const a = selected === valA ? '■ ' : '□ ';
  const b = selected === valB ? '■ ' : '□ ';
  return `${a}${labelA}  ${b}${labelB}`;
}

function renderJapan(targetEl) {
  const preview = targetEl || document.getElementById('jp-preview');
  if (!preview) return;

  const name = val('jp-fullname') || val('r-name') || 'Your Name';
  const furigana = val('jp-furigana');
  const dob = val('jp-dob') || val('r-dob'), age = val('jp-age'), permAddr = val('jp-permanent-addr') || val('r-permanent-addr');
  const marriage = document.getElementById('jp-marriage')?.value || 'Unmarried';
  const photoHtml = jpPhotoDataUrl
    ? `<img class="jp-photo" src="${jpPhotoDataUrl}">`
    : `<div class="jp-photo placeholder">Photo (3x4cm)</div>`;

  let html = `<h3>履歴書 / Resume</h3><div class="jp-sub">Date: ${esc(new Date().toLocaleDateString('en-GB'))}</div>`;
  html += `<div class="jp-photo-wrap">${photoHtml}</div>`;
  html += `<table>
    <tr><td class="jp-label">ふりがな / Furigana</td><td>${esc(furigana)}</td></tr>
    <tr><td class="jp-label">氏 名 / Full Name</td><td>${esc(name)}</td></tr>
    <tr><td class="jp-label">婚姻 / Marriage</td><td>${jpCheck(marriage, 'Unmarried', '未婚/Unmarried', 'Married', '既婚/Married')}</td></tr>
    <tr><td class="jp-label">生年月日 / Date of Birth</td><td>${esc(dob)}</td></tr>
    <tr><td class="jp-label">満年齢 / Age</td><td>${esc(age)} 歳</td></tr>
    <tr><td class="jp-label">本籍地 / Permanent Address</td><td>${esc(permAddr)}</td></tr>
  </table>`;

  const drivingLic = document.getElementById('jp-driving-license')?.value || 'No';
  html += `<div class="jp-section-title">Physical & Health / 身体状況</div>`;
  html += `<table>
    <tr><td class="jp-label">身長 / Height</td><td>${esc(val('jp-height'))} cm</td><td class="jp-label">体重 / Weight</td><td>${esc(val('jp-weight'))} kg</td></tr>
    <tr><td class="jp-label">利き手 / Hand</td><td>${jpCheck(document.getElementById('jp-hand')?.value || 'Right', 'Left', '左/Left', 'Right', '右/Right')}</td><td class="jp-label">血液型 / Blood</td><td>${esc(document.getElementById('jp-blood')?.value || 'O+')}</td></tr>
    <tr><td class="jp-label">視力 / Eyesight</td><td>左 ${esc(val('jp-eye-left'))} / 右 ${esc(val('jp-eye-right'))}</td><td class="jp-label">タトゥー / Tattoo</td><td>${jpCheck(document.getElementById('jp-tattoo')?.value || 'No', 'No', '無/No', 'Yes', '有/Yes')}</td></tr>
    <tr><td class="jp-label">色盲 / Colorblind</td><td>${jpCheck(document.getElementById('jp-colorblind')?.value || 'No', 'No', '無/No', 'Yes', '有/Yes')}</td><td class="jp-label">喫煙 / Smoking</td><td>${jpCheck(document.getElementById('jp-smoking')?.value || 'No', 'No', '無/No', 'Yes', '有/Yes')}</td></tr>
    <tr><td class="jp-label">飲酒 / Drinking</td><td>${jpCheck(document.getElementById('jp-drinking')?.value || 'No', 'No', '無/No', 'Yes', '有/Yes')}</td><td class="jp-label">病歴 / Medical</td><td>${jpCheck(document.getElementById('jp-medical')?.value || 'No', 'No', '無/No', 'Yes', '有/Yes')}</td></tr>
    <tr><td class="jp-label">運転免許 / License</td><td colspan="3">${jpCheck(drivingLic, 'No', '無/No', 'Yes', '有/Yes')}</td></tr>
  </table>`;

  let eduRows = '';
  document.querySelectorAll('#jp-edu-list .repeat-block').forEach(b => {
    const start = b.querySelector('.jp-edu-start')?.value || '', end = b.querySelector('.jp-edu-end')?.value || '';
    const school = b.querySelector('.jp-edu-school')?.value || '', spec = b.querySelector('.jp-edu-specialty')?.value || '';
    const lic = b.querySelector('.jp-edu-license')?.value || '';
    if (!school) return;
    eduRows += `<tr><td>${esc(start)}</td><td>${esc(end)}</td><td>${esc(school)}</td><td>${esc(spec)}</td><td>${esc(lic)}</td></tr>`;
  });
  if (eduRows) {
    html += `<div class="jp-section-title">Academic Background / 学歴</div>
      <table><tr><th>Start</th><th>End</th><th>School</th><th>Specialty</th><th>Degree/License</th></tr>${eduRows}</table>`;
  }

  let workRows = '';
  document.querySelectorAll('#jp-work-list .repeat-block').forEach(b => {
    const start = b.querySelector('.jp-work-start')?.value || '', end = b.querySelector('.jp-work-end')?.value || '';
    const comp = b.querySelector('.jp-work-company')?.value || '', role = b.querySelector('.jp-work-role')?.value || '';
    if (!comp) return;
    workRows += `<tr><td>${esc(start)}</td><td>${esc(end)}</td><td>${esc(comp)}</td><td>${esc(role)}</td></tr>`;
  });
  if (workRows) {
    html += `<div class="jp-section-title">Work History / 職歴</div>
      <table><tr><th>Start</th><th>End</th><th>Company</th><th>Role</th></tr>${workRows}</table>`;
  }

  preview.innerHTML = html;
}

function downloadJapanPdf() {
  openDocumentPreview('japan');
}

// ---- Letter & Email Writer ----
const letterPurposes = {
  job: { orgLabel: 'Company name', orgPh: 'Acme Inc.', subjLabel: 'Job title', subjPh: 'Software Engineer', recLabel: 'Hiring manager', recPh: 'Leave blank to use "Hiring Manager"', fallback: 'Hiring Manager' },
  request: { orgLabel: 'Organization', orgPh: 'Organization name', subjLabel: 'Subject', subjPh: 'Inquiry topic', recLabel: 'Recipient name', recPh: 'Sir/Madam', fallback: 'Sir/Madam' },
  complaint: { orgLabel: 'Platform / Company', orgPh: 'Company name', subjLabel: 'Issue', subjPh: 'Order / service complaint', recLabel: 'Support Team', recPh: 'Support Team', fallback: 'Support Team' },
  school: { orgLabel: 'Institution', orgPh: 'School / University', subjLabel: 'Subject', subjPh: 'Course inquiry / leave', recLabel: 'Teacher name', recPh: 'Professor / Teacher', fallback: 'Teacher' },
  account: { orgLabel: 'Platform', orgPh: 'Service provider', subjLabel: 'Issue', subjPh: 'Account access issue', recLabel: 'Support Team', recPh: 'Support Team', fallback: 'Support Team' },
  thanks: { orgLabel: 'Organization', orgPh: 'Company name', subjLabel: 'Reason', subjPh: 'Thank you note', recLabel: 'Recipient name', recPh: 'Recipient', fallback: 'there' },
  custom: { orgLabel: 'Organization', orgPh: 'Organization', subjLabel: 'Subject', subjPh: 'Subject', recLabel: 'Recipient', recPh: 'Recipient', fallback: 'there' }
};

function currentLetterPurpose() {
  const p = document.getElementById('l-purpose')?.value || 'job';
  return letterPurposes[p] || letterPurposes.job;
}

function onLetterPurposeChange() {
  const p = currentLetterPurpose();
  const compLbl = document.getElementById('l-company-label');
  if (compLbl) compLbl.textContent = p.orgLabel;
  const compInp = document.getElementById('l-company');
  if (compInp) compInp.placeholder = p.orgPh;
  renderLetter();
}

function renderLetter(targetEl) {
  const preview = targetEl || document.getElementById('letter-preview');
  if (!preview) return;

  const name = val('l-yourname') || val('r-name') || 'Your Name';
  const email = val('r-email'), phone = val('r-phone'), loc = val('r-location');
  const contactLine = [email, phone, loc].filter(Boolean).join(' • ');
  const company = val('l-company');
  const purpose = currentLetterPurpose();
  const manager = val('l-manager') || purpose.fallback;
  const opening = val('l-opening'), body = val('l-body'), closing = val('l-closing');
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  let html = `<div style="margin-bottom:16px;"><strong>${esc(name)}</strong><br><span style="font-size:.8rem;color:#555;">${esc(contactLine)}</span></div>`;
  html += `<div style="margin-bottom:16px;font-size:.82rem;color:#555;">${today}</div>`;
  if (company) html += `<div style="margin-bottom:16px;font-size:.85rem;">${esc(manager)}<br>${esc(company)}</div>`;
  html += `<p>Dear ${esc(manager)},</p>`;
  if (opening) html += `<p>${esc(opening)}</p>`;
  if (body) html += `<p>${esc(body)}</p>`;
  if (closing) html += `<p>${esc(closing)}</p>`;
  html += `<p>Sincerely,<br>${esc(name)}</p>`;
  preview.innerHTML = html;
}

function autoDraftLetter() {
  const org = val('l-company') || 'your company';
  const subject = val('l-jobtitle') || 'the position';
  const elOp = document.getElementById('l-opening');
  const elBd = document.getElementById('l-body');
  const elCl = document.getElementById('l-closing');
  if (elOp) elOp.value = `I am writing to express my strong interest in ${subject} at ${org}.`;
  if (elBd) elBd.value = `With a dedicated background and proven problem-solving abilities, I am confident in contributing positively to your goals.`;
  if (elCl) elCl.value = `Thank you for your time and consideration. I welcome the opportunity to discuss how I can add value to your team.`;
  renderLetter();
  showToast('Draft inserted.');
}

function copyLetterToClipboard() {
  const name = val('l-yourname') || val('r-name') || 'Your Name';
  const purpose = currentLetterPurpose();
  const recipient = val('l-manager') || purpose.fallback;
  const opening = val('l-opening'), body = val('l-body'), closing = val('l-closing');
  let text = `Dear ${recipient},\n\n${opening}\n\n${body}\n\n${closing}\n\nSincerely,\n${name}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('Letter copied to clipboard!')).catch(() => showToast('Could not copy automatically.'));
  }
}

function printLetter() {
  executePrintDoc();
}

function downloadLetterPdf() {
  openDocumentPreview('letter');
}

// ---- Image Tools ----
let resizeCurrentImg = null;
let resizeAspectRatio = 1;

function handleResizeFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const previewImg = document.getElementById('resize-preview-img');
    if (previewImg) {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
    }
    const img = new Image();
    img.onload = () => {
      resizeCurrentImg = img;
      resizeAspectRatio = img.width / img.height;
      const wEl = document.getElementById('resize-width');
      const hEl = document.getElementById('resize-height');
      if (wEl) wEl.value = img.width;
      if (hEl) hEl.value = img.height;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  const meta = document.getElementById('resize-file-meta');
  if (meta) meta.textContent = `${file.name} - ${(file.size / 1024).toFixed(0)} KB`;
  const ctrl = document.getElementById('resize-controls');
  if (ctrl) ctrl.style.display = 'block';
}

function canvasToBlobP(canvas, format, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, format, quality));
}

async function compressToTargetSize(canvas, format, targetBytes) {
  let lo = 0.05, hi = 0.98, bestBlob = null;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlobP(canvas, format, mid);
    if (!blob) break;
    if (blob.size > targetBytes) {
      hi = mid;
    } else {
      bestBlob = blob;
      lo = mid;
    }
  }
  if (!bestBlob) bestBlob = await canvasToBlobP(canvas, format, lo);
  return bestBlob;
}

function toggleResizeSizeMode() {
  const mode = document.getElementById('resize-size-mode')?.value || 'quality';
  const qRow = document.getElementById('resize-quality-mode-row');
  const tRow = document.getElementById('resize-target-mode-row');
  const note = document.getElementById('resize-target-size-note');
  if (qRow) qRow.style.display = mode === 'quality' ? '' : 'none';
  if (tRow) tRow.style.display = mode === 'target' ? '' : 'none';
  if (note) note.style.display = mode === 'target' ? '' : 'none';
}

async function resizeImage() {
  if (!resizeCurrentImg) return;
  const w = parseInt(document.getElementById('resize-width')?.value) || resizeCurrentImg.width;
  const h = parseInt(document.getElementById('resize-height')?.value) || resizeCurrentImg.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(resizeCurrentImg, 0, 0, w, h);

  const format = document.getElementById('resize-format')?.value || 'image/jpeg';
  const mode = document.getElementById('resize-size-mode')?.value || 'quality';
  let blob;
  if (mode === 'target') {
    const val = parseFloat(document.getElementById('resize-target-size-value')?.value) || 50;
    const unit = document.getElementById('resize-target-size-unit')?.value || 'KB';
    const targetBytes = unit === 'MB' ? val * 1024 * 1024 : val * 1024;
    blob = await compressToTargetSize(canvas, format, targetBytes);
  } else {
    const quality = (parseFloat(document.getElementById('resize-quality')?.value) || 90) / 100;
    blob = await canvasToBlobP(canvas, format, quality);
  }

  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-${w}x${h}.${format.split('/')[1] || 'jpg'}`;
    a.click();
    showToast(`Image exported (${(blob.size / 1024).toFixed(0)} KB)`);
  }
}

// ---- File Compressor & Converter (PDF & Word) ----
let docCurrentFile = null;

function handleDocFile(file) {
  if (!file) return;
  docCurrentFile = file;
  const meta = document.getElementById('doc-file-meta');
  if (meta) meta.textContent = `${file.name} — ${(file.size / 1024).toFixed(0)} KB`;
  const resMeta = document.getElementById('doc-result-meta');
  if (resMeta) resMeta.textContent = '';
  const ext = file.name.split('.').pop().toLowerCase();
  const pdfActs = document.getElementById('doc-pdf-actions');
  const docxActs = document.getElementById('doc-docx-actions');
  if (pdfActs) pdfActs.style.display = ext === 'pdf' ? 'block' : 'none';
  if (docxActs) docxActs.style.display = ext === 'docx' ? 'block' : 'none';
  if (ext !== 'pdf' && ext !== 'docx') {
    showToast('Please choose a .pdf or .docx file.');
  }
  const lbl = document.getElementById('doc-drop-label');
  if (lbl) lbl.textContent = 'Tap to choose a different file';
}

function toggleDocSizeMode() {
  const mode = document.getElementById('doc-size-mode')?.value || 'quality';
  const qRow = document.getElementById('doc-quality-mode-row');
  const tRow = document.getElementById('doc-target-mode-row');
  if (qRow) qRow.style.display = mode === 'quality' ? '' : 'none';
  if (tRow) tRow.style.display = mode === 'target' ? '' : 'none';
}

function rtfEscape(text) {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (ch === '\\' || ch === '{' || ch === '}') { out += '\\' + ch; }
    else if (code > 127) { out += '\\u' + code + '?'; }
    else { out += ch; }
  }
  return out;
}

async function pdfToRtfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let body = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => ({
      str: it.str, x: it.transform[4], y: it.transform[5], fontName: it.fontName
    }));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    let lines = [];
    let current = null;
    const yTol = 3;
    items.forEach(it => {
      if (!current || Math.abs(current.y - it.y) > yTol) {
        current = { y: it.y, items: [it] };
        lines.push(current);
      } else {
        current.items.push(it);
      }
    });
    lines.forEach(line => {
      line.items.sort((a, b) => a.x - b.x);
      const lineText = line.items.map(it => it.str).join(' ').trim();
      if (!lineText) return;
      const firstX = line.items[0].x;
      const pageWidth = viewport.width;
      let align = '\\ql';
      if (firstX > pageWidth * 0.3 && firstX < pageWidth * 0.6) align = '\\qc';
      const isBold = line.items.some(it => /bold/i.test(it.fontName || ''));
      const escStr = rtfEscape(lineText);
      const wrapped = isBold ? `{\\b ${escStr}}` : escStr;
      body += `${align} ${wrapped}\\par\n`;
    });
    body += '\\par\n';
  }
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\fs22\n${body}}`;
}

async function convertPdfToWord() {
  if (!docCurrentFile) return;
  if (typeof pdfjsLib === 'undefined') {
    showToast('The PDF engine failed to load — check your connection and refresh.');
    return;
  }
  showToast('Converting — this can take a moment...');
  try {
    const buf = await docCurrentFile.arrayBuffer();
    const rtf = await pdfToRtfText(buf);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docCurrentFile.name.replace(/\.pdf$/i, '') + '.rtf';
    a.click();
    const resMeta = document.getElementById('doc-result-meta');
    if (resMeta) resMeta.textContent = 'Done — opens directly in Microsoft Word.';
    showToast('Converted — check simple sections first for accuracy.');
  } catch (err) {
    showToast('Conversion failed — this PDF may be scanned/image-based rather than text.');
  }
}

function blobToDataUrlP(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function compressPdfFile() {
  if (!docCurrentFile) return;
  if (typeof pdfjsLib === 'undefined' || typeof jspdf === 'undefined') {
    showToast('A required engine failed to load — check your connection and refresh.');
    return;
  }
  showToast('Compressing — this can take a moment...');
  try {
    const buf = await docCurrentFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const mode = document.getElementById('doc-size-mode')?.value || 'quality';
    let targetBytesPerPage = null, quality = 0.7;
    if (mode === 'target') {
      const val = parseFloat(document.getElementById('doc-target-size-value')?.value) || 500;
      const unit = document.getElementById('doc-target-size-unit')?.value || 'KB';
      const totalTarget = unit === 'MB' ? val * 1024 * 1024 : val * 1024;
      targetBytesPerPage = totalTarget / pdf.numPages;
    } else {
      quality = (parseFloat(document.getElementById('doc-quality')?.value) || 70) / 100;
    }
    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    const outPdf = new jsPDFClass({ unit: 'pt', format: 'a4' });
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      let blob;
      if (mode === 'target') {
        blob = await compressToTargetSize(canvas, 'image/jpeg', targetBytesPerPage);
      } else {
        blob = await canvasToBlobP(canvas, 'image/jpeg', quality);
      }
      const dataUrl = await blobToDataUrlP(blob);
      if (p > 1) outPdf.addPage();
      const pw = outPdf.internal.pageSize.getWidth();
      const ph = outPdf.internal.pageSize.getHeight();
      outPdf.addImage(dataUrl, 'JPEG', 0, 0, pw, ph);
    }
    const originalKb = (docCurrentFile.size / 1024).toFixed(0);
    outPdf.save(docCurrentFile.name.replace(/\.pdf$/i, '') + '-compressed.pdf');
    const resMeta = document.getElementById('doc-result-meta');
    if (resMeta) resMeta.textContent = `Done — compressed from ${originalKb} KB. Text is no longer selectable in the output.`;
    showToast('Compressed PDF downloaded.');
  } catch (err) {
    showToast('Compression failed — please try a different file.');
  }
}

async function docxToPdf(arrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const container = document.createElement('div');
  container.style.width = '794px';
  container.style.padding = '48px';
  container.style.background = '#fff';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.5';
  container.style.color = '#111';
  container.innerHTML = result.value;
  document.body.appendChild(container);
  const canvas = await html2canvas(container, { scale: 2 });
  document.body.removeChild(container);
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  const pdf = new jsPDFClass({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = canvas.height * imgWidth / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  return pdf;
}

async function convertDocxToPdf() {
  if (!docCurrentFile) return;
  if (typeof mammoth === 'undefined' || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
    showToast('A required engine failed to load — check your connection and refresh.');
    return;
  }
  showToast('Converting — this can take a moment...');
  try {
    const buf = await docCurrentFile.arrayBuffer();
    const pdf = await docxToPdf(buf);
    pdf.save(docCurrentFile.name.replace(/\.docx$/i, '') + '.pdf');
    const resMeta = document.getElementById('doc-result-meta');
    if (resMeta) resMeta.textContent = 'Done — downloaded as PDF.';
    showToast('Converted to PDF.');
  } catch (err) {
    showToast('Conversion failed — please try a different file.');
  }
}

// ---- Document Scanner ----
let scanImg = null, scanImgNatW = 0, scanImgNatH = 0;
let scanPoints = [{ x: 0.06, y: 0.06 }, { x: 0.94, y: 0.06 }, { x: 0.94, y: 0.94 }, { x: 0.06, y: 0.94 }];
let scanPages = [];
let scanDraggingIdx = null;
let scanCropMode = '6pt';
let currentPreviewScanPageIdx = -1;

function setScanCropMode(mode) {
  scanCropMode = mode || '6pt';
  ['btn-crop-4pt', 'btn-crop-6pt', 'btn-crop-8pt'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    if (id === `btn-crop-${scanCropMode}`) {
      b.className = 'btn small';
    } else {
      b.className = 'btn ghost small';
    }
  });
  resetScanCorners(0.06);
}

function resetScanCorners(m = 0.06) {
  const p0 = { x: m, y: m };             // Top-Left
  const p1 = { x: 1 - m, y: m };         // Top-Right
  const p2 = { x: 1 - m, y: 1 - m };     // Bottom-Right
  const p3 = { x: m, y: 1 - m };         // Bottom-Left

  if (scanCropMode === '4pt') {
    scanPoints = [p0, p1, p2, p3];
  } else if (scanCropMode === '8pt') {
    scanPoints = [
      p0,
      { x: 0.5, y: m },
      p1,
      { x: 1 - m, y: 0.5 },
      p2,
      { x: 0.5, y: 1 - m },
      p3,
      { x: m, y: 0.5 }
    ];
  } else {
    // 6pt default: 4 corners + Left-Mid & Right-Mid
    scanPoints = [
      p0,
      p1,
      p2,
      p3,
      { x: m, y: 0.5 },
      { x: 1 - m, y: 0.5 }
    ];
  }
  buildScanHandlesDOM();
  positionScanHandles();
}

function buildScanHandlesDOM() {
  const container = document.getElementById('scan-handles-container');
  if (!container) return;
  container.innerHTML = '';
  scanPoints.forEach((pt, i) => {
    const handle = document.createElement('div');
    handle.id = 'scan-handle-' + i;
    const isCorner = (scanCropMode === '8pt') ? (i % 2 === 0) : (i < 4);
    handle.className = 'scan-handle' + (isCorner ? '' : ' side-handle');
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', `Crop control point ${i + 1}`);

    const onStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      scanDraggingIdx = i;
      handle.classList.add('active');
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onEnd);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };

    const onMove = (e) => {
      if (scanDraggingIdx === null) return;
      updateHandlePositionFromCoords(e.clientX, e.clientY);
    };

    const onTouchMove = (e) => {
      if (scanDraggingIdx === null || !e.touches || !e.touches[0]) return;
      e.preventDefault();
      updateHandlePositionFromCoords(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onEnd = () => {
      if (scanDraggingIdx !== null) {
        const h = document.getElementById('scan-handle-' + scanDraggingIdx);
        if (h) h.classList.remove('active');
      }
      scanDraggingIdx = null;
      const loupe = document.getElementById('scan-loupe');
      if (loupe) loupe.style.display = 'none';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
    };

    handle.addEventListener('pointerdown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    container.appendChild(handle);
  });
}

function updateHandlePositionFromCoords(clientX, clientY) {
  const wrap = document.getElementById('scan-canvas-wrap');
  if (!wrap || scanDraggingIdx === null) return;
  const rect = wrap.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return;

  const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

  scanPoints[scanDraggingIdx] = { x: nx, y: ny };
  positionScanHandles();
  updateScanLoupe(clientX - rect.left, clientY - rect.top, nx, normClamp(ny));
}

function normClamp(v) {
  return Math.max(0, Math.min(1, v));
}

function updateScanLoupe(pxX, pxY, normX, normY) {
  const loupe = document.getElementById('scan-loupe');
  const loupeCanvas = document.getElementById('scan-loupe-canvas');
  const srcImg = document.getElementById('scan-source-img');
  if (!loupe || !loupeCanvas || !srcImg || !srcImg.naturalWidth) return;

  loupe.style.display = 'block';
  loupe.style.left = pxX + 'px';
  loupe.style.top = pxY + 'px';

  const ctx = loupeCanvas.getContext('2d');
  ctx.clearRect(0, 0, 104, 104);
  const srcX = normX * srcImg.naturalWidth;
  const srcY = normY * srcImg.naturalHeight;
  const cropSize = 56;
  ctx.drawImage(
    srcImg,
    srcX - cropSize / 2, srcY - cropSize / 2, cropSize, cropSize,
    0, 0, 104, 104
  );
}

function initScanCanvasWrapTap() {
  const wrap = document.getElementById('scan-canvas-wrap');
  if (!wrap || wrap.dataset.tapInited) return;
  wrap.dataset.tapInited = 'true';

  wrap.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('scan-handle')) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return;
    const tapX = (e.clientX - rect.left) / rect.width;
    const tapY = (e.clientY - rect.top) / rect.height;

    let nearestIdx = 0;
    let minDist = Infinity;
    scanPoints.forEach((pt, i) => {
      const d = Math.hypot(pt.x - tapX, pt.y - tapY);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    });

    scanPoints[nearestIdx] = { x: Math.max(0, Math.min(1, tapX)), y: Math.max(0, Math.min(1, tapY)) };
    positionScanHandles();
  });
}

function positionScanHandles() {
  const wrap = document.getElementById('scan-canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return;

  scanPoints.forEach((pt, i) => {
    const handle = document.getElementById('scan-handle-' + i);
    if (handle) {
      handle.style.left = Math.round(pt.x * rect.width) + 'px';
      handle.style.top = Math.round(pt.y * rect.height) + 'px';
    }
  });

  let polyOrder = [];
  if (scanCropMode === '4pt') {
    polyOrder = [0, 1, 2, 3];
  } else if (scanCropMode === '8pt') {
    polyOrder = [0, 1, 2, 3, 4, 5, 6, 7];
  } else {
    polyOrder = (scanPoints.length >= 6) ? [0, 1, 5, 2, 3, 4] : [0, 1, 2, 3];
  }

  const polyPts = polyOrder.map(idx => {
    const p = scanPoints[idx] || scanPoints[0];
    return `${Math.round(p.x * rect.width)},${Math.round(p.y * rect.height)}`;
  }).join(' ');

  const poly = document.getElementById('scan-quad-poly');
  if (poly) poly.setAttribute('points', polyPts);

  const maskPoly = document.getElementById('scan-mask-poly');
  if (maskPoly) maskPoly.setAttribute('points', polyPts);

  const pTL = scanPoints[0] || { x: 0, y: 0 };
  const pTR = scanPoints[1] || { x: 1, y: 0 };
  const pBR = scanPoints[2] || { x: 1, y: 1 };
  const pBL = scanPoints[3] || { x: 0, y: 1 };

  const gridH = document.getElementById('scan-grid-h');
  if (gridH) {
    gridH.setAttribute('x1', Math.round(((pTL.x + pBL.x) / 2) * rect.width));
    gridH.setAttribute('y1', Math.round(((pTL.y + pBL.y) / 2) * rect.height));
    gridH.setAttribute('x2', Math.round(((pTR.x + pBR.x) / 2) * rect.width));
    gridH.setAttribute('y2', Math.round(((pTR.y + pBR.y) / 2) * rect.height));
  }
  const gridV = document.getElementById('scan-grid-v');
  if (gridV) {
    gridV.setAttribute('x1', Math.round(((pTL.x + pTR.x) / 2) * rect.width));
    gridV.setAttribute('y1', Math.round(((pTL.y + pTR.y) / 2) * rect.height));
    gridV.setAttribute('x2', Math.round(((pBL.x + pBR.x) / 2) * rect.width));
    gridV.setAttribute('y2', Math.round(((pBL.y + pBR.y) / 2) * rect.height));
  }
}

function rotateScanSourceImage(angle) {
  if (!scanImg) return;
  const canvas = document.createElement('canvas');
  const is90 = Math.abs(angle) === 90 || Math.abs(angle) === 270;
  canvas.width = is90 ? scanImgNatH : scanImgNatW;
  canvas.height = is90 ? scanImgNatW : scanImgNatH;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(scanImg, -scanImgNatW / 2, -scanImgNatH / 2);

  const newSrc = canvas.toDataURL('image/jpeg', 0.95);
  const imgEl = document.getElementById('scan-source-img');
  if (imgEl) {
    imgEl.onload = () => {
      scanImg = imgEl;
      scanImgNatW = imgEl.naturalWidth;
      scanImgNatH = imgEl.naturalHeight;
      resetScanCorners(0.06);
    };
    imgEl.src = newSrc;
  }
  showToast(angle > 0 ? 'Rotated clockwise 90°' : 'Rotated counter-clockwise 90°');
}

function computeSquareToQuad(x0, y0, x1, y1, x2, y2, x3, y3) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a13, a23;
  const denom = (dx1 * dy2 - dx2 * dy1) || 1e-10;
  if (Math.abs(dx3) < 1e-10 && Math.abs(dy3) < 1e-10) {
    a13 = 0; a23 = 0;
  } else {
    a13 = (dx3 * dy2 - dx2 * dy3) / denom;
    a23 = (dx1 * dy3 - dx3 * dy1) / denom;
  }
  return {
    a11: x1 - x0 + a13 * x1,
    a12: y1 - y0 + a13 * y1,
    a13,
    a21: x3 - x0 + a23 * x3,
    a22: y3 - y0 + a23 * y3,
    a23,
    a31: x0,
    a32: y0,
    a33: 1
  };
}

function applyScanCrop() {
  if (!scanImg) return;
  showToast('Processing scan...');
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = scanImgNatW;
  srcCanvas.height = scanImgNatH;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(scanImg, 0, 0, scanImgNatW, scanImgNatH);

  const p0 = scanPoints[0] || { x: 0, y: 0 };
  const p1 = scanPoints[1] || { x: 1, y: 0 };
  const p2 = scanPoints[2] || { x: 1, y: 1 };
  const p3 = scanPoints[3] || { x: 0, y: 1 };

  const quad = [
    { x: p0.x * scanImgNatW, y: p0.y * scanImgNatH },
    { x: p1.x * scanImgNatW, y: p1.y * scanImgNatH },
    { x: p2.x * scanImgNatW, y: p2.y * scanImgNatH },
    { x: p3.x * scanImgNatW, y: p3.y * scanImgNatH }
  ];

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const outW = Math.max(200, Math.min(Math.round((dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2), 2000));
  const outH = Math.max(200, Math.min(Math.round((dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2), 2600));

  const destCanvas = document.createElement('canvas');
  destCanvas.width = outW;
  destCanvas.height = outH;
  const destCtx = destCanvas.getContext('2d');

  const cropX = Math.min(quad[0].x, quad[3].x);
  const cropY = Math.min(quad[0].y, quad[1].y);
  const cropW = Math.max(quad[1].x, quad[2].x) - cropX;
  const cropH = Math.max(quad[2].y, quad[3].y) - cropY;

  destCtx.drawImage(
    srcCanvas,
    Math.max(0, cropX), Math.max(0, cropY), Math.min(scanImgNatW, Math.max(10, cropW)), Math.min(scanImgNatH, Math.max(10, cropH)),
    0, 0, outW, outH
  );

  const filterSel = document.getElementById('scan-filter');
  const filterVal = filterSel ? filterSel.value : 'enhanced';
  if (filterVal !== 'original') {
    try {
      const imgData = destCtx.getImageData(0, 0, outW, outH);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (filterVal === 'bw') {
          const v = gray > 140 ? 255 : 0;
          data[i] = v; data[i + 1] = v; data[i + 2] = v;
        } else if (filterVal === 'grayscale') {
          const boosted = Math.min(255, Math.max(0, (gray - 30) * (255 / (225 - 30))));
          data[i] = boosted; data[i + 1] = boosted; data[i + 2] = boosted;
        } else if (filterVal === 'enhanced') {
          const isBackground = (gray > 165 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25);
          if (isBackground) {
            data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
          } else {
            data[i] = Math.min(255, Math.max(0, Math.round(r * 1.05)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(g * 1.05)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(b * 1.05)));
          }
        }
      }
      destCtx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Scan filter error:', e);
    }
  }

  scanPages.push(destCanvas.toDataURL('image/jpeg', 0.92));
  renderScanPagesList();
  cancelScanEditor();
  showToast('Page added!');
}

function cancelScanEditor() {
  const ed = document.getElementById('scan-editor');
  if (ed) ed.style.display = 'none';
  scanImg = null;
}

function openScanPreviewModal(idx) {
  if (idx < 0 || idx >= scanPages.length) return;
  currentPreviewScanPageIdx = idx;
  const modal = document.getElementById('scan-page-modal');
  const img = document.getElementById('scan-modal-img');
  const title = document.getElementById('scan-modal-title');
  if (img) img.src = scanPages[idx];
  if (title) title.textContent = `Scanned Page ${idx + 1} of ${scanPages.length}`;
  if (modal) modal.style.display = 'flex';
}

function closeScanPreviewModal() {
  const modal = document.getElementById('scan-page-modal');
  if (modal) modal.style.display = 'none';
  currentPreviewScanPageIdx = -1;
}

function rotateCurrentPreviewPage(angle) {
  if (currentPreviewScanPageIdx < 0 || currentPreviewScanPageIdx >= scanPages.length) return;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const is90 = Math.abs(angle) === 90 || Math.abs(angle) === 270;
    canvas.width = is90 ? img.height : img.width;
    canvas.height = is90 ? img.width : img.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    scanPages[currentPreviewScanPageIdx] = rotatedDataUrl;
    const modalImg = document.getElementById('scan-modal-img');
    if (modalImg) modalImg.src = rotatedDataUrl;
    renderScanPagesList();
    showToast('Page rotated');
  };
  img.src = scanPages[currentPreviewScanPageIdx];
}

function renderScanPagesList() {
  const wrap = document.getElementById('scan-pages-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  scanPages.forEach((dataUrl, idx) => {
    const div = document.createElement('div');
    div.className = 'scan-page-thumb';
    div.innerHTML = `<img src="${dataUrl}" onclick="openScanPreviewModal(${idx})" style="cursor:pointer;" title="Click to preview / rotate full page"><div class="remove-x" onclick="removeScanPage(${idx})" title="Remove page">×</div>`;
    wrap.appendChild(div);
  });
  const act = document.getElementById('scan-actions');
  if (act) act.style.display = scanPages.length ? 'flex' : 'none';
}

function removeScanPage(idx) {
  scanPages.splice(idx, 1);
  renderScanPagesList();
}

function clearScanPages() {
  scanPages = [];
  renderScanPagesList();
}

async function downloadScanAsPdf() {
  if (!scanPages.length) return;
  const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPDFClass) return;
  const pdf = new jsPDFClass({ unit: 'pt', format: 'a4' });
  for (let i = 0; i < scanPages.length; i++) {
    if (i > 0) pdf.addPage();
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(scanPages[i], 'JPEG', 0, 0, pw, ph);
  }
  pdf.save('scanned-document.pdf');
  showToast('Downloaded PDF scan!');
}

function downloadScanAsImages() {
  scanPages.forEach((dataUrl, idx) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `scan-page-${idx + 1}.jpg`;
    a.click();
  });
}

// ---- GPA & Academic Result Engine ----
let gpaSystem = 'bd_diploma';

function onGpaSystemChange() {
  const sel = document.getElementById('gpa-system');
  if (sel) gpaSystem = sel.value;
  const container = document.getElementById('gpa-dynamic-container');
  const resBox = document.getElementById('gpa-result');
  if (resBox) resBox.style.display = 'none';
  if (!container) return;

  if (gpaSystem === 'bd_diploma') {
    renderBdDiplomaView(container);
  } else if (gpaSystem === 'bd_honours') {
    renderBdHonoursView(container);
  } else if (gpaSystem === 'bd_ssc_hsc') {
    renderBdSscHscView(container);
  } else if (gpaSystem === 'bd_nu') {
    renderBdNuView(container);
  } else if (gpaSystem === 'bd_uni') {
    renderBdUniView(container);
  } else if (gpaSystem === 'uk_degree') {
    renderUkDegreeView(container);
  } else if (gpaSystem === 'in_cgpa') {
    renderInCgpaView(container);
  } else if (gpaSystem === 'ca_gpa') {
    renderCanadaView(container);
  } else if (gpaSystem === 'au_gpa') {
    renderAustraliaView(container);
  } else if (gpaSystem === 'eu_ects') {
    renderEuEctsView(container);
  } else {
    renderUs4View(container);
  }
}

function displayGpaResult(data) {
  const box = document.getElementById('gpa-result');
  if (!box) return;
  box.style.display = 'block';

  let progressHtml = '';
  if (typeof data.completed === 'number' && typeof data.total === 'number' && data.total > 0) {
    const pct = Math.min(100, Math.round((data.completed / data.total) * 100));
    progressHtml = `
      <div class="gpa-progress-wrap">
        <div class="gpa-progress-header">
          <span>${data.progressTitle || 'Academic Progress'}</span>
          <span>${data.completed} of ${data.total} ${data.unitName || 'Semesters'} (${pct}%)</span>
        </div>
        <div class="gpa-progress-bar-bg">
          <div class="gpa-progress-bar-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }

  let statsHtml = `
    <div class="gpa-stat-grid">
      <div class="gpa-stat-box" style="border-left:3px solid var(--stamp);">
        <div class="lbl">${data.mainLabel || 'Result'}</div>
        <div class="val" style="color:var(--stamp);font-size:1.35rem;">${data.mainVal}</div>
      </div>
  `;
  if (data.stats && data.stats.length) {
    data.stats.forEach(s => {
      statsHtml += `
        <div class="gpa-stat-box">
          <div class="lbl">${s.lbl}</div>
          <div class="val" style="font-size:1.05rem;">${s.val}</div>
        </div>
      `;
    });
  }
  statsHtml += `</div>`;

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <span style="font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);">${data.systemName || 'Education System'}</span>
        <h3 style="margin:2px 0 0 0;font-size:1.1rem;color:var(--ink);">${data.calcMethod || 'Calculation Result'}</h3>
      </div>
      ${data.badge ? `<span class="${data.badge.isFinal ? 'gpa-badge-final' : 'gpa-badge-provisional'}">${data.badge.text}</span>` : ''}
    </div>
    ${progressHtml}
    ${statsHtml}
    ${data.note ? `<p style="font-size:.82rem;color:var(--ink-soft);margin-top:12px;line-height:1.45;">• ${data.note}</p>` : ''}
  `;
}

function renderBdDiplomaView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <div>
          <strong style="font-size:.95rem;color:var(--ink);">Bangladesh Diploma in Engineering (BTEB)</strong>
          <div style="font-size:.8rem;color:var(--ink-soft);">Standard curriculum: 8 semesters</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label for="bd-dip-completed" style="font-size:.85rem;margin:0;font-weight:600;">Semesters completed:</label>
          <select id="bd-dip-completed" onchange="updateBdDiplomaInputs()" style="padding:5px 10px;font-weight:600;width:auto;">
            <option value="1">1</option><option value="2">2</option><option value="3">3</option>
            <option value="4">4</option><option value="5">5</option><option value="6" selected>6</option>
            <option value="7">7</option><option value="8">8</option>
          </select>
        </div>
      </div>
      <div id="bd-dip-grid" class="gpa-grid-semesters"></div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="btn primary" onclick="calcBdDiploma()">Calculate Current Average</button>
      </div>
    </div>
  `;
  updateBdDiplomaInputs();
}

function updateBdDiplomaInputs() {
  const completed = parseInt(document.getElementById('bd-dip-completed')?.value, 10) || 6;
  const grid = document.getElementById('bd-dip-grid');
  if (!grid) return;
  let html = '';
  for (let i = 1; i <= completed; i++) {
    html += `
      <div class="gpa-sem-card active">
        <div class="gpa-sem-title"><span>Semester ${i}</span><span class="gpa-sem-badge">Scale 4.00</span></div>
        <label style="font-size:.78rem;">GPA (0.00 - 4.00)</label>
        <input type="number" class="bd-dip-gpa" id="bd-dip-gpa-${i}" min="0" max="4" step="0.01" placeholder="e.g. 3.75">
      </div>
    `;
  }
  grid.innerHTML = html;
}

function calcBdDiploma() {
  const completed = parseInt(document.getElementById('bd-dip-completed')?.value, 10) || 6;
  let sum = 0, count = 0;
  for (let i = 1; i <= completed; i++) {
    const el = document.getElementById(`bd-dip-gpa-${i}`);
    if (!el || !el.value.trim()) continue;
    const v = parseFloat(el.value);
    if (!isNaN(v) && v >= 0 && v <= 4) {
      sum += v;
      count++;
    }
  }
  if (count === 0) {
    showToast('Please enter at least one semester GPA.');
    return;
  }
  const avg = sum / count;
  const isFinal = completed === 8;
  displayGpaResult({
    systemName: 'Bangladesh Technical Education Board (BTEB)',
    calcMethod: 'Diploma in Engineering - Average GPA',
    mainLabel: isFinal ? 'Final Average GPA' : 'Current Average GPA',
    mainVal: avg.toFixed(2),
    completed,
    total: 8,
    unitName: 'Semesters',
    badge: { text: isFinal ? 'Completed' : `Provisional (${completed} of 8)`, isFinal },
    stats: [
      { lbl: 'Completed', val: `${completed} of 8` },
      { lbl: 'Scale', val: '4.00' }
    ]
  });
}

function renderBdHonoursView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">Bangladesh Honours / Bachelor's Degree (4-Year)</strong>
      <div id="bd-hon-content" style="margin-top:12px;">
        <div class="gpa-grid-semesters">
          ${[1,2,3,4].map(y => `
            <div class="gpa-sem-card active">
              <div class="gpa-sem-title"><span>Year ${y}</span><span class="gpa-sem-badge">Scale 4.00</span></div>
              <label style="font-size:.78rem;">Yearly GPA</label>
              <input type="number" id="bd-hon-yr-${y}" min="0" max="4" step="0.01" placeholder="e.g. 3.40">
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top:16px;">
        <button type="button" class="btn primary" onclick="calcBdHonours()">Calculate CGPA</button>
      </div>
    </div>
  `;
}

function calcBdHonours() {
  let sum = 0, count = 0;
  for (let y = 1; y <= 4; y++) {
    const el = document.getElementById(`bd-hon-yr-${y}`);
    if (!el || !el.value.trim()) continue;
    const v = parseFloat(el.value);
    if (!isNaN(v) && v >= 0 && v <= 4) {
      sum += v;
      count++;
    }
  }
  if (count === 0) { showToast('Please enter at least one year GPA.'); return; }
  const cgpa = sum / count;
  displayGpaResult({
    systemName: 'Bangladesh Honours / Bachelor\'s Degree',
    calcMethod: 'Cumulative CGPA',
    mainLabel: 'CGPA',
    mainVal: cgpa.toFixed(2),
    completed: count,
    total: 4,
    unitName: 'Years',
    badge: { text: count === 4 ? 'Degree Completed' : `Provisional (${count}/4 Years)`, isFinal: count === 4 },
    stats: [{ lbl: 'Years Counted', val: count.toString() }, { lbl: 'Scale', val: '4.00' }]
  });
}

function renderBdSscHscView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">Bangladesh Education Board: SSC / HSC GPA (5.00 Scale)</strong>
      <p style="font-size:.82rem;color:var(--ink-soft);margin:6px 0 14px 0;">Includes 4th subject bonus calculation (points above 2.0 added to main sum).</p>
      <div id="bd-ssc-list">
        ${['Bangla', 'English', 'ICT', 'Subject 4', 'Subject 5', 'Subject 6'].map(s => `
          <div class="gpa-row" style="grid-template-columns: 2fr 1fr;">
            <div><label>Subject</label><input type="text" value="${s}" readonly></div>
            <div>
              <label>Grade</label>
              <select class="ssc-gr">
                <option value="5.0" selected>A+ (5.0)</option>
                <option value="4.0">A (4.0)</option>
                <option value="3.5">A- (3.5)</option>
                <option value="3.0">B (3.0)</option>
                <option value="2.0">C (2.0)</option>
                <option value="1.0">D (1.0)</option>
                <option value="0.0">F (0.0)</option>
              </select>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:14px;">
        <label>4th Optional Subject Grade</label>
        <select id="bd-ssc-4th" style="max-width:260px;">
          <option value="5.0" selected>A+ (5.0) - Bonus 3.0</option>
          <option value="4.0">A (4.0) - Bonus 2.0</option>
          <option value="3.5">A- (3.5) - Bonus 1.5</option>
          <option value="3.0">B (3.0) - Bonus 1.0</option>
          <option value="2.0">C (2.0) - No Bonus</option>
          <option value="0.0">F (0.0)</option>
        </select>
      </div>
      <div style="margin-top:16px;">
        <button type="button" class="btn primary" onclick="calcBdSscHsc()">Calculate Overall GPA</button>
      </div>
    </div>
  `;
}

function calcBdSscHsc() {
  const selects = document.querySelectorAll('#bd-ssc-list .ssc-gr');
  let mainSum = 0;
  let hasFail = false;
  selects.forEach(s => {
    const v = parseFloat(s.value);
    if (v === 0) hasFail = true;
    mainSum += v;
  });
  if (hasFail) {
    displayGpaResult({
      systemName: 'Bangladesh Education Board',
      calcMethod: 'SSC / HSC Result',
      mainLabel: 'Overall GPA',
      mainVal: '0.00 (F)',
      badge: { text: 'Fail / Unsuccessful', isFinal: true },
      stats: [{ lbl: 'Status', val: 'Failed in Main Subject' }]
    });
    return;
  }
  const fourth = parseFloat(document.getElementById('bd-ssc-4th')?.value) || 0;
  const bonus = fourth > 2.0 ? fourth - 2.0 : 0;
  const finalGpa = Math.min(5.0, (mainSum + bonus) / selects.length);
  displayGpaResult({
    systemName: 'Bangladesh Education Board',
    calcMethod: 'SSC / HSC Result',
    mainLabel: 'Overall GPA',
    mainVal: finalGpa.toFixed(2),
    badge: { text: finalGpa === 5.0 ? 'GPA 5.00 (A+)' : 'Passed', isFinal: true },
    stats: [
      { lbl: 'Main Pts', val: mainSum.toFixed(2) },
      { lbl: '4th Bonus', val: `+${bonus.toFixed(2)}` },
      { lbl: 'Scale', val: '5.00' }
    ]
  });
}

function renderBdNuView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">National University (NU) 4-Year Bachelor's Degree</strong>
      <p style="font-size:.82rem;color:var(--ink-soft);margin:4px 0 14px 0;">Official NU divisions: 1st Class (3.00+), 2nd Class (2.25 - 2.99), 3rd Class (2.00 - 2.24).</p>
      <div class="gpa-grid-semesters">
        ${[1, 2, 3, 4].map(y => `
          <div class="gpa-sem-card active">
            <div class="gpa-sem-title"><span>Year ${y} GPA</span><span class="gpa-sem-badge">Scale 4.00</span></div>
            <input type="number" id="bd-nu-yr-${y}" min="0" max="4" step="0.01" placeholder="e.g. 3.15">
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px;">
        <button type="button" class="btn primary" onclick="calcBdNu()">Calculate NU CGPA</button>
      </div>
    </div>
  `;
}

function calcBdNu() {
  let sum = 0, count = 0;
  for (let y = 1; y <= 4; y++) {
    const el = document.getElementById(`bd-nu-yr-${y}`);
    if (!el || !el.value.trim()) continue;
    const v = parseFloat(el.value);
    if (!isNaN(v) && v >= 0 && v <= 4) {
      sum += v;
      count++;
    }
  }
  if (count === 0) { showToast('Please enter at least one year GPA.'); return; }
  const cgpa = sum / count;
  let division = 'Fail';
  if (cgpa >= 3.0) division = 'First Class';
  else if (cgpa >= 2.25) division = 'Second Class';
  else if (cgpa >= 2.0) division = 'Third Class';

  displayGpaResult({
    systemName: 'National University of Bangladesh',
    calcMethod: 'Honours CGPA & Division',
    mainLabel: 'Cumulative CGPA',
    mainVal: cgpa.toFixed(2),
    completed: count,
    total: 4,
    unitName: 'Years',
    badge: { text: count === 4 ? `${division} (Final)` : `Provisional (${count}/4 Yrs)`, isFinal: count === 4 },
    stats: [{ lbl: 'Division', val: division }, { lbl: 'Scale', val: '4.00' }]
  });
}

function renderBdUniView(container) {
  renderUs4View(container);
}

function renderUs4View(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">Credit-Weighted 4.00 GPA Calculator</strong>
      <div id="us4-course-list" style="margin-top:12px;"></div>
      <button type="button" class="btn ghost small" onclick="addUs4CourseRow()">+ Add Course</button>
      <div style="margin-top:16px;">
        <button type="button" class="btn primary" onclick="calcUs4()">Calculate GPA</button>
      </div>
    </div>
  `;
  for (let i = 0; i < 4; i++) addUs4CourseRow();
}

let us4Count = 0;
function addUs4CourseRow() {
  us4Count++;
  const list = document.getElementById('us4-course-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'gpa-row';
  row.innerHTML = `
    <div><label>Course</label><input type="text" placeholder="e.g. Calculus I"></div>
    <div>
      <label>Grade</label>
      <select class="us4-grade">
        <option value="4.00" selected>A (4.00)</option>
        <option value="3.70">A- (3.70)</option>
        <option value="3.30">B+ (3.30)</option>
        <option value="3.00">B (3.00)</option>
        <option value="2.70">B- (2.70)</option>
        <option value="2.00">C (2.00)</option>
        <option value="1.00">D (1.00)</option>
        <option value="0.00">F (0.00)</option>
      </select>
    </div>
    <div><label>Credits</label><input type="number" class="us4-cr" min="0.5" max="10" step="0.5" value="3"></div>
    <button type="button" class="btn ghost small" onclick="this.closest('.gpa-row').remove();">×</button>
  `;
  list.appendChild(row);
}

function calcUs4() {
  const rows = document.querySelectorAll('#us4-course-list .gpa-row');
  let totalPts = 0, totalCr = 0, count = 0;
  rows.forEach(r => {
    const sel = r.querySelector('.us4-grade');
    const cr = parseFloat(r.querySelector('.us4-cr')?.value) || 3;
    if (sel && cr > 0) {
      totalPts += parseFloat(sel.value) * cr;
      totalCr += cr;
      count++;
    }
  });
  if (count === 0) { showToast('Please enter courses.'); return; }
  const gpa = totalCr > 0 ? totalPts / totalCr : 0;
  displayGpaResult({
    systemName: 'Academic 4.00 System',
    calcMethod: 'Credit-Weighted GPA',
    mainLabel: 'Calculated GPA',
    mainVal: gpa.toFixed(2),
    badge: { text: 'Credit Weighted', isFinal: true },
    stats: [{ lbl: 'Total Credits', val: totalCr.toFixed(1) }, { lbl: 'Courses', val: count.toString() }]
  });
}

function renderUkDegreeView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">UK Percentage & Degree Classification</strong>
      <p style="font-size:.82rem;color:var(--ink-soft);margin:4px 0 12px 0;">1st (70%+), 2:1 (60-69%), 2:2 (50-59%), 3rd (40-49%).</p>
      <div id="uk-list"></div>
      <button type="button" class="btn ghost small" onclick="addUkRow()">+ Add Module</button>
      <div style="margin-top:16px;"><button type="button" class="btn primary" onclick="calcUkDegree()">Calculate Classification</button></div>
    </div>
  `;
  for (let i = 0; i < 4; i++) addUkRow();
}

let ukCount = 0;
function addUkRow() {
  ukCount++;
  const list = document.getElementById('uk-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'gpa-row';
  row.innerHTML = `
    <div><label>Module</label><input type="text" placeholder="e.g. Dissertation"></div>
    <div><label>Mark (%)</label><input type="number" class="uk-mark" min="0" max="100" placeholder="e.g. 68"></div>
    <div><label>Credits</label><input type="number" class="uk-cr" min="5" max="120" value="20"></div>
    <button type="button" class="btn ghost small" onclick="this.closest('.gpa-row').remove();">×</button>
  `;
  list.appendChild(row);
}

function calcUkDegree() {
  const rows = document.querySelectorAll('#uk-list .gpa-row');
  let sum = 0, crs = 0, count = 0;
  rows.forEach(r => {
    const m = parseFloat(r.querySelector('.uk-mark')?.value);
    const c = parseFloat(r.querySelector('.uk-cr')?.value) || 20;
    if (!isNaN(m) && m >= 0 && m <= 100 && c > 0) {
      sum += m * c;
      crs += c;
      count++;
    }
  });
  if (count === 0) { showToast('Please enter module marks.'); return; }
  const avg = crs > 0 ? sum / crs : 0;
  let classification = avg >= 70 ? 'First-Class Honours (1st)' : (avg >= 60 ? 'Upper Second-Class (2:1)' : (avg >= 50 ? 'Lower Second-Class (2:2)' : (avg >= 40 ? 'Third-Class (3rd)' : 'Fail')));
  displayGpaResult({
    systemName: 'United Kingdom Higher Education',
    calcMethod: 'Degree Classification',
    mainLabel: 'Weighted Average',
    mainVal: `${avg.toFixed(2)}%`,
    badge: { text: classification.split(' ')[0], isFinal: true },
    stats: [{ lbl: 'Classification', val: classification }, { lbl: 'Total Credits', val: crs.toString() }]
  });
}

function renderInCgpaView(container) {
  container.innerHTML = `
    <div style="background:#FFF;border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px;">
      <strong style="font-size:.95rem;color:var(--ink);">India 10-Point CGPA to Percentage</strong>
      <div style="margin:12px 0;">
        <label>Your CGPA (0.00 - 10.00)</label>
        <input type="number" id="in-cgpa-val" min="0" max="10" step="0.01" placeholder="e.g. 8.40">
      </div>
      <div style="margin-top:16px;"><button type="button" class="btn primary" onclick="calcInCgpa()">Calculate Percentage</button></div>
    </div>
  `;
}

function calcInCgpa() {
  const cgpa = parseFloat(document.getElementById('in-cgpa-val')?.value);
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) { showToast('Enter a valid CGPA between 0 and 10.'); return; }
  const pct = cgpa * 9.5;
  displayGpaResult({
    systemName: 'India Academic System',
    calcMethod: 'CBSE / Institutional Conversion (x9.5)',
    mainLabel: 'Equivalent Percentage',
    mainVal: `${pct.toFixed(2)}%`,
    badge: { text: `CGPA ${cgpa.toFixed(2)} / 10.0`, isFinal: true },
    stats: [{ lbl: 'Formula', val: 'CGPA × 9.5' }]
  });
}

function renderCanadaView(container) { renderUs4View(container); }
function renderAustraliaView(container) { renderUs4View(container); }
function renderEuEctsView(container) { renderUkDegreeView(container); }

// ---- Citation Generator ----
function genCitation() {
  const author = val('c-author') || 'Author, A.';
  const year = val('c-year') || 'n.d.';
  const title = val('c-title') || 'Untitled';
  const pub = val('c-pub') || 'Publisher';
  const style = document.getElementById('c-style')?.value || 'apa';
  let out = '';
  if (style === 'apa') {
    out = `${author} (${year}). ${title}. ${pub}.`;
  } else if (style === 'chicago') {
    out = `${author}. ${title}. ${pub}, ${year}.`;
  } else {
    out = `${author}. "${title}." ${pub}, ${year}.`;
  }
  const box = document.getElementById('citation-out');
  if (box) {
    box.style.display = 'block';
    box.textContent = out;
  }
}

// ---- Blog Composer ----
function bwCmd(command) {
  const ed = document.getElementById('bw-editor');
  if (ed) {
    ed.focus();
    document.execCommand(command, false, null);
    renderBlogPreview();
  }
}

function bwFormatBlock(tag) {
  const ed = document.getElementById('bw-editor');
  if (ed) {
    ed.focus();
    document.execCommand('formatBlock', false, tag);
    renderBlogPreview();
  }
}

function bwReadTime() {
  const text = document.getElementById('bw-editor')?.innerText || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)) + ' min read';
}

function renderBlogPreview() {
  const title = val('bw-title') || 'Untitled Post';
  const excerpt = val('bw-excerpt');
  const author = val('bw-author') || 'Deskwork';
  const category = val('bw-category');
  const bodyHtml = document.getElementById('bw-editor')?.innerHTML || '';
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const readTime = bwReadTime();

  let html = '';
  if (bwCoverDataUrl) html += `<img class="bap-cover" src="${bwCoverDataUrl}">`;
  html += `<div class="bap-body">`;
  if (category) html += `<span class="bap-category">${esc(category)}</span>`;
  html += `<h1>${esc(title)}</h1>`;
  if (excerpt) html += `<div class="bap-excerpt">${esc(excerpt)}</div>`;
  html += `<div class="bap-byline">By ${esc(author)} • ${today} • ${readTime}</div>`;
  html += `<div class="bap-content">${bodyHtml}</div>`;
  html += `</div>`;
  const previewEl = document.getElementById('bw-preview');
  if (previewEl) previewEl.innerHTML = html;
}

function buildBlogPostHtml() {
  const title = val('bw-title') || 'Untitled Post';
  const excerpt = val('bw-excerpt');
  const author = val('bw-author') || 'Deskwork';
  const category = val('bw-category');
  const bodyHtml = document.getElementById('bw-editor')?.innerHTML || '';
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const readTime = bwReadTime();
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(title)}</title></head><body><h1>${esc(title)}</h1><p>By ${esc(author)} • ${today} • ${readTime}</p><div>${bodyHtml}</div></body></html>`;
}

function downloadBlogPost() {
  const title = val('bw-title');
  if (!title) { showToast('Add a title first.'); return; }
  const html = buildBlogPostHtml();
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'untitled-post';
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slug}.html`;
  a.click();
  showToast(`Downloaded ${slug}.html`);
}

function copyBlogListingSnippet() {
  const title = val('bw-title') || 'Post Title';
  const excerpt = val('bw-excerpt') || '';
  const category = val('bw-category') || 'Guides';
  const author = val('bw-author') || 'Deskwork';
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) + '.html';
  const entry = { title, excerpt, slug, image: bwCoverDataUrl || '', date: new Date().toISOString().slice(0, 10), category, author, readTime: bwReadTime() };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2) + ',').then(() => showToast('Listing snippet copied!'));
  }
}

// Global App Init
function initDeskworkApp() {
  try {
    if (!loadSavedData()) {
      addExp();
      addEdu();
      addJpEdu();
      addJpWork();
      addJpFamily();
    }
  } catch (err) {
    console.warn(err);
  }

  DeskworkDB.get('photoDataUrl').then(val => {
    if (val) {
      photoDataUrl = val;
      syncResumePhotoUI();
      renderAll();
    }
  });

  DeskworkDB.get('signatureDataUrl').then(val => {
    if (val) {
      signatureDataUrl = val;
      syncResumeSigUI();
      renderAll();
    }
  });

  DeskworkDB.get('jpPhotoDataUrl').then(val => {
    if (val) {
      jpPhotoDataUrl = val;
      const b = document.getElementById('btn-remove-jp-photo');
      if (b) b.style.display = 'inline-block';
      renderJapan();
    }
  });

  // Photo change listeners
  const rPhoto = document.getElementById('r-photo');
  if (rPhoto) {
    rPhoto.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        photoDataUrl = ev.target.result;
        DeskworkDB.set('photoDataUrl', photoDataUrl);
        syncResumePhotoUI();
        renderAll();
      };
      reader.readAsDataURL(file);
    });
  }

  const rPhotoBox = document.getElementById('r-photo-box');
  if (rPhotoBox) {
    ['dragenter', 'dragover'].forEach(evt => {
      rPhotoBox.addEventListener(evt, e => {
        e.preventDefault();
        rPhotoBox.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      rPhotoBox.addEventListener(evt, e => {
        e.preventDefault();
        rPhotoBox.classList.remove('dragover');
      });
    });
    rPhotoBox.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        const file = dt.files[0];
        if (file.type && !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = ev => {
          photoDataUrl = ev.target.result;
          DeskworkDB.set('photoDataUrl', photoDataUrl);
          syncResumePhotoUI();
          renderAll();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const rSig = document.getElementById('r-signature');
  if (rSig) {
    rSig.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        signatureDataUrl = ev.target.result;
        DeskworkDB.set('signatureDataUrl', signatureDataUrl);
        syncResumeSigUI();
        saveDataImmediate();
        renderAll();
      };
      reader.readAsDataURL(file);
    });
  }

  const rSigBox = document.getElementById('r-sig-box');
  if (rSigBox) {
    ['dragenter', 'dragover'].forEach(evt => {
      rSigBox.addEventListener(evt, e => {
        e.preventDefault();
        rSigBox.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      rSigBox.addEventListener(evt, e => {
        e.preventDefault();
        rSigBox.classList.remove('dragover');
      });
    });
    rSigBox.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        const file = dt.files[0];
        if (file.type && !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = ev => {
          signatureDataUrl = ev.target.result;
          DeskworkDB.set('signatureDataUrl', signatureDataUrl);
          syncResumeSigUI();
          saveDataImmediate();
          renderAll();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const jpPhoto = document.getElementById('jp-photo');
  if (jpPhoto) {
    jpPhoto.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        jpPhotoDataUrl = ev.target.result;
        DeskworkDB.set('jpPhotoDataUrl', jpPhotoDataUrl);
        const b = document.getElementById('btn-remove-jp-photo');
        if (b) b.style.display = 'inline-block';
        renderJapan();
      };
      reader.readAsDataURL(file);
    });
  }

  // Cover image change listener
  const bwCover = document.getElementById('bw-cover-input');
  if (bwCover) {
    bwCover.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        bwCoverDataUrl = ev.target.result;
        renderBlogPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // Image resizer drag and drop
  const resizeDropZone = document.getElementById('resize-drop-zone');
  const resizeFileInput = document.getElementById('resize-file-input');
  if (resizeFileInput) {
    resizeFileInput.addEventListener('change', e => handleResizeFile(e.target.files[0]));
  }
  if (resizeDropZone) {
    resizeDropZone.addEventListener('dragover', e => { e.preventDefault(); resizeDropZone.classList.add('dragover'); });
    resizeDropZone.addEventListener('dragleave', () => resizeDropZone.classList.remove('dragover'));
    resizeDropZone.addEventListener('drop', e => {
      e.preventDefault();
      resizeDropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleResizeFile(e.dataTransfer.files[0]);
    });
  }

  // File Converter (PDF/Word) drop & input
  const docFileInput = document.getElementById('doc-file-input');
  const docDropZone = document.getElementById('doc-drop-zone');
  if (docFileInput) {
    docFileInput.addEventListener('change', e => handleDocFile(e.target.files[0]));
  }
  if (docDropZone) {
    docDropZone.addEventListener('dragover', e => { e.preventDefault(); docDropZone.classList.add('dragover'); });
    docDropZone.addEventListener('dragleave', () => docDropZone.classList.remove('dragover'));
    docDropZone.addEventListener('drop', e => {
      e.preventDefault();
      docDropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleDocFile(e.dataTransfer.files[0]);
    });
  }

  const docQualityInp = document.getElementById('doc-quality');
  if (docQualityInp) {
    docQualityInp.addEventListener('input', e => {
      const qVal = document.getElementById('doc-quality-val');
      if (qVal) qVal.textContent = e.target.value + '%';
    });
  }

  // Scanner inputs
  const scanCam = document.getElementById('scan-camera-input');
  const scanGal = document.getElementById('scan-gallery-input');
  const handleScanFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById('scan-source-img');
      if (img) {
        img.onload = () => {
          scanImg = img;
          scanImgNatW = img.naturalWidth;
          scanImgNatH = img.naturalHeight;
          resetScanCorners(0.06);
          const editor = document.getElementById('scan-editor');
          if (editor) editor.style.display = 'block';
          initScanCanvasWrapTap();
          setTimeout(() => {
            positionScanHandles();
          }, 40);
        };
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };
  if (scanCam) scanCam.addEventListener('change', handleScanFile);
  if (scanGal) scanGal.addEventListener('change', handleScanFile);
  initScanCanvasWrapTap();
  window.addEventListener('resize', () => {
    positionScanHandles();
  });

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDeskworkTab(btn.dataset.panel));
  });

  window.addEventListener('hashchange', handleDeskworkHashNavigation);
  handleDeskworkHashNavigation();

  const resumeSection = document.getElementById('resume');
  if (resumeSection) {
    resumeSection.addEventListener('input', renderAll);
    resumeSection.addEventListener('change', renderAll);
  }

  ['r-name','r-title','r-email','r-phone','r-location','r-linkedin','r-summary','r-skills','r-dob','r-nationality',
   'r-father','r-mother','r-nid','r-present-addr','r-permanent-addr','r-languages','r-references',
   'r-research-interests','r-awards','r-training','r-hobbies','r-passport','r-visa-status','r-driving-license',
   'r-computing-os','r-computing-software','r-strengths'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', renderAll);
      el.addEventListener('change', renderAll);
    }
  });

  updateFieldVisibility();
  renderAll();
  renderLetter();
  renderBlogPreview();
  onGpaSystemChange();

  // Escape key closes preview modal
  document.addEventListener('keydown', e => {
    const modal = document.getElementById('doc-preview-modal');
    if (modal && modal.style.display !== 'none' && e.key === 'Escape') {
      e.preventDefault();
      closeDocumentPreview();
    }
  });
}

// Expose all interactive functions to window object
Object.assign(window, {
  DeskworkDB,
  removeResumePhoto,
  removeResumeSig,
  syncResumeSigUI,
  setExpDescMode,
  setStrengthsMode,
  setSkillsDisplayMode,
  removeJapanPhoto,
  confirmResetResume,
  confirmResetJapan,
  switchDeskworkTab,
  addExp,
  addEdu,
  addJpEdu,
  addJpLangCert,
  addJpWork,
  addJpFamily,
  addLangRow,
  addPubRow,
  addConfRow,
  addSwSkillRow,
  addGulfLangRow,
  onEduScaleChange,
  onEduGpaInput,
  setTemplate,
  renderPreview,
  renderJapan,
  renderAll,
  autoDraftSummary,
  autoDraftStrengths,
  openDocumentPreview,
  closeDocumentPreview,
  toggleDocPreviewZoom,
  applyDocPreviewZoom,
  executeDownloadPdf,
  executePrintDoc,
  downloadResumePdf,
  downloadJapanPdf,
  onLetterPurposeChange,
  renderLetter,
  autoDraftLetter,
  copyLetterToClipboard,
  printLetter,
  downloadLetterPdf,
  resizeImage,
  toggleResizeSizeMode,
  toggleDocSizeMode,
  convertPdfToWord,
  compressPdfFile,
  convertDocxToPdf,
  setScanCropMode,
  rotateScanSourceImage,
  openScanPreviewModal,
  closeScanPreviewModal,
  rotateCurrentPreviewPage,
  resetScanCorners,
  applyScanCrop,
  cancelScanEditor,
  removeScanPage,
  clearScanPages,
  downloadScanAsPdf,
  downloadScanAsImages,
  onGpaSystemChange,
  updateBdDiplomaInputs,
  calcBdDiploma,
  calcBdHonours,
  calcBdSscHsc,
  calcBdNu,
  addUs4CourseRow,
  calcUs4,
  addUkRow,
  calcUkDegree,
  calcInCgpa,
  genCitation,
  bwCmd,
  bwFormatBlock,
  renderBlogPreview,
  downloadBlogPost,
  copyBlogListingSnippet
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDeskworkApp);
} else {
  initDeskworkApp();
}
