const STATUS_TERMS: Array<[RegExp, string]> = [
  [/\bIN_PROGRESS\b/g, "Dikerjakan"],
  [/\bTODO\b/g, "Belum mulai"],
  [/\bREVIEW\b/g, "Menunggu tinjauan"],
  [/\bREVISION\b/g, "Perlu revisi"],
  [/\bBLOCKED\b/g, "Terhambat"],
  [/\bDONE\b/g, "Selesai"],
  [/\bBACKLOG\b/g, "Rencana"],
  [/\bCOMPLETED\b/g, "Selesai"],
  [/\bCANCELLED\b/g, "Dibatalkan"],
  [/\bFINISHING\b/g, "Penyelesaian"],
  [/\bNEW\b/g, "Baru"],
];

const COMMON_TERMS: Array<[RegExp, string]> = [
  [/\bproject manager\b/gi, "manajer proyek"],
  [/\bproject\b/gi, "proyek"],
  [/\btasks?\b/gi, "tugas"],
  [/\battachment\b/gi, "lampiran"],
  [/\breview\b/gi, "tinjauan"],
  [/\bblocked\b/gi, "terhambat"],
  [/\bdeadline\b/gi, "batas waktu"],
];

export function formatActivityMessage(message: string): string {
  let result = message;
  for (const [pattern, replacement] of STATUS_TERMS) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of COMMON_TERMS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
