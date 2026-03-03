// app.js — HealthDCAT-AP Metadata Editor wizard logic

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  step: 0,
  data: {
    // Step 1: Identity
    datasetURI: '',
    titles: [{ value: '', lang: 'en' }],
    alternativeTitle: '',
    alternativeTitleLang: 'en',
    descriptions: [{ value: '', lang: 'en' }],
    version: '',
    identifier: '',

    // Step 2: Access & Legal
    accessRights: '',
    legislation: [],
    personalData: '',
    legalBases: [],
    retentionPeriodStart: '',
    retentionPeriodEnd: '',

    // Step 3: Health Classification
    healthCategories: [],
    healthThemes: [],
    hdabName: '',
    hdabNameLang: 'en',
    hdabEmail: '',
    hdabURL: '',

    // Step 4: Population & Stats
    numberOfRecords: '',
    numberOfUniqueIndividuals: '',
    minTypicalAge: '',
    maxTypicalAge: '',
    populationCoverage: [{ value: '', lang: 'en' }],

    // Step 5: Publisher & Contacts
    publisherName: '',
    publisherNameLang: 'en',
    publisherType: '',
    publisherEmail: '',
    publisherURL: '',
    contactEmail: '',
    contactURL: '',

    // Step 6: Distribution
    distributions: [{ accessURL: '', downloadURL: '', format: '', license: '', title: '', titleLang: 'en' }],

    // Step 7: Discoverability
    keywords: [{ value: '', lang: 'en' }],
    themes: [],
    languages: [],
    spatialCoverage: [],
    temporalStart: '',
    temporalEnd: '',
    accrualPeriodicity: '',
    issued: '',
    modified: '',
    landingPage: '',
  },
};

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identity',     label: 'Identity',        render: renderIdentity,     validate: validateIdentity },
  { id: 'access',       label: 'Access & Legal',   render: renderAccess,       validate: validateAccess },
  { id: 'health',       label: 'Health',           render: renderHealth,       validate: validateHealth },
  { id: 'population',   label: 'Population',       render: renderPopulation,   validate: () => [] },
  { id: 'contacts',     label: 'Contacts',         render: renderContacts,     validate: () => [] },
  { id: 'distribution', label: 'Distribution',     render: renderDistribution, validate: () => [] },
  { id: 'discovery',    label: 'Discoverability',  render: renderDiscovery,    validate: () => [] },
  { id: 'review',       label: 'Review & Publish', render: renderReview,       validate: () => [] },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

function goToStep(n) {
  state.step = n;
  renderCurrentStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  saveFormData(); // always persist current step before leaving
  const errors = STEPS[state.step].validate();
  if (errors.length > 0) {
    showErrors(errors);
    return;
  }
  clearErrors();
  if (state.step < STEPS.length - 1) goToStep(state.step + 1);
}

function back() {
  saveFormData(); // always persist current step before leaving
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

// ─── Progress bar ─────────────────────────────────────────────────────────────

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

function tryGoToStep(n) {
  if (n < state.step) goToStep(n); // only allow going back via progress bar
}

// ─── Navigation buttons ───────────────────────────────────────────────────────

function updateNav() {
  const backBtn = document.getElementById('back-btn');
  const nextBtn = document.getElementById('next-btn');
  const stepInfo = document.getElementById('step-info');

  backBtn.disabled = state.step === 0;

  if (state.step === STEPS.length - 1) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = '';
    nextBtn.textContent = state.step === STEPS.length - 2 ? 'Review →' : 'Next →';
  }

  stepInfo.textContent = `Step ${state.step + 1} of ${STEPS.length}`;
}

// ─── Render current step ──────────────────────────────────────────────────────

function renderCurrentStep() {
  renderProgress();
  updateNav();
  const container = document.getElementById('step-container');
  container.innerHTML = '';
  STEPS[state.step].render(container);
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function badge(type) {
  const map = { required: 'Required', recommended: 'Recommended', optional: 'Optional' };
  return `<span class="badge badge-${type}">${map[type]}</span>`;
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

function checkboxGroup(items, selectedArr, fieldName) {
  return `<div class="checkbox-group">
    ${items.map(item => `
      <label class="checkbox-item">
        <input type="checkbox" name="${fieldName}" value="${item.uri}" ${selectedArr.includes(item.uri) ? 'checked' : ''}>
        <span>${item.label}</span>
      </label>`).join('')}
  </div>`;
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
  if (state.data[fieldKey].length <= 1) return; // keep at least one
  saveFormData();
  state.data[fieldKey].splice(index, 1);
  renderCurrentStep();
}

function addDistribution() {
  saveFormData();
  state.data.distributions.push({ accessURL: '', downloadURL: '', format: '', license: '', title: '', titleLang: 'en' });
  renderCurrentStep();
}

function removeDistribution(index) {
  if (state.data.distributions.length <= 1) return;
  saveFormData();
  state.data.distributions.splice(index, 1);
  renderCurrentStep();
}

// ─── Save form data from DOM ──────────────────────────────────────────────────

function saveFormData() {
  // Multi-lang arrays
  ['titles', 'descriptions', 'populationCoverage', 'keywords'].forEach(key => {
    const container = document.getElementById(`multi-${key}`);
    if (!container) return;
    const rows = container.querySelectorAll('.multi-row');
    state.data[key] = Array.from(rows).map(row => ({
      value: row.querySelector('.multi-text')?.value || '',
      lang:  row.querySelector('.lang-select')?.value || 'en',
    }));
  });

  // Checkbox groups — only update if the field is actually rendered in the current DOM
  ['legislation', 'healthCategories', 'healthThemes', 'legalBases', 'languages', 'spatialCoverage', 'themes'].forEach(key => {
    const anyCheckbox = document.querySelector(`input[name="${key}"]`);
    if (!anyCheckbox) return; // field not on this step — keep existing value
    const checkboxes = document.querySelectorAll(`input[name="${key}"]:checked`);
    state.data[key] = Array.from(checkboxes).map(cb => cb.value);
  });

  // Distributions
  const distForms = document.querySelectorAll('.distribution-card');
  if (distForms.length > 0) {
    state.data.distributions = Array.from(distForms).map((card, i) => ({
      accessURL:   card.querySelector(`[name="dist[${i}].accessURL"]`)?.value   || '',
      downloadURL: card.querySelector(`[name="dist[${i}].downloadURL"]`)?.value || '',
      format:      card.querySelector(`[name="dist[${i}].format"]`)?.value      || '',
      license:     card.querySelector(`[name="dist[${i}].license"]`)?.value     || '',
      title:       card.querySelector(`[name="dist[${i}].title"]`)?.value       || '',
      titleLang:   card.querySelector(`[name="dist[${i}].titleLang"]`)?.value   || 'en',
    }));
  }

  // Plain inputs / selects
  const fields = [
    'datasetURI','identifier','version','alternativeTitle','alternativeTitleLang',
    'accessRights','personalData','retentionPeriodStart','retentionPeriodEnd',
    'hdabName','hdabNameLang','hdabEmail','hdabURL',
    'numberOfRecords','numberOfUniqueIndividuals','minTypicalAge','maxTypicalAge',
    'publisherName','publisherNameLang','publisherType','publisherEmail','publisherURL',
    'contactEmail','contactURL',
    'accrualPeriodicity','temporalStart','temporalEnd','issued','modified','landingPage',
  ];
  fields.forEach(key => {
    const el = document.querySelector(`[name="${key}"]`);
    if (el) state.data[key] = el.value;
  });
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
  return errors;
}

function validateHealth() {
  const errors = [];
  if (!state.data.healthCategories || state.data.healthCategories.length === 0) errors.push('At least one health category is required.');
  if (!state.data.hdabName) errors.push('Health Data Access Body name is required.');
  return errors;
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function renderIdentity(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Dataset Identity</h2>
      <p>Basic identifying information about your dataset. Fields marked <span class="badge badge-required">Required</span> must be filled before continuing.</p>
    </div>

    <div class="card">
      <h3>Dataset URI</h3>
      ${fieldWrap(
        'Dataset URI',
        'The permanent identifier URL for this dataset. Leave blank to auto-generate, or enter your own (e.g. <code>https://data.yourdomain.nl/datasets/my-dataset</code>).',
        'recommended',
        `<input type="url" class="form-input" name="datasetURI" value="${escHtml(d.datasetURI)}" placeholder="https://data.yourdomain.nl/datasets/my-dataset">`,
        'datasetURI'
      )}
    </div>

    <div class="card">
      <h3>Titles &amp; Descriptions</h3>
      ${fieldWrap(
        'Dataset Title',
        'Provide a clear, descriptive name. Add multiple titles for different languages.',
        'required',
        multiLangField(d.titles, 'titles', 'e.g. COVID-19 Patient Registry'),
        'titles'
      )}
      ${fieldWrap(
        'Alternative Title',
        'A secondary or abbreviated name for this dataset.',
        'optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="alternativeTitle" value="${escHtml(d.alternativeTitle)}" placeholder="e.g. COVID-19 Registry NL">
          ${langSelect(d.alternativeTitleLang, 'alternativeTitleLang')}
        </div>`,
        'alternativeTitle'
      )}
      ${fieldWrap(
        'Description',
        'A clear description of the dataset contents, scope, and purpose. Add multiple for different languages.',
        'required',
        multiLangField(d.descriptions, 'descriptions', 'Describe your dataset...'),
        'descriptions'
      )}
    </div>

    <div class="card">
      <h3>Version</h3>
      ${fieldWrap(
        'Version',
        'Version number or label (e.g. <code>1.0</code>, <code>2024-Q1</code>).',
        'optional',
        `<input type="text" class="form-input form-input--short" name="version" value="${escHtml(d.version)}" placeholder="e.g. 1.0">`,
        'version'
      )}
      ${fieldWrap(
        'Custom Identifier',
        'Override the dataset identifier (defaults to the Dataset URI above).',
        'optional',
        `<input type="text" class="form-input" name="identifier" value="${escHtml(d.identifier)}" placeholder="e.g. https://data.yourdomain.nl/datasets/my-dataset">`,
        'identifier'
      )}
    </div>
  `;
}

function renderAccess(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Access &amp; Legal</h2>
      <p>Define who can access this dataset and under what legal basis. These fields are required for EHDS compliance.</p>
    </div>

    <div class="card">
      <h3>Access Classification</h3>
      ${fieldWrap(
        'Access Rights',
        'How can this dataset be accessed? This determines which cardinality rules apply in the rest of the form.',
        'required',
        vocabSelect(VOCAB.accessRights, d.accessRights, 'accessRights', 'Select access level'),
        'accessRights'
      )}
      ${fieldWrap(
        'Personal Data',
        'Does this dataset contain personal health data as defined under GDPR?',
        'optional',
        `<select class="form-select" name="personalData">
          <option value="">— Select —</option>
          <option value="true"  ${d.personalData === 'true'  ? 'selected' : ''}>Yes — contains personal data</option>
          <option value="false" ${d.personalData === 'false' ? 'selected' : ''}>No — does not contain personal data</option>
        </select>`,
        'personalData'
      )}
    </div>

    <div class="card">
      <h3>Applicable Legislation</h3>
      ${fieldWrap(
        'Legislation',
        'Select all legislation that mandates or governs the creation and sharing of this dataset.',
        'required',
        checkboxGroup(VOCAB.legislation, d.legislation, 'legislation'),
        'legislation'
      )}
    </div>

    <div class="card">
      <h3>Legal Basis &amp; Retention</h3>
      ${fieldWrap(
        'Legal Basis (GDPR)',
        'The GDPR article under which personal data in this dataset is processed.',
        'optional',
        checkboxGroup(VOCAB.legalBases, d.legalBases, 'legalBases'),
        'legalBases'
      )}
      <div class="field-row">
        ${fieldWrap(
          'Retention Period Start',
          'When does/did the retention period begin?',
          'optional',
          `<input type="date" class="form-input" name="retentionPeriodStart" value="${escHtml(d.retentionPeriodStart)}">`,
          'retentionStart'
        )}
        ${fieldWrap(
          'Retention Period End',
          'When does the retention period end?',
          'optional',
          `<input type="date" class="form-input" name="retentionPeriodEnd" value="${escHtml(d.retentionPeriodEnd)}">`,
          'retentionEnd'
        )}
      </div>
    </div>
  `;
}

function renderHealth(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Health Classification</h2>
      <p>Classify your dataset using health-specific vocabulary and designate the Health Data Access Body (HDAB) responsible for granting access.</p>
    </div>

    <div class="card">
      <h3>Health Categories</h3>
      ${fieldWrap(
        'Health Category',
        'Select all categories that describe the type of health data in this dataset.',
        'required',
        checkboxGroup(VOCAB.healthCategories, d.healthCategories, 'healthCategories'),
        'healthCategories'
      )}
    </div>

    <div class="card">
      <h3>Health Themes</h3>
      ${fieldWrap(
        'Health Theme',
        'Select disease areas or health themes that this dataset covers.',
        'optional',
        checkboxGroup(VOCAB.healthThemes, d.healthThemes, 'healthThemes'),
        'healthThemes'
      )}
    </div>

    <div class="card">
      <h3>Health Data Access Body (HDAB)</h3>
      <p class="card-desc">The HDAB is the authority responsible for approving access requests for this dataset (required for non-public datasets).</p>
      ${fieldWrap(
        'HDAB Name',
        'Full name of the Health Data Access Body (e.g. <em>Dutch Health Data Access Body</em>).',
        'required',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="hdabName" value="${escHtml(d.hdabName)}" placeholder="e.g. Dutch Health Data Access Body">
          ${langSelect(d.hdabNameLang, 'hdabNameLang')}
        </div>`,
        'hdabName'
      )}
      ${fieldWrap(
        'HDAB Contact Email',
        'Official contact email for the HDAB.',
        'recommended',
        `<input type="email" class="form-input" name="hdabEmail" value="${escHtml(d.hdabEmail)}" placeholder="e.g. hdab@minvws.nl">`,
        'hdabEmail'
      )}
      ${fieldWrap(
        'HDAB Contact URL',
        'Link to the HDAB contact or application page.',
        'optional',
        `<input type="url" class="form-input" name="hdabURL" value="${escHtml(d.hdabURL)}" placeholder="https://hdab.example.nl/contact">`,
        'hdabURL'
      )}
    </div>
  `;
}

function renderPopulation(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Population &amp; Statistics</h2>
      <p>Quantitative metadata about the dataset population. All fields are optional but improve discoverability and reuse potential.</p>
    </div>

    <div class="card">
      <h3>Dataset Size</h3>
      <div class="field-row">
        ${fieldWrap(
          'Number of Records',
          'Total rows / observations in the dataset.',
          'optional',
          `<input type="number" min="0" class="form-input form-input--short" name="numberOfRecords" value="${escHtml(d.numberOfRecords)}" placeholder="e.g. 150000">`,
          'numberOfRecords'
        )}
        ${fieldWrap(
          'Number of Unique Individuals',
          'Number of distinct patients / persons.',
          'optional',
          `<input type="number" min="0" class="form-input form-input--short" name="numberOfUniqueIndividuals" value="${escHtml(d.numberOfUniqueIndividuals)}" placeholder="e.g. 12000">`,
          'numberOfUniqueIndividuals'
        )}
      </div>
    </div>

    <div class="card">
      <h3>Age Range</h3>
      <div class="field-row">
        ${fieldWrap(
          'Minimum Typical Age',
          'Youngest age typically present in this dataset (years).',
          'optional',
          `<input type="number" min="0" max="150" class="form-input form-input--short" name="minTypicalAge" value="${escHtml(d.minTypicalAge)}" placeholder="e.g. 18">`,
          'minTypicalAge'
        )}
        ${fieldWrap(
          'Maximum Typical Age',
          'Oldest age typically present in this dataset (years).',
          'optional',
          `<input type="number" min="0" max="150" class="form-input form-input--short" name="maxTypicalAge" value="${escHtml(d.maxTypicalAge)}" placeholder="e.g. 85">`,
          'maxTypicalAge'
        )}
      </div>
    </div>

    <div class="card">
      <h3>Population Description</h3>
      ${fieldWrap(
        'Population Coverage',
        'Free-text description of the population this dataset covers (e.g. "Adult patients diagnosed with Type 2 diabetes in the Netherlands").',
        'optional',
        multiLangField(d.populationCoverage, 'populationCoverage', 'Describe the covered population...'),
        'populationCoverage'
      )}
    </div>
  `;
}

function renderContacts(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Publisher &amp; Contacts</h2>
      <p>Who is responsible for publishing and maintaining this dataset?</p>
    </div>

    <div class="card">
      <h3>Publisher</h3>
      ${fieldWrap(
        'Publisher Name',
        'Organisation or institution that published this dataset.',
        'recommended',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="publisherName" value="${escHtml(d.publisherName)}" placeholder="e.g. RIVM">
          ${langSelect(d.publisherNameLang, 'publisherNameLang')}
        </div>`,
        'publisherName'
      )}
      ${fieldWrap(
        'Publisher Type',
        'Category of publishing organisation.',
        'recommended',
        vocabSelect(VOCAB.publisherTypes, d.publisherType, 'publisherType', 'Select publisher type'),
        'publisherType'
      )}
      ${fieldWrap(
        'Publisher Email',
        'Official contact email for the publishing organisation.',
        'optional',
        `<input type="email" class="form-input" name="publisherEmail" value="${escHtml(d.publisherEmail)}" placeholder="e.g. data@rivm.nl">`,
        'publisherEmail'
      )}
      ${fieldWrap(
        'Publisher Website',
        'URL of the publisher\'s contact or about page.',
        'optional',
        `<input type="url" class="form-input" name="publisherURL" value="${escHtml(d.publisherURL)}" placeholder="https://www.rivm.nl/contact">`,
        'publisherURL'
      )}
    </div>

    <div class="card">
      <h3>Dataset Contact Point</h3>
      <p class="card-desc">The contact for dataset-specific enquiries (may differ from the publisher).</p>
      ${fieldWrap(
        'Contact Email',
        'Email address for dataset enquiries.',
        'recommended',
        `<input type="email" class="form-input" name="contactEmail" value="${escHtml(d.contactEmail)}" placeholder="e.g. opendata@organisation.nl">`,
        'contactEmail'
      )}
      ${fieldWrap(
        'Contact URL',
        'Link to a contact form or page for this dataset.',
        'optional',
        `<input type="url" class="form-input" name="contactURL" value="${escHtml(d.contactURL)}" placeholder="https://www.organisation.nl/contact">`,
        'contactURL'
      )}
    </div>
  `;
}

function renderDistribution(container) {
  const d = state.data;

  const distCards = d.distributions.map((dist, i) => `
    <div class="distribution-card" data-index="${i}">
      <div class="distribution-card-header">
        <span>Distribution ${i + 1}</span>
        ${d.distributions.length > 1 ? `<button type="button" class="btn-remove-dist" onclick="removeDistribution(${i})">Remove</button>` : ''}
      </div>
      ${fieldWrap(
        'Access URL',
        'URL where this distribution can be accessed or requested.',
        'required',
        `<input type="url" class="form-input" name="dist[${i}].accessURL" value="${escHtml(dist.accessURL)}" placeholder="https://data.example.nl/dataset/my-data">`,
        `dist${i}accessURL`
      )}
      ${fieldWrap(
        'Download URL',
        'Direct download link if the data can be downloaded.',
        'optional',
        `<input type="url" class="form-input" name="dist[${i}].downloadURL" value="${escHtml(dist.downloadURL)}" placeholder="https://data.example.nl/dataset/my-data.csv">`,
        `dist${i}downloadURL`
      )}
      <div class="field-row">
        ${fieldWrap(
          'File Format',
          'Format of the data file.',
          'recommended',
          vocabSelect(VOCAB.fileFormats, dist.format, `dist[${i}].format`, 'Select format'),
          `dist${i}format`
        )}
        ${fieldWrap(
          'License',
          'License under which this distribution is released.',
          'recommended',
          vocabSelect(VOCAB.licenses, dist.license, `dist[${i}].license`, 'Select license'),
          `dist${i}license`
        )}
      </div>
      ${fieldWrap(
        'Distribution Title',
        'A name for this specific distribution (optional).',
        'optional',
        `<div class="multi-row">
          <input type="text" class="form-input multi-text" name="dist[${i}].title" value="${escHtml(dist.title)}" placeholder="e.g. CSV download">
          ${langSelect(dist.titleLang || 'en', `dist[${i}].titleLang`)}
        </div>`,
        `dist${i}title`
      )}
    </div>
  `).join('');

  container.innerHTML = `
    <div class="step-header">
      <h2>Distribution</h2>
      <p>How and where can this dataset be accessed or downloaded? Add one or more distributions.</p>
    </div>
    ${distCards}
    <button type="button" class="btn-add-dist" onclick="addDistribution()">+ Add another distribution</button>
  `;
}

function renderDiscovery(container) {
  const d = state.data;
  container.innerHTML = `
    <div class="step-header">
      <h2>Discoverability</h2>
      <p>Metadata that helps users find this dataset in catalogues. All optional but strongly recommended.</p>
    </div>

    <div class="card">
      <h3>Keywords &amp; Themes</h3>
      ${fieldWrap(
        'Keywords',
        'Search terms for this dataset. Add one per row.',
        'recommended',
        multiLangField(d.keywords, 'keywords', 'e.g. diabetes'),
        'keywords'
      )}
      ${fieldWrap(
        'EU Data Theme',
        'Thematic category from the EU data themes vocabulary.',
        'recommended',
        checkboxGroup(VOCAB.dataThemes, d.themes, 'themes'),
        'themes'
      )}
    </div>

    <div class="card">
      <h3>Geographic &amp; Temporal</h3>
      ${fieldWrap(
        'Languages of the Dataset',
        'Languages in which the data itself is available.',
        'recommended',
        checkboxGroup(VOCAB.languages, d.languages, 'languages'),
        'languages'
      )}
      ${fieldWrap(
        'Spatial Coverage',
        'Country or region the dataset covers.',
        'recommended',
        checkboxGroup(VOCAB.countries, d.spatialCoverage, 'spatialCoverage'),
        'spatialCoverage'
      )}
      <div class="field-row">
        ${fieldWrap(
          'Temporal Coverage Start',
          'When does the data coverage begin?',
          'recommended',
          `<input type="date" class="form-input" name="temporalStart" value="${escHtml(d.temporalStart)}">`,
          'temporalStart'
        )}
        ${fieldWrap(
          'Temporal Coverage End',
          'When does the data coverage end?',
          'recommended',
          `<input type="date" class="form-input" name="temporalEnd" value="${escHtml(d.temporalEnd)}">`,
          'temporalEnd'
        )}
      </div>
      ${fieldWrap(
        'Update Frequency',
        'How often is this dataset updated?',
        'recommended',
        vocabSelect(VOCAB.frequencies, d.accrualPeriodicity, 'accrualPeriodicity', 'Select frequency'),
        'accrualPeriodicity'
      )}
    </div>

    <div class="card">
      <h3>Publication Dates &amp; Links</h3>
      <div class="field-row">
        ${fieldWrap(
          'Publication Date',
          'When was this dataset first published?',
          'recommended',
          `<input type="date" class="form-input" name="issued" value="${escHtml(d.issued)}">`,
          'issued'
        )}
        ${fieldWrap(
          'Last Modified',
          'When was this dataset last updated?',
          'optional',
          `<input type="date" class="form-input" name="modified" value="${escHtml(d.modified)}">`,
          'modified'
        )}
      </div>
      ${fieldWrap(
        'Landing Page',
        'A web page with more information about this dataset.',
        'optional',
        `<input type="url" class="form-input" name="landingPage" value="${escHtml(d.landingPage)}" placeholder="https://www.organisation.nl/datasets/my-dataset">`,
        'landingPage'
      )}
    </div>
  `;
}

function renderReview(container) {
  const d = state.data;

  // Validation across all steps
  const allErrors = [
    ...validateIdentity(),
    ...validateAccess(),
    ...validateHealth(),
  ];

  const ttlOutput = generateTTL(d);
  const datasetTitle = d.titles?.[0]?.value || 'Untitled Dataset';

  const errorBlock = allErrors.length > 0 ? `
    <div class="review-errors">
      <h4>⚠ Required fields missing</h4>
      ${allErrors.map(e => `<div class="error-item">&#9888; ${e}</div>`).join('')}
      <p>You can still preview the TTL, but please fix these before publishing.</p>
    </div>` : `
    <div class="review-ok">&#10003; All required fields are complete. Ready to publish.</div>`;

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
        ${allErrors.length > 0 ? '⚠ Publish anyway' : 'Publish →'}
      </button>
      <span class="publish-hint">Opens a raw TTL page in a new tab</span>
    </div>
  `;
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
  const ttl = generateTTL(state.data);
  const title = state.data.titles?.[0]?.value || 'Dataset';
  publishToNewTab(ttl, title);
}

// ─── Draft save/load ──────────────────────────────────────────────────────────

function saveDraft() {
  saveFormData();
  try {
    localStorage.setItem('healthdcat_draft', JSON.stringify(state.data));
    showToast('Draft saved.');
  } catch (e) {
    showToast('Could not save draft.', true);
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem('healthdcat_draft');
    if (!raw) { showToast('No draft found.', true); return; }
    const loaded = JSON.parse(raw);
    Object.assign(state.data, loaded);
    renderCurrentStep();
    showToast('Draft loaded.');
  } catch (e) {
    showToast('Could not load draft.', true);
  }
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
  renderCurrentStep();
});
