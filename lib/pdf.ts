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
  fiatValues,
  fiatCode,
  address,
}: {
  company: Company;
  filteredTransactions: Transaction[];
  fiatValues: { [hash: string]: number };
  fiatCode: string;
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
    
    // Fetch full country name from restcountries.com
    let countryName = company.country || "";
    if (company.country) {
      try {
        const res = await fetch(`https://restcountries.com/v3.1/alpha/${company.country}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.name?.common) {
            countryName = data[0].name.common;
          }
        }
      } catch (e: unknown) {
        console.error("Error fetching country name:", e);
        // fallback to ISO code
      }
    }
    doc.text(`Country: ${countryName}`, 10, y); y += 6;
    doc.text(`Postal Code: ${company.postalCode || ""}`, 10, y); y += 6;
    doc.text(`Address: ${company.address || "N/A"}`, 10, y); y += 6;
    doc.text(`D-U-N-S ID: ${company.dunsId || ""}`, 10, y); y += 6;
    if (company.logoUrl) {
      try {
        const img = company.logoUrl;
        // Extract base64 data from data URL
        const base64Match = img.match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          const base64Data = base64Match[1];
          const buffer = Buffer.from(base64Data, 'base64');
          // Get image dimensions
          const sizeOf = (await import('image-size')).default || (await import('image-size')).imageSize;
          const dimensions = sizeOf(buffer);
          const { width, height } = dimensions;
          // Fit within 40x40 while preserving aspect ratio
          const maxDim = 40;
          if (width && height) {
            const scale = Math.min(maxDim / width, maxDim / height, 1);
            const drawWidth = width * scale;
            const drawHeight = height * scale;
            doc.addImage(img, "PNG", 150, 10, drawWidth, drawHeight);
          } else {
            // fallback to fixed size if dimensions not found
            doc.addImage(img, "PNG", 150, 10, 40, 40);
          }
        } else {
          // fallback to fixed size if not a data URL
          doc.addImage(img, "PNG", 150, 10, 40, 40);
        }
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
  y += 14;
  doc.setFontSize(9);
  const headers = ["Hash", "From", "To", "Value (ETH)", `Value (${fiatCode})`, "Timestamp"];
  const colWidths = [30, 30, 30, 20, 20, 40];
  const tableStartX = 10;
  const rowHeight = 10;
  doc.setFont("helvetica", "bold");
  let x = tableStartX;
  headers.forEach((h, i) => {
    doc.text(h, (x + 1), y);
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
      (typeof fiatValues[tx.hash] === "number" && !isNaN(fiatValues[tx.hash]))
        ? fiatValues[tx.hash].toFixed(2)
        : "",
      new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
    ];
    doc.rect(tableStartX, y - rowHeight + 2, colWidths.reduce((a, b) => a + b, 0), rowHeight);
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 30), (x + 1), (y - 3), { maxWidth: colWidths[i] - 2 });
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
