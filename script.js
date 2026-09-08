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
const downloadTransactionsButton = document.getElementById('downloadTransactionsButton');
const downloadFormatDialog = document.getElementById('downloadFormatDialog');
const downloadPdfOption = document.getElementById('downloadPdfOption');
const downloadExcelOption = document.getElementById('downloadExcelOption');
const cancelDownloadButton = document.getElementById('cancelDownloadButton');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const entryTypeFilter = document.getElementById('entryTypeFilter');
const entryDateFilter = document.getElementById('entryDateFilter');
const entryDateFromFilter = document.getElementById('entryDateFromFilter');
const entryDateToFilter = document.getElementById('entryDateToFilter');
const entryCategoryFilter = document.getElementById('entryCategoryFilter');
const entryDescriptionFilter = document.getElementById('entryDescriptionFilter');
const entryAmountMinFilter = document.getElementById('entryAmountMinFilter');
const entryAmountMaxFilter = document.getElementById('entryAmountMaxFilter');
const entryAmountOperator = document.getElementById('entryAmountOperator');
const filterMenus = Array.from(document.querySelectorAll('.filter-menu'));
const filterButtons = Array.from(document.querySelectorAll('.filter-icon'));
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
const togglePasswordButton = document.getElementById('togglePasswordButton');
const authMessage = document.getElementById('authMessage');
const authSubmitButton = document.getElementById('authSubmitButton');
const authModeButton = document.getElementById('authModeButton');
const forgotPasswordButton = document.getElementById('forgotPasswordButton');
const logoutButton = document.getElementById('logoutButton');
const currentUserName = document.getElementById('currentUserName');
const reportForm = document.getElementById('reportForm');
const reportStartDate = document.getElementById('reportStartDate');
const reportEndDate = document.getElementById('reportEndDate');
const categoryBudgetCategory = document.getElementById('categoryBudgetCategory');
const categoryBudgetAmount = document.getElementById('categoryBudgetAmount');
const addCategoryBudgetButton = document.getElementById('addCategoryBudgetButton');
const budgetListButton = document.getElementById('budgetListButton');
const budgetListPanel = document.getElementById('budgetListPanel');
const budgetListContent = document.getElementById('budgetListContent');
const budgetStatusList = document.getElementById('budgetStatusList');
const addIncomeCategoryButton = document.getElementById('addIncomeCategoryButton');
const addExpenseCategoryButton = document.getElementById('addExpenseCategoryButton');
const categoryDialog = document.getElementById('categoryDialog');
const categoryForm = document.getElementById('categoryForm');
const categoryDialogTitle = document.getElementById('categoryDialogTitle');
const categoryName = document.getElementById('categoryName');
const categoryDescription = document.getElementById('categoryDescription');
const categoryMessage = document.getElementById('categoryMessage');
const cancelCategoryButton = document.getElementById('cancelCategoryButton');
const idleTimeoutDialog = document.getElementById('idleTimeoutDialog');
const idleCountdown = document.getElementById('idleCountdown');
const continueSessionButton = document.getElementById('continueSessionButton');

let entries = [];
let nextEntryId = 1;
let budgetChart;
let currentUsername = '';
let isRegistrationMode = false;
let activeCategoryType = '';
let customCategories = { Income: [], Expense: [] };
let categoryBudgets = {};
let idleWarningTimer;
let idleLogoutTimer;
let idleCountdownTimer;

const USERS_STORAGE_KEY = 'budgetAppUsers';
const SESSION_STORAGE_KEY = 'budgetAppSession';
const IDLE_WARNING_MS = 13 * 60 * 1000;
const IDLE_LOGOUT_MS = 2 * 60 * 1000;

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
    customCategories,
    categoryBudgets,
  }));
}

function loadBudgetState() {
  const savedState = JSON.parse(localStorage.getItem(getBudgetStorageKey(currentUsername)) || 'null');
  openingBalanceInput.value = savedState?.openingBalance ?? 10000;
  entries = Array.isArray(savedState?.entries) ? savedState.entries : [];
  nextEntryId = savedState?.nextEntryId || (entries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1);
  customCategories = {
    Income: Array.isArray(savedState?.customCategories?.Income) ? savedState.customCategories.Income : [],
    Expense: Array.isArray(savedState?.customCategories?.Expense) ? savedState.customCategories.Expense : [],
  };
  categoryBudgets = savedState?.categoryBudgets && typeof savedState.categoryBudgets === 'object' ? savedState.categoryBudgets : {};
}

function setAuthenticatedView(isAuthenticated) {
  authView.style.display = isAuthenticated ? 'none' : 'grid';
  document.querySelector('.app-shell').style.display = isAuthenticated ? 'grid' : 'none';
}

function showAuthMessage(message, isError = true) {
  authMessage.textContent = message;
  authMessage.classList.toggle('error', isError);
}

function clearIdleTimers() {
  clearTimeout(idleWarningTimer);
  clearTimeout(idleLogoutTimer);
  clearInterval(idleCountdownTimer);
}

function hideIdleTimeoutDialog() {
  clearIdleTimers();
  idleTimeoutDialog.hidden = true;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function showIdleTimeoutDialog() {
  if (!currentUsername) return;

  idleTimeoutDialog.hidden = false;
  idleCountdown.textContent = formatCountdown(IDLE_LOGOUT_MS);
  const warningStartedAt = Date.now();
  idleCountdownTimer = setInterval(() => {
    idleCountdown.textContent = formatCountdown(IDLE_LOGOUT_MS - (Date.now() - warningStartedAt));
  }, 1000);
  idleLogoutTimer = setTimeout(() => handleLogout(), IDLE_LOGOUT_MS);
}

function resetIdleTimer() {
  if (!currentUsername || !idleTimeoutDialog.hidden) return;

  clearIdleTimers();
  idleWarningTimer = setTimeout(showIdleTimeoutDialog, IDLE_WARNING_MS);
}

function handleActivity() {
  resetIdleTimer();
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
  localStorage.setItem(SESSION_STORAGE_KEY, currentUsername);
  currentUserName.textContent = currentUsername;
  loadBudgetState();
  setAuthenticatedView(true);
  refreshEntries();
  updateSummary();
  hideIdleTimeoutDialog();
  resetIdleTimer();
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

function togglePasswordVisibility() {
  const isVisible = authPassword.type === 'text';
  authPassword.type = isVisible ? 'password' : 'text';
  togglePasswordButton.textContent = isVisible ? 'Show' : 'Hide';
  togglePasswordButton.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
  togglePasswordButton.setAttribute('title', isVisible ? 'Show password' : 'Hide password');
}

function handleLogout() {
  hideIdleTimeoutDialog();
  saveBudgetState();
  currentUsername = '';
  isRegistrationMode = false;
  authSubmitButton.textContent = 'Sign in';
  authModeButton.textContent = 'New here? Create an account';
  updateRegistrationFields();
  localStorage.removeItem(SESSION_STORAGE_KEY);
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

function parseDisplayDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return '';
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function getDateRangeValues() {
  return {
    startDate: parseDisplayDate(reportStartDate.value),
    endDate: parseDisplayDate(reportEndDate.value),
  };
}

function getExpenseCategoryNames() {
  return [...categoryOptions.Expense, ...customCategories.Expense.map((category) => category.name)]
    .filter((category, index, allCategories) => allCategories.indexOf(category) === index);
}

function getAllCategoryNames() {
  return [...categoryOptions.Income, ...categoryOptions.Expense, ...customCategories.Income, ...customCategories.Expense]
    .map((category) => typeof category === 'string' ? category : category.name)
    .filter((category, index, allCategories) => allCategories.indexOf(category) === index);
}

function getCategorySpend(category) {
  return entries
    .filter((item) => item.type === 'Expense' && item.category === category)
    .reduce((sum, item) => sum + item.amount, 0);
}

function getCashFlowObservation(totalIncome, totalExpenses, savings) {
  if (totalIncome === 0 && totalExpenses > 0) return 'Cash flow: expenses are recorded without income; add income or reduce spending.';
  if (savings < 0) return `Cash flow: expenditure exceeds income by ${formatCurrency(Math.abs(savings))}.`;
  if (totalIncome > 0 && savings >= totalIncome * 0.2) return `Savings tip: retain ${formatCurrency(savings)} as a reserve; it is at least 20% of income.`;
  if (savings === 0) return 'Savings: income and expenditure are currently balanced.';
  return `Savings tip: ${formatCurrency(savings)} remains after expenditure; keep a fixed portion aside next month.`;
}

function getSavingsTip() {
  const totalIncome = entries.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = entries.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const savings = totalIncome - totalExpenses;

  const exceededBudgets = getExpenseCategoryNames()
    .map((category) => ({ category, budget: Number(categoryBudgets[category]) || 0, spent: getCategorySpend(category) }))
    .filter((item) => item.budget > 0 && item.spent > item.budget)
    .sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget));

  if (exceededBudgets.length) {
    const categorySummary = exceededBudgets
      .map(({ category, spent, budget }) => `${category} by ${formatCurrency(spent - budget)}`)
      .join(', ');
    const totalOverage = exceededBudgets.reduce((sum, item) => sum + item.spent - item.budget, 0);
    return {
      message: `Over-budget categories this month: ${categorySummary}.`,
      steps: [
        `Review these categories and reduce or defer a combined ${formatCurrency(totalOverage)} in spending.`,
        getCashFlowObservation(totalIncome, totalExpenses, savings),
      ],
    };
  }

  if (entries.length === 0) {
    return null;
  }

  if (savings >= totalIncome * 0.2) {
    return {
      message: 'Your savings are strong. Keep this pace and consider increasing your reserve for future goals.',
      steps: [
        'Keep tracking income and expense entries regularly.',
        getCashFlowObservation(totalIncome, totalExpenses, savings),
        'Raise your savings goal slightly if your cash flow stays stable.',
      ],
    };
  }

  if (savings >= 0) {
    return {
      message: 'You are saving money. Focus on maintaining this balance and trimming discretionary expenses for faster progress.',
      steps: [
        'Review your variable expenses and see where you can reduce small recurring costs.',
        getCashFlowObservation(totalIncome, totalExpenses, savings),
        'Set aside a fixed amount each week or month.',
      ],
    };
  }

  return {
    message: 'Your expenses exceed income. Prioritize reducing spending so you can start building savings.',
    steps: [
      'Identify the largest expense categories and reduce one of them.',
      getCashFlowObservation(totalIncome, totalExpenses, savings),
      'Avoid non-essential purchases until you have a positive savings buffer.',
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
    <td>${formatDisplayDate(record.date)}</td>
    <td>${record.category}</td>
    <td>${record.description}</td>
    <td class="${amountClass}">${formatCurrency(record.amount)}</td>
  `;
  entriesTableBody.appendChild(row);
}

function refreshEntries() {
  entriesTableBody.innerHTML = '';
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const type = entryTypeFilter.value;
  const exactDate = parseDisplayDate(entryDateFilter.value);
  const dateFrom = parseDisplayDate(entryDateFromFilter.value);
  const dateTo = parseDisplayDate(entryDateToFilter.value);
  const category = entryCategoryFilter.value.trim().toLowerCase();
  const description = entryDescriptionFilter.value.trim().toLowerCase();
  const amountValue = entryAmountMinFilter.value === '' ? null : Number(entryAmountMinFilter.value);
  const maximumAmount = entryAmountMaxFilter.value === '' ? null : Number(entryAmountMaxFilter.value);
  const amountMatches = (amount) => {
    if (amountValue === null) return true;
    if (entryAmountOperator.value === 'less') return amount < amountValue;
    if (entryAmountOperator.value === 'greater') return amount > amountValue;
    if (entryAmountOperator.value === 'exactly') return amount === amountValue;
    return maximumAmount !== null && amount >= amountValue && amount <= maximumAmount;
  };
  const filteredEntries = entries.filter((record) => (
    (!type || record.type === type)
    && (exactDate ? record.date === exactDate : ((!dateFrom || record.date >= dateFrom) && (!dateTo || record.date <= dateTo)))
    && (!category || record.category.toLowerCase().includes(category))
    && (!description || record.description.toLowerCase().includes(description))
    && amountMatches(record.amount)
  ));
  filteredEntries.forEach((record) => addEntryRow(record));
  selectAllCheckbox.checked = false;
}

function updateCategoryFilterOptions() {
  const selectedCategory = entryCategoryFilter.value;
  const categories = getAllCategoryNames();
  entryCategoryFilter.innerHTML = '<option value="">All categories</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    entryCategoryFilter.appendChild(option);
  });
  entryCategoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : '';
}

function updateAmountFilterFields() {
  entryAmountMaxFilter.hidden = entryAmountOperator.value !== 'between';
  entryAmountMinFilter.placeholder = entryAmountOperator.value === 'between' ? 'Minimum' : 'Amount';
}

function closeFilterMenus() {
  filterMenus.forEach((menu) => { menu.hidden = true; });
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

function updateBudgetControls() {
  const categories = getExpenseCategoryNames();
  const selectedCategory = categoryBudgetCategory.value;
  categoryBudgetCategory.innerHTML = '<option value="">Select category</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryBudgetCategory.appendChild(option);
  });
  categoryBudgetCategory.value = categories.includes(selectedCategory) ? selectedCategory : '';
  renderBudgetList();
}

function renderBudgetList() {
  const savedBudgets = Object.entries(categoryBudgets).filter(([, amount]) => Number(amount) > 0);
  budgetListContent.innerHTML = '';
  if (!savedBudgets.length) {
    budgetListContent.textContent = 'No budgets added yet.';
    return;
  }
  savedBudgets.sort(([first], [second]) => first.localeCompare(second)).forEach(([category, budget]) => {
    const row = document.createElement('div');
    row.className = 'budget-list-row';
    row.innerHTML = `<span>${category}</span><strong>${formatCurrency(Number(budget))}</strong>`;
    budgetListContent.appendChild(row);
  });
}

function addCategoryBudget() {
  const category = categoryBudgetCategory.value;
  const amount = Number(categoryBudgetAmount.value);
  if (!category || !amount || amount < 0) return;
  categoryBudgets[category] = amount;
  categoryBudgetAmount.value = '';
  saveBudgetState();
  renderBudgetList();
  updateSummary();
}

function updateBudgetStatus(categories, spentValues, budgetValues) {
  budgetStatusList.innerHTML = '';
  categories.forEach((category, index) => {
    const spent = spentValues[index];
    const budget = budgetValues[index];
    if (!budget) return;
    const status = document.createElement('div');
    const exceeded = spent > budget;
    status.className = `budget-status ${exceeded ? 'over-budget' : 'within-budget'}`;
    status.innerHTML = `<span>${category}</span><strong>${exceeded ? 'Over by' : 'Remaining'} ${formatCurrency(Math.abs(budget - spent))}</strong>`;
    budgetStatusList.appendChild(status);
  });
}

function updateChart() {
  const categories = getExpenseCategoryNames();
  const spentValues = categories.map((category) => getCategorySpend(category));
  const budgetValues = categories.map((category) => Number(categoryBudgets[category]) || 0);
  const hasBudgets = budgetValues.some((value) => value > 0);
  const data = {
    labels: categories.length ? categories : ['No expense categories'],
    datasets: [
      {
        label: 'Spent',
        data: categories.length ? spentValues : [0],
        backgroundColor: spentValues.map((value, index) => budgetValues[index] > 0 && value > budgetValues[index] ? '#991b1b' : '#dc2626'),
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Budget',
        data: categories.length ? budgetValues : [0],
        backgroundColor: 'rgba(148, 163, 184, 0.35)',
        borderColor: '#94a3b8',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
  const config = {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#334155', usePointStyle: true, padding: 14 },
        },
        tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#475569', callback: (value) => formatDisplayDate(categories[value] || '') } },
        y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value), color: '#475569' }, grid: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
    },
  };

  updateBudgetStatus(categories, spentValues, budgetValues);
  chartPlaceholder.textContent = hasBudgets ? 'Set budgets above to compare category spending.' : 'Set a budget above to compare spending by category.';

  if (!entries.length) {
    if (budgetChart) {
      budgetChart.destroy();
      budgetChart = null;
    }
    chartCanvas.style.display = 'none';
    if (chartPlaceholder) chartPlaceholder.style.display = 'block';
    return;
  }

  chartCanvas.style.display = hasBudgets ? '' : 'none';
  if (chartPlaceholder) chartPlaceholder.style.display = hasBudgets ? 'none' : 'block';

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

  const { startDate, endDate } = getDateRangeValues();
  if (!startDate || !endDate) {
    alert('Please select the date range before downloading the report.');
    return;
  }
  if (startDate > endDate) {
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
  const margin = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 96;

  const addFooter = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Budget App', margin, pageHeight - 14);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  };

  doc.setFillColor(15, 118, 110);
  doc.roundedRect(margin, 28, pageWidth - margin * 2, 48, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('Budget App', margin + 16, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Monthly financial summary', margin + 16, 66);
  doc.text(`Generated ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`, pageWidth - margin - 16, 51, { align: 'right' });
  doc.text(`Period ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`, pageWidth - margin - 16, 66, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Summary', margin, y);
  y += 10;

  const tableWidth = pageWidth - margin * 2;
  doc.autoTable({
    startY: y,
    theme: 'plain',
    tableWidth,
    head: [['Metric', 'Amount']],
    body: [
      ['Opening Balance', formatPdfCurrency(openingBalance)],
      ['Total Income', formatPdfCurrency(totalIncome)],
      ['Total Expenses', formatPdfCurrency(totalExpenses)],
      ['Savings', formatPdfCurrency(savings)],
      ['Closing Balance', formatPdfCurrency(closingBalance)],
    ],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 6, right: 10, bottom: 6, left: 10 }, textColor: [51, 65, 85] },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'left' },
    bodyStyles: { lineColor: [226, 232, 240], lineWidth: 0.35 },
    columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: tableWidth - 260, halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin, right: margin },
    tableLineWidth: 0,
  });

  y = doc.lastAutoTable.finalY + 18;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Entries', margin, y);
  y += 10;

  const entryBody = filteredEntries.map((record) => [record.type, formatDisplayDate(record.date), record.category, record.description, formatPdfCurrency(record.amount)]);
  if (filteredEntries.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No entries available.', margin, y);
    y += 20;
  } else {
    doc.autoTable({
      startY: y,
      theme: 'plain',
      tableWidth,
      head: [['Type', 'Date', 'Category', 'Description', 'Amount']],
      body: entryBody,
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 5, right: 7, bottom: 5, left: 7 }, textColor: [51, 65, 85], overflow: 'linebreak' },
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { lineColor: [226, 232, 240], lineWidth: 0.35 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 72 }, 2: { cellWidth: 92 }, 3: { cellWidth: tableWidth - 62 - 72 - 92 - 82 }, 4: { cellWidth: 82, halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
      tableLineWidth: 0,
    });
    y = doc.lastAutoTable.finalY + 18;
  }

  if (y + 180 > pageHeight - 42) {
    addFooter();
    doc.addPage();
    y = 48;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Spending overview', margin, y);
  y += 10;

  const chartImage = chartCanvas.toDataURL('image/png', 1.0);
  const chartWidth = pageWidth - margin * 2;
  const chartHeight = Math.min(chartWidth * 0.48, pageHeight - y - 54);
  doc.addImage(chartImage, 'PNG', margin, y, chartWidth, chartHeight);
  addFooter();

  const fileName = `Budget report - ${endDate}.pdf`;
  doc.save(fileName);
}

function syncReportDateRange() {
  const startDate = parseDisplayDate(reportStartDate.value);
  const endDate = parseDisplayDate(reportEndDate.value);
  reportEndDate.min = startDate || '';
  reportStartDate.max = endDate || '';
  if (startDate && endDate && startDate > endDate) {
    reportEndDate.value = '';
  }
}

function updateCategoryOptions() {
  incomeCategory.innerHTML = '';
  expenseCategory.innerHTML = '';
  [...categoryOptions.Income, ...customCategories.Income.map((category) => category.name)].forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    incomeCategory.appendChild(optionElement);
  });
  [...categoryOptions.Expense, ...customCategories.Expense.map((category) => category.name)].forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    expenseCategory.appendChild(optionElement);
  });
  updateCategoryFilterOptions();
  updateBudgetControls();
}

function openCategoryDialog(type) {
  activeCategoryType = type;
  categoryDialogTitle.textContent = `Add ${type.toLowerCase()} category`;
  categoryForm.reset();
  categoryMessage.textContent = '';
  categoryDialog.hidden = false;
  categoryName.focus();
}

function closeCategoryDialog() {
  categoryDialog.hidden = true;
  activeCategoryType = '';
}

function addCustomCategory(event) {
  event.preventDefault();
  const name = categoryName.value.trim();
  const description = categoryDescription.value.trim();
  const allNames = [...categoryOptions[activeCategoryType], ...customCategories[activeCategoryType].map((category) => category.name)];

  if (allNames.some((option) => option.toLowerCase() === name.toLowerCase())) {
    categoryMessage.textContent = 'That category already exists.';
    return;
  }

  customCategories[activeCategoryType].push({ name, description });
  saveBudgetState();
  updateCategoryOptions();
  const targetCategory = activeCategoryType === 'Income' ? incomeCategory : expenseCategory;
  targetCategory.value = name;
  closeCategoryDialog();
}

function addEntryRecord(event, type, dateEl, categoryEl, descriptionEl, amountEl) {
  event.preventDefault();
  const date = parseDisplayDate(dateEl.value);
  const category = categoryEl.value;
  const description = descriptionEl.value.trim();
  const amount = Number(amountEl.value);

  if (!date || !category || !description || amount <= 0) {
    alert('Select a valid date and complete all fields.');
    return;
  }

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

function downloadTransactions() {
  const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDFConstructor) {
    alert('PDF export is unavailable.');
    return;
  }

  const { startDate, endDate } = getDateRangeValues();
  if (!startDate || !endDate) {
    alert('Please select the date range before downloading transactions.');
    return;
  }
  if (startDate > endDate) {
    alert('The transaction start date must be before the end date.');
    return;
  }

  const filteredEntries = entries.filter((item) => (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate));
  const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnX = [margin, 125, 220, 335, pageWidth - margin - 90];
  const rowHeight = 18;
  let y = margin + 58;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Transactions', margin, margin);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 20);

  if (filteredEntries.length === 0) {
    doc.text('No transactions available.', margin, margin + 48);
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y - 13, pageWidth - margin * 2, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    ['Type', 'Date', 'Category', 'Description', 'Amount'].forEach((heading, index) => doc.text(heading, columnX[index], y));
    y += rowHeight;
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');

    filteredEntries.forEach((record) => {
      const descriptionLines = doc.splitTextToSize(record.description, columnX[4] - columnX[3] - 12);
      const currentRowHeight = Math.max(rowHeight, descriptionLines.length * 12 + 6);
      if (y + currentRowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y - 13, pageWidth - margin * 2, currentRowHeight, 'S');
      doc.text(record.type, columnX[0], y);
      doc.text(formatDisplayDate(record.date), columnX[1], y);
      doc.text(record.category, columnX[2], y);
      doc.text(descriptionLines, columnX[3], y);
      doc.text(formatPdfCurrency(record.amount), columnX[4], y, { align: 'right' });
      y += currentRowHeight;
    });
  }

  const pdfBlob = doc.output('blob');
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `Transactions-${startDate || 'all'}-to-${endDate || 'all'}.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function downloadTransactionsExcel() {
  const { startDate, endDate } = getDateRangeValues();
  if (!startDate || !endDate) {
    alert('Please select the date range before downloading transactions.');
    return;
  }
  if (startDate > endDate) {
    alert('The transaction start date must be before the end date.');
    return;
  }

  const filteredEntries = entries.filter((item) => (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate));
  const escapeCsvValue = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['Type', 'Date', 'Category', 'Description', 'Amount'],
    ...filteredEntries.map((record) => [record.type, formatDisplayDate(record.date), record.category, record.description, record.amount]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `Transactions-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function openDownloadFormatDialog() {
  downloadFormatDialog.hidden = false;
}

function closeDownloadFormatDialog() {
  downloadFormatDialog.hidden = true;
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
addCategoryBudgetButton.addEventListener('click', addCategoryBudget);
budgetListButton.addEventListener('click', () => {
  budgetListPanel.hidden = !budgetListPanel.hidden;
});
incomeForm.addEventListener('submit', (e) => addEntryRecord(e, 'Income', incomeDate, incomeCategory, incomeDescription, incomeAmount));
expenseForm.addEventListener('submit', (e) => addEntryRecord(e, 'Expense', expenseDate, expenseCategory, expenseDescription, expenseAmount));
reportForm.addEventListener('submit', generateReportPdf);
reportStartDate.addEventListener('change', syncReportDateRange);
reportEndDate.addEventListener('change', syncReportDateRange);
deleteSelectedButton.addEventListener('click', deleteSelected);
downloadTransactionsButton.addEventListener('click', openDownloadFormatDialog);
downloadPdfOption.addEventListener('click', () => {
  closeDownloadFormatDialog();
  downloadTransactions();
});
downloadExcelOption.addEventListener('click', () => {
  closeDownloadFormatDialog();
  downloadTransactionsExcel();
});
cancelDownloadButton.addEventListener('click', closeDownloadFormatDialog);
selectAllCheckbox.addEventListener('change', (e) => toggleSelectAll(e.target.checked));
[entryTypeFilter, entryDateFilter, entryDateFromFilter, entryDateToFilter, entryCategoryFilter, entryDescriptionFilter, entryAmountMinFilter, entryAmountMaxFilter].forEach((filter) => {
  filter.addEventListener('input', refreshEntries);
  filter.addEventListener('change', refreshEntries);
});
filterButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = document.getElementById(button.dataset.filterMenu);
    const shouldOpen = menu.hidden;
    closeFilterMenus();
    if (!shouldOpen) return;

    menu.hidden = false;
    const buttonRect = button.getBoundingClientRect();
    const headerRect = button.closest('th').getBoundingClientRect();
    const menuLeft = Math.min(headerRect.left, window.innerWidth - menu.offsetWidth - 8);
    menu.style.top = `${headerRect.bottom + 4}px`;
    menu.style.left = `${Math.max(8, menuLeft)}px`;
  });
});
filterMenus.forEach((menu) => menu.addEventListener('click', (event) => event.stopPropagation()));
window.addEventListener('scroll', closeFilterMenus, true);
document.addEventListener('click', closeFilterMenus);
entryAmountOperator.addEventListener('change', () => {
  updateAmountFilterFields();
  refreshEntries();
});
tipButton.addEventListener('click', showTipOfTheDay);
incomeClearButton.addEventListener('click', clearIncomeForm);
expenseClearButton.addEventListener('click', clearExpenseForm);
authForm.addEventListener('submit', handleAuthSubmit);
authModeButton.addEventListener('click', toggleAuthMode);
forgotPasswordButton.addEventListener('click', handleForgotPassword);
togglePasswordButton.addEventListener('click', togglePasswordVisibility);
logoutButton.addEventListener('click', handleLogout);
addIncomeCategoryButton.addEventListener('click', () => openCategoryDialog('Income'));
addExpenseCategoryButton.addEventListener('click', () => openCategoryDialog('Expense'));
categoryForm.addEventListener('submit', addCustomCategory);
cancelCategoryButton.addEventListener('click', closeCategoryDialog);
continueSessionButton.addEventListener('click', () => {
  hideIdleTimeoutDialog();
  resetIdleTimer();
});

['click', 'keydown', 'input', 'change', 'mousemove', 'pointermove', 'scroll', 'touchstart', 'focus'].forEach((eventName) => {
  document.addEventListener(eventName, handleActivity, { passive: true });
});

updateCategoryOptions();
updateRegistrationFields();
const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
if (savedSession && getStoredUsers()[savedSession]) {
  currentUsername = savedSession;
  currentUserName.textContent = currentUsername;
  loadBudgetState();
  setAuthenticatedView(true);
  refreshEntries();
  updateSummary();
  resetIdleTimer();
} else {
  setAuthenticatedView(false);
}
