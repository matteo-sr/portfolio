/* app.js — Logique principale du portfolio */

let DATA = null;

/* =========================================
   CHARGEMENT DES DONNÉES
   ========================================= */
async function loadData() {
  const response = await fetch('data.json');
  DATA = await response.json();
  init();
}

/* =========================================
   INIT
   ========================================= */
function init() {
  buildHome();
  buildProjects();
  buildCompetences();
  buildVeille();
  buildLightbox();
  setupBurger();

  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', () => goTo(link.dataset.page));
  });

  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '') || 'home';
    navigate(h);
  });
}

/* =========================================
   NAVIGATION
   ========================================= */
function navigate(page) {
  document.querySelectorAll('.page, .detail-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goTo(page) {
  if (window.location.hash === '#' + page) {
    // Le hash est déjà le même, hashchange ne se déclenchera pas → forcer manuellement
    navigate(page);
  } else {
    window.location.hash = page;
  }
}

/* =========================================
   SIDEBAR BURGER
   ========================================= */
function setupBurger() {
  const burger = document.getElementById('burger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  burger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

/* =========================================
   LIGHTBOX
   ========================================= */
function buildLightbox() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  const lbCounter = document.getElementById('lb-counter');

  let images = [];
  let current = 0;

  // --- État zoom ---
  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let translateX = 0;
  let translateY = 0;

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
    lbImg.style.cursor = 'zoom-in';
  }

  function applyTransform() {
    lbImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function clampTranslate() {
    if (scale <= 1) { translateX = 0; translateY = 0; return; }
    const rect = lbImg.getBoundingClientRect();
    const maxX = (rect.width * (scale - 1)) / (2 * scale);
    const maxY = (rect.height * (scale - 1)) / (2 * scale);
    translateX = Math.min(maxX, Math.max(-maxX, translateX));
    translateY = Math.min(maxY, Math.max(-maxY, translateY));
  }

  window.openLightbox = function(imgs, startIndex) {
    images = Array.isArray(imgs) ? imgs : [imgs];
    current = startIndex || 0;
    resetZoom();
    showLbImage();
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function showLbImage() {
    resetZoom();
    lbImg.src = images[current];
    lbImg.alt = 'Image ' + (current + 1);
    lbCounter.textContent = images.length > 1 ? (current + 1) + ' / ' + images.length : '';
    lbPrev.style.display = images.length > 1 ? 'flex' : 'none';
    lbNext.style.display = images.length > 1 ? 'flex' : 'none';
  }

  function closeLb() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    lbImg.src = '';
    resetZoom();
  }

  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  lbPrev.addEventListener('click', () => {
    current = (current - 1 + images.length) % images.length;
    showLbImage();
  });

  lbNext.addEventListener('click', () => {
    current = (current + 1) % images.length;
    showLbImage();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') { if (scale > 1) resetZoom(); else closeLb(); }
    if (e.key === 'ArrowLeft' && scale === 1) { current = (current - 1 + images.length) % images.length; showLbImage(); }
    if (e.key === 'ArrowRight' && scale === 1) { current = (current + 1) % images.length; showLbImage(); }
  });

  // --- ZOOM molette ---
  lbImg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    scale = Math.min(5, Math.max(1, scale * delta));
    clampTranslate();
    applyTransform();
    lbImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  }, { passive: false });

  // --- DOUBLE CLIC zoom toggle ---
  lbImg.addEventListener('dblclick', (e) => {
    if (scale > 1) {
      resetZoom();
    } else {
      scale = 2.5;
      // centrer sur le point cliqué
      const rect = lbImg.getBoundingClientRect();
      translateX = (rect.width / 2 - (e.clientX - rect.left)) * (scale - 1) / scale;
      translateY = (rect.height / 2 - (e.clientY - rect.top)) * (scale - 1) / scale;
      clampTranslate();
      applyTransform();
      lbImg.style.cursor = 'grab';
    }
  });

  // --- DRAG pour se déplacer quand zoomé ---
  lbImg.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    lbImg.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;
    clampTranslate();
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    lbImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  });

  // --- PINCH sur mobile ---
  let lastPinchDist = null;
  lb.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  lb.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && lastPinchDist) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / lastPinchDist;
      scale = Math.min(5, Math.max(1, scale * ratio));
      lastPinchDist = dist;
      clampTranslate();
      applyTransform();
    }
  }, { passive: false });

  lb.addEventListener('touchend', () => { lastPinchDist = null; });
}

/* =========================================
   HELPER : rendu des images d'une sc_validee
   image peut être : null | string | string[]
   ========================================= */
function renderScImages(imageData) {
  if (!imageData) return '';

  const imgs = Array.isArray(imageData) ? imageData : [imageData];
  const allImgsJson = JSON.stringify(imgs).replace(/'/g, '&#39;');

  const thumbsHtml = imgs.map((src, idx) => `
    <div class="sc-thumb" onclick='event.stopPropagation(); openLightbox(${allImgsJson}, ${idx})'>
      <img src="${src}" alt="Preuves ${idx + 1}" loading="lazy">
      <div class="sc-thumb-overlay"><img width="15" height="15" src="https://img.icons8.com/ios/50/search.png" alt="search"/></div>
    </div>
  `).join('');

  return `<div class="sc-thumbs-row">${thumbsHtml}</div>`;
}

/* =========================================
   PAGE ACCUEIL
   ========================================= */
function buildHome() {

  const recentContainer = document.getElementById('home-recent-projects');
  DATA.projets.slice(-3).forEach(projet => {
    const card = document.createElement('div');
    card.className = 'quick-card quick-card--project';
    const imgHtml = projet.image
      ? `<div class="qc-img"><img src="${projet.image}" alt="${projet.nom}" loading="lazy"></div>`
      : `<div class="qc-img qc-img--placeholder">💻</div>`;
    card.innerHTML = `
      ${imgHtml}
      <div class="qc-name">${projet.nom}</div>
      <div class="qc-meta">${projet.technologies.slice(0, 2).join(', ')} · ${projet.annee}</div>
    `;
    card.addEventListener('click', () => openProject(projet.id));
    recentContainer.appendChild(card);
  });

  // Section galerie photos
  const galleryContainer = document.getElementById('home-gallery');
  if (galleryContainer && DATA.galerie) {
    DATA.galerie.forEach((item, idx) => {
      const figure = document.createElement('figure');
      figure.className = 'gallery-figure';
      figure.innerHTML = `
        <img src="${item.src}" alt="${item.legende}" loading="lazy">
        <figcaption>${item.legende}</figcaption>
      `;
      figure.addEventListener('click', () => openLightbox(DATA.galerie.map(g => g.src), idx));
      galleryContainer.appendChild(figure);
    });
  }

  const compContainer = document.getElementById('home-competences');
  DATA.competences.forEach(comp => {
    const card = document.createElement('div');
    card.className = 'quick-card';
    card.innerHTML = `
      <div class="qc-name">${comp.nom}</div>
      <div class="qc-meta">${comp.sous_competences.length} sous-compétences</div>
    `;
    card.addEventListener('click', () => openCompetence(comp.id));
    compContainer.appendChild(card);
  });
}

/* =========================================
   PAGE PROJETS
   ========================================= */
function buildProjects() {
  const grid = document.getElementById('projects-grid');
  DATA.projets.forEach(projet => {
    const card = document.createElement('div');
    card.className = 'project-card';

    const imgHtml = projet.image
      ? `<img src="${projet.image}" alt="${projet.nom}">`
      : `<div class="placeholder-icon">💻</div>`;

    const tagsHtml = projet.technologies.map(t => `<span class="tag">${t}</span>`).join('');

    card.innerHTML = `
      <div class="project-card-img">${imgHtml}</div>
      <div class="project-card-body">
        <div class="project-card-year">${projet.annee}</div>
        <div class="project-card-name">${projet.nom}</div>
        <div class="project-card-desc">${projet.description}</div>
      </div>
      <div class="project-card-footer">${tagsHtml}</div>
    `;

    card.addEventListener('click', () => openProject(projet.id));
    grid.appendChild(card);
  });
}

/* =========================================
   PAGE COMPÉTENCES
   ========================================= */
function buildCompetences() {
  const grid = document.getElementById('competences-grid');
  DATA.competences.forEach(comp => {
    const card = document.createElement('div');
    card.className = 'competence-card';

    const pillsHtml = comp.sous_competences
      .map(sc => `<span class="sc-pill">${sc.nom}</span>`)
      .join('');

    const projectIds = new Set();
    DATA.projets.forEach(p => {
      p.sous_competences_validees.forEach(sv => {
        if (sv.sous_competence_id && sv.sous_competence_id.startsWith(comp.id + '-')) {
          projectIds.add(p.id);
        }
      });
    });

    card.innerHTML = `
      <div class="competence-card-header">
        <div>
          <div class="competence-card-name">${comp.nom}</div>
          <div class="competence-card-count">${comp.sous_competences.length} sous-compétences · ${projectIds.size} projet(s)</div>
        </div>
      </div>
      <div class="sc-pills">${pillsHtml}</div>
    `;

    card.addEventListener('click', () => openCompetence(comp.id));
    grid.appendChild(card);
  });
}

/* =========================================
   PAGE VEILLE
========================================= */
function buildVeille() {

  const container = document.getElementById('veille-container');
  const veille = DATA.veille;

  if (!veille) return;

  container.innerHTML = '';

  /* =========================================
     SUJETS + TAGS
  ========================================= */

  const topSection = document.createElement('section');
  topSection.className = 'veille-top-bloc';

  topSection.innerHTML = `

    <div class="veille-top-header">
      <div class="veille-top-header-left">
        <span class="veille-bloc-title">
          Sujets de veille
        </span>
      </div>
    </div>

    <div class="veille-sujets-grid">

      ${veille.sujets.map(sujet => `

        <article class="veille-sujet-card">

          <div class="veille-sujet-content">

            <h2 class="veille-sujet-title">
              ${sujet.titre}
            </h2>

            <p class="veille-sujet-description">
              ${sujet.description}
            </p>

          </div>

        </article>

      `).join('')}

    </div>

    <div class="veille-tags-divider"></div>

    <div class="veille-tags-wrapper">
      <div class="veille-tags-list">

        ${veille.tagsCommuns.map(tag => `
          <span class="veille-tag">
            ${tag}
          </span>
        `).join('')}

      </div>

    </div>

  `;

  container.appendChild(topSection);

  /* =========================================
     ARTICLES
  ========================================= */

  const articlesSection = document.createElement('section');
  articlesSection.className = 'veille-bloc';

  const articlesSorted = [...veille.articles]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  articlesSection.innerHTML = `

    <div class="veille-bloc-header">

      <div class="veille-bloc-header-left">

        <span class="veille-bloc-title">
          Articles sélectionnés
        </span>

      </div>

    </div>

    <div class="veille-articles-grid">

      ${articlesSorted.map(article => {

        const sujet = veille.sujets.find(
          s => s.id === article.veille
        );

        return `
          
          <article class="veille-article-card">

            <div class="veille-article-card-top">

              <div class="veille-article-meta">

                <span class="veille-article-theme">
                  ${sujet?.titre || 'Veille'}
                </span>

                <span class="veille-article-date">
                  ${formatDate(article.date)}
                </span>

              </div>

              ${
                article.url && article.url !== '#'
                  ? `
                    <a
                      href="${article.url}"
                      class="veille-article-link"
                      target="_blank"
                      rel="noopener"
                    >
                      ↗
                    </a>
                  `
                  : ''
              }

            </div>

            <h3 class="veille-article-title">
              ${article.titre}
            </h3>

            <p class="veille-article-resume">
              ${article.resume}
            </p>

            <div class="veille-article-highlight">

              <div class="veille-article-highlight-label">
                INFORMATION CLÉ
              </div>

              <p>
                ${article["info-cle"]}
              </p>

            </div>

          </article>

        `;
      }).join('')}

    </div>

  `;

  container.appendChild(articlesSection);

  /* =========================================
     PROCÉDÉ
  ========================================= */

  const procede = veille.procede;

  const procedeSection = document.createElement('section');
  procedeSection.className = 'veille-bloc';

  procedeSection.innerHTML = `

    <div class="veille-bloc-header">

      <div class="veille-bloc-header-left">

        <span class="veille-bloc-title">
          Procédé de veille
        </span>

      </div>

    </div>

    <div class="veille-procede-layout">

      <div class="veille-procede-etapes">

        ${procede.etapes.map((etape, index) => `
          
          <div class="veille-etape">

            <div class="veille-etape-content">

              <div class="veille-etape-title">
                ${etape.titre}
              </div>

              <div class="veille-etape-desc">
                ${etape.description}
              </div>

            </div>

          </div>

        `).join('')}

      </div>

      <div class="veille-outils-section">

        <div class="veille-outils-title">
          Outils utilisés
        </div>

        <div class="veille-outils-list">

          ${procede.outils.map(outil => `
            <span class="veille-outil-chip">
              ${outil}
            </span>
          `).join('')}

        </div>

      </div>

    </div>

  `;

  container.appendChild(procedeSection);

}

/* =========================================
   DÉTAIL PROJET
   ========================================= */
function openProject(projetId) {
  const projet = DATA.projets.find(p => p.id === projetId);
  if (!projet) return;

  document.querySelectorAll('.page, .detail-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  const detailEl = document.getElementById('detail-project');
  detailEl.innerHTML = buildProjectDetailHtml(projet);
  detailEl.classList.add('active');

  detailEl.querySelector('.back-btn').addEventListener('click', () => goTo('projets'));

  detailEl.querySelectorAll('[data-goto-comp]').forEach(el => {
    el.addEventListener('click', () => openCompetence(el.dataset.gotoComp));
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildProjectDetailHtml(projet) {
  const imgHtml = projet.image
    ? `<img class="detail-img" src="${projet.image}" alt="${projet.nom}">`
    : `<div class="detail-img-placeholder">💻</div>`;

  const techHtml = projet.technologies
    .map(t => `<span class="tech-tag">${t}</span>`)
    .join('');

  // Grouper les sc validées par compétence parente
  const groupedMap = {};
  projet.sous_competences_validees.forEach(sv => {
    if (!sv.sous_competence_id) return;
    const cId = sv.sous_competence_id.split('-s')[0];
    if (!groupedMap[cId]) groupedMap[cId] = [];
    groupedMap[cId].push(sv);
  });

  let compBlocksHtml = '';
  Object.keys(groupedMap).forEach(cId => {
    const comp = DATA.competences.find(c => c.id === cId);
    if (!comp) return;
    const svList = groupedMap[cId];

    const scItemsHtml = svList.map(sv => {
      const sc = comp.sous_competences.find(s => s.id === sv.sous_competence_id);
      if (!sc) return '';
      const imagesHtml = renderScImages(sv.image);
      return `
        <div class="sc-item">
          <div class="sc-item-body">
            <div class="sc-item-name">${sc.nom}</div>
            <div class="sc-item-desc">${sv.description}</div>
            ${imagesHtml}
          </div>
        </div>
      `;
    }).join('');

    compBlocksHtml += `
      <div class="comp-block">
        <div class="comp-block-header" data-goto-comp="${comp.id}">
          <span class="comp-block-name">${comp.nom}</span>
          <span class="comp-block-arrow">→</span>
        </div>
        <div class="sc-items">${scItemsHtml}</div>
      </div>
    `;
  });

  const lienHtml = projet.lien && projet.lien !== '#'
    ? `<a href="${projet.lien}" class="btn btn-outline" target="_blank">Voir le projet</a>`
    : '';

  return `
    <button class="back-btn">Retour aux projets</button>
    <div class="detail-hero">
      ${imgHtml}
      <div class="detail-meta">
        <span class="detail-year">${projet.annee}</span>
      </div>
      <div class="detail-title">${projet.nom}</div>
      <div class="detail-desc">${projet.description}</div>
      <div class="detail-tech-row">${techHtml}</div>
      ${lienHtml}
    </div>
    <div class="detail-section-title">Compétences &amp; sous-compétences validées</div>
    <div class="competences-in-project">${compBlocksHtml}</div>
  `;
}

/* =========================================
   DÉTAIL COMPÉTENCE
   ========================================= */
function openCompetence(compId) {
  const comp = DATA.competences.find(c => c.id === compId);
  if (!comp) return;

  document.querySelectorAll('.page, .detail-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  const detailEl = document.getElementById('detail-competence');
  detailEl.innerHTML = buildCompetenceDetailHtml(comp);
  detailEl.classList.add('active');

  detailEl.querySelector('.back-btn').addEventListener('click', () => goTo('competences'));

  detailEl.querySelectorAll('[data-goto-project]').forEach(el => {
    el.addEventListener('click', () => openProject(el.dataset.gotoProject));
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildCompetenceDetailHtml(comp) {
  const scBlocksHtml = comp.sous_competences.map(sc => {
    const matchingProjects = DATA.projets.filter(p =>
      p.sous_competences_validees.some(sv => sv.sous_competence_id === sc.id)
    );

    let projectRowsHtml = '';
    if (matchingProjects.length === 0) {
      projectRowsHtml = `<div class="no-projects-msg">Aucun projet ne valide encore cette sous-compétence.</div>`;
    } else {
      projectRowsHtml = matchingProjects.map(proj => {
        const svEntry = proj.sous_competences_validees.find(sv => sv.sous_competence_id === sc.id);
        const imagesHtml = svEntry ? renderScImages(svEntry.image) : '';
        return `
          <div class="sc-project-row" data-goto-project="${proj.id}">
            <div class="sc-project-row-body">
              <div class="sc-project-row-name">${proj.nom}</div>
              <div class="sc-project-row-note">${svEntry ? svEntry.description : ''}</div>
              ${imagesHtml}
            </div>
            <div class="sc-project-row-arrow">→</div>
          </div>
        `;
      }).join('');
    }

    return `
      <div class="sc-detail-block">
        <div class="sc-detail-block-header">
          <div class="sc-detail-block-name">${sc.nom}</div>
        </div>
        <div class="sc-projects-list">${projectRowsHtml}</div>
      </div>
    `;
  }).join('');

  const validatingProjects = new Set();
  DATA.projets.forEach(p => {
    p.sous_competences_validees.forEach(sv => {
      if (sv.sous_competence_id && sv.sous_competence_id.startsWith(comp.id + '-')) {
        validatingProjects.add(p.id);
      }
    });
  });

  return `
    <button class="back-btn">Retour aux compétences</button>
    <div class="detail-hero">
      <div class="competence-detail-header">
        <div>
          <div class="competence-detail-title">${comp.nom}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">
            ${comp.sous_competences.length} sous-compétences · ${validatingProjects.size} projet(s) validant
          </div>
        </div>
      </div>
    </div>
    <div class="detail-section-title">Sous-compétences &amp; projets associés</div>
    <div class="sc-detail-list">${scBlocksHtml}</div>
  `;
}

/* =========================================
   UTILS
   ========================================= */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* =========================================
   LANCEMENT
   ========================================= */
document.addEventListener('DOMContentLoaded', loadData);
