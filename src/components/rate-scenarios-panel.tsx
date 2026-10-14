import { loanSummary, rand, rateScenarios, type Budget } from '@/lib/budget';

export function RateScenariosPanel({ budget }: { budget: Budget }) {
  const loan = loanSummary(budget);
  return (
    <section className="panel rate-scenarios-panel">
      <div className="panel-heading">
        <div>
          <span className="micro-label">ROOM FOR A RATE CHANGE</span>
          <h2>What if interest rates rise?</h2>
        </div>
      </div>
      <div className="comparison-scroll">
        <table className="scenario-table">
          <caption>Monthly costs with your other assumptions held constant</caption>
          <thead>
            <tr>
              <th scope="col">Annual rate</th>
              <th scope="col">Bond</th>
              <th scope="col">Ownership total</th>
              <th scope="col">Extra / month</th>
              <th scope="col">Income share</th>
            </tr>
          </thead>
          <tbody>
            {rateScenarios(budget).map((s) => (
              <tr key={s.increase}>
                <th scope="row">
                  {s.rate}%{' '}
                  <small>
                    {s.increase
                      ? `+${s.increase} percentage ${s.increase === 1 ? 'point' : 'points'}`
                      : 'Your current assumption'}
                  </small>
                </th>
                <td>{rand(s.bond)}</td>
                <td>{rand(s.total)}</td>
                <td>{s.increase ? rand(s.change) : '—'}</td>
                <td>
                  {s.incomeShare === null ? 'Income not entered' : `${s.incomeShare.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="loan-summary">
        <div>
          <span>Amount financed</span>
          <strong>{rand(loan.principal)}</strong>
        </div>
        <div>
          <span>Interest over {budget.years} years</span>
          <strong>{rand(loan.interest)}</strong>
        </div>
        <div>
          <span>Total bond repayments</span>
          <strong>{rand(loan.totalRepaid)}</strong>
        </div>
      </div>
      <p className="panel-note">
        Scenarios, not rate forecasts or lender approval. Each assumes that rate for the entire bond
        term, without fees or extra repayments. Other bills may also change. Income share is a
        calculation, not an affordability recommendation.
      </p>
    </section>
  );
}
