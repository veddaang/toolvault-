/**
 * D2C Unit Economics Calculator
 * All calculations run client-side. No data is sent anywhere.
 */

function getVal(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? 0 : v;
}

function formatCurrency(num) {
  if (num === Infinity || num === -Infinity || isNaN(num)) return '--';
  const absNum = Math.abs(num);
  let formatted;
  if (absNum >= 10000000) {
    formatted = (absNum / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) {
    formatted = (absNum / 100000).toFixed(2) + ' L';
  } else {
    formatted = absNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return (num < 0 ? '-' : '') + '\u20B9' + formatted;
}

function formatPercent(num) {
  if (isNaN(num) || !isFinite(num)) return '--';
  return num.toFixed(1) + '%';
}

function formatUnits(num) {
  if (num === Infinity || num === -Infinity || isNaN(num)) return '--';
  if (num < 0) return 'N/A (negative margin)';
  return Math.ceil(num).toLocaleString('en-IN');
}

function calculate() {
  // Gather inputs
  const sellingPrice = getVal('selling-price');
  const cogs = getVal('cogs');
  const shippingCost = getVal('shipping-cost');
  const packagingCost = getVal('packaging-cost');
  const marketplaceCommPct = getVal('marketplace-commission') / 100;
  const paymentGatewayPct = getVal('payment-gateway') / 100;
  const returnRatePct = getVal('return-rate') / 100;
  const marketingSpend = getVal('marketing-spend');
  const fixedCosts = getVal('fixed-costs');
  const unitsSold = getVal('units-sold');

  // Validation
  if (sellingPrice <= 0) {
    alert('Please enter a selling price greater than zero.');
    return;
  }

  // Calculate per-unit values
  const marketplaceCommission = sellingPrice * marketplaceCommPct;
  const paymentGatewayFee = sellingPrice * paymentGatewayPct;
  const returnCost = (cogs + shippingCost) * returnRatePct;

  const grossMargin = sellingPrice - cogs;
  const grossMarginPct = (grossMargin / sellingPrice) * 100;

  const totalVariableCosts = cogs + shippingCost + packagingCost + marketplaceCommission + paymentGatewayFee + marketingSpend + returnCost;
  const contributionMargin = sellingPrice - totalVariableCosts;
  const contributionMarginPct = (contributionMargin / sellingPrice) * 100;

  const fixedCostPerUnit = unitsSold > 0 ? fixedCosts / unitsSold : 0;
  const netProfitPerUnit = contributionMargin - fixedCostPerUnit;
  const netMarginPct = (netProfitPerUnit / sellingPrice) * 100;

  const monthlyProfit = unitsSold > 0 ? (contributionMargin * unitsSold) - fixedCosts : 0;

  const breakeven = contributionMargin > 0 ? fixedCosts / contributionMargin : Infinity;

  const cac = marketingSpend; // CAC = marketing spend per unit (simplified)
  const avgOrdersPerCustomer = 3; // Estimate
  const ltv = contributionMargin * avgOrdersPerCustomer;
  const ltvCacRatio = cac > 0 ? ltv / cac : Infinity;

  // Display results
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'block';

  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';

  const metrics = [
    { label: 'Gross Margin / Unit', value: formatCurrency(grossMargin), sub: formatPercent(grossMarginPct), positive: grossMargin >= 0 },
    { label: 'Contribution Margin / Unit', value: formatCurrency(contributionMargin), sub: formatPercent(contributionMarginPct), positive: contributionMargin >= 0 },
    { label: 'Net Profit / Unit', value: formatCurrency(netProfitPerUnit), sub: formatPercent(netMarginPct), positive: netProfitPerUnit >= 0 },
    { label: 'Monthly Profit', value: formatCurrency(monthlyProfit), sub: unitsSold + ' units/mo', positive: monthlyProfit >= 0 },
    { label: 'Breakeven Units', value: formatUnits(breakeven), sub: 'units/month', positive: breakeven !== Infinity && breakeven >= 0 },
    { label: 'CAC', value: formatCurrency(cac), sub: 'per customer', positive: true },
    { label: 'LTV Estimate', value: formatCurrency(ltv), sub: '3 orders avg', positive: ltv >= 0 },
    { label: 'LTV : CAC Ratio', value: ltvCacRatio === Infinity ? 'N/A' : ltvCacRatio.toFixed(1) + 'x', sub: ltvCacRatio >= 3 ? 'Healthy' : ltvCacRatio > 0 ? 'Needs improvement' : '', positive: ltvCacRatio >= 3 },
  ];

  metrics.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'result-card ' + (m.positive ? 'positive' : 'negative');
    card.innerHTML =
      '<div class="result-label">' + m.label + '</div>' +
      '<div class="result-value">' + m.value + '</div>' +
      (m.sub ? '<div class="result-sub">' + m.sub + '</div>' : '');
    grid.appendChild(card);
  });

  // Breakdown table
  const tbody = document.getElementById('breakdown-body');
  tbody.innerHTML = '';

  const rows = [
    { item: 'Selling Price', amount: sellingPrice },
    { item: 'COGS', amount: -cogs },
    { item: 'Gross Margin', amount: grossMargin, bold: true },
    { item: 'Shipping Cost', amount: -shippingCost },
    { item: 'Packaging Cost', amount: -packagingCost },
    { item: 'Marketplace Commission (' + (marketplaceCommPct * 100).toFixed(1) + '%)', amount: -marketplaceCommission },
    { item: 'Payment Gateway Fee (' + (paymentGatewayPct * 100).toFixed(1) + '%)', amount: -paymentGatewayFee },
    { item: 'Marketing Spend', amount: -marketingSpend },
    { item: 'Return Cost (' + (returnRatePct * 100).toFixed(1) + '% rate)', amount: -returnCost },
    { item: 'Contribution Margin', amount: contributionMargin, bold: true },
    { item: 'Fixed Cost Allocation (' + formatCurrency(fixedCosts) + ' / ' + unitsSold + ' units)', amount: -fixedCostPerUnit },
    { item: 'Net Profit Per Unit', amount: netProfitPerUnit, bold: true },
  ];

  rows.forEach(function(row) {
    const tr = document.createElement('tr');
    const color = row.amount >= 0 ? 'var(--green)' : 'var(--red)';
    const weight = row.bold ? 'font-weight:700;' : '';
    tr.innerHTML =
      '<td style="' + weight + '">' + row.item + '</td>' +
      '<td style="text-align:right;color:' + color + ';' + weight + '">' + formatCurrency(row.amount) + '</td>';
    tbody.appendChild(tr);
  });

  // Scroll to results
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearForm() {
  var inputs = document.querySelectorAll('#calculator input');
  inputs.forEach(function(input) {
    input.value = '';
  });
  document.getElementById('results').style.display = 'none';
}
