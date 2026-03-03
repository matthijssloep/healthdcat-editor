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

// ─── Turtle helpers ───────────────────────────────────────────────────────────

function esc(str) {
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
  const n = parseInt(value, 10);
  if (isNaN(n)) return null;
  return `"${n}"^^xsd:nonNegativeInteger`;
}

function xsdDecimal(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return `"${n}"^^xsd:decimal`;
}

function xsdDate(value) {
  if (!value) return null;
  return `"${value}"^^xsd:date`;
}

function xsdBool(value) {
  if (value === '' || value === null || value === undefined) return null;
  return (value === true || value === 'true') ? 'true' : 'false';
}

function buildISO8601Duration(tr) {
  if (!tr) return null;
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
  return d === 'P' ? null : `"${d}"^^xsd:duration`;
}

// Render a blank-node block with proper Turtle punctuation
function renderBlock(subject, type, pairs) {
  const validPairs = pairs.filter(([, obj]) => obj !== null && obj !== undefined && obj !== '');
  if (validPairs.length === 0 && !type) return '';

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

function multiLit(entries) {
  if (!entries || entries.length === 0) return null;
  const parts = entries.filter(e => e.value).map(e => lit(e.value, e.lang));
  return parts.length > 0 ? parts.join(', ') : null;
}

function multiUri(uris) {
  if (!uris || uris.length === 0) return null;
  const parts = uris.filter(u => u).map(u => uriRef(u));
  return parts.length > 0 ? parts.join(', ') : null;
}

// ─── Main generator ───────────────────────────────────────────────────────────

function generateTTL(data) {
  const lines = [];
  const bNodes = [];

  PREFIXES.forEach(([prefix, uri]) => lines.push(`@prefix ${prefix}: <${uri}> .`));
  lines.push('');

  const datasetURI = (data.datasetURI || '').trim()
    || `https://example.org/dataset/${slugify(data.titles?.[0]?.value || 'untitled')}`;

  const props = [];

  // ── Identity ──
  const titleLit = multiLit(data.titles);
  if (titleLit) props.push(['dct:title', titleLit]);

  if (data.alternativeTitle) props.push(['healthdcatap:alternative', lit(data.alternativeTitle, data.alternativeTitleLang || 'en')]);

  const descLit = multiLit(data.descriptions);
  if (descLit) props.push(['dct:description', descLit]);

  props.push(['dct:identifier', lit(data.identifier || datasetURI)]);

  if (data.version) props.push(['dct:version', lit(data.version)]);

  // ── Access & Legal ──
  if (data.accessRights) props.push(['dct:accessRights', uriRef(data.accessRights)]);

  const legUri = multiUri(data.legislation);
  if (legUri) props.push(['dcatap:applicableLegislation', legUri]);

  const personal = xsdBool(data.personalData);
  if (personal !== null) props.push(['healthdcatap:personalData', personal]);

  const legalUri = multiUri(data.legalBases);
  if (legalUri) props.push(['dpv:hasLegalBasis', legalUri]);

  if (data.retentionPeriodStart || data.retentionPeriodEnd) {
    props.push(['healthdcatap:retentionPeriod', '_:retention']);
    const retPairs = [];
    if (data.retentionPeriodStart) retPairs.push(['dcat:startDate', xsdDate(data.retentionPeriodStart)]);
    if (data.retentionPeriodEnd)   retPairs.push(['dcat:endDate',   xsdDate(data.retentionPeriodEnd)]);
    if (data.retentionNote)        retPairs.push(['rdfs:comment',   lit(data.retentionNote, data.retentionNoteLang || 'en')]);
    bNodes.push(renderBlock('_:retention', 'dct:PeriodOfTime', retPairs));
  }

  // ── Health Classification ──
  const catUri = multiUri(data.healthCategories);
  if (catUri) props.push(['healthdcatap:healthCategory', catUri]);

  const healthThemeUri = multiUri(data.healthThemes);
  if (healthThemeUri) props.push(['healthdcatap:healthTheme', healthThemeUri]);

  if (data.hdabName) {
    props.push(['healthdcatap:healthDataAccessBody', '_:hdab']);
    const hdabPairs = [['foaf:name', lit(data.hdabName, data.hdabNameLang || 'en')]];
    if (data.hdabEmail || data.hdabURL) {
      hdabPairs.push(['m8g:contactPoint', '_:hdabContact']);
      const hdabCPairs = [];
      if (data.hdabEmail) hdabCPairs.push(['m8g:email',       lit(data.hdabEmail)]);
      if (data.hdabURL)   hdabCPairs.push(['m8g:contactPage', uriRef(data.hdabURL)]);
      bNodes.push(renderBlock('_:hdabContact', 'm8g:ContactPoint', hdabCPairs));
    }
    bNodes.push(renderBlock('_:hdab', 'foaf:Agent', hdabPairs));
  }

  // Code values and coding system
  if (data.codeValues && data.codeValues.some(cv => cv.value)) {
    const cvLits = data.codeValues.filter(cv => cv.value).map(cv => lit(cv.value, cv.lang || 'en')).join(', ');
    props.push(['healthdcatap:codeValues', cvLits]);
  }
  if (data.codingSystem) props.push(['healthdcatap:codingSystem', uriRef(data.codingSystem)]);

  // ── Population ──
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

  // ── Publisher ──
  if (data.publisherName) {
    props.push(['dct:publisher', '_:publisher']);
    const pubPairs = [['foaf:name', lit(data.publisherName, data.publisherNameLang || 'en')]];
    if (data.publisherType) pubPairs.push(['dct:type', uriRef(data.publisherType)]);
    if (data.publisherEmail || data.publisherURL) {
      pubPairs.push(['m8g:contactPoint', '_:publisherContact']);
      const pubCPairs = [];
      if (data.publisherEmail) pubCPairs.push(['m8g:email',       lit(data.publisherEmail)]);
      if (data.publisherURL)   pubCPairs.push(['m8g:contactPage', uriRef(data.publisherURL)]);
      bNodes.push(renderBlock('_:publisherContact', 'm8g:ContactPoint', pubCPairs));
    }
    bNodes.push(renderBlock('_:publisher', 'foaf:Agent', pubPairs));
  }

  // ── Creators ──
  const validCreators = (data.creators || []).filter(c => c.name);
  if (validCreators.length > 0) {
    const creatorRefs = validCreators.map((_, i) => `_:creator${i + 1}`).join(', ');
    props.push(['dct:creator', creatorRefs]);
    validCreators.forEach((c, i) => {
      const cPairs = [['foaf:name', lit(c.name, c.nameLang || 'en')]];
      if (c.email || c.url) {
        cPairs.push(['m8g:contactPoint', `_:creatorContact${i + 1}`]);
        const ccPairs = [];
        if (c.email) ccPairs.push(['m8g:email',       lit(c.email)]);
        if (c.url)   ccPairs.push(['m8g:contactPage', uriRef(c.url)]);
        bNodes.push(renderBlock(`_:creatorContact${i + 1}`, 'm8g:ContactPoint', ccPairs));
      }
      bNodes.push(renderBlock(`_:creator${i + 1}`, 'foaf:Agent', cPairs));
    });
  }

  // ── Contact point ──
  if (data.contactEmail || data.contactURL) {
    props.push(['dcat:contactPoint', '_:contactPoint']);
    const cpPairs = [];
    if (data.contactEmail)   cpPairs.push(['vcard:hasEmail', lit(data.contactEmail)]);
    if (data.contactURL)     cpPairs.push(['vcard:hasURL',   uriRef(data.contactURL)]);
    if (data.contactOrgName) cpPairs.push(['vcard:organization-name', lit(data.contactOrgName)]);
    if (data.contactOrgUnit) cpPairs.push(['vcard:organization-unit', lit(data.contactOrgUnit)]);
    bNodes.push(renderBlock('_:contactPoint', 'vcard:Kind', cpPairs));
  }

  // ── Discoverability ──
  const kwLit = multiLit(data.keywords);
  if (kwLit) props.push(['dcat:keyword', kwLit]);

  const themeUri = multiUri(data.themes);
  if (themeUri) props.push(['dcat:theme', themeUri]);

  const langUri = multiUri(data.languages);
  if (langUri) props.push(['dct:language', langUri]);

  const spatialUri = multiUri(data.spatialCoverage);
  if (spatialUri) props.push(['dct:spatial', spatialUri]);

  const spatialRes = xsdDecimal(data.spatialResolutionInMeters);
  if (spatialRes) props.push(['dcat:spatialResolutionInMeters', spatialRes]);

  if (data.temporalStart || data.temporalEnd) {
    props.push(['dct:temporal', '_:temporal']);
    const tempPairs = [];
    if (data.temporalStart) tempPairs.push(['dcat:startDate', xsdDate(data.temporalStart)]);
    if (data.temporalEnd)   tempPairs.push(['dcat:endDate',   xsdDate(data.temporalEnd)]);
    bNodes.push(renderBlock('_:temporal', 'dct:PeriodOfTime', tempPairs));
  }

  const tempRes = buildISO8601Duration(data.temporalResolution);
  if (tempRes) props.push(['dcat:temporalResolution', tempRes]);

  if (data.accrualPeriodicity) props.push(['dct:accrualPeriodicity', uriRef(data.accrualPeriodicity)]);
  if (data.issued)   props.push(['dct:issued',   xsdDate(data.issued)]);
  if (data.modified) props.push(['dct:modified',  xsdDate(data.modified)]);
  if (data.landingPage) props.push(['dcat:landingPage', uriRef(data.landingPage)]);

  const purposeLit = multiLit(data.purpose);
  if (purposeLit) props.push(['dpv:hasPurpose', purposeLit]);

  const provLit = multiLit(data.provenance);
  if (provLit) props.push(['dct:provenance', provLit]);

  // ── Documentation pages (foaf:page) ──
  const validPages = (data.documentationPages || []).filter(p => p.uri);
  if (validPages.length > 0) {
    const pageRefs = validPages.map((_, i) => `_:page${i + 1}`).join(', ');
    props.push(['foaf:page', pageRefs]);
    validPages.forEach((p, i) => {
      const pPairs = [['dcat:accessURL', uriRef(p.uri)]];
      if (p.label) pPairs.push(['dct:title',       lit(p.label, p.labelLang || 'en')]);
      if (p.note)  pPairs.push(['dct:description', lit(p.note,  p.noteLang  || 'en')]);
      bNodes.push(renderBlock(`_:page${i + 1}`, 'foaf:Document', pPairs));
    });
  }

  // ── Qualified relations ──
  const validQRels = (data.qualifiedRelations || []).filter(r => r.uri);
  if (validQRels.length > 0) {
    const qrelRefs = validQRels.map((_, i) => `_:qrel${i + 1}`).join(', ');
    props.push(['dcat:qualifiedRelation', qrelRefs]);
    validQRels.forEach((r, i) => {
      const rPairs = [['dct:relation', uriRef(r.uri)]];
      if (r.role) rPairs.push(['dcat:hadRole', uriRef(r.role)]);
      bNodes.push(renderBlock(`_:qrel${i + 1}`, 'dcat:Relationship', rPairs));
    });
  }

  // ── Qualified attributions ──
  const validAttrs = (data.qualifiedAttributions || []).filter(a => a.name);
  if (validAttrs.length > 0) {
    const attrRefs = validAttrs.map((_, i) => `_:attr${i + 1}`).join(', ');
    props.push(['prov:qualifiedAttribution', attrRefs]);
    validAttrs.forEach((a, i) => {
      const agentPairs = [['foaf:name', lit(a.name, a.nameLang || 'en')]];
      if (a.email) agentPairs.push(['foaf:mbox', lit(`mailto:${a.email}`)]);
      if (a.uri)   agentPairs.push(['foaf:homepage', uriRef(a.uri)]);
      bNodes.push(renderBlock(`_:attrAgent${i + 1}`, 'foaf:Agent', agentPairs));

      const attrPairs = [['prov:agent', `_:attrAgent${i + 1}`]];
      if (a.role) attrPairs.push(['dcat:hadRole', uriRef(a.role)]);
      bNodes.push(renderBlock(`_:attr${i + 1}`, 'prov:Attribution', attrPairs));
    });
  }

  // ── Was generated by ──
  const validActivities = (data.wasGeneratedBy || []).filter(a => a.name);
  if (validActivities.length > 0) {
    const actRefs = validActivities.map((_, i) => `_:activity${i + 1}`).join(', ');
    props.push(['prov:wasGeneratedBy', actRefs]);
    validActivities.forEach((a, i) => {
      const actPairs = [['dct:title', lit(a.name, a.nameLang || 'en')]];
      if (a.description) actPairs.push(['dct:description', lit(a.description, a.descriptionLang || 'en')]);
      bNodes.push(renderBlock(`_:activity${i + 1}`, 'prov:Activity', actPairs));
    });
  }

  // ── Distributions ──
  const validDists = (data.distributions || []).filter(d => d.accessURL);
  if (validDists.length > 0) {
    const distRefs = validDists.map((_, i) => `_:dist${i + 1}`).join(', ');
    props.push(['dcat:distribution', distRefs]);

    validDists.forEach((dist, i) => {
      const dPairs = [['dcat:accessURL', uriRef(dist.accessURL)]];
      if (dist.downloadURL)    dPairs.push(['dcat:downloadURL',  uriRef(dist.downloadURL)]);
      if (dist.format)         dPairs.push(['dct:format',        uriRef(dist.format)]);
      if (dist.mediaType)      dPairs.push(['dcat:mediaType',    uriRef(dist.mediaType)]);
      if (dist.license)        dPairs.push(['dct:license',       uriRef(dist.license)]);
      if (dist.status)         dPairs.push(['adms:status',       uriRef(dist.status)]);
      if (dist.compressFormat) dPairs.push(['dcat:compressFormat', uriRef(dist.compressFormat)]);
      if (dist.byteSize)       dPairs.push(['dcat:byteSize',     xsdInt(dist.byteSize)]);
      if (dist.rights)         dPairs.push(['dct:rights',        lit(dist.rights)]);
      if (dist.title)          dPairs.push(['dct:title',         lit(dist.title, dist.titleLang || 'en')]);
      bNodes.push(renderBlock(`_:dist${i + 1}`, 'dcat:Distribution', dPairs));
    });
  }

  // ── Render Dataset block ──
  const datasetItems = [['a', 'dcat:Dataset'], ...props];
  lines.push(`<${datasetURI}>`);
  datasetItems.forEach(([pred, obj], i) => {
    const punct = (i === datasetItems.length - 1) ? ' .' : ' ;';
    lines.push(`    ${pred} ${obj}${punct}`);
  });

  lines.push('');
  bNodes.forEach(block => { if (block) { lines.push(block); lines.push(''); } });

  return lines.join('\n');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').substring(0, 60) || 'dataset';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Opens a new tab showing the raw TTL (simulates hosted URL)
function publishToNewTab(ttlContent, datasetTitle) {
  const safeTitle = escapeHtml(datasetTitle || 'Dataset');
  const fileName  = slugify(datasetTitle || 'dataset') + '.ttl';
  const escapedTTL = escapeHtml(ttlContent);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — Raw Turtle</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Consolas','Monaco','Courier New',monospace;background:#1e1e2e;color:#cdd6f4;min-height:100vh}
    .topbar{background:#181825;border-bottom:1px solid #313244;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}
    .topbar-left{display:flex;flex-direction:column;gap:2px}
    .topbar-title{color:#cba6f7;font-size:13px;font-weight:600}
    .topbar-meta{color:#6c7086;font-size:11px}
    .topbar-actions{display:flex;gap:8px}
    button{padding:6px 14px;border:1px solid #45475a;border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;transition:all .15s}
    .btn-copy{background:#313244;color:#cdd6f4}.btn-copy:hover{background:#45475a}
    .btn-copy.copied{background:#a6e3a1;color:#1e1e2e;border-color:#a6e3a1}
    .btn-dl{background:#89b4fa;color:#1e1e2e;border-color:#89b4fa}.btn-dl:hover{background:#b4d0fb}
    .ct-bar{background:#181825;padding:6px 20px;font-size:11px;color:#6c7086;border-bottom:1px solid #313244}
    .ct-bar span{color:#a6e3a1}
    pre{margin:0;padding:24px 20px;font-size:13px;line-height:1.7;white-space:pre;overflow-x:auto}
    footer{padding:16px 20px;color:#6c7086;font-size:11px;border-top:1px solid #313244;margin-top:24px}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-title">${safeTitle}</div>
      <div class="topbar-meta">HealthDCAT-AP v6 · RDF Turtle · ${new Date().toISOString().split('T')[0]}</div>
    </div>
    <div class="topbar-actions">
      <button class="btn-copy" id="copyBtn" onclick="copyTTL()">Copy TTL</button>
      <button class="btn-dl" onclick="downloadTTL()">Download .ttl</button>
    </div>
  </div>
  <div class="ct-bar">Content-Type: <span>text/turtle; charset=utf-8</span></div>
  <pre id="ttlContent">${escapedTTL}</pre>
  <footer>Generated with HealthDCAT-AP Editor · EHDS FAIR Data Point</footer>
  <script>
    const raw = document.getElementById('ttlContent').textContent;
    function copyTTL(){navigator.clipboard.writeText(raw).then(()=>{const b=document.getElementById('copyBtn');b.textContent='Copied!';b.classList.add('copied');setTimeout(()=>{b.textContent='Copy TTL';b.classList.remove('copied')},2000)})}
    function downloadTTL(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'text/turtle;charset=utf-8'}));a.download='${fileName}';a.click();URL.revokeObjectURL(a.href)}
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else alert('Please allow pop-ups for this site to view the published metadata.');
}
