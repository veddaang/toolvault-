/**
 * GST Calculator (India)
 * All calculations run client-side. No data is sent anywhere.
 */

var currentMode = 'add';   // 'add' or 'remove'
var currentTaxType = 'intra'; // 'intra' (CGST+SGST) or 'inter' (IGST)

function setMode(mode) {
  currentMode = mode;

  document.getElementById('mode-add').classList.toggle('active', mode === 'add');
  document.getElementById('mode-remove').classList.toggle('active', mode === 'remove');

  var label = document.getElementById('amount-label');
  label.textContent = mode === 'add' ? 'Amount (before GST)' : 'Amount (including GST)';

  calculateGST();
}

function setTaxType(type) {
  currentTaxType = type;

  document.getElementById('tax-intra').classList.toggle('active', type === 'intra');
  document.getElementById('tax-inter').classList.toggle('active', type === 'inter');

  calculateGST();
}

function formatINR(num) {
  if (isNaN(num)) return '--';
  return '\u20B9' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateGST() {
  var amountInput = parseFloat(document.getElementById('amount').value);
  var gstRate = parseFloat(document.getElementById('gst-rate').value) / 100;

  var resultsEl = document.getElementById('results');

  if (isNaN(amountInput) || amountInput <= 0) {
    resultsEl.style.display = 'none';
    return;
  }

  var baseAmount, gstAmount, totalAmount;

  if (currentMode === 'add') {
    baseAmount = amountInput;
    gstAmount = baseAmount * gstRate;
    totalAmount = baseAmount + gstAmount;
  } else {
    totalAmount = amountInput;
    baseAmount = totalAmount / (1 + gstRate);
    gstAmount = totalAmount - baseAmount;
  }

  // Display results
  resultsEl.style.display = 'block';

  var grid = document.getElementById('results-grid');
  grid.innerHTML = '';

  var metrics = [
    { label: 'Base Amount', value: formatINR(baseAmount) },
    { label: 'GST Amount', value: formatINR(gstAmount), sub: (gstRate * 100) + '% GST' },
    { label: 'Total Amount', value: formatINR(totalAmount) },
  ];

  metrics.forEach(function(m) {
    var card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML =
      '<div class="result-label">' + m.label + '</div>' +
      '<div class="result-value">' + m.value + '</div>' +
      (m.sub ? '<div class="result-sub">' + m.sub + '</div>' : '');
    grid.appendChild(card);
  });

  // Breakdown table
  var tbody = document.getElementById('breakdown-body');
  tbody.innerHTML = '';

  var rows = [];

  rows.push({ component: 'Base Amount (Taxable Value)', rate: '--', amount: formatINR(baseAmount) });

  if (currentTaxType === 'intra') {
    var halfRate = (gstRate * 100) / 2;
    var halfAmount = gstAmount / 2;
    rows.push({ component: 'CGST', rate: halfRate.toFixed(1) + '%', amount: formatINR(halfAmount) });
    rows.push({ component: 'SGST', rate: halfRate.toFixed(1) + '%', amount: formatINR(halfAmount) });
  } else {
    rows.push({ component: 'IGST', rate: (gstRate * 100).toFixed(1) + '%', amount: formatINR(gstAmount) });
  }

  rows.push({ component: 'Total Amount', rate: '--', amount: formatINR(totalAmount) });

  rows.forEach(function(row, i) {
    var tr = document.createElement('tr');
    var isTotal = i === rows.length - 1;
    var weight = (i === 0 || isTotal) ? 'font-weight:700;' : '';
    tr.innerHTML =
      '<td style="' + weight + '">' + row.component + '</td>' +
      '<td style="text-align:right;' + weight + '">' + row.rate + '</td>' +
      '<td style="text-align:right;' + weight + '">' + row.amount + '</td>';
    tbody.appendChild(tr);
  });
}
