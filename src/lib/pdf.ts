import { budgetLines, monthlyTotal, rand, type SavedReport } from './budget';
import { checklist, distanceKm, distanceLabel, municipalityFor, sources } from './data';
import crime from './crime-snapshot.json';
import { brand } from './brand';
import {
  financialYear,
  indicatorDefinitions,
  indicatorDisplay,
  municipalSnapshot,
  snapshotNeedsRefresh,
} from './municipal-evidence';
import { transferDuty, transferDutyEvidence } from './purchase-costs';

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
  line(brand.name, 26);
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
  const today = new Date().toISOString().slice(0, 10);
  const acquisitionDate = b.acquisitionDate ?? today;
  const duty = b.transferDutyExempt ? null : transferDuty(b.price, acquisitionDate);
  line('Once-off deposit and duty estimate', 17);
  line(
    `Deposit: ${rand((b.price * b.deposit) / 100)}. Acquisition agreement date: ${acquisitionDate || 'not supplied'}.`,
    10,
  );
  line(
    duty === null
      ? 'Transfer duty not estimated: possible VAT/exemption, unsupported acquisition date, or stale table. Confirm with your conveyancer.'
      : `Transfer duty: ${rand(duty)}. Deposit + duty subtotal: ${rand((b.price * b.deposit) / 100 + duty)}. Purchase price is assumed to be the taxable value.`,
    10,
  );
  line(
    `SARS table effective ${transferDutyEvidence.effectiveFrom}; source updated ${transferDutyEvidence.sourceUpdatedAt}; retrieved ${transferDutyEvidence.retrievedAt}. This subtotal excludes conveyancing, bond registration, VAT, moving and other fees. Confirm tax treatment and taxable value with your conveyancer.`,
    9,
  );
  line(transferDutyEvidence.source, 8);
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
  const profile = municipalityFor(p);
  line(
    profile
      ? `${profile.name}: ${profile.opinionLabel} for ${profile.year}. ${profile.summary}`
      : 'No verified municipal audit snapshot is available for this location. Check National Treasury Municipal Money.',
    10,
  );
  if (profile?.detail) line(profile.detail, 9);
  if (profile) {
    if (!p.example)
      line(
        'Municipality matched from the city label; confirm the boundary against the seller’s municipal account.',
        9,
      );
    for (const audit of profile.evidence.audits) {
      line(`FY ${financialYear(audit.year)}: ${audit.label}`, 10);
      if (audit.reportUrl) line(audit.reportUrl, 8);
    }
    line('Municipality-wide financial indicators', 14);
    for (const definition of indicatorDefinitions) {
      const indicator = profile.evidence.indicators[definition.key];
      const latest = indicator.values[0];
      line(
        `${definition.label}: ${indicatorDisplay(latest?.value ?? null, indicator.unit)}${latest ? ` (FY ${financialYear(latest.year)})` : ''}. ${definition.explanation}${latest?.note ? ` ${latest.note}` : ''}`,
        10,
      );
    }
    line(
      `National Treasury publisher update: ${profile.evidence.publisherUpdate}; exact publication date not supplied. Retrieved ${municipalSnapshot.retrievedAt}. ${municipalSnapshot.verification}`,
      9,
    );
    if (snapshotNeedsRefresh(municipalSnapshot.retrievedAt))
      line('Snapshot retrieved more than 90 days ago. Check the source for updates.', 9);
  }
  doc.textWithLink(profile?.sourceLabel || 'National Treasury Municipal Money', 20, y, {
    url: profile?.source || 'https://municipalmoney.gov.za/',
  });
  y += 10;
  doc.textWithLink('National Treasury Municipal Money', 20, y, {
    url: profile?.treasury || 'https://municipalmoney.gov.za/',
  });
  y += 10;
  line('Crime context', 17);
  line(
    `${p.station || 'Police precinct requires verification'}. Station statistics cover a precinct and do not measure the safety of an individual street. No address-level crime score is assigned.`,
    10,
  );
  if (p.id === 'observatory') {
    line('Residential break-ins recorded at Woodstock SAPS, July-June reporting years:', 10);
    crime.periods.forEach((period, i) =>
      line(`${period}: ${crime.counts[i]} reported residential break-ins`, 10),
    );
    line(`${crime.latestLabel} recorded categories at the same station:`, 10);
    crime.categories.forEach((item) =>
      line(`${item.name}: ${item.count} (prior year ${item.prior})`, 10),
    );
    line(
      `Covers ${crime.coverage}. Secondary aggregation by Cape Town Data of SAPS records. Release ${crime.releaseDate}; retrieved ${crime.retrievedAt}. Primary SAPS download unavailable during verification. No street-level inference.`,
      9,
    );
    doc.textWithLink('Crime series and category definitions', 20, y, { url: crime.source });
    y += 10;
  } else {
    line(
      p.stationNote ||
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
      `${brand.name} | ${brand.tagline}                                           ${i} / ${doc.getNumberOfPages()}`,
      20,
      287,
    );
  }
  doc.save(`homebuyer-${p.id}-reality-check.pdf`);
}
