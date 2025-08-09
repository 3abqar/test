// main.js - الكود الكامل والنهائي

import { db, auth, salesCollection, customersCollection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc, query, where, getDocs, writeBatch, onAuthStateChanged, signInAnonymously } from './firebase.js';import * as UI from './ui.js';
import { addAuditLog, listenToAuditLogs } from './auditLog.js';

// --- Global Variables ---
let salesData = [];
let customersData = {};
let currentLanguage = "ar";
let dailyGoal = 5000;
let currentSalesPage = 1;
let currentCustomerPage = 1;
const rowsPerPage = 10;
let customerSearchTerm = '';
let filteredSales = null;
let reminders = JSON.parse(localStorage.getItem('reminders') || '{}');
let recentActivities = [];
let notifications = [];

// --- TRANSLATION DATA ---
// main.js - استبدل كائن الترجمة القديم بهذا الكائن الكامل
const translations = {
  en: {
    app_title: "Abqar Store Sales",
    dashboard: "Dashboard",
    sales_log: "Sales & Log",
    customers: "Customers",
    debt_management: "Debt Management",
    reports: "Reports & Tools",
    export: "Export",
    monthly_revenue: "Monthly Revenue",
    top_selling_service: "Top Selling Service",
    profit_by_date: "Profit by Date",
    total_debt: "Total Debt",
    daily_goal: "Daily Goal", daily_goal_sentence: "% of profit goal",
    profit_margin: "Profit Margin",
    sales_by_service_type: "Sales by Service Type",
    monthly_sales_trend: "Monthly Sales Trend",
    service_profitability: "Service Profitability",
    service: "Service", orders: "Orders", revenue: "Revenue", avg_profit: "Avg. Profit",
    new_sale_entry: "New Sale Entry",
    date: "Date", service_type: "Service Type", select_service_type: "Select Service Type",
    price: "Price", service_cost: "Service Cost", client_name: "Client Name",
    whatsapp_number: "WhatsApp Number (Optional)", payment_status: "Payment Status",
    paid: "Paid", unpaid: "Unpaid", notes: "Notes (Optional)", save_sale: "Save Sale",
    sales_history: "Sales History", profit: "Profit", status: "Status",
    no_sales_records_found: "No sales records found",
    customer_database: "Customer Database", customer: "Customer", whatsapp: "WhatsApp",
    last_purchase: "Last Purchase", total_orders: "Total Orders", total_spent: "Total Spent",
    no_customer_records_found: "No customer records found",
    unpaid_orders: "Unpaid Orders", amount_due: "Amount Due", no_unpaid_orders: "No unpaid orders",
    notification: "Notification",
    delete_sale_title: "Delete Sale", delete_sale_message: "Are you sure you want to delete this sale? This action cannot be undone.",
    currency: "EGP", edit: "Edit", delete: "Delete", details: "Details", mark_as_paid: "Mark as Paid", filter: "Filter",
    enter_daily_goal: "Enter new daily goal", goal_updated: "Daily goal updated successfully!",
    customer_details: "Customer Details", purchase_history: "Purchase History", close: "Close",
    customer_name: "Name", confirm: "Confirm", cancel: "Cancel",
    tags: "Tags", add: "Add", notes_timeline: "Notes Timeline",
    pl_reports: "P&L Reports", monthly: "Monthly", quarterly: "Quarterly", generate: "Generate",
    total_income: "Total Income", total_expenses: "Total Expenses", net_profit: "Net Profit", net_loss: "Net Loss",
    whatsapp_marketing: "WhatsApp Marketing",
    average_sale: "Average Sale",
    new_customers: "New Customers (Month)", inactive_customers_placeholder: "Inactive customer numbers appear here...",
    copy: "Copy", copied: "Copied!",
    new_vs_returning: "New vs Returning",
    inactive_clients: "Inactive Clients",
    top_client_month: "Top Client This Month",
    type_returning: "Returning",
    type_new: "New",
    type_inactive: "Inactive",
    inactive_tooltip: "Customer inactive – consider follow-up.",
    search: "Search",
    total_profit: "Total Profit",
    avg_profit_order: "Avg Profit/Order",
    next: "Next",
    previous: "Previous",
    reminders: "Reminders",
    audit_log: "Audit Log",
    pdf_reports: "PDF Reports",
    sales_pdf: "Sales PDF",
    customers_pdf: "Customers PDF",
    most_profitable_client: "Most Profitable Client",
    vip: "VIP",
    alert_inactive: "Inactive clients: {count}",
    alert_sales_drop: "Sales dropped compared to yesterday",
    alert_target_not_met: "Daily target not reached",
    goal_simulator: "Financial Goal Simulator", profit_goal_placeholder: "Enter profit goal", calculate: "Calculate",
    goal_sim_intro_1: "To reach a profit goal of", goal_sim_intro_2: "you need to sell:", goal_sim_orders_of: "orders of",
    basket_analysis: "Basket Analysis", analyze: "Analyze",
    loading_data: "Loading Data...",
    firebase_error: "Connection to database failed. Please check your Firebase configuration and internet connection.",
    // -- الترجمات الجديدة --
    customer_data_management: "Customer Data Management",
    import_helper_text: "Export your contacts from Google as a Google CSV, then upload the file here.",
    import: "Import",
    delete_imported: "Delete Imported",
  },
  ar: {
    app_title: "مبيعات متجر عبقر",
    dashboard: "لوحة التحكم",
    sales_log: "المبيعات والسجل",
    customers: "العملاء",
    debt_management: "إدارة الديون",
    reports: "تقارير وأدوات",
    export: "تصدير",
    monthly_revenue: "إيرادات الشهر",
    top_selling_service: "الخدمة الأكثر مبيعاً",
    profit_by_date: "أرباح حسب اليوم",
    total_debt: "إجمالي الديون",
    daily_goal: "الهدف اليومي", daily_goal_sentence: "% من هدف الربح",
    profit_margin: "هامش الربح",
    sales_by_service_type: "المبيعات حسب نوع الخدمة",
    monthly_sales_trend: "اتجاه المبيعات الشهري",
    service_profitability: "ربحية الخدمة",
    service: "الخدمة", orders: "الطلبات", revenue: "الإيرادات", avg_profit: "متوسط الربح",
    new_sale_entry: "إدخال عملية بيع جديدة",
    date: "التاريخ", service_type: "نوع الخدمة", select_service_type: "اختر نوع الخدمة",
    price: "السعر", service_cost: "تكلفة الخدمة", client_name: "اسم العميل",
    whatsapp_number: "رقم الواتساب (اختياري)", payment_status: "حالة الدفع",
    paid: "مدفوع", unpaid: "غير مدفوع", notes: "ملاحظات (اختياري)", save_sale: "حفظ البيع",
    sales_history: "سجل المبيعات", profit: "الربح", status: "الحالة",
    no_sales_records_found: "لم يتم العثور على سجلات مبيعات",
    customer_database: "قاعدة بيانات العملاء", customer: "العميل", whatsapp: "واتساب",
    last_purchase: "آخر عملية شراء", total_orders: "إجمالي الطلبات", total_spent: "إجمالي الإنفاق",
    no_customer_records_found: "لم يتم العثور على سجلات عملاء",
    unpaid_orders: "الطلبات غير المدفوعة", amount_due: "المبلغ المستحق", no_unpaid_orders: "لا توجد طلبات غير مدفوعة",
    notification: "إشعار",
    delete_sale_title: "حذف عملية البيع", delete_sale_message: "هل أنت متأكد أنك تريد حذف هذا البيع؟ لا يمكن التراجع عن هذا الإجراء.",
    currency: "ج.م", edit: "تعديل", delete: "حذف", details: "تفاصيل", mark_as_paid: "تحديد كمدفوع", filter: "تصفية",
    enter_daily_goal: "أدخل الهدف اليومي الجديد", goal_updated: "تم تحديث الهدف اليومي بنجاح!",
    customer_details: "تفاصيل العميل", purchase_history: "سجل الشراء", close: "إغلاق",
    customer_name: "الاسم", confirm: "تأكيد", cancel: "إلغاء",
    tags: "العلامات", add: "إضافة", notes_timeline: "الجدول الزمني للملاحظات",
    pl_reports: "تقارير الأرباح والخسائر", monthly: "شهري", quarterly: "ربع سنوي", generate: "إنشاء",
    total_income: "إجمالي الدخل", total_expenses: "إجمالي المصاريف", net_profit: "صافي الربح", net_loss: "صافي الخسارة",
    whatsapp_marketing: "أداة واتساب للتسويق",
    average_sale: "متوسط قيمة البيع",
    new_customers: "العملاء الجدد (هذا الشهر)", inactive_customers_placeholder: "أرقام العملاء غير النشطين ستظهر هنا...",
    copy: "نسخ", copied: "تم النسخ!",
    new_vs_returning: "جدد مقابل عائدين",
    inactive_clients: "العملاء غير النشطين",
    top_client_month: "أعلى عميل هذا الشهر",
    type_returning: "عائد",
    type_new: "جديد",
    type_inactive: "غير نشط",
    inactive_tooltip: "عميل غير نشط - يُفضل المتابعة",
    search: "بحث",
    total_profit: "إجمالي الربح",
    avg_profit_order: "متوسط الربح/طلب",
    next: "التالي",
    previous: "السابق",
    reminders: "تذكيرات",
    audit_log: "سجل التدقيق",
    pdf_reports: "تقارير PDF",
    sales_pdf: "تقرير المبيعات PDF",
    customers_pdf: "تقرير العملاء PDF",
    most_profitable_client: "العميل الأكثر ربحاً",
    vip: "عميل مميز",
    alert_inactive: "عملاء غير نشطين: {count}",
    alert_sales_drop: "انخفاض المبيعات عن الأمس",
    alert_target_not_met: "لم يتم تحقيق الهدف اليومي",
    goal_simulator: "محاكي الهدف المالي", profit_goal_placeholder: "أدخل هدف الربح", calculate: "احسب",
    goal_sim_intro_1: "للوصول إلى هدف ربح قدره", goal_sim_intro_2: "تحتاج لبيع:", goal_sim_orders_of: "طلبات من",
    basket_analysis: "تحليل السلة", analyze: "تحليل",
    loading_data: "جاري تحميل البيانات...",
    firebase_error: "فشل الاتصال بقاعدة البيانات. يرجى التحقق من إعدادات Firebase واتصالك بالإنترنت.",
    // -- الترجمات الجديدة --
    customer_data_management: "إدارة بيانات العملاء",
    import_helper_text: "قم بتصدير جهات الاتصال من جوجل بصيغة Google CSV، ثم قم برفع الملف هنا.",
    import: "استيراد",
    delete_imported: "حذف المستوردين",
  }
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        UI.initializeCharts();
        UI.setTranslations(translations);
        
        const darkModeToggle = document.getElementById('darkmode-toggle');
        const storedTheme = localStorage.getItem("darkMode");
        if (storedTheme === "enabled" || (!storedTheme && new Date().getHours() >= 20)) {
            darkModeToggle.checked = true;
            document.body.classList.add("dark-mode");
        }
        
        currentLanguage = localStorage.getItem("language") || "ar";
        dailyGoal = parseFloat(localStorage.getItem("dailyGoal")) || 5000;
        
        UI.setCurrentLanguage(currentLanguage);
        UI.setLanguage(currentLanguage);
        
        document.getElementById("date").valueAsDate = new Date();
        document.getElementById("profitDateSelector").valueAsDate = new Date();

        setupEventListeners();
        checkRemindersOnLoad();

        onAuthStateChanged(auth, (user) => {
            // الكود الجديد والمُنظم داخل onAuthStateChanged
if (user) {
    loadDataAndSetupRealtimeListener();
    
    // هذا هو المكان الوحيد الآن الذي يستمع لتحديثات سجل التدقيق
    listenToAuditLogs((logs) => {
        recentActivities = logs;
        
        // نرسل البيانات الجديدة لتحديث كلا المكانين في الواجهة
        UI.updateActivityList(logs); // <--- لتحديث القائمة الجانبية
        UI.updateDashboardAuditLog(logs); // <--- لتحديث السجل في لوحة التحكم الرئيسية
    });
} else {
                signInAnonymously(auth).catch((error) => UI.handleLoadingErrorUI(error));
            }
        });
    } catch (error) {
        UI.handleLoadingErrorUI(error);
    }
});

function loadDataAndSetupRealtimeListener() {
    // يستمع لتغييرات المبيعات بذكاء
    onSnapshot(query(salesCollection), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const sale = { id: change.doc.id, ...change.doc.data() };
            const index = salesData.findIndex(s => s.id === change.doc.id);

            if (change.type === "added") {
                if (index === -1) salesData.push(sale);
            }
            if (change.type === "modified") {
                if (index > -1) salesData[index] = sale;
            }
            if (change.type === "removed") {
                if (index > -1) salesData.splice(index, 1);
            }
        });

        salesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        updateAllViews();

    }, (error) => UI.handleLoadingErrorUI(error));

    // يستمع لتغييرات العملاء بشكل منفصل
    onSnapshot(query(customersCollection), (custSnapshot) => {
        custSnapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
                delete customersData[change.doc.id];
            } else {
                customersData[change.doc.id] = { id: change.doc.id, ...change.doc.data() };
            }
        });
        
        updateAllViews();
        UI.hideLoadingOverlay();

    }, (error) => UI.handleLoadingErrorUI(error));
}

function updateAllViews() {
  updateCustomerAggregates();
  
  updateSalesTable();
  updateCustomerTable();
  UI.renderDebtManagement(salesData, markAsPaid);
  UI.updateDashboardUI(salesData, dailyGoal);
  UI.updateKpiCards(salesData, customersData);
  UI.renderActivityFeed(salesData);
  UI.updateCharts(salesData);
  checkNotifications();
  UI.setLanguage(currentLanguage);
}

function updateSalesTable() {
    const data = filteredSales || salesData;
    const totalPages = Math.ceil(data.length / rowsPerPage) || 1;
    if (currentSalesPage > totalPages) currentSalesPage = totalPages;
    const start = (currentSalesPage - 1) * rowsPerPage;
    const paged = data.slice(start, start + rowsPerPage);
    UI.renderSalesLog(paged, editSale, showDeleteConfirmation, {currentPage: currentSalesPage, totalPages}, (p)=>{ currentSalesPage = p; updateSalesTable(); });
}

function updateCustomerTable() {
    const term = customerSearchTerm.toLowerCase();
    const arr = Object.values(customersData).filter(c => {
        return !term || (c.name && c.name.toLowerCase().includes(term)) || (c.whatsappNumber && c.whatsappNumber.toLowerCase().includes(term)) || (c.id && c.id.toLowerCase().includes(term));
    }).sort((a,b)=> new Date(b.lastPurchase || 0) - new Date(a.lastPurchase || 0));
    const totalPages = Math.ceil(arr.length / rowsPerPage) || 1;
    if (currentCustomerPage > totalPages) currentCustomerPage = totalPages;
    const start = (currentCustomerPage - 1) * rowsPerPage;
    const paged = arr.slice(start, start + rowsPerPage);
    UI.renderCustomerDatabase(paged, showCustomerDetails, {currentPage: currentCustomerPage, totalPages}, (p)=>{ currentCustomerPage = p; updateCustomerTable(); }, quickCreateOrder);
}

function quickCreateOrder(name, number) {
    document.querySelector('[data-tab="sales-entry"]').click();
    document.getElementById('clientName').value = name;
    document.getElementById('whatsappNumber').value = number || '';
}

function addActivity(text, extra = {}) {
    addAuditLog({
        action: text,
        user: auth.currentUser ? auth.currentUser.uid : 'anonymous',
        device: navigator.userAgent,
        ...extra
    });
}

function addCustomerReminder(whatsapp, date, text) {
    if (!date || !text) return;
    if (!reminders[whatsapp]) reminders[whatsapp] = [];
    reminders[whatsapp].push({date, text});
    localStorage.setItem('reminders', JSON.stringify(reminders));
    UI.showNotification('Reminder added!', 'success');
    addActivity(`Reminder added for ${customersData[whatsapp]?.name || whatsapp}`);
    UI.renderCustomerRemindersUI(reminders[whatsapp], whatsapp, removeCustomerReminder);
}

function removeCustomerReminder(whatsapp, index) {
    if (!reminders[whatsapp]) return;
    reminders[whatsapp].splice(index,1);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    UI.renderCustomerRemindersUI(reminders[whatsapp], whatsapp, removeCustomerReminder);
}

function checkRemindersOnLoad() {
    const today = new Date().toISOString().split('T')[0];
    Object.entries(reminders).forEach(([whatsapp, rems]) => {
        rems.forEach(rem => {
            if (rem.date <= today) {
                UI.showNotification(`Reminder: ${rem.text}`, 'warning');
            }
        });
    });
}

function checkNotifications() {
    notifications = [];
    const inactive = Object.values(customersData).filter(c => {
        const last = new Date(c.lastPurchase);
        return last && !isNaN(last) && (Date.now() - last.getTime()) > 30*24*60*60*1000;
    });
    if (inactive.length > 0) {
        notifications.push(translations[currentLanguage].alert_inactive.replace('{count}', inactive.length));
    }
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todaySales = salesData.filter(s => s.date === todayStr).reduce((sum,s)=> sum + s.price,0);
    const yesterdaySales = salesData.filter(s => s.date === yesterdayStr).reduce((sum,s)=> sum + s.price,0);
    if (yesterdaySales > 0 && todaySales < yesterdaySales) {
        notifications.push(translations[currentLanguage].alert_sales_drop);
    }
    const todayProfit = salesData.filter(s => s.date === todayStr).reduce((sum,s)=> sum + s.profit,0);
    if (todayProfit < dailyGoal) {
        notifications.push(translations[currentLanguage].alert_target_not_met);
    }
    UI.renderNotifications(notifications);
}

function setupEventListeners() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      document.getElementById("deleteImportedBtn").addEventListener("click", handleDeleteImportedCustomers);

      this.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.add("hidden"));
      document.getElementById(this.dataset.tab).classList.remove("hidden");
      document.getElementById("importCsvBtn").addEventListener("click", handleImportCustomers);
        const links = document.getElementById('navLinks');
        if (window.innerWidth < 768 && links.classList.contains('max-h-96')) {
            links.classList.add('max-h-0');
            links.classList.remove('max-h-96');
            const arrow = document.getElementById('mobileMenuArrow');
            if (arrow) arrow.classList.remove('rotate-180');
        }
    });
  });

  document.getElementById("salesForm").addEventListener("submit", handleSaveSale);
  document.getElementById('darkmode-toggle').addEventListener('change', handleDarkModeToggle);
  document.getElementById("languageToggle").addEventListener("click", handleLanguageToggle);
  document.getElementById("editGoalBtn").addEventListener("click", handleSetDailyGoal);
  document.getElementById("exportBtn").addEventListener("click", handleExportData);
  document.getElementById("filterSalesBtn").addEventListener("click", handleFilterSales);
  document.getElementById("profitDateSelector").addEventListener("change", (e) => UI.updateProfitByDateUI(e.target.value, salesData));
  document.getElementById('customerSearch').addEventListener('input', (e)=>{ customerSearchTerm = e.target.value.toLowerCase(); currentCustomerPage = 1; updateCustomerTable(); });
  const salesPdfBtn = document.getElementById('salesPdfBtn');
  if (salesPdfBtn) salesPdfBtn.addEventListener('click', exportSalesPDF);
  const customersPdfBtn = document.getElementById('customersPdfBtn');
  if (customersPdfBtn) customersPdfBtn.addEventListener('click', exportCustomersPDF);

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
          const links = document.getElementById('navLinks');
          if (links.classList.contains('max-h-0')) {
              links.classList.remove('max-h-0');
              links.classList.add('max-h-96');
          } else {
              links.classList.add('max-h-0');
              links.classList.remove('max-h-96');
          }
          document.getElementById('mobileMenuArrow').classList.toggle('rotate-180');
      });
  }
    const activityOverlay = document.getElementById('activityOverlay');
    document.getElementById('activityToggle').addEventListener('click', ()=>{
        document.getElementById('activityPanel').classList.remove('translate-x-full');
        if (activityOverlay) activityOverlay.classList.remove('hidden');
    });
    document.getElementById('closeActivity').addEventListener('click', ()=>{
        document.getElementById('activityPanel').classList.add('translate-x-full');
        if (activityOverlay) activityOverlay.classList.add('hidden');
    });
    if (activityOverlay) activityOverlay.addEventListener('click', () => {
        document.getElementById('activityPanel').classList.add('translate-x-full');
        activityOverlay.classList.add('hidden');
    });

  document.getElementById("closeNotification").addEventListener("click", () => document.getElementById("notification").classList.add("-translate-x-full"));
  document.getElementById("cancelDeleteBtn").addEventListener("click", UI.hideDeleteConfirmationUI);
  document.getElementById("closeCustomerModalBtn").addEventListener("click", UI.hideCustomerDetailsUI);
  document.getElementById("closeCustomerModalBtn2").addEventListener("click", UI.hideCustomerDetailsUI);

  document.getElementById('generatePlReportBtn').addEventListener('click', generatePLReport);
  document.getElementById('filterInactiveBtn').addEventListener('click', filterInactiveCustomers);
  document.getElementById('copyNumbersBtn').addEventListener('click', copyInactiveNumbers);
  document.getElementById('exportNumbersBtn').addEventListener("click", exportInactiveNumbers);
  document.getElementById('simulateGoalBtn').addEventListener('click', simulateGoal);
  document.getElementById('runAnalysisBtn').addEventListener('click', analyzeBaskets);
}

async function handleSaveSale(e) {
  e.preventDefault();
  const form = document.getElementById("salesForm");
  const formData = new FormData(form);
  const editingId = formData.get("editingSaleId");

  const saleData = {
    date: formData.get("date"),
    serviceType: formData.get("serviceType"),
    price: parseFloat(formData.get("price")) || 0,
    serviceCost: parseFloat(formData.get("serviceCost")) || 0,
    clientName: formData.get("clientName") || "N/A",
    whatsappNumber: formData.get("whatsappNumber") || null,
    paymentStatus: formData.get("paymentStatus"),
    notes: formData.get("notes") || "",
  };
  saleData.profit = saleData.price - saleData.serviceCost;

  if (!saleData.date || !saleData.serviceType || !saleData.price) {
    UI.showNotification("Please fill all required fields", "error");
    return;
  }

  try {
    if (editingId) {
      await updateDoc(doc(db, "sales", editingId), saleData);
      UI.showNotification("Sale updated successfully!", "success");
        addActivity(`Sale updated for ${saleData.clientName}`, { amount: saleData.price, client: saleData.clientName });
    } else {
      await addDoc(salesCollection, saleData);
      UI.showNotification("Sale saved successfully!", "success");
        addActivity(`Sale added for ${saleData.clientName}`, { amount: saleData.price, client: saleData.clientName });
    }

    if (saleData.whatsappNumber) {
        const customerRef = doc(db, "customers", saleData.whatsappNumber);
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) {
            await setDoc(customerRef, {
                name: saleData.clientName,
                whatsappNumber: saleData.whatsappNumber,
                tags: [],
                notes: []
            });
            addActivity(`Customer added: ${saleData.clientName}`);
        } else {
            if (customerSnap.data().name !== saleData.clientName) {
                await updateDoc(customerRef, { name: saleData.clientName });
                addActivity(`Customer edited: ${saleData.clientName}`);
            } else {
                await updateDoc(customerRef, { name: saleData.clientName });
            }
        }
    }
    
    UI.resetSaleForm();
  } catch (error) {
    console.error("Error saving sale: ", error);
    UI.showNotification("Error saving sale.", "error");
  }
}

function editSale(saleId) {
  const sale = salesData.find((s) => s.id === saleId);
  if (!sale) return;
  UI.fillSaleForm(sale);
}

function showDeleteConfirmation(saleId) {
    UI.showDeleteConfirmationUI(() => deleteSale(saleId));
}

async function deleteSale(saleId) {
    try {
        const sale = salesData.find(s => s.id === saleId);
        await deleteDoc(doc(db, "sales", saleId));
        UI.showNotification("Sale deleted successfully", "success");
        if (sale) addActivity(`Sale deleted for ${sale.clientName}`);
    } catch (error) {
        console.error("Error deleting sale: ", error);
        UI.showNotification("Error deleting sale.", "error");
    }
}

async function markAsPaid(saleId) {
    try {
        await updateDoc(doc(db, "sales", saleId), { paymentStatus: "paid" });
        UI.showNotification("Order marked as paid", "success");
        const sale = salesData.find(s => s.id === saleId);
        if (sale) {
            addActivity(`Payment received for ${sale.clientName}`, { amount: sale.price, client: sale.clientName });
        }
    } catch (error) {
        console.error("Error marking as paid: ", error);
        UI.showNotification("Error updating order.", "error");
    }
}

function handleFilterSales() {
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    if (!startDate || !endDate) {
        filteredSales = null;
    } else {
        filteredSales = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
    }
    currentSalesPage = 1;
    updateSalesTable();
}

function updateCustomerAggregates() {
  for (const id in customersData) {
      customersData[id].totalOrders = 0;
      customersData[id].totalSpent = 0;
      customersData[id].purchaseHistory = [];
      customersData[id].lastPurchase = "1970-01-01";
  }

  salesData.forEach((sale) => {
    if (sale.whatsappNumber) {
      if (!customersData[sale.whatsappNumber]) {
        customersData[sale.whatsappNumber] = {
          name: sale.clientName,
          whatsappNumber: sale.whatsappNumber,
          totalOrders: 0,
          totalSpent: 0,
          purchaseHistory: [],
          lastPurchase: "1970-01-01",
          tags: [],
          notes: []
        };
      }

      const customer = customersData[sale.whatsappNumber];
      customer.totalOrders++;
      customer.totalSpent += sale.price;

      if (!customer.purchaseHistory) {
          customer.purchaseHistory = [];
      }
      customer.purchaseHistory.push(sale);
      
      if (new Date(sale.date) > new Date(customer.lastPurchase || "1970-01-01")) {
        customer.lastPurchase = sale.date;
        customer.name = sale.clientName;
      }
    }
  });
}

async function showCustomerDetails(whatsappNumber) {
    const customer = customersData[whatsappNumber];
    if (!customer) return;
    const history = salesData.filter(s => s.whatsappNumber === whatsappNumber);
    const totalProfit = history.reduce((sum,s)=> sum + s.profit,0);
    const avgProfit = history.length ? totalProfit / history.length : 0;
    UI.showCustomerDetailsUI(customer, history, totalProfit, avgProfit, reminders[whatsappNumber] || [], addCustomerTag, removeCustomerTag, addCustomerNote, addCustomerReminder, removeCustomerReminder);
}

async function addCustomerTag(whatsapp, tag) {
    if (!tag || !whatsapp) return;
    const customer = customersData[whatsapp];
    const updatedTags = [...(customer.tags || []), tag];
    await updateDoc(doc(db, "customers", whatsapp), { tags: updatedTags });
    document.getElementById('newTagInput').value = '';
    UI.showNotification("Tag added!", "success");
    customersData[whatsapp].tags = updatedTags;
    UI.renderCustomerTagsUI(customersData[whatsapp], removeCustomerTag);
    addActivity(`Tag '${tag}' added to ${customer.name}`);
}

async function removeCustomerTag(whatsapp, tag) {
    if (!tag || !whatsapp) return;
    const customer = customersData[whatsapp];
    const updatedTags = customer.tags.filter(t => t !== tag);
    await updateDoc(doc(db, "customers", whatsapp), { tags: updatedTags });
    UI.showNotification("Tag removed!", "success");
    customersData[whatsapp].tags = updatedTags;
    UI.renderCustomerTagsUI(customersData[whatsapp], removeCustomerTag);
    addActivity(`Tag '${tag}' removed from ${customer.name}`);
}

async function addCustomerNote(whatsapp, text) {
    if (!text || !whatsapp) return;
    const customer = customersData[whatsapp];
    const newNote = { text: text, timestamp: Date.now() };
    const updatedNotes = [...(customer.notes || []), newNote];
    try {
        await updateDoc(doc(db, "customers", whatsapp), { notes: updatedNotes });
        customersData[whatsapp].notes = updatedNotes;
        UI.renderCustomerNotesUI(customersData[whatsapp]);
        document.getElementById('newNoteInput').value = '';
        UI.showNotification("Note added!", "success");
        addActivity(`Note added for ${customer.name}`);
    } catch(error) {
        console.error("Error adding note:", error);
        UI.showNotification("Failed to add note.", "error");
    }
}

function handleDarkModeToggle(event) {
  document.body.classList.toggle('dark-mode', event.target.checked);
  localStorage.setItem('darkMode', event.target.checked ? 'enabled' : 'disabled');
  UI.updateCharts(salesData);
}

function handleLanguageToggle() {
  currentLanguage = currentLanguage === "en" ? "ar" : "en";
  localStorage.setItem("language", currentLanguage);
  UI.setCurrentLanguage(currentLanguage);
  updateAllViews();
}

function handleSetDailyGoal() {
  const newGoal = prompt(translations[currentLanguage].enter_daily_goal, dailyGoal);
  if (newGoal && !isNaN(newGoal) && parseFloat(newGoal) > 0) {
    dailyGoal = parseFloat(newGoal);
    localStorage.setItem("dailyGoal", dailyGoal);
    UI.showNotification(translations[currentLanguage].goal_updated, "success");
    UI.updateDashboardUI(salesData, dailyGoal);
  }
}

function handleExportData() {
    exportData(salesData, "sales_export.csv");
}

function exportData(data, filename) {
    if (!data || data.length === 0) {
        UI.showNotification("No data to export.", "error");
        return;
    }
    const headers = Object.keys(data[0]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
    data.forEach(item => {
        const row = headers.map(header => {
            let value = item[header];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            if (Array.isArray(value)) {
                return `"${value.join(';')}"`;
            }
            return value;
        }).join(',');
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportSalesPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sales Report', 10, 10);
    const data = (filteredSales || salesData);
    doc.setFontSize(12);
    doc.text('Date', 10, 20);
    doc.text('Client', 40, 20);
    doc.text('Service', 90, 20);
    doc.text('Price', 140, 20);
    doc.text('Profit', 170, 20);
    let y = 30;
    data.forEach(s => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(s.date, 10, y);
        doc.text(s.clientName || 'N/A', 40, y);
        doc.text(s.serviceType, 90, y);
        doc.text(Number(s.price).toFixed(2), 140, y);
        doc.text(Number(s.profit).toFixed(2), 170, y);
        y += 8;
    });
    doc.save('sales_report.pdf');
}

function exportCustomersPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Customers Report', 10, 10);
    let y = 20;
    Object.values(customersData).forEach(c => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(`${c.name} - ${c.whatsappNumber || ''} - ${c.totalSpent || 0}`, 10, y);
        y += 8;
    });
    doc.save('customers_report.pdf');
}

function generatePLReport() {
    const period = document.getElementById('plReportPeriod').value;
    const now = new Date();
    let startDate;

    if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else { // quarterly
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
    }
    
    const relevantSales = salesData.filter(s => new Date(s.date) >= startDate);
    const income = relevantSales.reduce((sum, s) => sum + s.price, 0);
    const expenses = relevantSales.reduce((sum, s) => sum + s.serviceCost, 0);
    const net = income - expenses;

    UI.updatePLReportResult(period, income, expenses, net);
}

function filterInactiveCustomers() {
    const days = parseInt(document.getElementById('inactivityDays').value) || 30;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    
    const inactive = Object.values(customersData).filter(c => 
        c.whatsappNumber && new Date(c.lastPurchase).getTime() < threshold
    );
    
    UI.updateInactiveCustomersList(inactive);
    UI.showNotification(`${inactive.length} inactive customers found.`, 'success');
}

function copyInactiveNumbers() {
    const listArea = document.getElementById('inactiveCustomersList');
    navigator.clipboard.writeText(listArea.value).then(() => {
        UI.showNotification(translations[currentLanguage].copied, 'success');
    });
}

function exportInactiveNumbers() {
    const listArea = document.getElementById('inactiveCustomersList');
    const numbers = listArea.value.split('\n').map(n => ({ whatsappNumber: n }));
    exportData(numbers, 'inactive_customers.csv');
}

function simulateGoal() {
    const goal = parseFloat(document.getElementById('profitGoalInput').value);
    if (!goal) {
        UI.updateGoalSimulatorResult(null);
        return;
    }

    const serviceStats = {};
    salesData.forEach((sale) => {
        if (!serviceStats[sale.serviceType]) {
            serviceStats[sale.serviceType] = { profit: 0, count: 0 };
        }
        serviceStats[sale.serviceType].profit += sale.profit;
        serviceStats[sale.serviceType].count++;
    });

    UI.updateGoalSimulatorResult(goal, serviceStats);
}

function analyzeBaskets() {
    const baskets = {};
    salesData.forEach(sale => {
        const key = `${sale.clientName}-${sale.date}`;
        if (!baskets[key]) baskets[key] = new Set();
        baskets[key].add(sale.serviceType);
    });

    const pairs = {};
    Object.values(baskets).forEach(basket => {
        if (basket.size > 1) {
            const items = Array.from(basket);
            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    const pair = [items[i], items[j]].sort().join(' & ');
                    pairs[pair] = (pairs[pair] || 0) + 1;
                }
            }
        }
    });
    
    const sortedPairs = Object.entries(pairs).sort((a,b) => b[1] - a[1]);
    UI.updateBasketAnalysisResult(sortedPairs);
}
async function handleImportCustomers() {
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput.files.length === 0) {
        UI.showNotification("الرجاء اختيار ملف أولاً", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(event) {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const nameIndex = headers.findIndex(h => h.includes("Name"));
        const phoneIndex = headers.findIndex(h => h.includes("Phone 1 - Value"));

        if (nameIndex === -1 || phoneIndex === -1) {
            UI.showNotification("لم يتم العثور على أعمدة الاسم أو الرقم في الملف", "error");
            return;
        }

        const allCustomers = [];
        for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(',');
            const name = data[nameIndex]?.trim();
            const phone = data[phoneIndex]?.trim().replace(/\s+/g, '');
            if (name && phone) {
                allCustomers.push({ name, phone });
            }
        }

        const batchSize = 400; // سنقوم بمعالجة 400 عميل في كل دفعة
        let importedCount = 0;
        
        UI.showNotification("بدء عملية الاستيراد... قد تستغرق هذه العملية عدة دقائق.", "info");

        for (let i = 0; i < allCustomers.length; i += batchSize) {
            const batch = allCustomers.slice(i, i + batchSize);
            
            const promises = batch.map(customer => {
                const customerRef = doc(db, "customers", customer.phone);
                return setDoc(customerRef, {
                    name: customer.name,
                    whatsappNumber: customer.phone,
                    tags: ["مستورد"], // علامة مميزة للعملاء المستوردين
                    notes: []
                }, { merge: true });
            });

            await Promise.all(promises);
            importedCount += batch.length;
            
            // تحديث الإشعار لإظهار التقدم
            UI.showNotification(`جاري الاستيراد... تم حفظ ${importedCount} من ${allCustomers.length} عميل`, "info");

            // انتظار ثانية واحدة قبل معالجة الدفعة التالية
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        UI.showNotification(`اكتمل الاستيراد بنجاح! تم حفظ ${importedCount} عميل.`, "success");
        fileInput.value = ''; // تفريغ حقل الملف
    };

    reader.readAsText(file);
}
// main.js - أضف هذه الدالة الجديدة
async function handleDeleteImportedCustomers() {
    const confirmation = confirm("هل أنت متأكد أنك تريد حذف جميع العملاء الذين تم استيرادهم؟ لا يمكن التراجع عن هذا الإجراء.");
    if (!confirmation) {
        return;
    }

    UI.showNotification("بدء عملية الحذف... قد تستغرق عدة دقائق.", "info");

    try {
        // إنشاء استعلام لجلب العملاء الذين لديهم علامة "مستورد" فقط
        const q = query(customersCollection, where("tags", "array-contains", "مستورد"));
        const querySnapshot = await getDocs(q);

        const customersToDelete = querySnapshot.docs;
        const totalToDelete = customersToDelete.length;
        let deletedCount = 0;

        if (totalToDelete === 0) {
            UI.showNotification("ไม่พบลูกค้าที่นำเข้าที่จะลบ", "info"); // لا يوجد عملاء مستوردون للحذف
            return;
        }

        const batchSize = 400; // سنقوم بحذف 400 في كل دفعة

        for (let i = 0; i < totalToDelete; i += batchSize) {
            const batch = customersToDelete.slice(i, i + batchSize);
            const deleteBatch = writeBatch(db);

            batch.forEach(docSnapshot => {
                deleteBatch.delete(docSnapshot.ref);
            });

            await deleteBatch.commit();
            deletedCount += batch.length;

            UI.showNotification(`جاري الحذف... تم حذف ${deletedCount} من ${totalToDelete} عميل`, "info");
            await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية بين الدفعات
        }

        UI.showNotification(`اكتمل الحذف بنجاح! تم حذف ${deletedCount} عميل.`, "success");

    } catch (error) {
        console.error("Error deleting imported customers: ", error);
        UI.showNotification("حدث خطأ أثناء عملية الحذف.", "error");
    }
}