type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
};

type Company = {
  name: string;
  taxId: string;
  city: string;
  country: string;
  postalCode: string;
  address: string;
  dunsId: string;
  logoUrl: string | null;
} | null;

export async function exportTransactionsPDF({
  company,
  filteredTransactions,
  usdValues,
  address,
}: {
  company: Company;
  filteredTransactions: Transaction[];
  usdValues: { [hash: string]: number };
  address: string | undefined;
}) {
  const jsPDF = (await import("jspdf")).default;
  const doc = new jsPDF();

  let y = 10;
  doc.setFontSize(14);
  doc.text("Company Profile", 10, y);
  y += 8;
  if (company) {
    doc.setFontSize(10);
    doc.text(`Name: ${company.name || ""}`, 10, y);
    y += 6;
    doc.text(`Tax ID: ${company.taxId || ""}`, 10, y); y += 6;
    doc.text(`City: ${company.city || ""}`, 10, y); y += 6;
    doc.text(`Country: ${company.country || ""}`, 10, y); y += 6;
    doc.text(`Postal Code: ${company.postalCode || ""}`, 10, y); y += 6;
    doc.text(`Address: ${company.address || "N/A"}`, 10, y); y += 6;
    doc.text(`D-U-N-S ID: ${company.dunsId || ""}`, 10, y); y += 6;
    if (company.logoUrl) {
      try {
        const img = company.logoUrl;
        doc.addImage(img, "PNG", 150, 10, 40, 40);
      } catch {}
    }
    y += 2;
  } else {
    doc.setFontSize(10);
    doc.text(`Name: N/A`, 10, y);
    y += 6;
    doc.text(`Address: N/A`, 10, y);
    y += 6;
    doc.text("No company data found.", 10, y); y += 6;
  }

  y += 4;
  doc.setFontSize(14);
  doc.text("Transactions", 10, y);
  y += 8;
  doc.setFontSize(9);
  const headers = ["Hash", "From", "To", "Value (ETH)", "Value (USD)", "Timestamp"];
  const colWidths = [30, 30, 30, 20, 20, 40];
  const tableStartX = 10;
  const rowHeight = 10;
  doc.setFont("helvetica", "bold");
  let x = tableStartX;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });
  doc.rect(tableStartX, y - rowHeight + 2, colWidths.reduce((a, b) => a + b, 0), rowHeight);
  doc.setFont("helvetica", "normal");
  y += rowHeight;
  filteredTransactions.forEach(tx => {
    x = tableStartX;
    const row = [
      tx.hash,
      tx.from,
      tx.to,
      (Number(tx.value) / 1e18).toString(),
      (typeof usdValues[tx.hash] === "number" && !isNaN(usdValues[tx.hash]))
        ? usdValues[tx.hash].toFixed(2)
        : "",
      new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
    ];
    doc.rect(tableStartX, y - rowHeight + 2, colWidths.reduce((a, b) => a + b, 0), rowHeight);
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 30), x, y, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });
    y += rowHeight;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`${address}transactions.pdf`);
}
