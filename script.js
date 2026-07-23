const openingBalanceInput = document.getElementById('openingBalance');
const entryForm = document.getElementById('entryForm');
const entryType = document.getElementById('entryType');
const entryDate = document.getElementById('entryDate');
const entryCategory = document.getElementById('entryCategory');
const entryDescription = document.getElementById('entryDescription');
const entryAmount = document.getElementById('entryAmount');
const entriesTableBody = document.getElementById('entriesTableBody');
const summaryOpening = document.getElementById('summaryOpening');
const summaryIncome = document.getElementById('summaryIncome');
const summaryExpenses = document.getElementById('summaryExpenses');
const summaryClosing = document.getElementById('summaryClosing');
const chartCanvas = document.getElementById('budgetChart');
const downloadReportButton = document.getElementById('downloadReportButton');
const tipButton = document.getElementById('tipButton');
const tipText = document.getElementById('tipText');
const tipCategories = document.getElementById('tipCategories');
const tipSteps = document.getElementById('tipSteps');

let entries = [];
let budgetChart;

const financeTips = {
  Budgeting: {
    message: 'A budget is easier to follow when you give every rupee a purpose.',
    steps: [
      'Write down your fixed monthly costs first.',
      'Set a small savings target before discretionary spending.',
      'Review your spending once a week to stay on track.',
    ],
  },
  Savings: {
    message: 'Try to keep at least 3 to 6 months of essentials in an emergency fund.',
    steps: [
      'Start with a small weekly transfer to savings.',
      'Keep the emergency fund separate from daily spending.',
      'Use it only for real emergencies, not impulse purchases.',
    ],
  },
  Debt: {
    message: 'Paying high-interest debt first usually saves more money than investing aggressively.',
    steps: [
      'List all debts by interest rate.',
      'Put extra money toward the highest-rate balance first.',
      'Avoid adding new high-interest debt while paying it down.',
    ],
  },
  Investment: {
    message: 'Invest early and regularly; time in the market can matter more than timing the market.',
    steps: [
      'Choose one recurring investment amount.',
      'Keep investing even in market down months.',
      'Revisit your plan quarterly instead of reacting daily.',
    ],
  },
  Spending: {
    message: 'Review subscriptions and impulse spending once a month to protect your budget.',
    steps: [
      'Check recurring charges and cancel unused ones.',
      'Set a weekly limit for discretionary spending.',
      'Use a one-day wait rule before non-essential purchases.',
    ],
  },
};

const categoryOptions = {
  Income: ['Salary', 'Rent'],
  Expense: ['Home', 'Parents', 'Fitness', 'Entertainment', 'Office'],
};

function formatCurrency(value) {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function formatPdfCurrency(value) {
  return `Rs ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function renderTipCategoryButtons() {
  const categories = Object.keys(financeTips);
  tipCategories.innerHTML = '';

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tip-category-button';
    button.textContent = category;
    button.addEventListener('click', () => showTipByCategory(category));
    tipCategories.appendChild(button);
  });
}

function showTipByCategory(category) {
  const selectedTip = financeTips[category];
  tipText.textContent = selectedTip.message;
  tipSteps.innerHTML = selectedTip.steps.map((step) => `<li>${step}</li>`).join('');

  document.querySelectorAll('.tip-category-button').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent === category);
  });
}

function showTipOfTheDay() {
  const categories = Object.keys(financeTips);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  showTipByCategory(randomCategory);
}

function updateSummary() {
  const openingBalance = Number(openingBalanceInput.value) || 0;
  const totalIncome = entries.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = entries.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const closingBalance = openingBalance + totalIncome - totalExpenses;

  summaryOpening.textContent = formatCurrency(openingBalance);
  summaryIncome.textContent = formatCurrency(totalIncome);
  summaryExpenses.textContent = formatCurrency(totalExpenses);
  summaryClosing.textContent = formatCurrency(closingBalance);

  updateChart(openingBalance, totalIncome, totalExpenses, closingBalance);
}

function addEntryRow(record) {
  const row = document.createElement('tr');
  const amountClass = record.type === 'Income' ? 'amount-income' : 'amount-expense';
  row.innerHTML = `
    <td>${record.type}</td>
    <td>${record.date}</td>
    <td>${record.category}</td>
    <td>${record.description}</td>
    <td class="${amountClass}">${formatCurrency(record.amount)}</td>
  `;
  entriesTableBody.appendChild(row);
}

function refreshEntries() {
  entriesTableBody.innerHTML = '';
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  entries.forEach((record) => addEntryRow(record));
}

function getSortedLabels() {
  const dates = new Set(entries.map((item) => item.date));
  return Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
}

function getSeries(labels, type) {
  const recordMap = entries
    .filter((item) => item.type === type)
    .reduce((map, item) => {
      map[item.date] = (map[item.date] || 0) + item.amount;
      return map;
    }, {});
  return labels.map((date) => recordMap[date] || 0);
}

function updateChart(openingBalance, totalIncome, totalExpenses, closingBalance) {
  const labels = getSortedLabels();
  const incomeSeries = getSeries(labels, 'Income');
  const expenseSeries = getSeries(labels, 'Expense');
  const savingsSeries = labels.map((_, idx) => incomeSeries[idx] - expenseSeries[idx]);

  const data = {
    labels: labels.length ? labels : ['No data'],
    datasets: [
      {
        label: 'Income',
        data: labels.length ? incomeSeries : [0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Expense',
        data: labels.length ? expenseSeries : [0],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.16)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Savings',
        data: labels.length ? savingsSeries : [0],
        borderColor: '#16a34a',
        backgroundColor: 'rgba(16, 185, 129, 0.16)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const config = {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: { color: '#334155' },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#475569' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
            color: '#475569',
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.18)',
          },
        },
      },
    },
  };

  if (budgetChart) {
    budgetChart.data = data;
    budgetChart.options = config.options;
    budgetChart.update();
  } else {
    budgetChart = new Chart(chartCanvas, config);
  }
}

function generateReportPdf() {
  const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDFConstructor) {
    alert('PDF export is unavailable.');
    return;
  }

  const openingBalance = Number(openingBalanceInput.value) || 0;
  const totalIncome = entries.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = entries.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const savings = totalIncome - totalExpenses;
  const closingBalance = openingBalance + savings;
  const doc = new jsPDFConstructor({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Budget App Report', pageWidth / 2, y, { align: 'center' });
  y += 32;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Summary', margin, y);
  y += 18;

  const tableWidth = pageWidth - margin * 2;
  doc.autoTable({
    startY: y,
    theme: 'grid',
    tableWidth,
    head: [['Metric', 'Amount']],
    body: [
      ['Opening Balance', formatPdfCurrency(openingBalance)],
      ['Total Income', formatPdfCurrency(totalIncome)],
      ['Total Expenses', formatPdfCurrency(totalExpenses)],
      ['Savings', formatPdfCurrency(savings)],
      ['Closing Balance', formatPdfCurrency(closingBalance)],
    ],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 7, overflow: 'linebreak', cellWidth: 'wrap' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center' },
    columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 180, halign: 'right' } },
    margin: { left: margin, right: margin },
    tableLineWidth: 0.5,
  });

  y = doc.lastAutoTable.finalY + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Entries', margin, y);
  y += 18;

  const entryBody = entries.map((record) => [record.type, record.date, record.category, record.description, formatPdfCurrency(record.amount)]);
  if (entryBody.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No entries available.', margin, y);
    y += 20;
  } else {
    doc.autoTable({
      startY: y,
      theme: 'grid',
      tableWidth,
      head: [['Type', 'Date', 'Category', 'Description', 'Amount']],
      body: entryBody,
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, halign: 'center' },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 70 }, 2: { cellWidth: 90 }, 3: { cellWidth: 200 }, 4: { cellWidth: 80, halign: 'right' } },
      margin: { left: margin, right: margin },
      tableLineWidth: 0.4,
    });
  }

  y = doc.lastAutoTable.finalY + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Savings Chart', margin, y);
  y += 14;

  const chartImage = chartCanvas.toDataURL('image/png', 1.0);
  const chartWidth = pageWidth - margin * 2;
  const chartHeight = chartWidth * 0.55;
  if (y + chartHeight > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    y = margin;
  }
  doc.addImage(chartImage, 'PNG', margin, y, chartWidth, chartHeight);

  const fileName = `Budget-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

function updateCategoryOptions() {
  const selectedType = entryType.value;
  entryCategory.innerHTML = '';
  categoryOptions[selectedType].forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    entryCategory.appendChild(optionElement);
  });
}

function addEntryRecord(event) {
  event.preventDefault();
  const type = entryType.value;
  const date = entryDate.value;
  const category = entryCategory.value;
  const description = entryDescription.value.trim();
  const amount = Number(entryAmount.value);

  if (!date || !category || !description || amount <= 0) return;

  entries.push({ type, date, category, description, amount });
  refreshEntries();
  updateSummary();
  entryForm.reset();
  entryType.value = 'Income';
  updateCategoryOptions();
}

openingBalanceInput.addEventListener('input', updateSummary);
entryForm.addEventListener('submit', addEntryRecord);
entryType.addEventListener('change', updateCategoryOptions);
downloadReportButton.addEventListener('click', generateReportPdf);
tipButton.addEventListener('click', showTipOfTheDay);

updateCategoryOptions();
updateSummary();
renderTipCategoryButtons();
showTipByCategory('Budgeting');
