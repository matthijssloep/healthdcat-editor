// app.js — HealthDCAT-AP Metadata Editor wizard logic

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  step: 0,
  data: {
    // Step 1: Identity
    datasetURI: '', titles: [{ value: '', lang: 'en' }],
    alternativeTitle: '', alternativeTitleLang: 'en',
    descriptions: [{ value: '', lang: 'en' }],
    version: '', identifier: '',

    // Step 2: Access & Legal
    accessRights: '', legislation: [], personalData: '', legalBases: [],
    retentionPeriodStart: '', retentionPeriodEnd: '',
    retentionNote: '', retentionNoteLang: 'en',

    // Step 3: Health Classification
    healthCategories: [], healthThemes: [],
    hdabName: '', hdabNameLang: 'en', hdabEmail: '', hdabURL: '',
    codeValues: [{ value: '', lang: 'en' }], codingSystem: '',

    // Step 4: Population & Stats
    numberOfRecords: '', numberOfUniqueIndividuals: '',
    minTypicalAge: '', maxTypicalAge: '',
    populationCoverage: [{ value: '', lang: 'en' }],

    // Step 5: Publisher & Contacts
    publisherName: '', publisherNameLang: 'en', publisherType: '',
    publisherEmail: '', publisherURL: '',
    creators: [{ name: '', nameLang: 'en', email: '', url: '' }],
    contactEmail: '', contactURL: '', contactOrgName: '', contactOrgUnit: '',

    // Step 6: Distribution
    distributions: [{
      accessURL: '', downloadURL: '', format: '', mediaType: '',
      license: '', status: '', compressFormat: '',
      byteSize: '', rights: '', title: '', titleLang: 'en',
    }],

    // Step 7: Discoverability
    keywords: [{ value: '', lang: 'en' }], themes: [], languages: [],
    spatialCoverage: [], temporalStart: '', temporalEnd: '',
    accrualPeriodicity: '', issued: '', modified: '', landingPage: '',
    purpose: [{ value: '', lang: 'en' }],
    provenance: [{ value: '', lang: 'en' }],
    spatialResolutionInMeters: '',
    temporalResolution: { years: '', months: '', days: '', hours: '', minutes: '', seconds: '' },

    // Step 8: Documentation & Relations
    documentationPages: [{ uri: '', label: '', labelLang: 'en', note: '', noteLang: 'en' }],
    qualifiedRelations: [{ uri: '', role: '' }],
    qualifiedAttributions: [{ name: '', nameLang: 'en', uri: '', email: '', role: '' }],
    wasGeneratedBy: [{ name: '', nameLang: 'en', description: '', descriptionLang: 'en' }],
  },
};

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identity',      label: 'Identity',       render: renderIdentity,      validate: validateIdentity },
  { id: 'access',        label: 'Access & Legal',  render: renderAccess,        validate: validateAccess },
  { id: 'health',        label: 'Health',          render: renderHealth,        validate: validateHealth },
  { id: 'population',    label: 'Population',      render: renderPopulation,    validate: validatePopulation },
  { id: 'contacts',      label: 'Contacts',        render: renderContacts,      validate: () => [] },
  { id: 'distribution',  label: 'Distribution',    render: renderDistribution,  validate: () => [] },
  { id: 'discovery',     label: 'Discoverability', render: renderDiscovery,     validate: validateDiscovery },
  { id: 'documentation', label: 'Documentation',   render: renderDocumentation, validate: () => [] },
  { id: 'review',        label: 'Review & Publish',render: renderReview,        validate: () => [] },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

function goToStep(n) {
  state.step = n;
  renderCurrentStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  saveFormData();
  const errors = [...STEPS[state.step].validate(), ...validateVisibleFields()];
  if (errors.length > 0) { showErrors(errors); return; }
  clearErrors();
  if (state.step < STEPS.length - 1) goToStep(state.step + 1);
}

function back() {
  saveFormData();
  clearErrors();
  if (state.step > 0) goToStep(state.step - 1);
}

function showErrors(errors) {
  const el = document.getElementById('error-banner');
  el.innerHTML = errors.map(e => `<div class="error-item">&#9888; ${e}</div>`).join('');
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearErrors() {
  const el = document.getElementById('error-banner');
  el.style.display = 'none';
  el.innerHTML = '';
}

// ─── Progress ─────────────────────────────────────────────────────────────────

function renderProgress() {
  const container = document.getElementById('progress-steps');
  container.innerHTML = STEPS.map((step, i) => {
    let cls = 'step-pip';
    if (i < state.step)  cls += ' completed';
    if (i === state.step) cls += ' active';
    return `<div class="${cls}" onclick="tryGoToStep(${i})" title="${step.label}">
      <div class="pip-circle">${i < state.step ? '&#10003;' : i + 1}</div>
      <div class="pip-label">${step.label}</div>
    </div>`;
  }).join('<div class="step-connector"></div>');
}

function tryGoToStep(n) { if (n < state.step) { saveFormData(); goToStep(n); } }

function updateNav() {
  const backBtn = document.getElementById('back-btn');
  const nextBtn = document.getElementById('next-btn');
  document.getElementById('step-info').textContent = `Step ${state.step + 1} of ${STEPS.length}`;
  backBtn.disabled = state.step === 0;
  if (state.step === STEPS.length - 1) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = '';
    nextBtn.textContent = state.step === STEPS.length - 2 ? 'Review →' : 'Next →';
  }
}

function initTomSelects() {
  document.querySelectorAll('select.ts-select').forEach(el => {
    if (el.tomselect) return; // already initialised
    new TomSelect(el, {
      plugins: ['remove_button'],
      placeholder: el.dataset.placeholder || 'Search or select…',
      maxOptions: null,
      onInitialize() {
        // keep the native <select> in sync so saveFormData() can read it without tomselect API
      },
    });
  });
}

function renderCurrentStep() {
  renderProgress();
  updateNav();
  const container = document.getElementById('step-container');
  container.innerHTML = '';
  STEPS[state.step].render(container);
  initTomSelects();
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function badge(type) {
  return `<span class="badge badge-${type}">${{required:'Required',recommended:'Recommended',optional:'Optional'}[type]}</span>`;
}

function fieldWrap(label, hint, badgeType, inner, id) {
  return `<div class="field-group" id="fg-${id}">
    <label class="field-label">${label} ${badge(badgeType)}</label>
    ${hint ? `<div class="field-hint">${hint}</div>` : ''}
    ${inner}
  </div>`;
}

function langSelect(selected, name) {
  return `<select class="lang-select" name="${name}">
    ${VOCAB.langTags.map(l => `<option value="${l.tag}" ${l.tag === selected ? 'selected' : ''}>${l.label}</option>`).join('')}
  </select>`;
}

function vocabSelect(items, selected, name, placeholder = 'Select...') {
  return `<select class="form-select" name="${name}">
    <option value="">— ${placeholder} —</option>
    ${items.map(item => `<option value="${item.uri}" ${item.uri === selected ? 'selected' : ''}>${item.label}</option>`).join('')}
  </select>`;
}

function multiSelect(items, selectedArr, fieldName, placeholder) {
  const opts = items.map(item =>
    `<option value="${item.uri}" ${selectedArr.includes(item.uri) ? 'selected' : ''}>${item.label}</option>`
  ).join('');
  return `<select multiple class="ts-select" name="${fieldName}" data-placeholder="${placeholder || 'Search or select…'}">${opts}</select>`;
}

function multiLangField(entries, fieldKey, placeholder) {
  const rows = entries.map((e, i) => `
    <div class="multi-row" data-index="${i}">
      <input type="text" class="form-input multi-text" name="${fieldKey}[${i}].value" value="${escHtml(e.value)}" placeholder="${placeholder}">
      ${langSelect(e.lang, `${fieldKey}[${i}].lang`)}
      <button type="button" class="btn-remove" onclick="removeMultiRow('${fieldKey}', ${i})" title="Remove">&#215;</button>
    </div>`).join('');
  return `<div class="multi-container" id="multi-${fieldKey}">${rows}</div>
    <button type="button" class="btn-add-row" onclick="addMultiRow('${fieldKey}', '${placeholder}')">+ Add language</button>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Multi-row management ─────────────────────────────────────────────────────

function addMultiRow(fieldKey, placeholder) {
  saveFormData();
  state.data[fieldKey].push({ value: '', lang: 'en' });
  renderCurrentStep();
}

function removeMultiRow(fieldKey, index) {
  if (state.data[fieldKey].length <= 1) return;
  saveFormData();
  state.data[fieldKey].splice(index, 1);
  renderCurrentStep();
}

function addCodeValueRow() {
  saveFormData();
  state.data.codeValues.push({ value: '', lang: 'en' });
  renderCurrentStep();
}

function removeCodeValueRow(index) {
  if (state.data.codeValues.length <= 1) return;
  saveFormData();
  state.data.codeValues.splice(index, 1);
  renderCurrentStep();
}

function addCreator() {
  saveFormData();
  state.data.creators.push({ name: '', nameLang: 'en', email: '', url: '' });
  renderCurrentStep();
}

function removeCreator(index) {
  if (state.data.creators.length <= 1) return;
  saveFormData();
  state.data.creators.splice(index, 1);
  renderCurrentStep();
}

function addDistribution() {
  saveFormData();
  state.data.distributions.push({
    accessURL: '', downloadURL: '', format: '', mediaType: '',
    license: '', status: '', compressFormat: '',
    byteSize: '', rights: '', title: '', titleLang: 'en',
  });
  renderCurrentStep();
}

function removeDistribution(index) {
  if (state.data.distributions.length <= 1) return;
  saveFormData();
  state.data.distributions.splice(index, 1);
  renderCurrentStep();
}

function addDocPage() {
  saveFormData();
  state.data.documentationPages.push({ uri: '', label: '', labelLang: 'en', note: '', noteLang: 'en' });
  renderCurrentStep();
}
function removeDocPage(i) {
  if (state.data.documentationPages.length <= 1) return;
  saveFormData(); state.data.documentationPages.splice(i, 1); renderCurrentStep();
}

function addQRel() {
  saveFormData();
  state.data.qualifiedRelations.push({ uri: '', role: '' });
  renderCurrentStep();
}
function removeQRel(i) {
  if (state.data.qualifiedRelations.length <= 1) return;
  saveFormData(); state.data.qualifiedRelations.splice(i, 1); renderCurrentStep();
}

function addQAttr() {
  saveFormData();
  state.data.qualifiedAttributions.push({ name: '', nameLang: 'en', uri: '', email: '', role: '' });
  renderCurrentStep();
}
function removeQAttr(i) {
  if (state.data.qualifiedAttributions.length <= 1) return;
  saveFormData(); state.data.qualifiedAttributions.splice(i, 1); renderCurrentStep();
}

function addActivity() {
  saveFormData();
  state.data.wasGeneratedBy.push({ name: '', nameLang: 'en', description: '', descriptionLang: 'en' });
  renderCurrentStep();
}
function removeActivity(i) {
  if (state.data.wasGeneratedBy.length <= 1) return;
  saveFormData(); state.data.wasGeneratedBy.splice(i, 1); renderCurrentStep();
}

// ─── Save form data ───────────────────────────────────────────────────────────

function saveFormData() {
  // Multi-lang arrays
  ['titles', 'descriptions', 'populationCoverage', 'keywords', 'purpose', 'provenance'].forEach(key => {
    const container = document.getElementById(`multi-${key}`);
    if (!container) return;
    state.data[key] = Array.from(container.querySelectorAll('.multi-row')).map(row => ({
      value: row.querySelector('.multi-text')?.value || '',
      lang:  row.querySelector('.lang-select')?.value || 'en',
    }));
  });

  // Code values (multi-lang)
  const cvContainer = document.getElementById('multi-codeValues');
  if (cvContainer) {
    state.data.codeValues = Array.from(cvContainer.querySelectorAll('.multi-row')).map(row => ({
      value: row.querySelector('.multi-text')?.value || '',
      lang:  row.querySelector('.lang-select')?.value || 'en',
    }));
  }

  // Multi-selects (Tom Select) — only update if field is rendered
  ['legislation', 'healthCategories', 'healthThemes', 'legalBases', 'languages', 'spatialCoverage', 'themes'].forEach(key => {
    const el = document.querySelector(`select[name="${key}"]`);
    if (!el) return;
    state.data[key] = el.tomselect ? el.tomselect.getValue() : Array.from(el.selectedOptions).map(o => o.value);
  });

  // Creators
  const creatorCards = document.querySelectorAll('.creator-card');
  if (creatorCards.length > 0) {
    state.data.creators = Array.from(creatorCards).map((card, i) => ({
      name:     card.querySelector(`[name="creator[${i}].name"]`)?.value     || '',
      nameLang: card.querySelector(`[name="creator[${i}].nameLang"]`)?.value || 'en',
      email:    card.querySelector(`[name="creator[${i}].email"]`)?.value    || '',
      url:      card.querySelector(`[name="creator[${i}].url"]`)?.value      || '',
    }));
  }

  // Distributions
  const distCards = document.querySelectorAll('.distribution-card');
  if (distCards.length > 0) {
    state.data.distributions = Array.from(distCards).map((card, i) => ({
      accessURL:     card.querySelector(`[name="dist[${i}].accessURL"]`)?.value     || '',
      downloadURL:   card.querySelector(`[name="dist[${i}].downloadURL"]`)?.value   || '',
      format:        card.querySelector(`[name="dist[${i}].format"]`)?.value        || '',
      mediaType:     card.querySelector(`[name="dist[${i}].mediaType"]`)?.value     || '',
      license:       card.querySelector(`[name="dist[${i}].license"]`)?.value       || '',
      status:        card.querySelector(`[name="dist[${i}].status"]`)?.value        || '',
      compressFormat:card.querySelector(`[name="dist[${i}].compressFormat"]`)?.value|| '',
      byteSize:      card.querySelector(`[name="dist[${i}].byteSize"]`)?.value      || '',
      rights:        card.querySelector(`[name="dist[${i}].rights"]`)?.value        || '',
      title:         card.querySelector(`[name="dist[${i}].title"]`)?.value         || '',
      titleLang:     card.querySelector(`[name="dist[${i}].titleLang"]`)?.value     || 'en',
    }));
  }

  // Documentation pages
  const pageCards = document.querySelectorAll('.doc-page-card');
  if (pageCards.length > 0) {
    state.data.documentationPages = Array.from(pageCards).map((card, i) => ({
      uri:       card.querySelector(`[name="page[${i}].uri"]`)?.value       || '',
      label:     card.querySelector(`[name="page[${i}].label"]`)?.value     || '',
      labelLang: card.querySelector(`[name="page[${i}].labelLang"]`)?.value || 'en',
      note:      card.querySelector(`[name="page[${i}].note"]`)?.value      || '',
      noteLang:  card.querySelector(`[name="page[${i}].noteLang"]`)?.value  || 'en',
    }));
  }

  // Qualified relations
  const qrelCards = document.querySelectorAll('.qrel-card');
  if (qrelCards.length > 0) {
    state.data.qualifiedRelations = Array.from(qrelCards).map((card, i) => ({
      uri:  card.querySelector(`[name="qrel[${i}].uri"]`)?.value  || '',
      role: card.querySelector(`[name="qrel[${i}].role"]`)?.value || '',
    }));
  }

  // Qualified attributions
  const attrCards = document.querySelectorAll('.attr-card');
  if (attrCards.length > 0) {
    state.data.qualifiedAttributions = Array.from(attrCards).map((card, i) => ({
      name:     card.querySelector(`[name="attr[${i}].name"]`)?.value     || '',
      nameLang: card.querySelector(`[name="attr[${i}].nameLang"]`)?.value || 'en',
      uri:      card.querySelector(`[name="attr[${i}].uri"]`)?.value      || '',
      email:    card.querySelector(`[name="attr[${i}].email"]`)?.value    || '',
      role:     card.querySelector(`[name="attr[${i}].role"]`)?.value     || '',
    }));
  }

  // Was generated by (activities)
  const actCards = document.querySelectorAll('.activity-card');
  if (actCards.length > 0) {
    state.data.wasGeneratedBy = Array.from(actCards).map((card, i) => ({
      name:            card.querySelector(`[name="act[${i}].name"]`)?.value            || '',
      nameLang:        card.querySelector(`[name="act[${i}].nameLang"]`)?.value        || 'en',
      description:     card.querySelector(`[name="act[${i}].description"]`)?.value     || '',
      descriptionLang: card.querySelector(`[name="act[${i}].descriptionLang"]`)?.value || 'en',
    }));
  }

  // Temporal resolution (object)
  ['years','months','days','hours','minutes','seconds'].forEach(unit => {
    const el = document.querySelector(`[name="temporalResolution.${unit}"]`);
    if (el) state.data.temporalResolution[unit] = el.value;
  });

  // Plain fields
  [
    'datasetURI','identifier','version','alternativeTitle','alternativeTitleLang',
    'accessRights','personalData','retentionPeriodStart','retentionPeriodEnd',
    'retentionNote','retentionNoteLang',
    'hdabName','hdabNameLang','hdabEmail','hdabURL', 'codingSystem',
    'numberOfRecords','numberOfUniqueIndividuals','minTypicalAge','maxTypicalAge',
    'publisherName','publisherNameLang','publisherType','publisherEmail','publisherURL',
    'contactEmail','contactURL','contactOrgName','contactOrgUnit',
    'accrualPeriodicity','temporalStart','temporalEnd','issued','modified','landingPage',
    'spatialResolutionInMeters',
  ].forEach(key => {
    const el = document.querySelector(`[name="${key}"]`);
    if (el) state.data[key] = el.value;
  });

  updateDurationPreview();
}

function updateDurationPreview() {
  const tr = state.data.temporalResolution;
  if (!tr) return;
  const el = document.getElementById('duration-preview');
  if (!el) return;
  const { years, months, days, hours, minutes, seconds } = tr;
  let d = 'P';
  if (years)   d += `${years}Y`;
  if (months)  d += `${months}M`;
  if (days)    d += `${days}D`;
  if (hours || minutes || seconds) {
    d += 'T';
    if (hours)   d += `${hours}H`;
    if (minutes) d += `${minutes}M`;
    if (seconds) d += `${seconds}S`;
  }
  el.textContent = d === 'P' ? 'No duration set' : d;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateIdentity() {
  const errors = [];
  if (!state.data.titles.some(t => t.value.trim())) errors.push('At least one dataset title is required.');
  if (!state.data.descriptions.some(d => d.value.trim())) errors.push('At least one dataset description is required.');
  return errors;
}

function validateAccess() {
  const errors = [];
  if (!state.data.accessRights) errors.push('Access rights classification is required.');
  if (!state.data.legislation || state.data.legislation.length === 0) errors.push('At least one applicable legislation must be selected.');
  const rs = state.data.retentionPeriodStart;
  const re = state.data.retentionPeriodEnd;
  if (rs && re && rs > re) errors.push('Retention period end date must be on or after the start date.');
  return errors;
}

function validatePopulation() {
  const errors = [];
  const min = parseFloat(state.data.minTypicalAge);
  const max = parseFloat(state.data.maxTypicalAge);
  if (!isNaN(min) && !isNaN(max) && min > max) errors.push('Minimum typical age cannot be greater than maximum typical age.');
  return errors;
}

function validateDiscovery() {
  const errors = [];
  const s = state.data.temporalStart;
  const e = state.data.temporalEnd;
  if (s && e && s > e) errors.push('Temporal coverage end date must be on or after the start date.');
  return errors;
}

function validateHealth() {
  const errors = [];
  if (!state.data.healthCategories || state.data.healthCategories.length === 0) {
    errors.push('At least one health category is required.');
  }
  const isPublic = state.data.accessRights === 'http://publications.europa.eu/resource/authority/access-right/PUBLIC';
  if (!isPublic && !state.data.hdabName) {
    errors.push('Health Data Access Body name is required for non-public and restricted datasets.');
  }
  return errors;
}

// ─── Field-level validation ────────────────────────────────────────────────────

function isValidURL(val) {
  if (!val) return true;
  try {
    const u = new URL(val);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

function isValidEmail(val) {
  if (!val) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
}

function isValidIRI(val) {
  if (!val) return true;
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]+$/.test(val);
}

function showFieldError(input, message) {
  input.classList.add('is-invalid');
  const parent = input.closest('.field-group') || input.parentNode;
  let err = parent.querySelector('.field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-error';
    // Insert after the input's containing element (could be a .multi-row or the input itself)
    const anchor = input.closest('.multi-row') || input;
    anchor.insertAdjacentElement('afterend', err);
  }
  err.textContent = message;
}

function clearFieldError(input) {
  input.classList.remove('is-invalid');
  const parent = input.closest('.field-group') || input.parentNode;
  parent.querySelector('.field-error')?.remove();
}

function validateFieldEl(input) {
  const val = input.value.trim();
  if (input.type === 'url') {
    if (!isValidURL(val)) {
      showFieldError(input, 'Must be a valid URL (http:// or https://).');
      return false;
    }
  } else if (input.dataset.validate === 'iri') {
    if (!isValidIRI(val)) {
      showFieldError(input, 'Must be a valid URI (e.g. https://… or urn:…).');
      return false;
    }
  } else if (input.type === 'email') {
    if (!isValidEmail(val)) {
      showFieldError(input, 'Must be a valid email address.');
      return false;
    }
  }
  clearFieldError(input);
  return true;
}

function validateVisibleFields() {
  const errors = [];
  document.querySelectorAll(
    'input[type="url"], input[type="email"], input[data-validate="iri"]'
  ).forEach(input => {
    if (!validateFieldEl(input)) {
      const label = input.closest('.field-group')?.querySelector('.field-label')?.childNodes[0]?.textContent?.trim();
      errors.push(`${label || 'A field'}: invalid format — please correct before continuing.`);
    }
  });
  return errors;
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function renderIdentity(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Dataset Identity</h2>
      <p>Basic identifying information. Fields marked ${badge('required')} must be filled before continuing.</p>
    </div>
    <div class="card">
      <h3>Dataset URI</h3>
      ${fieldWrap('Dataset URI','The permanent identifier URL for this dataset. Leave blank to auto-generate.','recommended',
        `<input type="url" class="form-input" name="datasetURI" value="${escHtml(d.datasetURI)}" placeholder="https://data.yourdomain.nl/datasets/my-dataset">`,'datasetURI')}
    </div>
    <div class="card">
      <h3>Titles &amp; Descriptions</h3>
      ${fieldWrap('Dataset Title','Provide a clear, descriptive name. Add multiple entries for different languages.','required',
        multiLangField(d.titles,'titles','e.g. COVID-19 Patient Registry'),'titles')}
      ${fieldWrap('Alternative Title','A secondary or abbreviated name.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="alternativeTitle" value="${escHtml(d.alternativeTitle)}" placeholder="e.g. COVID-19 Registry NL">
          ${langSelect(d.alternativeTitleLang,'alternativeTitleLang')}
        </div>`,'alternativeTitle')}
      ${fieldWrap('Description','A clear description of the contents, scope, and purpose.','required',
        multiLangField(d.descriptions,'descriptions','Describe your dataset...'),'descriptions')}
    </div>
    <div class="card">
      <h3>Version</h3>
      ${fieldWrap('Version','Version number or label (e.g. <code>1.0</code>, <code>2024-Q1</code>).','optional',
        `<input type="text" class="form-input form-input--short" name="version" value="${escHtml(d.version)}" placeholder="e.g. 1.0">`,'version')}
      ${fieldWrap('Custom Identifier','Override the dataset identifier (defaults to the URI above). Must be a valid URI.','optional',
        `<input type="text" class="form-input" name="identifier" data-validate="iri" value="${escHtml(d.identifier)}" placeholder="e.g. https://data.yourdomain.nl/datasets/my-dataset">`,'identifier')}
    </div>`;
}

function renderAccess(container) {
  const d = state.data;
  const isNonPublic = d.accessRights && d.accessRights !== 'http://publications.europa.eu/resource/authority/access-right/PUBLIC';
  const isPublic    = d.accessRights === 'http://publications.europa.eu/resource/authority/access-right/PUBLIC';

  const dynamicNote = d.accessRights ? `
    <div class="info-banner">
      ${isPublic
        ? '&#8505; <strong>Public</strong>: Health Data Access Body and Legal Basis are optional for openly accessible datasets.'
        : '&#9888; <strong>Non-Public / Restricted</strong>: Health Data Access Body and Legal Basis are required on the next step.'}
    </div>` : '';

  container.innerHTML = `
    <div class="step-header">
      <h2>Access &amp; Legal</h2>
      <p>Define access level and legal basis. The access rights you select here will change which fields are required in the Health step.</p>
    </div>
    <div class="card">
      <h3>Access Classification</h3>
      ${fieldWrap('Access Rights','How can this dataset be accessed? This determines required fields downstream.','required',
        vocabSelect(VOCAB.accessRights, d.accessRights, 'accessRights', 'Select access level'),'accessRights')}
      ${dynamicNote}
      ${fieldWrap('Personal Data','Does this dataset contain personal health data under GDPR?','optional',
        `<select class="form-select" name="personalData">
          <option value="">— Select —</option>
          <option value="true"  ${d.personalData==='true'  ? 'selected':''}>Yes — contains personal data</option>
          <option value="false" ${d.personalData==='false' ? 'selected':''}>No — does not contain personal data</option>
        </select>`,'personalData')}
    </div>
    <div class="card">
      <h3>Applicable Legislation</h3>
      ${fieldWrap('Legislation','Select all legislation that mandates or governs this dataset.','required',
        multiSelect(VOCAB.legislation, d.legislation, 'legislation', 'Search legislation…'),'legislation')}
    </div>
    <div class="card">
      <h3>Legal Basis &amp; Retention</h3>
      ${fieldWrap('Legal Basis (GDPR)','The GDPR article under which personal data is processed.',
        isNonPublic ? 'recommended' : 'optional',
        multiSelect(VOCAB.legalBases, d.legalBases, 'legalBases', 'Search legal basis…'),'legalBases')}
      <div class="field-row">
        ${fieldWrap('Retention Period Start','When does/did the retention period begin?','optional',
          `<input type="date" class="form-input" name="retentionPeriodStart" value="${escHtml(d.retentionPeriodStart)}">`,'retentionStart')}
        ${fieldWrap('Retention Period End','When does the retention period end?','optional',
          `<input type="date" class="form-input" name="retentionPeriodEnd" value="${escHtml(d.retentionPeriodEnd)}">`,'retentionEnd')}
      </div>
      ${fieldWrap('Retention Note','Additional context about the retention policy.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="retentionNote" value="${escHtml(d.retentionNote)}" placeholder="e.g. Retained for 10 years per national law">
          ${langSelect(d.retentionNoteLang,'retentionNoteLang')}
        </div>`,'retentionNote')}
    </div>`;

  // Re-render when access rights changes so the dynamic note updates
  const sel = container.querySelector('[name="accessRights"]');
  if (sel) sel.addEventListener('change', () => { saveFormData(); renderCurrentStep(); });
}

function renderHealth(container) {
  const d = state.data;
  const isPublic = d.accessRights === 'http://publications.europa.eu/resource/authority/access-right/PUBLIC';
  const hdabBadge = isPublic ? 'optional' : 'required';
  const hdabHint  = isPublic
    ? 'Optional for public datasets.'
    : 'Required for non-public and restricted datasets. The HDAB is the authority responsible for approving access requests.';

  const cvRows = d.codeValues.map((cv, i) => `
    <div class="multi-row" data-index="${i}">
      <input type="text" class="form-input multi-text" name="codeValues[${i}].value" value="${escHtml(cv.value)}" placeholder="e.g. ICD-10">
      ${langSelect(cv.lang, `codeValues[${i}].lang`)}
      <button type="button" class="btn-remove" onclick="removeCodeValueRow(${i})" title="Remove">&#215;</button>
    </div>`).join('');

  container.innerHTML = `
    <div class="step-header">
      <h2>Health Classification</h2>
      <p>Classify your dataset using health-specific vocabulary and designate the responsible HDAB.</p>
    </div>
    <div class="card">
      <h3>Health Categories</h3>
      ${fieldWrap('Health Category','Select all categories that describe the type of health data in this dataset.','required',
        multiSelect(VOCAB.healthCategories, d.healthCategories, 'healthCategories', 'Search health categories…'),'healthCategories')}
    </div>
    <div class="card">
      <h3>Health Themes</h3>
      ${fieldWrap('Health Theme','Select disease areas or health themes covered.','optional',
        multiSelect(VOCAB.healthThemes, d.healthThemes, 'healthThemes', 'Search health themes…'),'healthThemes')}
    </div>
    <div class="card">
      <h3>Health Data Access Body (HDAB)</h3>
      ${fieldWrap('HDAB Name', hdabHint, hdabBadge,
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="hdabName" value="${escHtml(d.hdabName)}" placeholder="e.g. Dutch Health Data Access Body">
          ${langSelect(d.hdabNameLang,'hdabNameLang')}
        </div>`,'hdabName')}
      ${fieldWrap('HDAB Contact Email','Official contact email for the HDAB.','recommended',
        `<input type="email" class="form-input" name="hdabEmail" value="${escHtml(d.hdabEmail)}" placeholder="e.g. hdab@minvws.nl">`,'hdabEmail')}
      ${fieldWrap('HDAB Contact URL','Link to the HDAB contact or application page.','optional',
        `<input type="url" class="form-input" name="hdabURL" value="${escHtml(d.hdabURL)}" placeholder="https://hdab.example.nl/contact">`,'hdabURL')}
    </div>
    <div class="card">
      <h3>Coding &amp; Code Values</h3>
      ${fieldWrap('Coding System','URI of the coding system(s) used in this dataset (e.g. SNOMED CT, ICD-10).','optional',
        `<input type="url" class="form-input" name="codingSystem" value="${escHtml(d.codingSystem)}" placeholder="e.g. http://snomed.info/sct">`,'codingSystem')}
      ${fieldWrap('Code Values','List the specific code sets or value sets used in this dataset.','optional',
        `<div class="multi-container" id="multi-codeValues">${cvRows}</div>
        <button type="button" class="btn-add-row" onclick="addCodeValueRow()">+ Add code value</button>`,'codeValues')}
    </div>`;
}

function renderPopulation(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Population &amp; Statistics</h2>
      <p>Quantitative metadata about the dataset population. All optional but strongly recommended.</p>
    </div>
    <div class="card">
      <h3>Dataset Size</h3>
      <div class="field-row">
        ${fieldWrap('Number of Records','Total rows / observations in the dataset.','optional',
          `<input type="number" min="0" class="form-input form-input--short" name="numberOfRecords" value="${escHtml(d.numberOfRecords)}" placeholder="e.g. 150000">`,'numberOfRecords')}
        ${fieldWrap('Number of Unique Individuals','Number of distinct patients / persons.','optional',
          `<input type="number" min="0" class="form-input form-input--short" name="numberOfUniqueIndividuals" value="${escHtml(d.numberOfUniqueIndividuals)}" placeholder="e.g. 12000">`,'numberOfUniqueIndividuals')}
      </div>
    </div>
    <div class="card">
      <h3>Age Range</h3>
      <div class="field-row">
        ${fieldWrap('Minimum Typical Age','Youngest age typically present (years).','optional',
          `<input type="number" min="0" max="150" class="form-input form-input--short" name="minTypicalAge" value="${escHtml(d.minTypicalAge)}" placeholder="e.g. 18">`,'minTypicalAge')}
        ${fieldWrap('Maximum Typical Age','Oldest age typically present (years).','optional',
          `<input type="number" min="0" max="150" class="form-input form-input--short" name="maxTypicalAge" value="${escHtml(d.maxTypicalAge)}" placeholder="e.g. 85">`,'maxTypicalAge')}
      </div>
    </div>
    <div class="card">
      <h3>Population Description</h3>
      ${fieldWrap('Population Coverage','Free-text description of the population this dataset covers.','optional',
        multiLangField(d.populationCoverage,'populationCoverage','Describe the covered population...'),'populationCoverage')}
    </div>`;
}

function renderContacts(container) {
  const d = state.data;

  const creatorCards = d.creators.map((c, i) => `
    <div class="creator-card sub-card" data-index="${i}">
      <div class="sub-card-header">
        <span>Creator ${i + 1}</span>
        ${d.creators.length > 1 ? `<button type="button" class="btn-remove-sub" onclick="removeCreator(${i})">Remove</button>` : ''}
      </div>
      <div class="field-row">
        ${fieldWrap('Name','Full name of the creator.','optional',
          `<div class="multi-row">
            <input type="text" class="form-input multi-text" name="creator[${i}].name" value="${escHtml(c.name)}" placeholder="e.g. Dr. Jan de Vries">
            ${langSelect(c.nameLang,`creator[${i}].nameLang`)}
          </div>`,`creator${i}name`)}
        ${fieldWrap('Email','Contact email.','optional',
          `<input type="email" class="form-input" name="creator[${i}].email" value="${escHtml(c.email)}" placeholder="e.g. j.devries@rivm.nl">`,`creator${i}email`)}
      </div>
      ${fieldWrap('URL / ORCID','Website or ORCID of the creator.','optional',
        `<input type="url" class="form-input" name="creator[${i}].url" value="${escHtml(c.url)}" placeholder="https://orcid.org/0000-0000-0000-0000">`,`creator${i}url`)}
    </div>`).join('');

  container.innerHTML = `
    <div class="step-header">
      <h2>Publisher &amp; Contacts</h2>
      <p>Who is responsible for publishing, creating, and maintaining this dataset?</p>
    </div>
    <div class="card">
      <h3>Publisher</h3>
      ${fieldWrap('Publisher Name','Organisation or institution that published this dataset.','recommended',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="publisherName" value="${escHtml(d.publisherName)}" placeholder="e.g. RIVM">
          ${langSelect(d.publisherNameLang,'publisherNameLang')}
        </div>`,'publisherName')}
      ${fieldWrap('Publisher Type','Category of publishing organisation.','recommended',
        vocabSelect(VOCAB.publisherTypes, d.publisherType, 'publisherType', 'Select publisher type'),'publisherType')}
      <div class="field-row">
        ${fieldWrap('Publisher Email','Official contact email.','optional',
          `<input type="email" class="form-input" name="publisherEmail" value="${escHtml(d.publisherEmail)}" placeholder="e.g. data@rivm.nl">`,'publisherEmail')}
        ${fieldWrap('Publisher Website','URL of the publisher\'s webpage.','optional',
          `<input type="url" class="form-input" name="publisherURL" value="${escHtml(d.publisherURL)}" placeholder="https://www.rivm.nl">`,'publisherURL')}
      </div>
    </div>
    <div class="card">
      <h3>Creators</h3>
      <p class="card-desc">The individuals or organisations responsible for creating the dataset (may differ from the publisher).</p>
      ${creatorCards}
      <button type="button" class="btn-add-sub" onclick="addCreator()">+ Add creator</button>
    </div>
    <div class="card">
      <h3>Dataset Contact Point</h3>
      <div class="field-row">
        ${fieldWrap('Contact Email','Email for dataset-specific enquiries.','recommended',
          `<input type="email" class="form-input" name="contactEmail" value="${escHtml(d.contactEmail)}" placeholder="e.g. opendata@organisation.nl">`,'contactEmail')}
        ${fieldWrap('Contact URL','Link to a contact form or page.','optional',
          `<input type="url" class="form-input" name="contactURL" value="${escHtml(d.contactURL)}" placeholder="https://organisation.nl/contact">`,'contactURL')}
      </div>
      <div class="field-row">
        ${fieldWrap('Organisation Name','Name of the organisation to contact.','optional',
          `<input type="text" class="form-input" name="contactOrgName" value="${escHtml(d.contactOrgName)}" placeholder="e.g. RIVM Data Team">`,'contactOrgName')}
        ${fieldWrap('Organisation Unit','Department or unit within the organisation.','optional',
          `<input type="text" class="form-input" name="contactOrgUnit" value="${escHtml(d.contactOrgUnit)}" placeholder="e.g. Open Data Department">`,'contactOrgUnit')}
      </div>
    </div>`;
}

function renderDistribution(container) {
  const d = state.data;

  const distCards = d.distributions.map((dist, i) => `
    <div class="distribution-card" data-index="${i}">
      <div class="distribution-card-header">
        <span>Distribution ${i + 1}</span>
        ${d.distributions.length > 1 ? `<button type="button" class="btn-remove-dist" onclick="removeDistribution(${i})">Remove</button>` : ''}
      </div>
      ${fieldWrap('Access URL','URL where this distribution can be accessed or requested.','required',
        `<input type="url" class="form-input" name="dist[${i}].accessURL" value="${escHtml(dist.accessURL)}" placeholder="https://data.example.nl/dataset">`,`dist${i}accessURL`)}
      ${fieldWrap('Download URL','Direct download link if the data can be downloaded.','optional',
        `<input type="url" class="form-input" name="dist[${i}].downloadURL" value="${escHtml(dist.downloadURL)}" placeholder="https://data.example.nl/dataset.csv">`,`dist${i}downloadURL`)}
      <div class="field-row">
        ${fieldWrap('File Format','Format of the data file.','recommended',
          vocabSelect(VOCAB.fileFormats, dist.format, `dist[${i}].format`, 'Select format'),`dist${i}format`)}
        ${fieldWrap('Media Type (IANA)','IANA media type of the distribution.','recommended',
          vocabSelect(VOCAB.mediaTypes, dist.mediaType, `dist[${i}].mediaType`, 'Select media type'),`dist${i}mediaType`)}
      </div>
      <div class="field-row">
        ${fieldWrap('License','License under which this distribution is released.','recommended',
          vocabSelect(VOCAB.licenses, dist.license, `dist[${i}].license`, 'Select license'),`dist${i}license`)}
        ${fieldWrap('Status','Maturity / lifecycle stage of this distribution.','optional',
          vocabSelect(VOCAB.distributionStatuses, dist.status, `dist[${i}].status`, 'Select status'),`dist${i}status`)}
      </div>
      <div class="field-row">
        ${fieldWrap('Compression Format','Format used to compress the data.','optional',
          vocabSelect(VOCAB.compressionFormats, dist.compressFormat, `dist[${i}].compressFormat`, 'Select compression'),`dist${i}compressFormat`)}
        ${fieldWrap('Byte Size','File size in bytes.','optional',
          `<input type="number" min="0" class="form-input form-input--short" name="dist[${i}].byteSize" value="${escHtml(dist.byteSize)}" placeholder="e.g. 1048576">`,`dist${i}byteSize`)}
      </div>
      ${fieldWrap('Rights Statement','Free-text rights or conditions statement for this distribution.','optional',
        `<input type="text" class="form-input" name="dist[${i}].rights" value="${escHtml(dist.rights)}" placeholder="e.g. Available upon request to approved researchers">`,`dist${i}rights`)}
      ${fieldWrap('Distribution Title','A name for this specific distribution.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="dist[${i}].title" value="${escHtml(dist.title)}" placeholder="e.g. CSV download">
          ${langSelect(dist.titleLang || 'en', `dist[${i}].titleLang`)}
        </div>`,`dist${i}title`)}
    </div>`).join('');

  container.innerHTML = `
    <div class="step-header">
      <h2>Distribution</h2>
      <p>How and where can this dataset be accessed or downloaded? Add one or more distributions.</p>
    </div>
    ${distCards}
    <button type="button" class="btn-add-dist" onclick="addDistribution()">+ Add another distribution</button>`;
}

function renderDiscovery(container) {
  const d = state.data;
  const tr = d.temporalResolution || {};

  const durationPreview = (() => {
    let p = 'P';
    if (tr.years)   p += `${tr.years}Y`;
    if (tr.months)  p += `${tr.months}M`;
    if (tr.days)    p += `${tr.days}D`;
    if (tr.hours || tr.minutes || tr.seconds) {
      p += 'T';
      if (tr.hours)   p += `${tr.hours}H`;
      if (tr.minutes) p += `${tr.minutes}M`;
      if (tr.seconds) p += `${tr.seconds}S`;
    }
    return p === 'P' ? 'No duration set' : p;
  })();

  container.innerHTML = `
    <div class="step-header">
      <h2>Discoverability</h2>
      <p>Metadata that helps users find this dataset. All optional but strongly recommended.</p>
    </div>
    <div class="card">
      <h3>Keywords, Themes &amp; Purpose</h3>
      ${fieldWrap('Keywords','Search terms for this dataset. One per row.','recommended',
        multiLangField(d.keywords,'keywords','e.g. diabetes'),'keywords')}
      ${fieldWrap('EU Data Theme','Thematic category from the EU vocabulary.','recommended',
        multiSelect(VOCAB.dataThemes, d.themes, 'themes', 'Search EU data themes…'),'themes')}
      ${fieldWrap('Purpose','Statement of the purpose for which this data is collected or processed.','optional',
        multiLangField(d.purpose,'purpose','e.g. Secondary use for academic research on cardiovascular disease'),'purpose')}
      ${fieldWrap('Provenance','Lineage and methodology — how the data was collected or generated.','optional',
        multiLangField(d.provenance,'provenance','e.g. Collected from hospital EHR systems via HL7 FHIR API...'),'provenance')}
    </div>
    <div class="card">
      <h3>Geographic &amp; Temporal Coverage</h3>
      ${fieldWrap('Languages of the Dataset','Languages in which the data is available.','recommended',
        multiSelect(VOCAB.languages, d.languages, 'languages', 'Search languages…'),'languages')}
      ${fieldWrap('Spatial Coverage','Country or region the dataset covers.','recommended',
        multiSelect(VOCAB.countries, d.spatialCoverage, 'spatialCoverage', 'Search countries…'),'spatialCoverage')}
      ${fieldWrap('Spatial Resolution (metres)','Geographic precision of the data, in metres.','optional',
        `<input type="number" min="0" step="any" class="form-input form-input--short" name="spatialResolutionInMeters" value="${escHtml(d.spatialResolutionInMeters)}" placeholder="e.g. 1000">`,'spatialResolutionInMeters')}
      <div class="field-row">
        ${fieldWrap('Temporal Coverage Start','When does the data coverage begin?','recommended',
          `<input type="date" class="form-input" name="temporalStart" value="${escHtml(d.temporalStart)}">`,'temporalStart')}
        ${fieldWrap('Temporal Coverage End','When does the data coverage end?','recommended',
          `<input type="date" class="form-input" name="temporalEnd" value="${escHtml(d.temporalEnd)}">`,'temporalEnd')}
      </div>
      ${fieldWrap('Temporal Resolution','Minimum time period resolvable in the dataset (ISO 8601 duration).','optional',
        `<div class="duration-input">
          <div class="duration-fields">
            ${['years','months','days','hours','minutes','seconds'].map(u => `
              <div class="duration-field">
                <input type="number" min="0" class="form-input" name="temporalResolution.${u}" value="${escHtml(tr[u])}" placeholder="0" oninput="saveFormData()">
                <label>${u.charAt(0).toUpperCase() + u.slice(1)}</label>
              </div>`).join('')}
          </div>
          <div class="duration-preview" id="duration-preview">${durationPreview}</div>
        </div>`,'temporalResolution')}
    </div>
    <div class="card">
      <h3>Dates &amp; Links</h3>
      ${fieldWrap('Update Frequency','How often is this dataset updated?','recommended',
        vocabSelect(VOCAB.frequencies, d.accrualPeriodicity, 'accrualPeriodicity', 'Select frequency'),'accrualPeriodicity')}
      <div class="field-row">
        ${fieldWrap('Publication Date','When was this dataset first published?','recommended',
          `<input type="date" class="form-input" name="issued" value="${escHtml(d.issued)}">`,'issued')}
        ${fieldWrap('Last Modified','When was this dataset last updated?','optional',
          `<input type="date" class="form-input" name="modified" value="${escHtml(d.modified)}">`,'modified')}
      </div>
      ${fieldWrap('Landing Page','A web page with more information about this dataset.','optional',
        `<input type="url" class="form-input" name="landingPage" value="${escHtml(d.landingPage)}" placeholder="https://organisation.nl/datasets/my-dataset">`,'landingPage')}
    </div>`;
}

function renderDocumentation(container) {
  const d = state.data;

  const pageCards = d.documentationPages.map((p, i) => `
    <div class="doc-page-card sub-card">
      <div class="sub-card-header">
        <span>Documentation Page ${i + 1}</span>
        ${d.documentationPages.length > 1 ? `<button type="button" class="btn-remove-sub" onclick="removeDocPage(${i})">Remove</button>` : ''}
      </div>
      ${fieldWrap('Page URL','Link to the documentation or technical notes page.','optional',
        `<input type="url" class="form-input" name="page[${i}].uri" value="${escHtml(p.uri)}" placeholder="https://docs.example.nl/dataset">`,`page${i}uri`)}
      ${fieldWrap('Label','Human-readable title for this page.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="page[${i}].label" value="${escHtml(p.label)}" placeholder="e.g. Technical documentation">
          ${langSelect(p.labelLang,`page[${i}].labelLang`)}
        </div>`,`page${i}label`)}
      ${fieldWrap('Note','Short description of this documentation page.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="page[${i}].note" value="${escHtml(p.note)}" placeholder="e.g. Contains data dictionary and codebook">
          ${langSelect(p.noteLang,`page[${i}].noteLang`)}
        </div>`,`page${i}note`)}
    </div>`).join('');

  const qrelCards = d.qualifiedRelations.map((r, i) => `
    <div class="qrel-card sub-card">
      <div class="sub-card-header">
        <span>Relation ${i + 1}</span>
        ${d.qualifiedRelations.length > 1 ? `<button type="button" class="btn-remove-sub" onclick="removeQRel(${i})">Remove</button>` : ''}
      </div>
      <div class="field-row">
        ${fieldWrap('Related Dataset URI','URI of the related dataset.','optional',
          `<input type="url" class="form-input" name="qrel[${i}].uri" value="${escHtml(r.uri)}" placeholder="https://data.example.nl/datasets/related">`,`qrel${i}uri`)}
        ${fieldWrap('Relationship Role','Nature of the relationship.','optional',
          vocabSelect(VOCAB.relationRoles, r.role, `qrel[${i}].role`, 'Select role'),`qrel${i}role`)}
      </div>
    </div>`).join('');

  const attrCards = d.qualifiedAttributions.map((a, i) => `
    <div class="attr-card sub-card">
      <div class="sub-card-header">
        <span>Attribution ${i + 1}</span>
        ${d.qualifiedAttributions.length > 1 ? `<button type="button" class="btn-remove-sub" onclick="removeQAttr(${i})">Remove</button>` : ''}
      </div>
      <div class="field-row">
        ${fieldWrap('Name','Name of the attributed person or organisation.','optional',
          `<div class="multi-row">
            <input type="text" class="form-input multi-text" name="attr[${i}].name" value="${escHtml(a.name)}" placeholder="e.g. Dr. J. de Vries">
            ${langSelect(a.nameLang,`attr[${i}].nameLang`)}
          </div>`,`attr${i}name`)}
        ${fieldWrap('Role','Role of the attributed agent.','optional',
          vocabSelect(VOCAB.attributionRoles, a.role, `attr[${i}].role`, 'Select role'),`attr${i}role`)}
      </div>
      <div class="field-row">
        ${fieldWrap('Email','Contact email.','optional',
          `<input type="email" class="form-input" name="attr[${i}].email" value="${escHtml(a.email)}" placeholder="e.g. j.devries@rivm.nl">`,`attr${i}email`)}
        ${fieldWrap('URI / ORCID','Personal URI or ORCID.','optional',
          `<input type="url" class="form-input" name="attr[${i}].uri" value="${escHtml(a.uri)}" placeholder="https://orcid.org/0000-0000-0000-0000">`,`attr${i}uri`)}
      </div>
    </div>`).join('');

  const actCards = d.wasGeneratedBy.map((a, i) => `
    <div class="activity-card sub-card">
      <div class="sub-card-header">
        <span>Activity ${i + 1}</span>
        ${d.wasGeneratedBy.length > 1 ? `<button type="button" class="btn-remove-sub" onclick="removeActivity(${i})">Remove</button>` : ''}
      </div>
      ${fieldWrap('Activity Name','Name of the process that generated this dataset.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="act[${i}].name" value="${escHtml(a.name)}" placeholder="e.g. Annual data collection 2023">
          ${langSelect(a.nameLang,`act[${i}].nameLang`)}
        </div>`,`act${i}name`)}
      ${fieldWrap('Description','Description of the generating activity or process.','optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="act[${i}].description" value="${escHtml(a.description)}" placeholder="e.g. Data extracted from EHR systems via HL7 FHIR">
          ${langSelect(a.descriptionLang,`act[${i}].descriptionLang`)}
        </div>`,`act${i}desc`)}
    </div>`).join('');

  container.innerHTML = `
    <div class="step-header">
      <h2>Documentation &amp; Relations</h2>
      <p>Link to documentation, related datasets, and attribute contributing agents. All fields optional.</p>
    </div>
    <div class="card">
      <h3>Documentation Pages <span class="badge badge-optional">Optional</span></h3>
      <p class="card-desc">Links to technical documentation, data dictionaries, or codebooks (<code>foaf:page</code>).</p>
      ${pageCards}
      <button type="button" class="btn-add-sub" onclick="addDocPage()">+ Add documentation page</button>
    </div>
    <div class="card">
      <h3>Qualified Relations <span class="badge badge-optional">Optional</span></h3>
      <p class="card-desc">Links to related datasets with a typed relationship (<code>dcat:qualifiedRelation</code>).</p>
      ${qrelCards}
      <button type="button" class="btn-add-sub" onclick="addQRel()">+ Add relation</button>
    </div>
    <div class="card">
      <h3>Qualified Attributions <span class="badge badge-optional">Optional</span></h3>
      <p class="card-desc">People or organisations with a specific role in creating this dataset (<code>prov:qualifiedAttribution</code>).</p>
      ${attrCards}
      <button type="button" class="btn-add-sub" onclick="addQAttr()">+ Add attribution</button>
    </div>
    <div class="card">
      <h3>Was Generated By <span class="badge badge-optional">Optional</span></h3>
      <p class="card-desc">The activity or process that generated this dataset (<code>prov:wasGeneratedBy</code>).</p>
      ${actCards}
      <button type="button" class="btn-add-sub" onclick="addActivity()">+ Add activity</button>
    </div>`;
}

function renderReview(container) {
  const d = state.data;
  const allErrors = [...validateIdentity(), ...validateAccess(), ...validateHealth()];
  const ttlOutput = generateTTL(d);
  const datasetTitle = d.titles?.[0]?.value || 'Untitled Dataset';

  const errorBlock = allErrors.length > 0 ? `
    <div class="review-errors">
      <h4>&#9888; Required fields missing</h4>
      ${allErrors.map(e => `<div class="error-item">&#9888; ${e}</div>`).join('')}
      <p>You can still preview the TTL, but please fix these before publishing.</p>
    </div>` : `<div class="review-ok">&#10003; All required fields are complete. Ready to publish.</div>`;

  container.innerHTML = `
    <div class="step-header">
      <h2>Review &amp; Publish</h2>
      <p>Review the generated Turtle metadata below, then click <strong>Publish</strong> to open it as a raw TTL page.</p>
    </div>
    ${errorBlock}
    <div class="card">
      <div class="review-meta">
        <div class="review-meta-item"><span>Dataset</span><strong>${escHtml(datasetTitle)}</strong></div>
        <div class="review-meta-item"><span>URI</span><strong>${escHtml(d.datasetURI || '(auto-generated)')}</strong></div>
        <div class="review-meta-item"><span>Access</span><strong>${VOCAB.accessRights.find(a => a.uri === d.accessRights)?.label || '(not set)'}</strong></div>
        <div class="review-meta-item"><span>Distributions</span><strong>${d.distributions.filter(dist => dist.accessURL).length}</strong></div>
      </div>
    </div>
    <div class="card">
      <div class="ttl-preview-header">
        <h3>Generated Turtle (HealthDCAT-AP v6)</h3>
        <button type="button" class="btn-copy-ttl" onclick="copyTTLPreview()">Copy</button>
      </div>
      <pre class="ttl-preview" id="ttl-preview">${escHtml(ttlOutput)}</pre>
    </div>
    <div class="publish-row">
      <button type="button" class="btn-publish ${allErrors.length > 0 ? 'btn-publish--warn' : ''}" onclick="doPublish()">
        ${allErrors.length > 0 ? '&#9888; Publish anyway' : 'Publish →'}
      </button>
      <span class="publish-hint">Opens a raw TTL page in a new tab</span>
    </div>`;
}

function copyTTLPreview() {
  const text = document.getElementById('ttl-preview')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-copy-ttl');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
  });
}

function doPublish() {
  saveFormData();
  publishToNewTab(generateTTL(state.data), state.data.titles?.[0]?.value || 'Dataset');
}

// ─── Draft save/load ──────────────────────────────────────────────────────────

function saveDraft() {
  saveFormData();
  try {
    localStorage.setItem('healthdcat_draft', JSON.stringify(state.data));
    showToast('Draft saved.');
  } catch (e) { showToast('Could not save draft.', true); }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem('healthdcat_draft');
    if (!raw) { showToast('No draft found.', true); return; }
    Object.assign(state.data, JSON.parse(raw));
    renderCurrentStep();
    showToast('Draft loaded.');
  } catch (e) { showToast('Could not load draft.', true); }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' toast--error' : ' toast--ok');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('back-btn').addEventListener('click', back);
  document.getElementById('next-btn').addEventListener('click', next);
  document.getElementById('save-btn').addEventListener('click', saveDraft);
  document.getElementById('load-btn').addEventListener('click', loadDraft);

  // Inline validation on blur for URL, email, and IRI fields
  document.addEventListener('blur', e => {
    const input = e.target;
    if (input.matches('input[type="url"], input[type="email"], input[data-validate="iri"]')) {
      validateFieldEl(input);
    }
  }, true);

  renderCurrentStep();
});
