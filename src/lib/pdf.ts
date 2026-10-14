import { rand, type SavedReport } from './budget';
import { distanceKm, distanceLabel, sources } from './data';
import { comparisonRows, reportSnapshot } from './reports';
import { brand } from './brand';
import { financialYear, indicatorDisplay, snapshotNeedsRefresh } from './municipal-evidence';
import { upfrontFields } from './purchase-costs';

export async function buildReportDocument(reports: SavedReport[], comparison = false) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 25;
  const line = (text: string, size = 11, color = '#3c4239', url?: string) => {
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, 170);
    if (y + lines.length * size * 0.45 > 270) {
      doc.addPage();
      y = 25;
    }
    doc.text(lines, 20, y);
    if (url) doc.link(20, y - size * 0.35, 170, lines.length * size * 0.45 + 3, { url });
    y += lines.length * size * 0.45 + 5;
  };
  if (comparison) {
    line(brand.name, 26);
    line('YOUR HOME COMPARISON', 17);
    line(
      `Exported ${new Date().toISOString().slice(0, 10)}. Each home keeps its saved assumptions and evidence date.`,
      9,
    );
    const rows = comparisonRows(reports);
    // Vertical summaries stay readable on A4 for all three homes.
    reports.forEach((report, i) => {
      line(`${i + 1}. ${report.property.address}, ${report.property.suburb}`, 16);
      rows.forEach((row) => line(`${row[0]}: ${row[i + 1]}`, 10));
    });
    line(
      'Incomplete cash subtotals exclude unresolved quotes or tax treatment. Rate +2 pp means two percentage points higher, with other assumptions fixed. No valuation, safety ranking or lender approval is implied.',
      9,
    );
    line(
      'The following pages contain each home’s full report, sources and outstanding checks.',
      10,
    );
  }
  for (const report of reports) {
    if (comparison || y > 25) {
      doc.addPage();
      y = 25;
    }
    const { property: p, budget: b } = report;
    const snapshot = reportSnapshot(report);
    const profile = snapshot.municipality;
    const crime = snapshot.crime;
    const transferDutyEvidence = snapshot.dutyEvidence;
    const indicatorDefinitions = snapshot.indicatorDefinitions;
    line(brand.name, 26);
    line('THE REALITY CHECK', 10, '#737b65');
    y += 6;
    line(p.address, 21);
    line(`${p.suburb}, ${p.city}`);
    line(
      `Captured ${snapshot.capturedAt.slice(0, 10)} | ${p.example ? 'Illustrative property; approximate map location' : 'Address selected from OpenStreetMap; verify the map pin'}`,
      9,
    );
    line(
      'Photography and the 3D model are representative, not an image or survey of this address.',
      9,
    );
    if (!report.snapshot)
      line(
        'Older save: no historical evidence was captured. This export uses current evidence and calculations.',
        9,
      );
    line(
      `Exported ${new Date().toISOString().slice(0, 10)}. Calculation version: ${snapshot.calculationVersion}.`,
      9,
    );
    y += 4;
    line(`Estimated monthly ownership cost: ${rand(snapshot.monthlyTotal)}`, 17);
    for (const item of snapshot.lines) line(`${item.label}: ${rand(item.value)}`);
    line(
      `Assumptions: price ${rand(b.price)}, deposit ${b.deposit}%, rate ${b.rate}%, ${b.years} years. Insurance and maintenance are user assumptions. No lender quote or property valuation.`,
      9,
    );
    line(
      `Commute: ${b.destination || 'destination not specified'}, ${b.commuteKm} km one way, ${b.workdays} days/month, R${b.costPerKm.toFixed(2)}/km. Distance and costs are assumptions; no traffic-time estimate.`,
      9,
    );
    line('Interest-rate scenarios', 17);
    for (const scenario of snapshot.scenarios) {
      line(
        `${scenario.rate}% annual rate: bond ${rand(scenario.bond)}, monthly ownership ${rand(scenario.total)}, extra ${rand(scenario.change)} / month${scenario.incomeShare === null ? '; income not entered' : `; ${scenario.incomeShare.toFixed(1)}% of entered take-home income`}.`,
        10,
      );
    }
    line(
      `At your entered rate for the full ${b.years}-year term: amount financed ${rand(snapshot.loan.principal)}, total repayments ${rand(snapshot.loan.totalRepaid)}, interest ${rand(snapshot.loan.interest)}.`,
      10,
    );
    line(
      'Scenarios hold all other costs constant. No rate forecast, fees, extra repayments or affordability recommendation.',
      9,
    );
    const { acquisitionDate, duty } = snapshot.purchase;
    line('Upfront cash planning', 17);
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
    upfrontFields.forEach(({ key, label }) =>
      line(`${label}: ${b[key] === undefined ? 'Quote needed' : rand(b[key])}`, 10),
    );
    line(
      `${snapshot.purchase.complete ? 'Estimated upfront cash' : 'Known upfront subtotal (incomplete)'}: ${rand(snapshot.purchase.knownSubtotal)}.`,
      12,
    );
    if (!snapshot.purchase.complete)
      line(
        `Still needed: ${[...(duty === null ? ['confirmed transfer duty / tax treatment'] : []), ...snapshot.purchase.missingQuotes].join(', ')}. Unknown amounts are excluded; entered quotes should include VAT where charged.`,
        9,
      );
    line(transferDutyEvidence.source, 8, '#3c4239', transferDutyEvidence.source);
    y += 3;
    line('Nearby places', 17);
    for (const place of p.amenities) {
      line(
        `${place.name}: ${distanceLabel(distanceKm(p.lat, p.lng, place.lat, place.lng))} straight-line, approximate`,
        10,
      );
      line(place.source, 8, '#3c4239', place.source);
      line(
        `Retrieval date: ${place.retrievedAt ?? 'not recorded'}.${place.category === 'school' ? ' Confirm admissions and catchment with the school.' : ''}`,
        9,
      );
    }
    if (!p.amenities.length)
      line(
        'No verified nearby-place snapshot is available for this address. Explore the map and verify locally.',
        10,
      );
    line('Municipal evidence', 17);
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
        if (audit.reportUrl) line(audit.reportUrl, 8, '#3c4239', audit.reportUrl);
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
        `National Treasury publisher update: ${profile.evidence.publisherUpdate}; exact publication date not supplied. Retrieved ${snapshot.municipalRetrievedAt}. ${snapshot.municipalVerification}`,
        9,
      );
      if (snapshotNeedsRefresh(snapshot.municipalRetrievedAt, Date.parse(snapshot.capturedAt)))
        line('Snapshot retrieved more than 90 days ago. Check the source for updates.', 9);
    }
    const municipalSource = profile?.source || 'https://municipalmoney.gov.za/';
    line(municipalSource, 8, '#3c4239', municipalSource);
    line('Crime context', 17);
    line(
      `${p.station || 'Police precinct requires verification'}. Station statistics cover a precinct and do not measure the safety of an individual street. No address-level crime score is assigned.`,
      10,
    );
    if (crime) {
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
      line(crime.source, 8, '#3c4239', crime.source);
    } else {
      line(
        p.stationNote ||
          'A verified station time series is unavailable here. Check SAPS releases, confirm the precinct and compare like-for-like periods and categories.',
        10,
      );
    }
    line(sources.police, 8, '#3c4239', sources.police);
    line('Before you sign', 17);
    snapshot.checklist.forEach((item, i) =>
      line(
        `${report.checked.includes(i) ? '[Done]' : '[To do]'} ${item.title}. ${item.detail}`,
        10,
      ),
    );
    line(
      'Coverage: no licensed valuation, deeds transactions, legal title verification, building survey or address-level safety prediction. Transfer and bond registration costs are excluded from this monthly budget. Verify the latest bills, tariffs and reports before making a purchase decision.',
      9,
    );
  }
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
  return doc;
}

export async function downloadReport(report: SavedReport) {
  const doc = await buildReportDocument([report]);
  doc.save(`homebuyer-${report.property.id}-reality-check.pdf`);
}

export async function downloadComparison(reports: SavedReport[]) {
  if (reports.length < 2 || reports.length > 3) throw new RangeError('Choose two or three homes');
  const doc = await buildReportDocument(reports, true);
  doc.save('homebuyer-property-comparison.pdf');
}
