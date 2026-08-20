const openingBalanceInput = document.getElementById('openingBalance');
const incomeForm = document.getElementById('incomeForm');
const incomeDate = document.getElementById('incomeDate');
const incomeCategory = document.getElementById('incomeCategory');
const incomeDescription = document.getElementById('incomeDescription');
const incomeAmount = document.getElementById('incomeAmount');

const expenseForm = document.getElementById('expenseForm');
const expenseDate = document.getElementById('expenseDate');
const expenseCategory = document.getElementById('expenseCategory');
const expenseDescription = document.getElementById('expenseDescription');
const expenseAmount = document.getElementById('expenseAmount');
const entriesTableBody = document.getElementById('entriesTableBody');
const summaryOpening = document.getElementById('summaryOpening');
const summaryIncome = document.getElementById('summaryIncome');
const summaryExpenses = document.getElementById('summaryExpenses');
const summaryClosing = document.getElementById('summaryClosing');
const chartCanvas = document.getElementById('budgetChart');
const downloadReportButton = document.getElementById('downloadReportButton');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const tipButton = document.getElementById('tipButton');
const tipText = document.getElementById('tipText');
const tipSection = document.querySelector('.tip-strip');
const tipSteps = document.getElementById('tipSteps');
const tipActions = document.getElementById('tipActions');
const chartPlaceholder = document.getElementById('chartPlaceholder');
const incomeClearButton = document.getElementById('incomeClearButton');
const expenseClearButton = document.getElementById('expenseClearButton');
const authView = document.getElementById('authView');
const authForm = document.getElementById('authForm');
const registrationFields = document.getElementById('registrationFields');
const authFirstName = document.getElementById('authFirstName');
const authLastName = document.getElementById('authLastName');
const authEmail = document.getElementById('authEmail');
const authMobile = document.getElementById('authMobile');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authMessage = document.getElementById('authMessage');
const authSubmitButton = document.getElementById('authSubmitButton');
const authModeButton = document.getElementById('authModeButton');
const forgotPasswordButton = document.getElementById('forgotPasswordButton');
const logoutButton = document.getElementById('logoutButton');
const currentUserName = document.getElementById('currentUserName');
const reportForm = document.getElementById('reportForm');
const reportStartDate = document.getElementById('reportStartDate');
const reportEndDate = document.getElementById('reportEndDate');

let entries = [];
let nextEntryId = 1;
let budgetChart;
let currentUsername = '';
let isRegistrationMode = false;

const USERS_STORAGE_KEY = 'budgetAppUsers';
const SESSION_STORAGE_KEY = 'budgetAppSession';

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
}

function getBudgetStorageKey(username) {
  return `budgetAppData:${username}`;
}

function saveBudgetState() {
  if (!currentUsername) return;
  localStorage.setItem(getBudgetStorageKey(currentUsername), JSON.stringify({
    openingBalance: Number(openingBalanceInput.value) || 0,
    entries,
    nextEntryId,
  }));
}

function loadBudgetState() {
  const savedState = JSON.parse(localStorage.getItem(getBudgetStorageKey(currentUsername)) || 'null');
  openingBalanceInput.value = savedState?.openingBalance ?? 10000;
  entries = Array.isArray(savedState?.entries) ? savedState.entries : [];
  nextEntryId = savedState?.nextEntryId || (entries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1);
}

function setAuthenticatedView(isAuthenticated) {
  authView.style.display = isAuthenticated ? 'none' : 'grid';
  document.querySelector('.app-shell').style.display = isAuthenticated ? 'grid' : 'none';
}

function showAuthMessage(message, isError = true) {
  authMessage.textContent = message;
  authMessage.classList.toggle('error', isError);
}

function updateRegistrationFields() {
  registrationFields.style.display = isRegistrationMode ? 'grid' : 'none';
  [authFirstName, authLastName, authEmail, authMobile].forEach((field) => {
    field.required = isRegistrationMode;
  });
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const username = authUsername.value.trim().toLowerCase();
  const password = authPassword.value;
  if (!username || password.length < 4) return;

  const users = getStoredUsers();
  if (isRegistrationMode) {
    const profile = {
      firstName: authFirstName.value.trim(),
      lastName: authLastName.value.trim(),
      email: authEmail.value.trim().toLowerCase(),
      mobile: authMobile.value.trim(),
    };
    if (users[username]) {
      showAuthMessage('That username already exists. Sign in instead.');
      return;
    }
    users[username] = { password, ...profile };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } else if (!users[username] || users[username].password !== password) {
    showAuthMessage('Username or password is incorrect.');
    return;
  }

  currentUsername = username;
  sessionStorage.setItem(SESSION_STORAGE_KEY, currentUsername);
  currentUserName.textContent = currentUsername;
  loadBudgetState();
  setAuthenticatedView(true);
  refreshEntries();
  updateSummary();
  authForm.reset();
}

function toggleAuthMode() {
  isRegistrationMode = !isRegistrationMode;
  authSubmitButton.textContent = isRegistrationMode ? 'Create account' : 'Sign in';
  authModeButton.textContent = isRegistrationMode ? 'Already have an account? Sign in' : 'New here? Create an account';
  authPassword.setAttribute('autocomplete', isRegistrationMode ? 'new-password' : 'current-password');
  updateRegistrationFields();
  showAuthMessage('');
}

function handleForgotPassword() {
  const username = authUsername.value.trim().toLowerCase() || window.prompt('Enter your username:')?.trim().toLowerCase();
  if (!username) return;

  const users = getStoredUsers();
  if (!users[username]) {
    showAuthMessage('No local account was found for that username.');
    return;
  }

  const newPassword = window.prompt('Enter a new password with at least 4 characters:');
  if (!newPassword || newPassword.length < 4) {
    showAuthMessage('Password reset cancelled or password is too short.');
    return;
  }

  users[username].password = newPassword;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  authUsername.value = username;
  authPassword.value = '';
  showAuthMessage('Password updated on this device. You can sign in now.', false);
}

function handleLogout() {
  saveBudgetState();
  currentUsername = '';
  isRegistrationMode = false;
  authSubmitButton.textContent = 'Sign in';
  authModeButton.textContent = 'New here? Create an account';
  updateRegistrationFields();
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  setAuthenticatedView(false);
}

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

function getSavingsTip() {
  const totalIncome = entries.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = entries.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const savings = totalIncome - totalExpenses;

  if (entries.length === 0) {
    return null;
  }

  if (savings >= totalIncome * 0.2) {
    return {
      message: 'Your savings are strong. Keep this pace and consider increasing your reserve for future goals.',
      steps: [
        'Keep tracking income and expense entries regularly.',
        'Raise your savings goal slightly if your cash flow stays stable.',
        'Consider splitting savings into short-term and long-term buckets.',
      ],
    };
  }

  if (savings >= 0) {
    return {
      message: 'You are saving money. Focus on maintaining this balance and trimming discretionary expenses for faster progress.',
      steps: [
        'Review your variable expenses and see where you can reduce small recurring costs.',
        'Keep setting aside a fixed amount each week or month.',
        'Use your closing balance to decide how much you can safely save next month.',
      ],
    };
  }

  return {
    message: 'Your expenses exceed income. Prioritize reducing spending so you can start building savings.',
    steps: [
      'Identify the largest expense categories and reduce one of them.',
      'Avoid non-essential purchases until you have a positive savings buffer.',
      'Use the app to track every entry and spot patterns quickly.',
    ],
  };
}

function updateTipSection() {
  const tip = getSavingsTip();

  if (!tip) {
    tipSection.style.display = 'none';
    return;
  }

  tipSection.style.display = '';
  tipText.textContent = tip.message;
  tipSteps.innerHTML = tip.steps.map((step) => `<li>${step}</li>`).join('');
  tipActions.style.display = '';
}

function showTipOfTheDay() {
  updateTipSection();
}

function clearEntries() {
  const confirmed = window.confirm('Are you sure you want to clear all entries? This cannot be undone.');
  if (!confirmed) return;

  entries = [];
  saveBudgetState();
  refreshEntries();
  updateSummary();
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
  updateTipSection();
}

function addEntryRow(record) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', record.id);
  const amountClass = record.type === 'Income' ? 'amount-income' : 'amount-expense';
  row.innerHTML = `
    <td><input type="checkbox" class="select-entry" data-id="${record.id}" aria-label="Select entry"/></td>
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

  if (!entries.length) {
    if (budgetChart) {
      budgetChart.destroy();
      budgetChart = null;
    }
    chartCanvas.style.display = 'none';
    if (chartPlaceholder) chartPlaceholder.style.display = 'block';
    return;
  }

  chartCanvas.style.display = '';
  if (chartPlaceholder) chartPlaceholder.style.display = 'none';

  if (budgetChart) {
    budgetChart.data = data;
    budgetChart.options = config.options;
    budgetChart.update();
  } else {
    budgetChart = new Chart(chartCanvas, config);
  }
}

function generateReportPdf(event) {
  event?.preventDefault();
  const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDFConstructor) {
    alert('PDF export is unavailable.');
    return;
  }

  const startDate = reportStartDate.value;
  const endDate = reportEndDate.value;
  if (startDate && endDate && startDate > endDate) {
    alert('The report start date must be before the end date.');
    return;
  }
  const filteredEntries = entries.filter((item) => (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate));
  const openingBalance = Number(openingBalanceInput.value) || 0;
  const totalIncome = filteredEntries.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = filteredEntries.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
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
  doc.text(`Period: ${startDate || 'All dates'} to ${endDate || 'All dates'}`, margin, y);
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

  const entryBody = filteredEntries.map((record) => [record.type, record.date, record.category, record.description, formatPdfCurrency(record.amount)]);
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

  const fileName = `Budget-Report-${startDate || 'all'}-to-${endDate || 'all'}.pdf`;
  doc.save(fileName);
}

function updateCategoryOptions() {
  incomeCategory.innerHTML = '';
  expenseCategory.innerHTML = '';
  categoryOptions['Income'].forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    incomeCategory.appendChild(optionElement);
  });
  categoryOptions['Expense'].forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    expenseCategory.appendChild(optionElement);
  });
}

function addEntryRecord(event, type, dateEl, categoryEl, descriptionEl, amountEl) {
  event.preventDefault();
  const date = dateEl.value;
  const category = categoryEl.value;
  const description = descriptionEl.value.trim();
  const amount = Number(amountEl.value);

  if (!date || !category || !description || amount <= 0) return;

  const record = { id: nextEntryId++, type, date, category, description, amount };
  entries.push(record);
  saveBudgetState();
  refreshEntries();
  updateSummary();
  event.target.reset();
  updateCategoryOptions();
}

function deleteSelected() {
  const checked = Array.from(document.querySelectorAll('.select-entry:checked'));
  if (checked.length === 0) return;
  const confirmed = window.confirm(`Delete ${checked.length} selected entr${checked.length > 1 ? 'ies' : 'y'}? This cannot be undone.`);
  if (!confirmed) return;
  const idsToDelete = checked.map((cb) => Number(cb.getAttribute('data-id')));
  entries = entries.filter((e) => !idsToDelete.includes(e.id));
  saveBudgetState();
  refreshEntries();
  updateSummary();
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.select-entry').forEach((cb) => { cb.checked = checked; });
}

function clearIncomeForm() {
  incomeForm.reset();
  updateCategoryOptions();
}

function clearExpenseForm() {
  expenseForm.reset();
  updateCategoryOptions();
}

openingBalanceInput.addEventListener('input', () => {
  saveBudgetState();
  updateSummary();
});
incomeForm.addEventListener('submit', (e) => addEntryRecord(e, 'Income', incomeDate, incomeCategory, incomeDescription, incomeAmount));
expenseForm.addEventListener('submit', (e) => addEntryRecord(e, 'Expense', expenseDate, expenseCategory, expenseDescription, expenseAmount));
reportForm.addEventListener('submit', generateReportPdf);
deleteSelectedButton.addEventListener('click', deleteSelected);
selectAllCheckbox.addEventListener('change', (e) => toggleSelectAll(e.target.checked));
tipButton.addEventListener('click', showTipOfTheDay);
incomeClearButton.addEventListener('click', clearIncomeForm);
expenseClearButton.addEventListener('click', clearExpenseForm);
authForm.addEventListener('submit', handleAuthSubmit);
authModeButton.addEventListener('click', toggleAuthMode);
forgotPasswordButton.addEventListener('click', handleForgotPassword);
logoutButton.addEventListener('click', handleLogout);

updateCategoryOptions();
updateRegistrationFields();
const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
if (savedSession && getStoredUsers()[savedSession]) {
  currentUsername = savedSession;
  currentUserName.textContent = currentUsername;
  loadBudgetState();
  setAuthenticatedView(true);
  refreshEntries();
  updateSummary();
} else {
  setAuthenticatedView(false);
}
