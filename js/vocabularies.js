// vocabularies.js — Controlled vocabulary lists for Health DCAT-AP v6

const VOCAB = {

  accessRights: [
    { label: 'Non-Public — requires HDAB mediation', uri: 'http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC' },
    { label: 'Restricted — specific access conditions apply', uri: 'http://publications.europa.eu/resource/authority/access-right/RESTRICTED' },
    { label: 'Public — openly accessible', uri: 'http://publications.europa.eu/resource/authority/access-right/PUBLIC' },
  ],

  legislation: [
    { label: 'EHDS Regulation (EU) 2024/1689', uri: 'http://data.europa.eu/eli/reg/2024/1689/oj' },
    { label: 'GDPR (EU) 2016/679', uri: 'http://data.europa.eu/eli/reg/2016/679/oj' },
    { label: 'ePrivacy Directive 2002/58/EC', uri: 'http://data.europa.eu/eli/dir/2002/58/oj' },
    { label: 'NEN 7510 (NL Health Data Security)', uri: 'https://www.nen.nl/nen-7510-2017-nl-230461' },
  ],

  healthCategories: [
    { label: 'Electronic Health Records (EHR)', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/ehr' },
    { label: 'Patient Registry', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/patient-registry' },
    { label: 'Clinical Trials Data', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/clinical-trials' },
    { label: 'Genomics / Biobank Data', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/genomics' },
    { label: 'Medical Imaging', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/medical-imaging' },
    { label: 'Claims / Reimbursement Data', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/claims' },
    { label: 'Laboratory / Diagnostic Results', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/laboratory' },
    { label: 'Prescription / Medication Data', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/medication' },
    { label: 'Population Health Survey', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/population-survey' },
    { label: 'Disease Registry', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/disease-registry' },
    { label: 'Wearable / IoT Health Data', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/wearable' },
    { label: 'Social Determinants of Health', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-category/social-determinants' },
  ],

  healthThemes: [
    { label: 'Cancer / Oncology', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/cancer' },
    { label: 'Cardiovascular Disease', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/cardiovascular' },
    { label: 'Rare Diseases', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/rare-diseases' },
    { label: 'Mental Health / Psychiatry', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/mental-health' },
    { label: 'Infectious Disease', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/infectious-disease' },
    { label: 'Diabetes / Endocrinology', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/diabetes' },
    { label: 'Respiratory Disease', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/respiratory' },
    { label: 'Neurology', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/neurology' },
    { label: 'Pediatrics', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/pediatrics' },
    { label: 'Maternal and Reproductive Health', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/maternal-health' },
    { label: 'Musculoskeletal', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/musculoskeletal' },
    { label: 'COVID-19', uri: 'http://data.europa.eu/r5r/healthdcat-ap/resource/health-theme/covid-19' },
  ],

  languages: [
    { label: 'Dutch (nl)', uri: 'http://publications.europa.eu/resource/authority/language/NLD', tag: 'nl' },
    { label: 'English (en)', uri: 'http://publications.europa.eu/resource/authority/language/ENG', tag: 'en' },
    { label: 'German (de)', uri: 'http://publications.europa.eu/resource/authority/language/DEU', tag: 'de' },
    { label: 'French (fr)', uri: 'http://publications.europa.eu/resource/authority/language/FRA', tag: 'fr' },
    { label: 'Spanish (es)', uri: 'http://publications.europa.eu/resource/authority/language/SPA', tag: 'es' },
    { label: 'Italian (it)', uri: 'http://publications.europa.eu/resource/authority/language/ITA', tag: 'it' },
    { label: 'Swedish (sv)', uri: 'http://publications.europa.eu/resource/authority/language/SWE', tag: 'sv' },
    { label: 'Danish (da)', uri: 'http://publications.europa.eu/resource/authority/language/DAN', tag: 'da' },
    { label: 'Finnish (fi)', uri: 'http://publications.europa.eu/resource/authority/language/FIN', tag: 'fi' },
    { label: 'Norwegian (no)', uri: 'http://publications.europa.eu/resource/authority/language/NOR', tag: 'no' },
  ],

  langTags: [
    { label: 'English (en)', tag: 'en' },
    { label: 'Dutch (nl)', tag: 'nl' },
    { label: 'German (de)', tag: 'de' },
    { label: 'French (fr)', tag: 'fr' },
    { label: 'Spanish (es)', tag: 'es' },
    { label: 'Italian (it)', tag: 'it' },
    { label: 'Swedish (sv)', tag: 'sv' },
    { label: 'Danish (da)', tag: 'da' },
  ],

  countries: [
    { label: 'Netherlands', uri: 'http://publications.europa.eu/resource/authority/country/NLD' },
    { label: 'Belgium', uri: 'http://publications.europa.eu/resource/authority/country/BEL' },
    { label: 'Germany', uri: 'http://publications.europa.eu/resource/authority/country/DEU' },
    { label: 'France', uri: 'http://publications.europa.eu/resource/authority/country/FRA' },
    { label: 'Spain', uri: 'http://publications.europa.eu/resource/authority/country/ESP' },
    { label: 'Italy', uri: 'http://publications.europa.eu/resource/authority/country/ITA' },
    { label: 'Sweden', uri: 'http://publications.europa.eu/resource/authority/country/SWE' },
    { label: 'Denmark', uri: 'http://publications.europa.eu/resource/authority/country/DNK' },
    { label: 'Finland', uri: 'http://publications.europa.eu/resource/authority/country/FIN' },
    { label: 'Norway', uri: 'http://publications.europa.eu/resource/authority/country/NOR' },
    { label: 'European Union (multiple)', uri: 'http://publications.europa.eu/resource/authority/country/EU' },
  ],

  frequencies: [
    { label: 'Continuous', uri: 'http://publications.europa.eu/resource/authority/frequency/CONT' },
    { label: 'Daily', uri: 'http://publications.europa.eu/resource/authority/frequency/DAILY' },
    { label: 'Weekly', uri: 'http://publications.europa.eu/resource/authority/frequency/WEEKLY' },
    { label: 'Monthly', uri: 'http://publications.europa.eu/resource/authority/frequency/MONTHLY' },
    { label: 'Quarterly', uri: 'http://publications.europa.eu/resource/authority/frequency/QUARTERLY' },
    { label: 'Biannual (twice a year)', uri: 'http://publications.europa.eu/resource/authority/frequency/BIANNUAL' },
    { label: 'Annual', uri: 'http://publications.europa.eu/resource/authority/frequency/ANNUAL' },
    { label: 'Biennial (every 2 years)', uri: 'http://publications.europa.eu/resource/authority/frequency/BIENNIAL' },
    { label: 'Irregular', uri: 'http://publications.europa.eu/resource/authority/frequency/IRREG' },
    { label: 'Not planned / Static', uri: 'http://publications.europa.eu/resource/authority/frequency/NEVER' },
  ],

  fileFormats: [
    { label: 'CSV', uri: 'http://publications.europa.eu/resource/authority/file-type/CSV' },
    { label: 'JSON', uri: 'http://publications.europa.eu/resource/authority/file-type/JSON' },
    { label: 'XML', uri: 'http://publications.europa.eu/resource/authority/file-type/XML' },
    { label: 'Parquet', uri: 'http://publications.europa.eu/resource/authority/file-type/PARQUET' },
    { label: 'XLSX (Excel)', uri: 'http://publications.europa.eu/resource/authority/file-type/XLSX' },
    { label: 'PDF', uri: 'http://publications.europa.eu/resource/authority/file-type/PDF' },
    { label: 'RDF/Turtle', uri: 'http://publications.europa.eu/resource/authority/file-type/RDF_TURTLE' },
    { label: 'FHIR (JSON)', uri: 'http://publications.europa.eu/resource/authority/file-type/JSON_LD' },
    { label: 'DICOM (imaging)', uri: 'http://publications.europa.eu/resource/authority/file-type/DICOM' },
    { label: 'HL7 v2', uri: 'http://publications.europa.eu/resource/authority/file-type/HL7' },
  ],

  licenses: [
    { label: 'Creative Commons BY 4.0', uri: 'https://creativecommons.org/licenses/by/4.0/' },
    { label: 'Creative Commons BY-NC 4.0', uri: 'https://creativecommons.org/licenses/by-nc/4.0/' },
    { label: 'Creative Commons BY-SA 4.0', uri: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { label: 'Public Domain (CC0 1.0)', uri: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    { label: 'Open Data Commons Attribution', uri: 'https://opendatacommons.org/licenses/by/1-0/' },
    { label: 'Proprietary / Restricted Access', uri: 'http://publications.europa.eu/resource/authority/licence/COM_REUSE' },
  ],

  publisherTypes: [
    { label: 'National Authority', uri: 'http://publications.europa.eu/resource/authority/publisher-type/NATIONAL_AUTHORITY' },
    { label: 'Regional Authority', uri: 'http://publications.europa.eu/resource/authority/publisher-type/REGIONAL_AUTHORITY' },
    { label: 'University / Research Institution', uri: 'http://publications.europa.eu/resource/authority/publisher-type/ACADEMIA_SCH_EDU' },
    { label: 'Hospital / Healthcare Provider', uri: 'http://publications.europa.eu/resource/authority/publisher-type/PUB_HOSPITAL' },
    { label: 'Non-governmental Organisation', uri: 'http://publications.europa.eu/resource/authority/publisher-type/NGO' },
    { label: 'Private Company', uri: 'http://publications.europa.eu/resource/authority/publisher-type/PRIVATE' },
  ],

  dataThemes: [
    { label: 'Health', uri: 'http://publications.europa.eu/resource/authority/data-theme/HEAL' },
    { label: 'Science and Technology', uri: 'http://publications.europa.eu/resource/authority/data-theme/TECH' },
    { label: 'Population and Society', uri: 'http://publications.europa.eu/resource/authority/data-theme/SOCI' },
    { label: 'Education, Culture, Sport', uri: 'http://publications.europa.eu/resource/authority/data-theme/EDUC' },
  ],

  legalBases: [
    { label: 'GDPR Art. 9(2)(a) — Explicit consent', uri: 'https://w3id.org/dpv/dpv-gdpr#A9-2-a' },
    { label: 'GDPR Art. 9(2)(c) — Vital interests', uri: 'https://w3id.org/dpv/dpv-gdpr#A9-2-c' },
    { label: 'GDPR Art. 9(2)(h) — Healthcare provision', uri: 'https://w3id.org/dpv/dpv-gdpr#A9-2-h' },
    { label: 'GDPR Art. 9(2)(i) — Public interest in public health', uri: 'https://w3id.org/dpv/dpv-gdpr#A9-2-i' },
    { label: 'GDPR Art. 9(2)(j) — Scientific or historical research', uri: 'https://w3id.org/dpv/dpv-gdpr#A9-2-j' },
    { label: 'EHDS Chapter IV — Secondary use of health data', uri: 'http://data.europa.eu/eli/reg/2024/1689/oj' },
  ],
};
