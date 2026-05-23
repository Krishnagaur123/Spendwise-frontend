
import * as XLSX from "xlsx";

// expect rows: array of plain objects; filename without extension
export function exportToExcel(rows, filename = "export") {
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  // set column widths (optional, to avoid clipping "₹" etc.)
  const headers = Object.keys(rows[0] || {});
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// helper to format INR and date
export function formatInr(n) {
  return `₹${Number(n ?? 0).toLocaleString()}`;
}
export function formatIso(isoOrDate) {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString();
}
