// ttl-generator.js — Generates valid RDF Turtle from form data (Health DCAT-AP v6)

const PREFIXES = [
  ['dcat',        'http://www.w3.org/ns/dcat#'],
  ['dct',         'http://purl.org/dc/terms/'],
  ['foaf',        'http://xmlns.com/foaf/0.1/'],
  ['healthdcatap','http://data.europa.eu/r5r/healthdcat-ap/'],
  ['dcatap',      'http://data.europa.eu/r5r/'],
  ['xsd',         'http://www.w3.org/2001/XMLSchema#'],
  ['vcard',       'http://www.w3.org/2006/vcard/ns#'],
  ['m8g',         'http://data.europa.eu/m8g/'],
  ['adms',        'http://www.w3.org/ns/adms#'],
  ['dpv',         'https://w3id.org/dpv#'],
  ['dqv',         'http://www.w3.org/ns/dqv#'],
  ['prov',        'http://www.w3.org/ns/prov#'],
  ['skos',        'http://www.w3.org/2004/02/skos/core#'],
  ['odrl',        'http://www.w3.org/ns/odrl/2/'],
];

// --- Turtle helpers ---

function esc(str) {
  // Escape special characters in Turtle string literals
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g,  '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function lit(value, lang) {
  if (!value) return null;
  if (lang) return `"${esc(value)}"@${lang}`;
  return `"${esc(value)}"`;
}

function uriRef(value) {
  if (!value) return null;
  return `<${value}>`;
}

function xsdInt(value) {
  if (value === '' || value === null || value === undefined) return null;
  return `"${parseInt(value, 10)}"^^xsd:nonNegativeInteger`;
}

function xsdDate(value) {
  if (!value) return null;
  return `"${value}"^^xsd:date`;
}

function xsdBool(value) {
  if (value === '' || value === null || value === undefined) return null;
  return (value === true || value === 'true') ? 'true' : 'false';
}

// Render a blank-node block: subject line, then predicate-object pairs with proper Turtle punctuation
function renderBlock(subject, type, pairs) {
  const validPairs = pairs.filter(([, obj]) => obj !== null && obj !== undefined && obj !== '');
  if (validPairs.length === 0 && !type) return '';

  // Build a flat list of all [predicate, object] entries (type first)
  const items = [];
  if (type) items.push(['a', type]);
  validPairs.forEach(p => items.push(p));

  if (items.length === 0) return '';

  const lines = [subject];
  items.forEach(([pred, obj], i) => {
    const punct = (i === items.length - 1) ? ' .' : ' ;';
    lines.push(`    ${pred} ${obj}${punct}`);
  });

  return lines.join('\n');
}

// Multi-lang literals: return comma-joined or null
function multiLit(entries) {
  if (!entries || entries.length === 0) return null;
  const parts = entries.filter(e => e.value).map(e => lit(e.value, e.lang));
  return parts.length > 0 ? parts.join(', ') : null;
}

// Multi-URI: return comma-joined or null
function multiUri(uris) {
  if (!uris || uris.length === 0) return null;
  const parts = uris.filter(u => u).map(u => uriRef(u));
  return parts.length > 0 ? parts.join(', ') : null;
}

// --- Main generator ---

function generateTTL(data) {
  const lines = [];

  // Prefixes
  PREFIXES.forEach(([prefix, uri]) => {
    lines.push(`@prefix ${prefix}: <${uri}> .`);
  });
  lines.push('');

  const datasetURI = (data.datasetURI || '').trim() || `https://example.org/dataset/${slugify(data.titles?.[0]?.value || 'untitled')}`;

  // Collect all blank-node blocks to append after the Dataset block
  const bNodes = [];

  // Collect dataset properties
  const props = [];

  // Titles
  const titleLit = multiLit(data.titles);
  if (titleLit) props.push(['dct:title', titleLit]);

  // Alternative title
  if (data.alternativeTitle) props.push(['healthdcatap:alternative', lit(data.alternativeTitle, data.alternativeTitleLang || 'en')]);

  // Descriptions
  const descLit = multiLit(data.descriptions);
  if (descLit) props.push(['dct:description', descLit]);

  // Identifier
  if (data.identifier) props.push(['dct:identifier', lit(data.identifier)]);
  else props.push(['dct:identifier', lit(datasetURI)]);

  // Version
  if (data.version) props.push(['dct:version', lit(data.version)]);

  // Access rights
  if (data.accessRights) props.push(['dct:accessRights', uriRef(data.accessRights)]);

  // Applicable legislation
  const legUri = multiUri(data.legislation);
  if (legUri) props.push(['dcatap:applicableLegislation', legUri]);

  // Personal data
  const personal = xsdBool(data.personalData);
  if (personal !== null) props.push(['healthdcatap:personalData', personal]);

  // Legal bases
  const legalUri = multiUri(data.legalBases);
  if (legalUri) props.push(['dpv:hasLegalBasis', legalUri]);

  // Retention period
  if (data.retentionPeriodStart || data.retentionPeriodEnd) {
    props.push(['healthdcatap:retentionPeriod', '_:retention']);
    const retPairs = [];
    if (data.retentionPeriodStart) retPairs.push(['dcat:startDate', xsdDate(data.retentionPeriodStart)]);
    if (data.retentionPeriodEnd)   retPairs.push(['dcat:endDate',   xsdDate(data.retentionPeriodEnd)]);
    bNodes.push(renderBlock('_:retention', 'dct:PeriodOfTime', retPairs));
  }

  // Health categories
  const catUri = multiUri(data.healthCategories);
  if (catUri) props.push(['healthdcatap:healthCategory', catUri]);

  // Health themes
  const healthThemeUri = multiUri(data.healthThemes);
  if (healthThemeUri) props.push(['healthdcatap:healthTheme', healthThemeUri]);

  // Health Data Access Body
  if (data.hdabName) {
    props.push(['healthdcatap:healthDataAccessBody', '_:hdab']);
    const hdabContactPairs = [];
    if (data.hdabEmail) hdabContactPairs.push(['m8g:email', lit(data.hdabEmail)]);
    if (data.hdabURL)   hdabContactPairs.push(['m8g:contactPage', uriRef(data.hdabURL)]);

    const hdabPairs = [['foaf:name', lit(data.hdabName, data.hdabNameLang || 'en')]];
    if (hdabContactPairs.length > 0) {
      hdabPairs.push(['m8g:contactPoint', '_:hdabContact']);
      bNodes.push(renderBlock('_:hdabContact', 'm8g:ContactPoint', hdabContactPairs));
    }
    bNodes.push(renderBlock('_:hdab', 'foaf:Agent', hdabPairs));
  }

  // Population stats
  const recCount = xsdInt(data.numberOfRecords);
  if (recCount) props.push(['healthdcatap:numberOfRecords', recCount]);

  const indCount = xsdInt(data.numberOfUniqueIndividuals);
  if (indCount) props.push(['healthdcatap:numberOfUniqueIndividuals', indCount]);

  const minAge = xsdInt(data.minTypicalAge);
  if (minAge) props.push(['healthdcatap:minTypicalAge', minAge]);

  const maxAge = xsdInt(data.maxTypicalAge);
  if (maxAge) props.push(['healthdcatap:maxTypicalAge', maxAge]);

  const popCov = multiLit(data.populationCoverage);
  if (popCov) props.push(['healthdcatap:populationCoverage', popCov]);

  // Publisher
  if (data.publisherName) {
    props.push(['dct:publisher', '_:publisher']);
    const pubPairs = [['foaf:name', lit(data.publisherName, data.publisherNameLang || 'en')]];
    if (data.publisherType) pubPairs.push(['dct:type', uriRef(data.publisherType)]);
    if (data.publisherEmail || data.publisherURL) {
      pubPairs.push(['m8g:contactPoint', '_:publisherContact']);
      const pubContactPairs = [];
      if (data.publisherEmail) pubContactPairs.push(['m8g:email',       lit(data.publisherEmail)]);
      if (data.publisherURL)   pubContactPairs.push(['m8g:contactPage', uriRef(data.publisherURL)]);
      bNodes.push(renderBlock('_:publisherContact', 'm8g:ContactPoint', pubContactPairs));
    }
    bNodes.push(renderBlock('_:publisher', 'foaf:Agent', pubPairs));
  }

  // Contact point
  if (data.contactEmail || data.contactURL) {
    props.push(['dcat:contactPoint', '_:contactPoint']);
    const cpPairs = [];
    if (data.contactEmail) cpPairs.push(['vcard:hasEmail', lit(data.contactEmail)]);
    if (data.contactURL)   cpPairs.push(['vcard:hasURL',   uriRef(data.contactURL)]);
    bNodes.push(renderBlock('_:contactPoint', 'vcard:Kind', cpPairs));
  }

  // Keywords
  const kwLit = multiLit(data.keywords);
  if (kwLit) props.push(['dcat:keyword', kwLit]);

  // Data themes
  const themeUri = multiUri(data.themes);
  if (themeUri) props.push(['dcat:theme', themeUri]);

  // Languages
  const langUri = multiUri(data.languages);
  if (langUri) props.push(['dct:language', langUri]);

  // Spatial coverage
  const spatialUri = multiUri(data.spatialCoverage);
  if (spatialUri) props.push(['dct:spatial', spatialUri]);

  // Temporal coverage
  if (data.temporalStart || data.temporalEnd) {
    props.push(['dct:temporal', '_:temporal']);
    const tempPairs = [];
    if (data.temporalStart) tempPairs.push(['dcat:startDate', xsdDate(data.temporalStart)]);
    if (data.temporalEnd)   tempPairs.push(['dcat:endDate',   xsdDate(data.temporalEnd)]);
    bNodes.push(renderBlock('_:temporal', 'dct:PeriodOfTime', tempPairs));
  }

  // Accrual periodicity
  if (data.accrualPeriodicity) props.push(['dct:accrualPeriodicity', uriRef(data.accrualPeriodicity)]);

  // Issued / modified
  if (data.issued)   props.push(['dct:issued',   xsdDate(data.issued)]);
  if (data.modified) props.push(['dct:modified',  xsdDate(data.modified)]);

  // Landing page
  if (data.landingPage) props.push(['dcat:landingPage', uriRef(data.landingPage)]);

  // Distributions
  const validDists = (data.distributions || []).filter(d => d.accessURL);
  if (validDists.length > 0) {
    const distRefs = validDists.map((_, i) => `_:dist${i + 1}`).join(', ');
    props.push(['dcat:distribution', distRefs]);

    validDists.forEach((dist, i) => {
      const distPairs = [['dcat:accessURL', uriRef(dist.accessURL)]];
      if (dist.downloadURL) distPairs.push(['dcat:downloadURL', uriRef(dist.downloadURL)]);
      if (dist.format)      distPairs.push(['dct:format',      uriRef(dist.format)]);
      if (dist.license)     distPairs.push(['dct:license',     uriRef(dist.license)]);
      if (dist.title)       distPairs.push(['dct:title',       lit(dist.title, dist.titleLang || 'en')]);
      bNodes.push(renderBlock(`_:dist${i + 1}`, 'dcat:Distribution', distPairs));
    });
  }

  // --- Render Dataset block ---
  const datasetItems = [['a', 'dcat:Dataset'], ...props];
  lines.push(`<${datasetURI}>`);
  datasetItems.forEach(([pred, obj], i) => {
    const punct = (i === datasetItems.length - 1) ? ' .' : ' ;';
    lines.push(`    ${pred} ${obj}${punct}`);
  });

  lines.push('');

  // Blank node blocks
  bNodes.forEach(block => {
    if (block) {
      lines.push(block);
      lines.push('');
    }
  });

  return lines.join('\n');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60) || 'dataset';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Opens a new tab showing the raw TTL (simulates hosted URL)
function publishToNewTab(ttlContent, datasetTitle) {
  const safeTitle = escapeHtml(datasetTitle || 'Dataset');
  const fileName = slugify(datasetTitle || 'dataset') + '.ttl';
  const escapedTTL = escapeHtml(ttlContent);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — Raw Turtle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; background: #1e1e2e; color: #cdd6f4; min-height: 100vh; }
    .topbar { background: #181825; border-bottom: 1px solid #313244; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; }
    .topbar-left { display: flex; flex-direction: column; gap: 2px; }
    .topbar-title { color: #cba6f7; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
    .topbar-meta { color: #6c7086; font-size: 11px; }
    .topbar-actions { display: flex; gap: 8px; }
    button { padding: 6px 14px; border: 1px solid #45475a; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
    .btn-copy { background: #313244; color: #cdd6f4; }
    .btn-copy:hover { background: #45475a; }
    .btn-copy.copied { background: #a6e3a1; color: #1e1e2e; border-color: #a6e3a1; }
    .btn-download { background: #89b4fa; color: #1e1e2e; border-color: #89b4fa; }
    .btn-download:hover { background: #b4d0fb; }
    .content-type-bar { background: #181825; padding: 6px 20px; font-size: 11px; color: #6c7086; border-bottom: 1px solid #313244; }
    .content-type-bar span { color: #a6e3a1; }
    .ttl-content { padding: 24px 20px; font-size: 13px; line-height: 1.7; white-space: pre; overflow-x: auto; }
    .line-comment { color: #6c7086; }
    .line-prefix { color: #89dceb; }
    .line-uri { color: #89b4fa; }
    .line-literal { color: #a6e3a1; }
    footer { padding: 16px 20px; color: #6c7086; font-size: 11px; border-top: 1px solid #313244; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-title">${safeTitle}</div>
      <div class="topbar-meta">HealthDCAT-AP v6 · RDF Turtle · Generated ${new Date().toISOString().split('T')[0]}</div>
    </div>
    <div class="topbar-actions">
      <button class="btn-copy" id="copyBtn" onclick="copyTTL()">Copy TTL</button>
      <button class="btn-download" onclick="downloadTTL()">Download .ttl</button>
    </div>
  </div>
  <div class="content-type-bar">Content-Type: <span>text/turtle; charset=utf-8</span></div>
  <pre class="ttl-content" id="ttlContent">${escapedTTL}</pre>
  <footer>Generated with HealthDCAT-AP Editor · EHDS FAIR Data Point</footer>
  <script>
    const raw = document.getElementById('ttlContent').textContent;
    function copyTTL() {
      navigator.clipboard.writeText(raw).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy TTL'; btn.classList.remove('copied'); }, 2000);
      });
    }
    function downloadTTL() {
      const blob = new Blob([raw], { type: 'text/turtle;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${fileName}';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    alert('Please allow pop-ups for this site to view the published metadata.');
  }
}
