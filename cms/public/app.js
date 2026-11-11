// AEM-Style Visual In-Context Studio CMS Engine
// STRICT RULE: Exactly zero emojis throughout the entire script.

const API = {
  getData: (collection) => fetch(`/api/data/${collection}`).then(r => r.json()),
  saveData: (collection, data) => fetch(`/api/data/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getUploads: () => fetch('/api/uploads').then(r => r.json()),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json());
  },
  getGitStatus: () => fetch('/api/git/status').then(r => r.json()),
  executeGitPush: (message) => fetch('/api/git/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  }).then(r => r.json())
};

// Global In-Memory State
let state = {
  cv: null,
  caseStudies: null,
  projects: null,
  education: null,
  certifications: null,
  isDirty: false,
  selectedTarget: null, // { type: 'component'|'subitem', name, index, element }
  mode: 'edit'
};

function markDirty() {
  state.isDirty = true;
  const statusEl = document.getElementById('save-status');
  statusEl.className = 'aem-save-status unsaved';
  statusEl.textContent = 'Unsaved Changes (Ctrl+S)';
}

function markClean() {
  state.isDirty = false;
  const statusEl = document.getElementById('save-status');
  statusEl.className = 'aem-save-status';
  statusEl.textContent = 'All Changes Saved';
}

function showToast(msg = 'Saved successfully!') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2500);
}

/* -------------------------------------------------------------
   1. CANVAS RENDERING ENGINE (Exact Live Mirror)
------------------------------------------------------------- */
async function loadAndRenderAll() {
  try {
    const [cv, caseStudies, projects, education, certifications] = await Promise.all([
      API.getData('cv'),
      API.getData('case-studies'),
      API.getData('projects'),
      API.getData('education'),
      API.getData('certifications')
    ]);

    state.cv = cv;
    state.caseStudies = caseStudies;
    state.projects = projects;
    state.education = education;
    state.certifications = certifications;

    renderCanvas();
    setupCanvasInteractions();
    markClean();
  } catch (err) {
    console.error('Failed to load portfolio data:', err);
    document.getElementById('aem-canvas').innerHTML = `
      <div style="color: #ef4444; text-align: center; padding: 3rem;">
        Failed to load data. Please ensure the CMS server is running.
      </div>
    `;
  }
}

function renderCanvas() {
  const canvas = document.getElementById('aem-canvas');
  const b = state.cv.basics || {};
  const metrics = state.cv.metrics || [];

  // Group certifications
  const seoCerts = (state.certifications || []).filter(c => c.category === 'SEO & Content');
  const aiCerts = (state.certifications || []).filter(c => c.category === 'AI & Search');
  const perfCerts = (state.certifications || []).filter(c => c.category === 'Performance Marketing & Paid Ads');
  const uxCerts = (state.certifications || []).filter(c => c.category === 'UX & Automation');
  const socialCerts = (state.certifications || []).filter(c => c.category === 'Social & Media');
  const maritimeCerts = (state.certifications || []).filter(c => c.category === 'Maritime and Commercial Licensing');

  canvas.innerHTML = `
    <!-- COMPONENT 1: HERO -->
    <section class="aem-component pt-4 pb-6 border-b border-slate-800/60" data-aem-component="hero">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Hero</span></div>
      <div class="max-w-3xl space-y-3">
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white" contenteditable="true" data-field="cv.basics.name">
          ${b.name || 'Doruk Doğan'}
        </h1>
        <p class="text-base sm:text-lg text-slate-300 leading-relaxed font-medium" contenteditable="true" data-field="cv.basics.summary">
          ${b.summary || ''}
        </p>
      </div>
    </section>

    <!-- COMPONENT 2: GREETING CARD -->
    <section class="aem-component py-6 border-b border-slate-800/60" data-aem-component="greeting">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Greeting Card</span></div>
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="relative shrink-0">
          <div class="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center shadow-sm">
            ${b.avatar ? `
              <img id="canvas-avatar-img" src="${b.avatar}" alt="${b.name}" class="w-full h-full object-cover object-center" onerror="this.style.display='none'; document.getElementById('canvas-avatar-fallback').style.display='flex';" />
            ` : ''}
            <div id="canvas-avatar-fallback" class="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800" style="${b.avatar ? 'display: none;' : 'display: flex;'}">
              <svg class="w-16 h-16 sm:w-20 sm:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span class="text-[10px] font-mono tracking-wider uppercase mt-1 text-slate-500">${b.name || 'Doruk Doğan'}</span>
            </div>
          </div>
        </div>

        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span contenteditable="true" data-field="cv.status">Available for senior mandates</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white" contenteditable="true" data-field="cv.greetingTitle">
            Hi, I'm Doruk. Welcome to my portfolio.
          </h2>
          <p class="text-sm text-slate-300 leading-relaxed" contenteditable="true" data-field="cv.greetingSubtitle">
            Senior performance marketing and technical web operations specialist based in Istanbul / Amsterdam. I bridge paid media growth, enterprise CMS architecture, and custom automation software.
          </p>
          <div class="pt-1 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span contenteditable="true" data-field="cv.basics.location">${b.location || 'Istanbul / Amsterdam'}</span>
            <span>·</span>
            <span class="text-white underline underline-offset-4">Direct Inquiry</span>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPONENT 3: METRICS -->
    <section class="aem-component py-8 border-b border-slate-800/60" data-aem-component="metrics">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Key Metrics</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        ${metrics.map((m, idx) => `
          <div class="aem-subitem p-2" data-aem-subitem="metric" data-index="${idx}">
            <div class="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight" contenteditable="true" data-field="cv.metrics.${idx}.value">
              ${m.value}
            </div>
            <div class="text-xs text-slate-400 mt-0.5" contenteditable="true" data-field="cv.metrics.${idx}.label">
              ${m.label}
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- COMPONENT 4: PAST WORK (CASE STUDIES) -->
    <section class="aem-component py-12 border-b border-slate-800/60" data-aem-component="case-studies">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Past Work</span></div>
      <div class="space-y-6">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Past Work</h2>
          <span class="text-xs font-mono text-slate-400">${(state.caseStudies || []).length} Deliverables</span>
        </div>
        <div id="sublist-case-studies" class="divide-y divide-slate-800/50">
          ${(state.caseStudies || []).map((work, idx) => {
            const topKpi = work.kpis && work.kpis[0] ? work.kpis[0] : null;
            return `
              <article class="aem-subitem py-6 first:pt-0 last:pb-0" data-aem-subitem="case-study" data-index="${idx}">
                <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div class="space-y-1 max-w-2xl">
                    <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span class="font-semibold text-slate-300" contenteditable="true" data-field="caseStudies.${idx}.client">${work.client}</span>
                      <span>·</span>
                      <span contenteditable="true" data-field="caseStudies.${idx}.category">${work.category}</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-bold text-white">
                      <span contenteditable="true" data-field="caseStudies.${idx}.title">${work.title}</span>
                    </h3>
                    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed" contenteditable="true" data-field="caseStudies.${idx}.summary">
                      ${work.summary}
                    </p>
                  </div>
                  ${topKpi ? `
                    <div class="sm:text-right shrink-0 pt-1 sm:pt-0">
                      <div class="font-mono text-sm font-bold text-white" contenteditable="true" data-field="caseStudies.${idx}.kpis.0.value">${topKpi.value}</div>
                      <div class="text-[11px] text-slate-400" contenteditable="true" data-field="caseStudies.${idx}.kpis.0.label">${topKpi.label}</div>
                    </div>
                  ` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- COMPONENT 5: CUSTOM SOFTWARE TOOLS -->
    <section class="aem-component py-12 border-b border-slate-800/60" data-aem-component="custom-tools">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Custom Tools</span></div>
      <div class="space-y-6">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Custom Software Tools</h2>
          <span class="text-xs font-mono text-slate-400">${(state.projects || []).length} Systems</span>
        </div>
        <div id="sublist-projects" class="divide-y divide-slate-800/50">
          ${(state.projects || []).map((proj, idx) => {
            const topKpi = proj.kpis && proj.kpis[0] ? proj.kpis[0] : null;
            return `
              <article class="aem-subitem py-6 first:pt-0 last:pb-0" data-aem-subitem="custom-tool" data-index="${idx}">
                <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div class="space-y-1 max-w-2xl">
                    <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span class="font-semibold text-slate-300" contenteditable="true" data-field="projects.${idx}.category">${proj.category}</span>
                      <span>·</span>
                      <span contenteditable="true" data-field="projects.${idx}.type">${proj.type}</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-bold text-white">
                      <span contenteditable="true" data-field="projects.${idx}.title">${proj.title}</span>
                    </h3>
                    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed" contenteditable="true" data-field="projects.${idx}.summary">
                      ${proj.summary}
                    </p>
                  </div>
                  ${topKpi ? `
                    <div class="sm:text-right shrink-0 pt-1 sm:pt-0">
                      <div class="font-mono text-sm font-bold text-white" contenteditable="true" data-field="projects.${idx}.kpis.0.value">${topKpi.value}</div>
                      <div class="text-[11px] text-slate-400" contenteditable="true" data-field="projects.${idx}.kpis.0.label">${topKpi.label}</div>
                    </div>
                  ` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- COMPONENT 6: EXPERIENCE TIMELINE -->
    <section class="aem-component py-12 border-b border-slate-800/60" data-aem-component="experience">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Experience</span></div>
      <div class="space-y-6">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Experience</h2>
          <span class="text-xs font-mono text-slate-400">Career Timeline</span>
        </div>
        <div id="sublist-experience" class="divide-y divide-slate-800/50">
          ${(state.cv.experience || []).map((exp, idx) => `
            <div class="aem-subitem py-6 first:pt-0 last:pb-0 space-y-2" data-aem-subitem="experience-role" data-index="${idx}">
              <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span class="font-bold text-sm sm:text-base text-white" contenteditable="true" data-field="cv.experience.${idx}.role">${exp.role}</span>
                  <span class="text-slate-400 mx-1.5">·</span>
                  <span class="text-xs sm:text-sm font-medium text-emerald-400" contenteditable="true" data-field="cv.experience.${idx}.company">${exp.company}</span>
                </div>
                <span class="font-mono text-xs text-slate-400 shrink-0" contenteditable="true" data-field="cv.experience.${idx}.period">${exp.period}</span>
              </div>
              ${exp.highlights && exp.highlights.length > 0 ? `
                <ul class="space-y-1 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl pt-1">
                  ${exp.highlights.map((h, hIdx) => `
                    <li class="flex items-start gap-2">
                      <span class="text-slate-400 shrink-0 mt-0.5">•</span>
                      <span contenteditable="true" data-field="cv.experience.${idx}.highlights.${hIdx}">${h}</span>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- COMPONENT 7: QUALIFICATIONS & CERTIFICATIONS -->
    <section class="aem-component py-12 border-b border-slate-800/60" data-aem-component="qualifications">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Qualifications</span></div>
      <div class="space-y-6">
        <div class="flex items-baseline justify-between">
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Qualifications</h2>
          <span class="text-xs font-mono text-slate-400">3 Degrees · ${(state.certifications || []).length} Credentials</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 text-xs">
          <!-- Col 1: Degrees + SEO + AI -->
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/50">Academic Foundation</div>
              ${(state.education || []).map((edu, idx) => `
                <div class="aem-subitem space-y-0.5" data-aem-subitem="education" data-index="${idx}">
                  <div class="font-bold text-white text-sm" contenteditable="true" data-field="education.${idx}.degree">${edu.degree}</div>
                  <div class="text-slate-400 font-mono text-xs">
                    <span contenteditable="true" data-field="education.${idx}.institution">${edu.institution}</span> · <span contenteditable="true" data-field="education.${idx}.year">${edu.year}</span>
                  </div>
                  ${edu.highlight ? `<p class="text-slate-400 text-xs pt-0.5" contenteditable="true" data-field="education.${idx}.highlight">${edu.highlight}</p>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="space-y-3">
              <div class="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/50">Technical SEO (${seoCerts.length})</div>
              ${seoCerts.map((cert) => `
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-semibold text-white">${cert.name}</div>
                    <div class="text-slate-400 font-mono text-[11px]">${cert.issuer} · ${cert.date}</div>
                  </div>
                  ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" class="text-slate-400 hover:text-emerald-400 font-mono text-[11px] underline">Verify</a>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Col 2: Paid Ads + UX + Licensing -->
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/50">Performance Marketing (${perfCerts.length})</div>
              ${perfCerts.map((cert) => `
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-semibold text-white">${cert.name}</div>
                    <div class="text-slate-400 font-mono text-[11px]">${cert.issuer} · ${cert.date}</div>
                  </div>
                  ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" class="text-slate-400 hover:text-emerald-400 font-mono text-[11px] underline">Verify</a>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="space-y-3">
              <div class="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/50">UX &amp; Automation (${uxCerts.length})</div>
              ${uxCerts.map((cert) => `
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-semibold text-white">${cert.name}</div>
                    <div class="text-slate-400 font-mono text-[11px]">${cert.issuer} · ${cert.date}</div>
                  </div>
                  ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" class="text-slate-400 hover:text-emerald-400 font-mono text-[11px] underline">Verify</a>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="space-y-3">
              <div class="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/50">Maritime &amp; Licensing (${maritimeCerts.length})</div>
              ${maritimeCerts.map((cert) => `
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-semibold text-white">${cert.name}</div>
                    <div class="text-slate-400 font-mono text-[11px]">${cert.issuer} · ${cert.date}</div>
                  </div>
                  ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" class="text-slate-400 hover:text-emerald-400 font-mono text-[11px] underline">Verify</a>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPONENT 8: CONTACT -->
    <section class="aem-component py-12" data-aem-component="contact">
      <div class="aem-badge"><span class="aem-drag-handle">⠿</span><span>Component: Contact</span></div>
      <div class="space-y-4">
        <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Contact</h2>
        <p class="text-sm text-slate-300 leading-relaxed max-w-xl">
          Available for Senior Growth, Performance Marketing, and Web Operations mandates across Europe and remote.
        </p>
        <div class="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-mono">
          <span class="text-white font-semibold underline underline-offset-4" contenteditable="true" data-field="cv.basics.email">${b.email || 'dorukdogan95@gmail.com'}</span>
          <span class="text-slate-700">/</span>
          <span class="text-slate-300 underline underline-offset-4" contenteditable="true" data-field="cv.basics.linkedin">${b.linkedin || 'LinkedIn'}</span>
          <span class="text-slate-700">/</span>
          <span class="text-slate-400" contenteditable="true" data-field="cv.basics.location">${b.location || 'Istanbul / Amsterdam'}</span>
        </div>
      </div>
    </section>
  `;
}

/* -------------------------------------------------------------
   2. INLINE DATA BINDING & INTERACTION SETUP
------------------------------------------------------------- */
function setupCanvasInteractions() {
  const canvas = document.getElementById('aem-canvas');

  // Input listener for inline contenteditable
  canvas.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const fieldPath = el.dataset.field;
      if (!fieldPath) return;
      setDeepValue(state, fieldPath, el.textContent.trim());
      markDirty();
    });
  });

  // Right-Click Context Menu Listener
  canvas.addEventListener('contextmenu', (e) => {
    if (state.mode === 'preview') return;
    e.preventDefault();

    // Check if subitem or component was targeted
    const subitemEl = e.target.closest('.aem-subitem');
    const componentEl = e.target.closest('.aem-component');

    if (subitemEl) {
      const subType = subitemEl.dataset.aemSubitem;
      const index = parseInt(subitemEl.dataset.index, 10);
      selectTarget({ type: 'subitem', name: subType, index, element: subitemEl, parentComponent: componentEl });
      openContextMenu(e.clientX, e.clientY, `Card: ${subType} #${index + 1}`);
    } else if (componentEl) {
      const compName = componentEl.dataset.aemComponent;
      selectTarget({ type: 'component', name: compName, element: componentEl });
      openContextMenu(e.clientX, e.clientY, `Component: ${compName}`);
    }
  });

  // Initialize Section Drag & Drop
  if (window.Sortable) {
    Sortable.create(canvas, {
      handle: '.aem-drag-handle',
      animation: 150,
      onEnd: () => markDirty()
    });

    // Sub-item drag & drop
    const sublists = ['sublist-case-studies', 'sublist-projects', 'sublist-experience'];
    sublists.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        Sortable.create(el, {
          handle: '.aem-subitem',
          animation: 150,
          onEnd: (evt) => {
            handleSubitemReorder(id, evt.oldIndex, evt.newIndex);
            markDirty();
          }
        });
      }
    });
  }
}

function handleSubitemReorder(sublistId, oldIdx, newIdx) {
  if (sublistId === 'sublist-case-studies' && state.caseStudies) {
    const moved = state.caseStudies.splice(oldIdx, 1)[0];
    state.caseStudies.splice(newIdx, 0, moved);
  } else if (sublistId === 'sublist-projects' && state.projects) {
    const moved = state.projects.splice(oldIdx, 1)[0];
    state.projects.splice(newIdx, 0, moved);
  } else if (sublistId === 'sublist-experience' && state.cv.experience) {
    const moved = state.cv.experience.splice(oldIdx, 1)[0];
    state.cv.experience.splice(newIdx, 0, moved);
  }
}

function selectTarget(target) {
  // Clear previous selection
  document.querySelectorAll('.aem-selected').forEach(el => el.classList.remove('aem-selected'));
  state.selectedTarget = target;
  if (target && target.element) {
    target.element.classList.add('aem-selected');
  }
}

/* -------------------------------------------------------------
   3. AEM CONTEXT MENU ACTIONS
------------------------------------------------------------- */
function openContextMenu(x, y, title) {
  const menu = document.getElementById('aem-context-menu');
  document.getElementById('aem-menu-title').textContent = title;

  // Clamp within viewport
  const maxX = window.innerWidth - 240;
  const maxY = window.innerHeight - 200;
  menu.style.left = `${Math.min(x, maxX)}px`;
  menu.style.top = `${Math.min(y, maxY)}px`;
  menu.style.display = 'block';
}

function closeContextMenu() {
  document.getElementById('aem-context-menu').style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#aem-context-menu')) {
    closeContextMenu();
  }
});

// Context Menu Action: Configure Properties
document.getElementById('menu-action-configure').addEventListener('click', () => {
  closeContextMenu();
  if (state.selectedTarget) {
    openPropertiesDrawer(state.selectedTarget);
  }
});

// Context Menu Action: Move Up
document.getElementById('menu-action-move-up').addEventListener('click', () => {
  closeContextMenu();
  const t = state.selectedTarget;
  if (!t || !t.element) return;
  const prev = t.element.previousElementSibling;
  if (prev && prev.parentNode) {
    prev.parentNode.insertBefore(t.element, prev);
    markDirty();
  }
});

// Context Menu Action: Move Down
document.getElementById('menu-action-move-down').addEventListener('click', () => {
  closeContextMenu();
  const t = state.selectedTarget;
  if (!t || !t.element) return;
  const next = t.element.nextElementSibling;
  if (next && next.parentNode) {
    next.parentNode.insertBefore(next, t.element);
    markDirty();
  }
});

// Context Menu Action: Insert Component
document.getElementById('menu-action-insert').addEventListener('click', () => {
  closeContextMenu();
  document.getElementById('aem-insert-modal').style.display = 'flex';
});

// Context Menu Action: Delete Component
document.getElementById('menu-action-delete').addEventListener('click', () => {
  closeContextMenu();
  const t = state.selectedTarget;
  if (!t || !t.element) return;

  if (confirm(`Are you sure you want to delete this ${t.name}?`)) {
    if (t.type === 'subitem') {
      if (t.name === 'case-study') state.caseStudies.splice(t.index, 1);
      else if (t.name === 'custom-tool') state.projects.splice(t.index, 1);
      else if (t.name === 'experience-role') state.cv.experience.splice(t.index, 1);
    }
    t.element.remove();
    markDirty();
  }
});

/* -------------------------------------------------------------
   4. AEM PROPERTIES DRAWER (380px Slide-out on Right)
------------------------------------------------------------- */
function openPropertiesDrawer(target) {
  const drawer = document.getElementById('aem-drawer');
  const titleEl = document.getElementById('aem-drawer-title');
  const bodyEl = document.getElementById('aem-drawer-body');

  titleEl.textContent = `Configure: ${target.name.toUpperCase()}`;
  bodyEl.innerHTML = '';

  if (target.name === 'greeting') {
    const b = state.cv.basics || {};
    bodyEl.innerHTML = `
      <div class="drawer-form-group">
        <label>Greeting Headline</label>
        <input type="text" id="drawer-greeting-title" value="Hi, I'm Doruk. Welcome to my portfolio.">
      </div>
      <div class="drawer-form-group">
        <label>Greeting Subtext</label>
        <textarea id="drawer-greeting-sub">Senior performance marketing and technical web operations specialist based in Istanbul / Amsterdam. I bridge paid media growth, enterprise CMS architecture, and custom automation software.</textarea>
      </div>
      <div class="drawer-form-group">
        <label>Portrait Image Source</label>
        <div class="drawer-image-preview">
          <img id="drawer-avatar-preview" src="${b.avatar || ''}" class="drawer-image-thumb" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'%2364748b\\'><path d=\\'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\\'/></svg>';">
          <div style="flex: 1;">
            <input type="text" id="drawer-avatar-path" value="${b.avatar || ''}" placeholder="/dorukdogan/images/doruk-portrait.jpg">
            <button id="drawer-open-media-btn" class="btn-aem-secondary" style="margin-top: 6px; width: 100%;">Select from Uploads</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('drawer-avatar-path').addEventListener('input', (e) => {
      b.avatar = e.target.value.trim();
      document.getElementById('drawer-avatar-preview').src = b.avatar;
      const img = document.getElementById('canvas-avatar-img');
      if (img) img.src = b.avatar;
      markDirty();
    });

    document.getElementById('drawer-open-media-btn').addEventListener('click', () => {
      openMediaModal((url) => {
        b.avatar = url;
        document.getElementById('drawer-avatar-path').value = url;
        document.getElementById('drawer-avatar-preview').src = url;
        const img = document.getElementById('canvas-avatar-img');
        if (img) img.src = url;
        markDirty();
      });
    });
  } else if (target.name === 'case-study' && target.index !== undefined) {
    const item = state.caseStudies[target.index];
    if (item) {
      bodyEl.innerHTML = `
        <div class="drawer-form-group">
          <label>Project Title</label>
          <input type="text" id="drawer-cs-title" value="${item.title || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Client</label>
          <input type="text" id="drawer-cs-client" value="${item.client || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Category</label>
          <input type="text" id="drawer-cs-category" value="${item.category || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Timeline</label>
          <input type="text" id="drawer-cs-timeline" value="${item.timeline || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Primary KPI Value</label>
          <input type="text" id="drawer-cs-kpi-val" value="${item.kpis && item.kpis[0] ? item.kpis[0].value : ''}">
        </div>
        <div class="drawer-form-group">
          <label>Primary KPI Label</label>
          <input type="text" id="drawer-cs-kpi-lbl" value="${item.kpis && item.kpis[0] ? item.kpis[0].label : ''}">
        </div>
        <div class="drawer-form-group">
          <label>1-Sentence Summary</label>
          <textarea id="drawer-cs-summary">${item.summary || ''}</textarea>
        </div>
      `;

      ['title', 'client', 'category', 'timeline', 'summary'].forEach(field => {
        const input = document.getElementById(`drawer-cs-${field}`);
        if (input) {
          input.addEventListener('input', (e) => {
            item[field] = e.target.value;
            markDirty();
          });
        }
      });
    }
  } else if (target.name === 'experience-role' && target.index !== undefined) {
    const item = state.cv.experience[target.index];
    if (item) {
      bodyEl.innerHTML = `
        <div class="drawer-form-group">
          <label>Role Title</label>
          <input type="text" id="drawer-exp-role" value="${item.role || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Company</label>
          <input type="text" id="drawer-exp-company" value="${item.company || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Period</label>
          <input type="text" id="drawer-exp-period" value="${item.period || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Location</label>
          <input type="text" id="drawer-exp-loc" value="${item.location || ''}">
        </div>
        <div class="drawer-form-group">
          <label>Role Summary</label>
          <textarea id="drawer-exp-summary">${item.summary || ''}</textarea>
        </div>
      `;

      ['role', 'company', 'period', 'location', 'summary'].forEach(field => {
        const input = document.getElementById(`drawer-exp-${field === 'location' ? 'loc' : field}`);
        if (input) {
          input.addEventListener('input', (e) => {
            item[field] = e.target.value;
            markDirty();
          });
        }
      });
    }
  } else {
    bodyEl.innerHTML = `
      <div style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
        You can edit text directly on the canvas in Edit Mode by clicking on it.<br><br>
        Changes are buffered in real-time. Press <strong>Ctrl+S</strong> to save everything to disk.
      </div>
    `;
  }

  drawer.classList.add('open');
}

function closeDrawer() {
  document.getElementById('aem-drawer').classList.remove('open');
}

document.getElementById('aem-drawer-close').addEventListener('click', closeDrawer);
document.getElementById('aem-drawer-done-btn').addEventListener('click', closeDrawer);

/* -------------------------------------------------------------
   5. INSERT COMPONENT MODAL LOGIC
------------------------------------------------------------- */
document.getElementById('aem-insert-cancel-btn').addEventListener('click', () => {
  document.getElementById('aem-insert-modal').style.display = 'none';
});

document.querySelectorAll('.insert-option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.insert;
    document.getElementById('aem-insert-modal').style.display = 'none';

    if (type === 'case-study') {
      state.caseStudies.unshift({
        slug: `new-case-study-${Date.now().toString().slice(-4)}`,
        title: 'New Client Engagement',
        client: 'Enterprise Client',
        category: 'Performance Marketing',
        summary: 'Deliverable outcome summary statement.',
        kpis: [{ value: 'High', label: 'Impact Gain' }],
        url: '/case-studies/new'
      });
    } else if (type === 'custom-tool') {
      state.projects.unshift({
        slug: `new-tool-${Date.now().toString().slice(-4)}`,
        title: 'New Engineering Software Tool',
        category: 'Automation Pipeline',
        type: 'Full-Stack Application',
        summary: 'System architecture and capability description.',
        kpis: [{ value: 'Unified', label: 'Workflow Efficiency' }],
        url: '/projects/new'
      });
    } else if (type === 'experience-role') {
      state.cv.experience.unshift({
        company: 'New Enterprise Client',
        role: 'Senior Growth & Operations Specialist',
        period: '2026 – Present',
        location: 'Remote',
        summary: 'Role summary statement.',
        highlights: ['Key operational achievement metric.']
      });
    }

    renderCanvas();
    setupCanvasInteractions();
    markDirty();
    showToast(`Inserted new ${type}!`);
  });
});

/* -------------------------------------------------------------
   6. MEDIA UPLOADER MODAL & AVATAR ASSIGNMENT
------------------------------------------------------------- */
let onImageSelectedCallback = null;

function openMediaModal(callback = null) {
  onImageSelectedCallback = callback;
  const modal = document.getElementById('aem-media-modal');
  modal.style.display = 'flex';
  loadMediaGallery();
}

document.getElementById('btn-media').addEventListener('click', () => openMediaModal());
document.getElementById('media-modal-close-btn').addEventListener('click', () => {
  document.getElementById('aem-media-modal').style.display = 'none';
});

const dropzone = document.getElementById('media-dropzone');
const fileInput = document.getElementById('media-file-input');

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#00d2ff'; });
dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = '#334155'; });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.borderColor = '#334155';
  if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
});

async function handleFileUpload(file) {
  showToast('Uploading image...');
  const res = await API.uploadFile(file);
  if (res.success) {
    showToast(`Uploaded: ${res.filename}`);
    loadMediaGallery();
  } else {
    alert('Upload failed: ' + (res.error || 'Unknown error'));
  }
}

async function loadMediaGallery() {
  const gallery = document.getElementById('media-gallery');
  gallery.innerHTML = '<div style="color: #64748b; font-size: 11px;">Loading uploads...</div>';
  const data = await API.getUploads();
  gallery.innerHTML = '';

  (data.files || []).forEach(f => {
    const card = document.createElement('div');
    card.style.cssText = 'background: #0b0f19; border: 1px solid #1e293b; border-radius: 6px; padding: 6px; display: flex; flex-direction: column; gap: 4px;';
    card.innerHTML = `
      <img src="${f.url}" style="width: 100%; height: 70px; object-fit: cover; border-radius: 4px; background: #1e293b;">
      <div style="font-size: 10px; font-family: monospace; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</div>
      <button class="btn-aem-primary" style="font-size: 10px; padding: 3px 6px; width: 100%;">Set as Portrait</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      state.cv.basics.avatar = f.url;
      const img = document.getElementById('canvas-avatar-img');
      if (img) img.src = f.url;
      markDirty();
      if (onImageSelectedCallback) onImageSelectedCallback(f.url);
      document.getElementById('aem-media-modal').style.display = 'none';
      showToast('Set as Greeting Portrait!');
    });

    gallery.appendChild(card);
  });
}

/* -------------------------------------------------------------
   7. SAVE ALL CHANGES (Ctrl+S / Save Button)
------------------------------------------------------------- */
async function saveAllChanges() {
  const saveBtn = document.getElementById('btn-save');
  saveBtn.textContent = 'Saving...';

  try {
    await Promise.all([
      API.saveData('cv', state.cv),
      API.saveData('case-studies', state.caseStudies),
      API.saveData('projects', state.projects),
      API.saveData('education', state.education),
      API.saveData('certifications', state.certifications)
    ]);

    markClean();
    saveBtn.textContent = 'Save All Changes (Ctrl+S)';
    showToast('All changes saved! Astro hot-reloaded.');
  } catch (err) {
    console.error('Save failed:', err);
    saveBtn.textContent = 'Save All Changes (Ctrl+S)';
    alert('Save failed: ' + err.message);
  }
}

document.getElementById('btn-save').addEventListener('click', saveAllChanges);

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveAllChanges();
  }
});

/* -------------------------------------------------------------
   8. MODE SWITCHER (Edit Mode vs Preview Mode)
------------------------------------------------------------- */
const btnEdit = document.getElementById('btn-mode-edit');
const btnPreview = document.getElementById('btn-mode-preview');

btnEdit.addEventListener('click', () => {
  state.mode = 'edit';
  btnEdit.classList.add('active');
  btnPreview.classList.remove('active');
  document.body.classList.remove('aem-preview');
  document.querySelectorAll('[data-field]').forEach(el => el.setAttribute('contenteditable', 'true'));
  closeDrawer();
});

btnPreview.addEventListener('click', () => {
  state.mode = 'preview';
  btnPreview.classList.add('active');
  btnEdit.classList.remove('active');
  document.body.classList.add('aem-preview');
  document.querySelectorAll('[data-field]').forEach(el => el.setAttribute('contenteditable', 'false'));
  closeContextMenu();
  closeDrawer();
});

/* -------------------------------------------------------------
   9. GIT REVIEW & PUSH
------------------------------------------------------------- */
const gitModal = document.getElementById('git-modal');

document.getElementById('btn-git').addEventListener('click', async () => {
  gitModal.style.display = 'flex';
  const preview = document.getElementById('git-changes-preview');
  preview.textContent = 'Checking modified files...';

  const res = await API.getGitStatus();
  if (res.changes && res.changes.length > 0) {
    preview.innerHTML = res.changes.map(c => `<div>${c.status} ${c.file}</div>`).join('');
  } else {
    preview.textContent = 'No local changes detected.';
  }
});

document.getElementById('close-git-modal-btn').addEventListener('click', () => {
  gitModal.style.display = 'none';
  document.getElementById('git-terminal-output').style.display = 'none';
});

document.getElementById('execute-git-push-btn').addEventListener('click', async () => {
  const msg = document.getElementById('commit-msg').value;
  const outEl = document.getElementById('git-terminal-output');
  outEl.style.display = 'block';
  outEl.textContent = 'Executing git commit and push...';

  const res = await API.executeGitPush(msg);
  if (res.success) {
    outEl.textContent = res.output || res.message;
    showToast('Pushed to GitHub successfully!');
  } else {
    outEl.textContent = 'Error:\n' + (res.error || res.output);
  }
});

/* -------------------------------------------------------------
   HELPER UTILITIES
------------------------------------------------------------- */
function setDeepValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

// Initialize on page load
loadAndRenderAll();
