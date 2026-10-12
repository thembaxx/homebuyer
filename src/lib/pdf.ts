import { budgetLines, monthlyTotal, rand, type SavedReport } from './budget';
import { checklist, sources, distanceKm, distanceLabel } from './data';
import crime from './crime-snapshot.json';

export async function downloadReport(report: SavedReport) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const { property: p, budget: b } = report;
  let y = 25;
  const line = (text: string, size = 11, color = '#3c4239') => {
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, 170);
    if (y + lines.length * size * 0.45 > 270) {
      doc.addPage();
      y = 25;
    }
    doc.text(lines, 20, y);
    y += lines.length * size * 0.45 + 5;
  };
  line('HomeBuyer', 26);
  line('THE REALITY CHECK', 10, '#737b65');
  y += 6;
  line(p.address, 21);
  line(`${p.suburb}, ${p.city}`);
  line(
    `Prepared ${new Date().toLocaleDateString('en-ZA')} | ${p.example ? 'Illustrative property; approximate map location' : 'Address selected from OpenStreetMap; verify the map pin'}`,
    9,
  );
  line(
    'Photography and the 3D model are representative, not an image or survey of this address.',
    9,
  );
  y += 4;
  line(`Estimated monthly ownership cost: ${rand(monthlyTotal(b))}`, 17);
  for (const item of budgetLines(b)) line(`${item.label}: ${rand(item.value)}`);
  line(
    `Assumptions: price ${rand(b.price)}, deposit ${b.deposit}%, rate ${b.rate}%, ${b.years} years. Insurance and maintenance are user assumptions. No lender quote or property valuation.`,
    9,
  );
  line(
    `Commute: ${b.destination || 'destination not specified'}, ${b.commuteKm} km one way, ${b.workdays} days/month, R${b.costPerKm.toFixed(2)}/km. Distance and costs are assumptions; no traffic-time estimate.`,
    9,
  );
  y += 3;
  line('Nearby places', 17);
  for (const place of p.amenities) {
    line(
      `${place.name}: ${distanceLabel(distanceKm(p.lat, p.lng, place.lat, place.lng))} straight-line, approximate`,
      10,
    );
    doc.setFontSize(8);
    doc.textWithLink('Place source', 20, y, { url: place.source });
    y += 8;
  }
  if (!p.amenities.length)
    line(
      'No verified nearby-place snapshot is available for this address. Explore the map and verify locally.',
      10,
    );
  line('Municipal evidence', 17);
  line(
    p.city === 'Cape Town'
      ? 'City of Cape Town: clean audit for FY 2023/24, as reported by the City. This is a dated governance indicator, not a guarantee of service delivery.'
      : 'No verified municipal audit snapshot is available for this location. Check National Treasury Municipal Money.',
    10,
  );
  doc.textWithLink('National Treasury Municipal Money', 20, y, {
    url: p.city === 'Cape Town' ? sources.treasury : 'https://municipalmoney.gov.za/',
  });
  y += 10;
  if (p.city === 'Cape Town') {
    doc.textWithLink('City audit source: FY 2023/24', 20, y, { url: sources.audit });
    y += 10;
  }
  line('Crime context', 17);
  line(
    `${p.station || 'Police precinct requires verification'}. Station statistics cover a precinct and do not measure the safety of an individual street. No address-level crime score is assigned.`,
    10,
  );
  if (p.id === 'observatory') {
    line('Residential break-ins recorded at Woodstock SAPS, July-June reporting years:', 10);
    crime.periods.forEach((period, i) =>
      line(`${period}: ${crime.counts[i]} reported incidents`, 10),
    );
    line(
      `Secondary aggregation by Cape Town Data of SAPS records. Release ${crime.releaseDate}; retrieved ${crime.retrievedAt}. Primary SAPS download unavailable during verification. No street-level inference.`,
      9,
    );
    doc.textWithLink('Crime series and category definitions', 20, y, { url: crime.source });
    y += 10;
  } else {
    line(
      'A verified station time series is unavailable here. Check SAPS releases, confirm the precinct and compare like-for-like periods and categories.',
      10,
    );
  }
  doc.textWithLink('Official SAPS statistics', 20, y, { url: sources.police });
  y += 12;
  line('Before you sign', 17);
  checklist.forEach((item, i) =>
    line(`${report.checked.includes(i) ? '[Done]' : '[To do]'} ${item.title}. ${item.detail}`, 10),
  );
  line(
    'Coverage: no licensed valuation, deeds transactions, legal title verification, building survey or address-level safety prediction. Transfer and bond registration costs are excluded from this monthly budget. Verify the latest bills, tariffs and reports before making a purchase decision.',
    9,
  );
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#858a7d');
    doc.text(
      `HomeBuyer | Evidence before emotion.                                           ${i} / ${doc.getNumberOfPages()}`,
      20,
      287,
    );
  }
  doc.save(`homebuyer-${p.id}-reality-check.pdf`);
}
