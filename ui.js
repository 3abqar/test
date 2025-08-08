// ui.js
let serviceTypeChart, salesTrendChart;
let currentLanguage = "en"; // Default language, will be updated by main.js
let translations = {}; // Will be populated by main.js

export function setTranslations(data) {
  translations = data;
}

export function setCurrentLanguage(lang) {
  currentLanguage = lang;
}

export function initializeCharts() {
  Chart.defaults.font.family = "'Cairo', sans-serif";
  const serviceTypeCtx = document.getElementById("serviceTypeChart").getContext("2d");
  serviceTypeChart = new Chart(serviceTypeCtx, { type: "pie", data: { labels: [], datasets: [{ data: [], backgroundColor: ["#4A90E2", "#7ED321", "#F5A623", "#9013FE", "#BD10E0", "#4A4A4A"] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } });
  
  const salesTrendCtx = document.getElementById("salesTrendChart").getContext("2d");
  salesTrendChart = new Chart(salesTrendCtx, { type: "line", data: { labels: [], datasets: [{ label: "Revenue", data: [], borderColor: "#4A90E2", tension: 0.1 }, { label: "Profit", data: [], borderColor: "#7ED321", tension: 0.1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
}

export function updateCharts(salesData) {
  if (!serviceTypeChart || !salesTrendChart || !salesData) return;
  const isDarkMode = document.body.classList.contains("dark-mode");
  const textColor = isDarkMode ? "#f3f4f6" : "#374151";

  // Service Type Chart
  const serviceCounts = salesData.reduce((acc, sale) => { acc[sale.serviceType] = (acc[sale.serviceType] || 0) + sale.price; return acc; }, {});
  serviceTypeChart.data.labels = Object.keys(serviceCounts);
  serviceTypeChart.data.datasets[0].data = Object.values(serviceCounts);
  serviceTypeChart.options.plugins.legend.labels.color = textColor;
  serviceTypeChart.update();

  // Monthly Sales Trend Chart
  const monthlyData = {};
  salesData.forEach((sale) => {
    const month = sale.date.substring(0, 7);
    if (!monthlyData[month]) { monthlyData[month] = { revenue: 0, profit: 0 }; }
    monthlyData[month].revenue += sale.price;
    monthlyData[month].profit += sale.profit;
  });
  const sortedMonths = Object.keys(monthlyData).sort();
  salesTrendChart.data.labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      return new Date(year, month-1).toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', {month: 'short', year: 'numeric'})
  });
  salesTrendChart.data.datasets[0].data = sortedMonths.map((m) => monthlyData[m].revenue);
  salesTrendChart.data.datasets[0].label = translations[currentLanguage].revenue;
  salesTrendChart.data.datasets[1].data = sortedMonths.map((m) => monthlyData[m].profit);
  salesTrendChart.data.datasets[1].label = translations[currentLanguage].profit;

  salesTrendChart.options.plugins.legend.labels.color = textColor;
  salesTrendChart.options.scales.x.ticks.color = textColor;
  salesTrendChart.options.scales.y.ticks.color = textColor;
  salesTrendChart.update();
}

function salesRowContent(sale) {
    return `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${formatDate(sale.date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${sale.serviceType}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${sale.clientName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${formatCurrency(sale.price)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm ${sale.profit >= 0 ? "text-green-500" : "text-red-500"}">${formatCurrency(sale.profit)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.paymentStatus === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}">
                ${translations[currentLanguage][sale.paymentStatus] || sale.paymentStatus}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium actions-cell">
            <button class="edit-btn" data-id="${sale.id}" data-translate="edit"></button>
            <button class="delete-btn" data-id="${sale.id}" data-translate="delete"></button>
        </td>`;
}

export function renderSalesLog(dataToRender, editSaleCallback, deleteSaleCallback, pagination, onPageChange) {
  const tableBody = document.getElementById("salesTableBody");
  const existing = new Map();
  Array.from(tableBody.children).forEach(tr => existing.set(tr.dataset.id, tr));

  if (!dataToRender || dataToRender.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center" data-translate="no_sales_records_found"></td></tr>`;
    document.getElementById('salesPagination').innerHTML = '';
    setLanguage(currentLanguage);
    return;
  }

  dataToRender.forEach(sale => {
      const id = sale.id;
      const content = salesRowContent(sale);
      let row = existing.get(id);
      if (row) {
          if (row.dataset.hash !== content) {
              row.innerHTML = content;
              row.dataset.hash = content;
          }
          existing.delete(id);
      } else {
          row = document.createElement('tr');
          row.className = "hover:bg-gray-50 dark:hover:bg-slate-700";
          row.dataset.id = id;
          row.dataset.hash = content;
          row.innerHTML = content;
          tableBody.appendChild(row);
      }
  });

  existing.forEach(tr => tr.remove());

  tableBody.querySelectorAll(".delete-btn").forEach(btn => btn.onclick = function(){ deleteSaleCallback(this.dataset.id); });
  tableBody.querySelectorAll(".edit-btn").forEach(btn => btn.onclick = function(){ editSaleCallback(this.dataset.id); });

  const pagDiv = document.getElementById('salesPagination');
  pagDiv.innerHTML = `
    <button id="prevSales" class="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded" ${pagination.currentPage === 1 ? 'disabled' : ''} data-translate="previous"></button>
    <span class="dark:text-white">${pagination.currentPage} / ${pagination.totalPages}</span>
    <button id="nextSales" class="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-translate="next"></button>
  `;
  document.getElementById('prevSales').onclick = () => onPageChange(pagination.currentPage - 1);
  document.getElementById('nextSales').onclick = () => onPageChange(pagination.currentPage + 1);
  setLanguage(currentLanguage);
}

function customerRowContent(customer) {
    const isVip = (customer.tags && customer.tags.includes('VIP')) || (customer.totalSpent || 0) > 10000;
    const lastPurchase = new Date(customer.lastPurchase);
    const daysInactive = lastPurchase && !isNaN(lastPurchase) ? (Date.now() - lastPurchase.getTime()) / (1000*60*60*24) : Infinity;
    let typeKey = 'type_new';
    let badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (daysInactive > 30) {
        typeKey = 'type_inactive';
        badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    } else if ((customer.totalOrders || 0) > 1) {
        typeKey = 'type_returning';
        badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    const warningIcon = daysInactive > 30 ? `<svg class="inline w-4 h-4 text-yellow-500 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="${translations[currentLanguage].inactive_tooltip}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.1 0 1.98-.9 1.87-2L18.87 5c-.1-1.1-1-2-2.1-2H7.23c-1.1 0-2 .9-2.1 2L3.1 17c-.1 1.1.77 2 1.97 2z" /></svg>` : '';
    return `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            ${customer.name} ${isVip ? '<span class="vip-badge" data-translate="vip">VIP</span>' : ''}
            <span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}" data-translate="${typeKey}"></span>
            ${warningIcon}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${customer.whatsappNumber || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${formatDate(customer.lastPurchase)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${customer.totalOrders || 0}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${formatCurrency(customer.totalSpent)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium actions-cell space-x-2">
            <button class="copy-phone" data-number="${customer.whatsappNumber}" title="${translations[currentLanguage].copy}">
                <svg class="w-5 h-5 inline text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V6a2 2 0 00-2-2h-6M6 16H5a2 2 0 01-2-2V6a2 2 0 012-2h6"></path></svg>
            </button>
            <a href="https://wa.me/${customer.whatsappNumber}" target="_blank" class="open-whatsapp" title="WhatsApp">
                <svg class="w-5 h-5 inline text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16c0 2.837.74 5.51 2.029 7.844L0 32l8.363-2.19A15.901 15.901 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0z" fill="currentColor"/><path d="M24.26 22.04c-.37.94-2.16 1.79-2.97 1.91-.76.11-1.74.16-2.81-.17-.65-.21-1.48-.48-2.55-.94-4.49-1.95-7.4-6.52-7.63-6.82-.23-.3-1.82-2.42-1.82-4.62s1.15-3.27 1.56-3.72c.41-.45.9-.56 1.2-.56.3 0 .6 0 .86.02.27.01.65-.11 1.02.78.37.89 1.26 3.07 1.37 3.29.11.23.18.5.04.8-.23.49-.35.8-.7 1.23-.23.28-.48.63-.2 1.2.28.56 1.24 2.05 2.66 3.32 1.83 1.63 3.36 2.14 3.92 2.37.56.23.89.2 1.22-.12.33-.32 1.4-1.64 1.78-2.2.37-.56.74-.47 1.22-.28.49.19 3.09 1.45 3.62 1.72.53.27.88.4 1 .62.23.12 1.34-.25 2.27z" fill="#fff"/></svg>
            </a>
            <button class="quick-order" data-name="${customer.name}" data-number="${customer.whatsappNumber}" title="New Order">
                <svg class="w-5 h-5 inline text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            </button>
            <button class="details-btn" data-id="${customer.whatsappNumber}" data-translate="details"></button>
        </td>
    `;
}

export function renderCustomerDatabase(customersArray, showCustomerDetailsCallback, pagination, onPageChange, quickOrderCallback) {
  const tableBody = document.getElementById("customersTableBody");
  const existing = new Map();
  Array.from(tableBody.children).forEach(tr => existing.set(tr.dataset.id, tr));

  if (!customersArray || customersArray.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center" data-translate="no_customer_records_found"></td></tr>`;
    setLanguage(currentLanguage);
    document.getElementById('customersPagination').innerHTML = '';
    return;
  }

  customersArray.forEach(customer => {
      const id = customer.whatsappNumber || customer.id;
      const content = customerRowContent(customer);
      let row = existing.get(id);
      if (row) {
          if (row.dataset.hash !== content) {
              row.innerHTML = content;
              row.dataset.hash = content;
          }
          existing.delete(id);
      } else {
          row = document.createElement('tr');
          row.className = "hover:bg-gray-50 dark:hover:bg-slate-700";
          row.dataset.id = id;
          row.dataset.hash = content;
          row.innerHTML = content;
          tableBody.appendChild(row);
      }
  });

  existing.forEach(tr => tr.remove());

  tableBody.querySelectorAll(".details-btn").forEach(btn => btn.onclick = function(){ showCustomerDetailsCallback(this.dataset.id); });
  tableBody.querySelectorAll('.copy-phone').forEach(btn => btn.onclick = () => { navigator.clipboard.writeText(btn.dataset.number); showNotification(translations[currentLanguage].copied, 'success'); });
  tableBody.querySelectorAll('.quick-order').forEach(btn => btn.onclick = () => { quickOrderCallback(btn.dataset.name, btn.dataset.number); });

  const pagDiv = document.getElementById('customersPagination');
  pagDiv.innerHTML = `
    <button id="prevCustomers" class="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded" ${pagination.currentPage === 1 ? 'disabled' : ''} data-translate="previous"></button>
    <span class="dark:text-white">${pagination.currentPage} / ${pagination.totalPages}</span>
    <button id="nextCustomers" class="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-translate="next"></button>
  `;
  document.getElementById('prevCustomers').onclick = () => onPageChange(pagination.currentPage - 1);
  document.getElementById('nextCustomers').onclick = () => onPageChange(pagination.currentPage + 1);
  setLanguage(currentLanguage);
}


export function renderDebtManagement(salesData, markAsPaidCallback) {
  const tableBody = document.getElementById("debtTableBody");
  const unpaidOrders = salesData.filter((sale) => sale.paymentStatus === "unpaid");
  tableBody.innerHTML = "";

  if (unpaidOrders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center" data-translate="no_unpaid_orders"></td></tr>`;
    setLanguage(currentLanguage);
    return;
  }

  unpaidOrders.forEach((sale) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 dark:hover:bg-slate-700";
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${formatDate(sale.date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">${sale.clientName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-semibold">${formatCurrency(sale.price)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium actions-cell">
            <button class="mark-paid-btn" data-id="${sale.id}" data-translate="mark_as_paid"></button>
        </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".mark-paid-btn").forEach((btn) => btn.addEventListener("click", function () { markAsPaidCallback(this.dataset.id); }));
  setLanguage(currentLanguage);
}

export function updateKpiCards(salesData, customersData) {
    const now = new Date();
    const thisMonthStr = now.toISOString().substring(0, 7);
    
    const thisMonthSales = salesData.filter(s => s.date.substring(0, 7) === thisMonthStr);

    // 1. Calculate Monthly Revenue
    const monthlyRevenue = thisMonthSales.reduce((sum, s) => sum + s.price, 0);
    document.getElementById("monthlyRevenue").textContent = monthlyRevenue.toFixed(2);

    // 2. Calculate Profit Margin (Total)
    const totalRevenue = salesData.reduce((sum, s) => sum + s.price, 0);
    const totalProfit = salesData.reduce((sum, s) => sum + s.profit, 0);
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    document.getElementById("profitMargin").textContent = profitMargin;
    
    // 3. Calculate Average Sale Value
    const avgSaleValue = thisMonthSales.length > 0 ? monthlyRevenue / thisMonthSales.length : 0;
    document.getElementById("avgSaleValue").textContent = avgSaleValue.toFixed(2);
    
    // 4. Calculate New Customers This Month
    const salesByCustomer = {};
    salesData.forEach(sale => {
        if (sale.whatsappNumber) {
            if (!salesByCustomer[sale.whatsappNumber]) {
                salesByCustomer[sale.whatsappNumber] = [];
            }
            salesByCustomer[sale.whatsappNumber].push(sale.date);
        }
    });
    
    let newCustomersThisMonth = 0;
    for (const customer in salesByCustomer) {
        const firstSaleDate = salesByCustomer[customer].sort()[0];
        if (firstSaleDate.substring(0, 7) === thisMonthStr) {
            newCustomersThisMonth++;
        }
    }
    document.getElementById("newCustomers").textContent = newCustomersThisMonth;

    const totalCustomers = customersData ? Object.keys(customersData).length : 0;
    const returningCount = customersData ? Object.values(customersData).filter(c => (c.totalOrders || 0) > 1).length : 0;
    const newCount = customersData ? Object.values(customersData).filter(c => (c.totalOrders || 0) === 1).length : 0;
    const inactiveList = customersData ? Object.values(customersData).filter(c => {
        const last = new Date(c.lastPurchase);
        return last && !isNaN(last) && (Date.now() - last.getTime()) > 30*24*60*60*1000;
    }) : [];
    const inactiveCount = inactiveList.length;
    const newPercent = totalCustomers > 0 ? Math.round((newCount/totalCustomers)*100) : 0;
    const returningPercent = totalCustomers > 0 ? Math.round((returningCount/totalCustomers)*100) : 0;
    const nvEl = document.getElementById('newVsReturning');
    if (nvEl) nvEl.textContent = `${newPercent}% / ${returningPercent}%`;
    const inactEl = document.getElementById('inactiveClientsCount');
    if (inactEl) inactEl.textContent = inactiveCount;
    const inactListEl = document.getElementById('inactiveClientsList');
    if (inactListEl) inactListEl.innerHTML = inactiveList.slice(0,3).map(c=>`<li>${c.name}</li>`).join('');

    const monthSalesByCustomer = {};
    thisMonthSales.forEach(sale => {
        monthSalesByCustomer[sale.clientName] = (monthSalesByCustomer[sale.clientName] || 0) + sale.price;
    });
    const topClient = Object.entries(monthSalesByCustomer).sort((a,b) => b[1]-a[1])[0];
    const topClientEl = document.getElementById('topClientThisMonth');
    if (topClientEl) topClientEl.textContent = topClient ? `${topClient[0]} (${formatCurrency(topClient[1])})` : 'N/A';

    const profitByCustomer = {};
    salesData.forEach(sale => {
        profitByCustomer[sale.clientName] = (profitByCustomer[sale.clientName] || 0) + sale.profit;
    });
    const topProfit = Object.entries(profitByCustomer).sort((a,b)=> b[1]-a[1])[0];
    const mpEl = document.getElementById('mostProfitableClient');
    if (mpEl) mpEl.textContent = topProfit ? `${topProfit[0]} (${formatCurrency(topProfit[1])})` : 'N/A';
}

export function renderActivityFeed(salesData) {
    const feedContainer = document.getElementById("activityFeed");
    if (!feedContainer) return;
    feedContainer.innerHTML = ""; // Clear old items

    const recentSales = salesData.slice(0, 5);

    if (recentSales.length === 0) {
        feedContainer.innerHTML = `<p class="text-gray-500 dark:text-slate-400">No recent activity.</p>`;
        return;
    }

    recentSales.forEach(sale => {
        const item = document.createElement("div");
        item.className = "activity-item";
        
        let iconBg = sale.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500';
        let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`;

        item.innerHTML = `
          <div class="activity-icon ${iconBg}">
            ${iconSvg}
          </div>
          <div>
            <p class="text-sm font-medium dark:text-white">New sale to ${sale.clientName}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">${sale.serviceType} - ${formatCurrency(sale.price)}</p>
          </div>
        `;
        feedContainer.appendChild(item);
    });
}

export function renderNotifications(messages) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!messages || messages.length === 0) return;
    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'stat-card p-4 flex items-center bg-white dark:bg-slate-800 rounded-lg';
        card.innerHTML = `<p class="text-sm text-gray-700 dark:text-slate-200">${msg}</p>`;
        container.appendChild(card);
    });
}

export function updateActivityList(activities) {
    const list = document.getElementById('activityList');
    if (!list) return;
    list.innerHTML = '';
    if (!activities || activities.length === 0) {
        list.innerHTML = `<p class="text-gray-500 dark:text-slate-400 p-2">No recent activity.</p>`;
        return;
    }
    activities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'p-2 border-b dark:border-slate-700';
        item.innerHTML = `<p class="text-sm dark:text-white">${act.text}</p><p class="text-xs text-gray-500 dark:text-slate-400">${new Date(act.timestamp).toLocaleString()} - ${act.user || ''} - ${act.device || ''}</p>`;
        list.appendChild(item);
    });
    setLanguage(currentLanguage);
}

export function updateDashboardUI(salesData, dailyGoal) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // This function now only handles the second row of stats and the goal progress bar
    document.getElementById("dashboardTotalOrders").textContent = salesData.length;
    const serviceCounts = salesData.reduce((acc, sale) => { acc[sale.serviceType] = (acc[sale.serviceType] || 0) + 1; return acc; }, {});
    const topService = Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b, "N/A");
    const topServiceEl = document.getElementById("dashboardTopService");
    topServiceEl.textContent = topService;
    topServiceEl.title = topService;
    
    updateProfitByDateUI(todayStr, salesData);
    const totalDebt = salesData.filter(s => s.paymentStatus === "unpaid").reduce((sum, s) => sum + s.price, 0);
    document.getElementById("totalDebt").textContent = totalDebt.toFixed(2);

    const todaySales = salesData.filter(s => s.date === todayStr);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
    const goalPercentage = dailyGoal > 0 ? Math.round(Math.min((todayProfit / dailyGoal) * 100, 100)) : 0;

    const dailyGoalProgress = document.getElementById("dailyGoalProgress");
    if(dailyGoalProgress) { // Check if element exists before updating
        dailyGoalProgress.style.width = `${goalPercentage}%`;
    }

    const goalTextElement = document.getElementById("dailyGoalFullText");
    if(goalTextElement) {
        const sentenceTemplate = translations[currentLanguage].daily_goal_sentence || "% of profit goal";
        goalTextElement.textContent = `${goalPercentage}${sentenceTemplate}`;
    }

    renderServiceProfitability(salesData);
    setLanguage(currentLanguage);
}

export function updateProfitByDateUI(dateStr, salesData) {
    if (!dateStr) return;
    const salesForDate = salesData.filter(s => s.date === dateStr);
    const profitForDate = salesForDate.reduce((sum, s) => sum + s.profit, 0);
    document.getElementById("dateProfitValue").textContent = profitForDate.toFixed(2);
}

export function renderServiceProfitability(salesData) {
    const body = document.getElementById("serviceProfitabilityBody");
    body.innerHTML = "";
    const serviceStats = {};
    salesData.forEach((sale) => {
        if (!serviceStats[sale.serviceType]) {
            serviceStats[sale.serviceType] = { orders: 0, revenue: 0, profit: 0 };
        }
        serviceStats[sale.serviceType].orders++;
        serviceStats[sale.serviceType].revenue += sale.price;
        serviceStats[sale.serviceType].profit += sale.profit;
    });

    if (Object.keys(serviceStats).length === 0) {
        body.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center" data-translate="no_data_available"></td></tr>`;
    } else {
        Object.entries(serviceStats)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .forEach(([service, stats]) => {
                const avgProfit = stats.orders > 0 ? stats.profit / stats.orders : 0;
                const row = document.createElement("tr");
                row.className = "hover:bg-gray-50 dark:hover:bg-slate-700";
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${service}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${stats.orders}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${formatCurrency(stats.revenue)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${avgProfit >= 0 ? "text-green-500" : "text-red-500"}">${formatCurrency(avgProfit)}</td>
                `;
                body.appendChild(row);
            });
    }
    setLanguage(currentLanguage); // Re-apply translations for new elements
}

export function showDeleteConfirmationUI(confirmDeleteCallback) {
    const dialog = document.getElementById("deleteConfirmationModal");
    dialog.classList.remove("hidden");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    
    const confirmAction = () => {
        confirmDeleteCallback();
        dialog.classList.add("hidden");
    };

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener("click", confirmAction, { once: true });
    newConfirmBtn.setAttribute('data-translate', 'delete');
    setLanguage(currentLanguage); 
}

export function hideDeleteConfirmationUI() {
    document.getElementById("deleteConfirmationModal").classList.add("hidden");
}

export function fillSaleForm(sale) {
  document.getElementById("editingSaleId").value = sale.id;
  document.getElementById("date").value = sale.date;
  document.getElementById("serviceType").value = sale.serviceType;
  document.getElementById("price").value = sale.price;
  document.getElementById("serviceCost").value = sale.serviceCost;
  document.getElementById("clientName").value = sale.clientName;
  document.getElementById("whatsappNumber").value = sale.whatsappNumber;
  document.getElementById("paymentStatus").value = sale.paymentStatus;
  document.getElementById("notes").value = sale.notes;

  document.querySelector('[data-tab="sales-entry"]').click();
  window.scrollTo(0,0);
}

export function resetSaleForm() {
  document.getElementById("salesForm").reset();
  document.getElementById("editingSaleId").value = "";
  document.getElementById("date").valueAsDate = new Date();
}

export function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationMessage = document.getElementById("notificationMessage");
  notificationMessage.textContent = message;
  notification.classList.remove("bg-green-100", "text-green-800", "bg-red-100", "text-red-800", "dark:bg-green-900", "dark:text-green-200", "dark:bg-red-900", "dark:text-red-200");
  const color = type === "error" ? "red" : "green";
  notification.classList.add(`bg-${color}-100`, `text-${color}-800`, `dark:bg-${color}-900`, `dark:text-${color}-200`);
  notification.classList.remove("-translate-x-full");
  setTimeout(() => { notification.classList.add("-translate-x-full"); }, 3000);
}

export function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        document.body.classList.remove('loading');
    }
}
export function handleLoadingErrorUI(error) {
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingError = document.getElementById('loadingError');
    console.error("Firebase Initialization Error:", error);
    loadingMessage.classList.add('hidden');
    loadingError.textContent = translations[currentLanguage].firebase_error;
    loadingError.classList.remove('hidden');
}

export function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-translate]").forEach((el) => {
    const key = el.dataset.translate;
    if (translations[lang]?.[key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = translations[lang].currency;
  });

  const profitGoalInput = document.getElementById('profitGoalInput');
  if (profitGoalInput) {
    profitGoalInput.placeholder = translations[lang].profit_goal_placeholder;
  }
  const inactiveCustomersList = document.getElementById('inactiveCustomersList');
  if (inactiveCustomersList) {
    inactiveCustomersList.placeholder = translations[lang].inactive_customers_placeholder;
  }
  const customerSearch = document.getElementById('customerSearch');
  if (customerSearch) {
    customerSearch.placeholder = translations[lang].search;
  }
}

export function formatCurrency(value) {
  return `${(value || 0).toFixed(2)} ${translations[currentLanguage].currency}`;
}

export function formatDate(dateString) {
  if (!dateString || dateString.startsWith('1970')) return 'N/A';
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString(currentLanguage === "ar" ? "ar-EG" : "en-US", options);
}

export function showCustomerDetailsUI(customer, history, totalProfit, avgProfit, reminders, addTagCallback, removeTagCallback, addNoteCallback, addReminderCallback, removeReminderCallback) {
    document.getElementById("modalCustomerName").textContent = customer.name;
    document.getElementById("modalCustomerWhatsapp").textContent = customer.whatsappNumber;
    document.getElementById("modalCustomerTotalOrders").textContent = history.length;
    document.getElementById("modalCustomerTotalSpent").textContent = formatCurrency(history.reduce((s, h) => s + h.price, 0));
    document.getElementById("modalCustomerTotalProfit").textContent = formatCurrency(totalProfit);
    document.getElementById("modalCustomerAvgProfit").textContent = formatCurrency(avgProfit);

    const historyBody = document.getElementById("modalPurchaseHistory");
    historyBody.innerHTML = "";
    if (history && history.length > 0) {
        history.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(sale => {
            const row = historyBody.insertRow();
            row.className = "hover:bg-gray-50 dark:hover:bg-slate-700";
            row.innerHTML = `<td class="px-4 py-2 text-sm">${formatDate(sale.date)}</td><td class="px-4 py-2 text-sm">${sale.serviceType}</td><td class="px-4 py-2 text-sm">${formatCurrency(sale.price)}</td>`;
        });
    }

    renderCustomerTagsUI(customer, removeTagCallback);
    const addTagBtn = document.getElementById("addTagBtn");
    const newTagInput = document.getElementById("newTagInput");
    addTagBtn.onclick = () => addTagCallback(customer.whatsappNumber, newTagInput.value.trim());

    renderCustomerNotesUI(customer);
    const addNoteBtn = document.getElementById("addNoteBtn");
    const newNoteInput = document.getElementById("newNoteInput");
    addNoteBtn.onclick = () => addNoteCallback(customer.whatsappNumber, newNoteInput.value.trim());

    renderCustomerRemindersUI(reminders, customer.whatsappNumber, removeReminderCallback);
    const addReminderBtn = document.getElementById("addReminderBtn");
    const newReminderDate = document.getElementById("newReminderDate");
    const newReminderText = document.getElementById("newReminderText");
    addReminderBtn.onclick = () => addReminderCallback(customer.whatsappNumber, newReminderDate.value, newReminderText.value.trim());

    document.getElementById("customerDetailsModal").classList.remove("hidden");
    setLanguage(currentLanguage);
}

export function hideCustomerDetailsUI() {
    document.getElementById("customerDetailsModal").classList.add("hidden");
}

export function renderCustomerTagsUI(customer, removeTagCallback) {
    const tagsContainer = document.getElementById("modalCustomerTags");
    tagsContainer.innerHTML = "";
    if (customer.tags && customer.tags.length > 0) {
        customer.tags.forEach(tag => {
            const badge = document.createElement("span");
            badge.className = "tag-badge";
            badge.textContent = tag;
            const removeBtn = document.createElement("button");
            removeBtn.className = "ml-2 text-red-500 hover:text-red-700";
            removeBtn.innerHTML = "&times;";
            removeBtn.onclick = () => removeTagCallback(customer.whatsappNumber, tag);
            badge.appendChild(removeBtn);
            tagsContainer.appendChild(badge);
        });
    } else {
        tagsContainer.textContent = "No tags yet.";
    }
    setLanguage(currentLanguage);
}

export function renderCustomerNotesUI(customer) {
    const notesContainer = document.getElementById("modalNotesTimeline");
    notesContainer.innerHTML = "";
    if (customer.notes && customer.notes.length > 0) {
        customer.notes.sort((a,b) => b.timestamp - a.timestamp).forEach(note => {
            const noteEl = document.createElement("div");
            noteEl.className = "p-2 bg-gray-100 dark:bg-slate-700 rounded-md";
            noteEl.innerHTML = `<p class="text-sm">${note.text}</p><p class="text-xs text-gray-500 dark:text-slate-400 mt-1">${new Date(note.timestamp).toLocaleString()}</p>`;
            notesContainer.appendChild(noteEl);
        });
    } else {
        notesContainer.textContent = "No notes yet.";
    }
    setLanguage(currentLanguage);
}

export function renderCustomerRemindersUI(reminders, whatsapp, removeReminderCallback) {
    const container = document.getElementById('modalReminders');
    container.innerHTML = '';
    if (reminders && reminders.length > 0) {
        reminders.forEach((rem, index) => {
            const el = document.createElement('div');
            el.className = 'p-2 bg-gray-100 dark:bg-slate-700 rounded-md flex justify-between items-center';
            el.innerHTML = `<span class="text-sm">${rem.date}: ${rem.text}</span><button class="text-red-500" data-index="${index}">&times;</button>`;
            container.appendChild(el);
        });
        container.querySelectorAll('button').forEach(btn => btn.onclick = () => removeReminderCallback(whatsapp, btn.dataset.index));
    } else {
        container.textContent = 'No reminders yet.';
    }
    setLanguage(currentLanguage);
}

export function updatePLReportResult(period, income, expenses, net) {
    const resultDiv = document.getElementById('plReportResult');
    resultDiv.innerHTML = `
        <h4 class="font-bold mb-2">${period.charAt(0).toUpperCase() + period.slice(1)} Report</h4>
        <p><strong>${translations[currentLanguage].total_income}:</strong> ${formatCurrency(income)}</p>
        <p><strong>${translations[currentLanguage].total_expenses}:</strong> ${formatCurrency(expenses)}</p>
        <hr class="my-2 dark:border-slate-600">
        <p class="font-bold ${net >= 0 ? 'text-green-500' : 'text-red-500'}">
            <strong>${net >= 0 ? translations[currentLanguage].net_profit : translations[currentLanguage].net_loss}:</strong>
            ${formatCurrency(Math.abs(net))}
        </p>
    `;
    resultDiv.classList.remove('hidden');
    setLanguage(currentLanguage);
}

export function updateInactiveCustomersList(inactiveCustomers) {
    const listArea = document.getElementById('inactiveCustomersList');
    listArea.value = inactiveCustomers.map(c => c.whatsappNumber).join('\n');
    setLanguage(currentLanguage);
}

export function updateGoalSimulatorResult(goal, serviceStats) {
    const resultDiv = document.getElementById('goalSimulatorResult');
    if (!goal) {
        resultDiv.innerHTML = `<p class="text-red-500">Please enter a valid profit goal.</p>`;
        setLanguage(currentLanguage);
        return;
    }

    let resultHTML = `<p class="mb-2">${translations[currentLanguage].goal_sim_intro_1} <strong>${formatCurrency(goal)}</strong>, ${translations[currentLanguage].goal_sim_intro_2}</p><ul class="list-disc list-inside">`;
    for (const service in serviceStats) {
        const avgProfit = serviceStats[service].profit / serviceStats[service].count;
        if (avgProfit > 0) {
            const salesNeeded = Math.ceil(goal / avgProfit);
            resultHTML += `<li><strong>${salesNeeded}</strong> ${translations[currentLanguage].goal_sim_orders_of} '${service}'</li>`;
        }
    }
    resultHTML += `</ul>`;
    resultDiv.innerHTML = resultHTML;
    setLanguage(currentLanguage);
}

export function updateBasketAnalysisResult(sortedPairs) {
    const resultDiv = document.getElementById('basketAnalysisResult');
    if(sortedPairs.length === 0) {
        resultDiv.innerHTML = `<p>Not enough data for analysis.</p>`;
        setLanguage(currentLanguage);
        return;
    }

    let resultHTML = `<p class="mb-2"><strong>Frequently Bought Together:</strong></p><ul class="list-disc list-inside">`;
    sortedPairs.slice(0, 3).forEach(pair => {
        resultHTML += `<li>${pair[0]} (${pair[1]} times)</li>`;
    });
    resultHTML += `</ul>`;
    resultDiv.innerHTML = resultHTML;
    setLanguage(currentLanguage);
}