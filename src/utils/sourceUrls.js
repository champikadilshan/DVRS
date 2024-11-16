// src/utils/sourceUrls.js
export const getSourceUrl = (source, finding) => {
  switch (source.id) {
    case 'official':
      return finding.uri;
    case 'stackoverflow':
      return `https://stackoverflow.com/search?q=${encodeURIComponent(
        `${finding.name} vulnerability`
      )}`;
    case 'github':
      return `https://github.com/search?q=${encodeURIComponent(
        `${finding.name} security vulnerability`
      )}&type=issues`;
    case 'cve':
      const cveMatch = finding.name.match(/CVE-\d{4}-\d+/i);
      const cveId = cveMatch ? cveMatch[0] : finding.name;
      return `https://nvd.nist.gov/vuln/search/results?form_type=Basic&results_type=overview&query=${encodeURIComponent(
        cveId
      )}`;
    default:
      return finding.uri;
  }
};
