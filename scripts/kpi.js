// KPI awards: national or international awards from outside UF, for faculty.
// These count toward the department's rankings. UF-internal awards and
// student awards never count, even when they are national.
//
// The scripts use this rule to *suggest* the `kpi` flag for new submissions;
// the committee confirms or changes it when reviewing the pull request.
export function suggestKpi({ level = '', awardFor = '' } = {}) {
  const nationalOrInternational = /\b(national|international)\b/i.test(level);
  const internalToUF = /internal/i.test(level);
  const forFaculty = /\bfaculty\b/i.test(awardFor);
  return nationalOrInternational && !internalToUF && forFaculty;
}
