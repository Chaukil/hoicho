// app.js
// File này chứa toàn bộ logic cho trang Dashboard.
// Toàn bộ chức năng đăng nhập, đăng ký, và phân quyền đã được loại bỏ.

import { db } from './firebase-config.js'; // Chỉ import db, không còn auth
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp // Import Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Khai báo các phần tử DOM ---
// Sử dụng kiểm tra null để đảm bảo phần tử tồn tại trước khi thao tác
const pageTitle = document.getElementById('pageTitle');

// Điều hướng Sidebar
const navDashboard = document.getElementById('navDashboard');
const navProducts = document.getElementById('navProducts');
const navInventoryIn = document.getElementById('navInventoryIn');
const navInventoryHistory = document.getElementById('navInventoryHistory');
const navConsume = document.getElementById('navConsume');
const navReports = document.getElementById('navReports');
const navSettings = document.getElementById('navSettings');

// Phần tử Sidebar
const sidebar = document.querySelector('.sidebar');
const mainContentArea = document.querySelector('.main-content-area');
const sidebarToggle = document.getElementById('sidebarToggle');

// Các section chính
const dashboardSection = document.getElementById('dashboardSection');
const productsSection = document.getElementById('productsSection');
const inventoryInSection = document.getElementById('inventoryInSection');
const inventoryHistorySection = document.getElementById('inventoryHistorySection');
const consumeSection = document.getElementById('consumeSection');
const reportsSection = document.getElementById('reportsSection');
const settingsSection = document.getElementById('settingsSection');

// Elements cho Products Section
const addProductButton = document.getElementById('addProductButton');
const productsTableBody = document.getElementById('productsTableBody');
const productSearchInput = document.getElementById('productSearchInput');
const searchProductButton = document.getElementById('searchProductButton');

// Elements cho Inventory In Section
const addInventoryInButton = document.getElementById('addInventoryInButton');
const inventoryInTableBody = document.getElementById('inventoryInTableBody');
const inventoryInSearchInput = document.getElementById('inventoryInSearchInput');
const searchInventoryInButton = document.getElementById('searchInventoryInButton');

// Elements cho Inventory History Section
const inventoryHistoryTableBody = document.getElementById('inventoryHistoryTableBody');
const inventoryHistoryProductFilter = document.getElementById('inventoryHistoryProductFilter');
const inventoryHistoryStartDate = document.getElementById('inventoryHistoryStartDate');
const inventoryHistoryEndDate = document.getElementById('inventoryHistoryEndDate');
const filterInventoryHistoryButton = document.getElementById('filterInventoryHistoryButton');
const resetInventoryHistoryFilterButton = document.getElementById('resetInventoryHistoryFilterButton');
const prevInventoryHistoryPage = document.getElementById('prevInventoryHistoryPage');
let currentInventoryHistoryPage = document.getElementById('currentInventoryHistoryPage'); // Changed from const to let
const nextInventoryHistoryPage = document.getElementById('nextInventoryHistoryPage');

// Elements cho Consume Section
const addConsumeButton = document.getElementById('addConsumeButton');
const consumeTableBody = document.getElementById('consumeTableBody');
const consumeSearchInput = document.getElementById('consumeSearchInput');
const searchConsumeButton = document.getElementById('searchConsumeButton');

// Elements cho Report Section
const reportPeriodSelect = document.getElementById('reportPeriodSelect');
const reportStartDateInput = document.getElementById('reportStartDate');
const reportEndDateInput = document.getElementById('reportEndDate');
const generateReportButton = document.getElementById('generateReportButton');
const profitReportContent = document.getElementById('profitReportContent');

// Elements cho Dashboard KPIs
const totalProductsCount = document.getElementById('totalProductsCount');
const totalInventoryInValue = document.getElementById('totalInventoryInValue');
const totalConsumedValue = document.getElementById('totalConsumedValue');
const totalProfitValue = document.getElementById('totalProfitValue'); // Sẽ được đổi tên thành Total Value Remaining hoặc tương tự
const lowStockProductsList = document.getElementById('lowStockProductsList');
const profitChartCanvas = document.getElementById('profitChart'); // Đã đổi ID canvas
let consumptionChart = null; // Chart đã bán trong Dashboard
let revenueChart = null;     // Chart lợi nhuận trong Report

// Khai báo thêm các elements
const inventoryInStartDate = document.getElementById('inventoryInStartDate');
const inventoryInEndDate = document.getElementById('inventoryInEndDate');
const filterInventoryInButton = document.getElementById('filterInventoryInButton');
const resetInventoryInFilterButton = document.getElementById('resetInventoryInFilterButton');
const inventoryInTotalValue = document.getElementById('inventoryInTotalValue');

// Modals và các phần tử liên quan
const productModal = document.getElementById('productModal');
const addProductForm = document.getElementById('addProductForm');
const modalTitle = document.getElementById('modalTitle');
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
// const productPriceInput = document.getElementById('productPrice'); // Đã xóa
const productUnitInput = document.getElementById('productUnit');
const productMinStockInput = document.getElementById('productMinStock');
const saveProductButton = document.getElementById('saveProductButton');
const productStatusMessage = document.getElementById('productStatusMessage');

const inventoryInModal = document.getElementById('inventoryInModal');
const addInventoryInForm = document.getElementById('addInventoryInForm');
const inventoryInDateInput = document.getElementById('inventoryInDate');
const inventoryInSupplierInput = document.getElementById('inventoryInSupplier');
const inventoryInProductsContainer = document.getElementById('inventoryInProductsContainer');
const addInventoryInProductButton = document.getElementById('addInventoryInProductButton');
const inventoryInTotalAmountSpan = document.getElementById('inventoryInTotalAmount');
const inventoryInStatusMessage = document.getElementById('inventoryInStatusMessage');

const consumeModal = document.getElementById('consumeModal');
const addConsumeForm = document.getElementById('addConsumeForm');
const consumeDateInput = document.getElementById('consumeDate');
const consumeReasonInput = document.getElementById('consumeReason');
const consumeProductsContainer = document.getElementById('consumeProductsContainer');
const addConsumeProductButton = document.getElementById('addConsumeProductButton');
const consumeTotalAmountSpan = document.getElementById('consumeTotalAmount');
const consumeStatusMessage = document.getElementById('consumeStatusMessage');

const viewInventoryInModal = document.getElementById('viewInventoryInModal');
const viewInventoryInId = document.getElementById('viewInventoryInId');
const viewInventoryInDate = document.getElementById('viewInventoryInDate');
const viewInventoryInUser = document.getElementById('viewInventoryInUser');
const viewInventoryInSupplier = document.getElementById('viewInventoryInSupplier');
const viewInventoryInProductsTableBody = document.getElementById('viewInventoryInProductsTableBody');
const viewInventoryInTotal = document.getElementById('viewInventoryInTotal');

const viewConsumeModal = document.getElementById('viewConsumeModal');
const viewConsumeId = document.getElementById('viewConsumeId');
const viewConsumeDate = document.getElementById('viewConsumeDate');
const viewConsumeUser = document.getElementById('viewConsumeUser');
const viewConsumeReason = document.getElementById('viewConsumeReason');
const viewConsumeProductsTableBody = document.getElementById('viewConsumeProductsTableBody');
const viewConsumeTotal = document.getElementById('viewConsumeTotal');

const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

// Khai báo thêm các elements
const inventoryInPageSize = document.getElementById('inventoryInPageSize');
const prevInventoryInPage = document.getElementById('prevInventoryInPage');
const nextInventoryInPage = document.getElementById('nextInventoryInPage');
const inventoryInPageInfo = document.getElementById('inventoryInPageInfo');

const consumeStartDate = document.getElementById('consumeStartDate');
const consumeEndDate = document.getElementById('consumeEndDate');
const filterConsumeButton = document.getElementById('filterConsumeButton');
const resetConsumeFilterButton = document.getElementById('resetConsumeFilterButton');
const consumePageSize = document.getElementById('consumePageSize');
const prevConsumePage = document.getElementById('prevConsumePage');
const nextConsumePage = document.getElementById('nextConsumePage');
const consumePageInfo = document.getElementById('consumePageInfo');
const consumeTotalValue = document.getElementById('consumeTotalValue');

// Khai báo các elements mới
const productStockFilter = document.getElementById('productStockFilter');
const resetProductFilterButton = document.getElementById('resetProductFilterButton');
const productPageSize = document.getElementById('productPageSize');
const prevProductPage = document.getElementById('prevProductPage');
const nextProductPage = document.getElementById('nextProductPage');
const productPageInfo = document.getElementById('productPageInfo');
const productsTotalValue = document.getElementById('productsTotalValue');

// Khai báo các elements mới
const dailySalesForm = document.getElementById('dailySalesForm');
const salesDate = document.getElementById('salesDate');
const salesAmount = document.getElementById('salesAmount');
const salesNote = document.getElementById('salesNote');
const profitStartDate = document.getElementById('profitStartDate');
const profitEndDate = document.getElementById('profitEndDate');
const filterProfitButton = document.getElementById('filterProfitButton');
const resetProfitFilterButton = document.getElementById('resetProfitFilterButton');
const profitTableBody = document.getElementById('profitTableBody');
const totalSales = document.getElementById('totalSales');
const totalConsumption = document.getElementById('totalConsumption');
const totalProfit = document.getElementById('totalProfit');
const addSalesButton = document.getElementById('addSalesButton');
const salesModal = document.getElementById('salesModal');

// Global variables
let allProducts = []; // Cache all products
let currentEditProductId = null;
let currentDeleteId = null;
let currentDeleteCollection = null; // 'products', 'inventoryIn', 'consume'

const INVENTORY_HISTORY_PAGE_SIZE = 10;
let totalInventoryHistoryPages = 1;
let filteredInventoryHistory = [];
let currentInventoryInPage = 1;
let totalInventoryInPages = 1;
let currentPageSize = 10;
let allInventoryInData = []; // Cache tất cả dữ liệu

let currentConsumePage = 1;
let totalConsumePages = 1;
let currentConsumePageSize = 10;
let allConsumeData = [];

// Khai báo biến phân trang cho Products
let currentProductPage = 1;
let totalProductPages = 1;
let currentProductPageSize = 10;
let filteredProducts = [];

// --- Helper Functions ---

function showSection(section, title) {
    const sections = [
        dashboardSection, productsSection, inventoryInSection,
        inventoryHistorySection, consumeSection, reportsSection, settingsSection
    ];
    sections.forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (section) section.classList.remove('hidden');
    if (pageTitle) pageTitle.textContent = title;

    // Cập nhật trạng thái active của sidebar
    const navItems = document.querySelectorAll('.main-nav li');
    navItems.forEach(item => item.classList.remove('active'));
    if (section === dashboardSection && navDashboard) navDashboard.classList.add('active');
    if (section === productsSection && navProducts) navProducts.classList.add('active');
    if (section === inventoryInSection && navInventoryIn) navInventoryIn.classList.add('active');
    if (section === inventoryHistorySection && navInventoryHistory) navInventoryHistory.classList.add('active');
    if (section === consumeSection && navConsume) navConsume.classList.add('active');
    if (section === reportsSection && navReports) navReports.classList.add('active');
}

function showModal(modal) {
    if (modal) modal.classList.remove('hidden');
}

function hideModal(modal) {
    if (modal) modal.classList.add('hidden');
    resetForm(modal); // Reset form khi đóng modal
    hideStatusMessage(modal);
}

function resetForm(modal) {
    if (!modal) return;
    const form = modal.querySelector('form');
    if (form) form.reset();
    // Clear dynamic fields for inventory in/consume
    if (modal.id === 'inventoryInModal' && inventoryInProductsContainer) {
        inventoryInProductsContainer.innerHTML = '';
        addInventoryInProduct(); // Add one empty row
        inventoryInTotalAmountSpan.textContent = '0 VNĐ';
    }
    if (modal.id === 'consumeModal' && consumeProductsContainer) {
        consumeProductsContainer.innerHTML = '';
        addConsumeProduct(); // Add one empty row
        consumeTotalAmountSpan.textContent = '0 VNĐ';
    }
    // Clear product specific fields
    currentEditProductId = null;
    if (productModal && productNameInput) {
        productNameInput.value = '';
        // productPriceInput.value = ''; // Đã xóa
        productUnitInput.value = '';
        productMinStockInput.value = '';
    }
}

function displayStatusMessage(container, message, type) {
    let statusSpan = container.querySelector('.status-message');
    if (!statusSpan) {
        statusSpan = document.createElement('span');
        statusSpan.classList.add('status-message');
        if (container.tagName === 'FORM') { // For form, append after button
            container.appendChild(statusSpan);
        } else { // For sections, append at top
            container.insertBefore(statusSpan, container.firstChild);
        }
    }
    statusSpan.textContent = message;
    statusSpan.className = 'status-message'; // Reset classes
    statusSpan.classList.add(type);
    statusSpan.classList.remove('hidden'); // Ensure it's visible
    setTimeout(() => {
        statusSpan.classList.add('hidden');
        statusSpan.textContent = '';
    }, 5000);
}

function hideStatusMessage(container) {
    const statusSpan = container.querySelector('.status-message');
    if (statusSpan) {
        statusSpan.classList.add('hidden');
        statusSpan.textContent = '';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function calculateTotalAmount(containerId, priceClass, quantityClass, totalSpan) {
    let total = 0;
    const items = document.querySelectorAll(`#${containerId} .inventory-product-item, #${containerId} .consume-product-item`);
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector(quantityClass).value) || 0;
        const price = parseFloat(item.querySelector(priceClass).value) || 0;
        total += quantity * price;
    });
    if (totalSpan) {
        totalSpan.textContent = formatCurrency(total);
    }
    return total;
}

// --- Sidebar Toggling ---
function setInitialSidebarVisibility() {
    if (window.innerWidth <= 992) {
        if (sidebar) sidebar.classList.add('collapsed');
        if (mainContentArea) mainContentArea.style.marginLeft = '60px'; // Adjust margin
    } else {
        if (sidebar) sidebar.classList.remove('collapsed');
        if (mainContentArea) mainContentArea.style.marginLeft = '250'; // Reset margin
    }
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('collapsed');
    });
}

function handleResponsive() {
    const sidebar = document.querySelector('.sidebar');
    const mainContentArea = document.querySelector('.main-content-area');

    if (window.innerWidth <= 992) {
        sidebar.classList.add('collapsed');
        mainContentArea.classList.add('content-collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        mainContentArea.classList.remove('content-collapsed');
    }
}

// --- Data Operations (Firestore) ---

// Products
// Hàm load sản phẩm với filter và phân trang
async function loadProducts(searchTerm = '', page = 1, stockFilter = '') {
    if (!productsTableBody || !productsTotalValue) return;

    productsTableBody.innerHTML = '<tr><td colspan="7">Đang tải sản phẩm...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        allProducts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Áp dụng các filter
        filteredProducts = allProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesStock = true;

            if (stockFilter) {
                switch (stockFilter) {
                    case 'inStock':
                        matchesStock = product.currentStock > product.minStock;
                        break;
                    case 'lowStock':
                        matchesStock = product.currentStock > 0 && product.currentStock <= product.minStock;
                        break;
                    case 'outStock':
                        matchesStock = product.currentStock === 0;
                        break;
                }
            }

            return matchesSearch && matchesStock;
        });

        // Cập nhật phân trang
        currentProductPageSize = parseInt(productPageSize?.value || 10);
        totalProductPages = Math.ceil(filteredProducts.length / currentProductPageSize);
        currentProductPage = page;

        // Lấy dữ liệu cho trang hiện tại
        const startIndex = (page - 1) * currentProductPageSize;
        const endIndex = startIndex + currentProductPageSize;
        const paginatedData = filteredProducts.slice(startIndex, endIndex);

        // Tính tổng giá trị tồn kho
        let totalValue = 0;
        filteredProducts.forEach(product => {
            totalValue += (product.currentStock * (product.lastPurchasePrice || 0));
        });

        // Hiển thị dữ liệu
        if (paginatedData.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="7">Không có sản phẩm nào.</td></tr>';
        } else {
            productsTableBody.innerHTML = '';
            paginatedData.forEach(product => {
                let stockStatusClass = '';
                let statusText = '';

                if (product.currentStock === 0) {
                    stockStatusClass = 'out-of-stock';
                    statusText = 'Hết hàng';
                } else if (product.currentStock <= product.minStock) {
                    stockStatusClass = 'low-stock';
                    statusText = 'Sắp hết';
                } else {
                    stockStatusClass = 'in-stock';
                    statusText = 'Còn hàng';
                }

                const row = productsTableBody.insertRow();
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.unit}</td>
                    <td>${product.minStock}</td>
                    <td>${product.currentStock}</td>
                    <td>${formatCurrency(product.lastPurchasePrice || 0)}</td>
                    <td><span class="status-badge ${stockStatusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-product-btn" data-id="${product.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-product-btn" data-id="${product.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <button class="quick-inventory-in-btn" data-id="${product.id}">
                                <i class="fas fa-truck-loading"></i>
                            </button>
                        </div>
                    </td>
                `;
            });

            // Setup event listeners cho các nút trong bảng
            setupProductTableButtons();
        }

        // Cập nhật tổng giá trị
        if (productsTotalValue) {
            productsTotalValue.textContent = formatCurrency(totalValue);
        }

        // Cập nhật thông tin phân trang
        updateProductPaginationInfo();

    } catch (error) {
        console.error("Lỗi khi tải sản phẩm: ", error);
        if (productsTableBody) {
            productsTableBody.innerHTML = '<tr><td colspan="7" class="status-message error">Lỗi khi tải sản phẩm. Vui lòng thử lại.</td></tr>';
        }
        if (productsTotalValue) {
            productsTotalValue.textContent = 'Lỗi';
        }
    }
}

function setupProductTableButtons() {
    // Event listeners cho nút Edit
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => editProduct(e.currentTarget.dataset.id));
    });

    // Event listeners cho nút Delete
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'products'));
    });

    // Event listeners cho nút Quick Inventory In
    document.querySelectorAll('.quick-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => quickInventoryIn(e.currentTarget.dataset.id));
    });
}

// Cập nhật thông tin phân trang
function updateProductPaginationInfo() {
    if (!productPageInfo) return;

    productPageInfo.textContent = `Trang ${currentProductPage} / ${totalProductPages}`;

    if (prevProductPage) {
        prevProductPage.disabled = currentProductPage <= 1;
    }
    if (nextProductPage) {
        nextProductPage.disabled = currentProductPage >= totalProductPages;
    }
}

// Setup event listeners cho filter và phân trang
function setupProductControls() {
    // Page size change
    if (productPageSize) {
        productPageSize.addEventListener('change', () => {
            loadProducts(
                productSearchInput?.value || '',
                1,
                productStockFilter?.value || ''
            );
        });
    }

    // Pagination
    if (prevProductPage) {
        prevProductPage.addEventListener('click', () => {
            if (currentProductPage > 1) {
                loadProducts(
                    productSearchInput?.value || '',
                    currentProductPage - 1,
                    productStockFilter?.value || ''
                );
            }
        });
    }

    if (nextProductPage) {
        nextProductPage.addEventListener('click', () => {
            if (currentProductPage < totalProductPages) {
                loadProducts(
                    productSearchInput?.value || '',
                    currentProductPage + 1,
                    productStockFilter?.value || ''
                );
            }
        });
    }

    // Search and Filter
    if (searchProductButton) {
        searchProductButton.addEventListener('click', () => {
            loadProducts(
                productSearchInput?.value || '',
                1,
                productStockFilter?.value || ''
            );
        });
    }

    if (productStockFilter) {
        productStockFilter.addEventListener('change', () => {
            loadProducts(
                productSearchInput?.value || '',
                1,
                productStockFilter.value
            );
        });
    }

    if (resetProductFilterButton) {
        resetProductFilterButton.addEventListener('click', () => {
            if (productSearchInput) productSearchInput.value = '';
            if (productStockFilter) productStockFilter.value = '';
            loadProducts('', 1, '');
        });
    }
}


function displayProducts(products) {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '';
    if (products.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="6">Không có sản phẩm nào.</td></tr>'; // Đã giảm colspan
        return;
    }

    products.forEach(product => {
        let stockStatusClass = '';
        let statusText = '';

        if (product.currentStock === 0) {
            stockStatusClass = 'out-of-stock';
            statusText = 'Hết hàng';
        } else if (product.currentStock <= product.minStock) {
            stockStatusClass = 'low-stock';
            statusText = 'Sắp hết';
        } else {
            stockStatusClass = 'in-stock';
            statusText = 'Còn hàng';
        }

        const row = productsTableBody.insertRow();
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.unit}</td>
            <td>${product.minStock}</td>
            <td>${product.currentStock}</td>
            <td><span class="status-badge ${stockStatusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-product-btn" data-id="${product.id}"><i class="fas fa-trash-alt"></i></button>
                    <button class="quick-inventory-in-btn" data-id="${product.id}"><i class="fas fa-truck-loading"></i></button>
                </div>
            </td>
        `;
    });

    // Add event listeners for edit/delete/quick-inventory-in buttons
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => editProduct(e.currentTarget.dataset.id)); // Use currentTarget
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'products')); // Use currentTarget
    });
    document.querySelectorAll('.quick-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => quickInventoryIn(e.currentTarget.dataset.id)); // New listener for quick inventory in
    });
}

async function saveProduct(e) {
    e.preventDefault();
    if (!addProductForm) return;

    const name = productNameInput.value.trim();
    // const price = parseFloat(productPriceInput.value); // Đã xóa
    const unit = productUnitInput.value.trim();
    const minStock = parseInt(productMinStockInput.value);

    if (!name || isNaN(minStock) || !unit) { // Xóa isNaN(price)
        displayStatusMessage(addProductForm, 'Vui lòng điền đầy đủ và đúng định dạng các trường.', 'error');
        return;
    }

    try {
        if (currentEditProductId) {
            // Cập nhật sản phẩm
            const productRef = doc(db, 'products', currentEditProductId);
            await updateDoc(productRef, {
                name: name,
                // price: price, // Đã xóa
                unit: unit,
                minStock: minStock
            });
            displayStatusMessage(addProductForm, 'Cập nhật sản phẩm thành công!', 'success');
        } else {
            // Thêm sản phẩm mới
            await addDoc(collection(db, 'products'), {
                name: name,
                // price: price, // Đã xóa
                unit: unit,
                minStock: minStock,
                currentStock: 0, // Sản phẩm mới ban đầu có tồn kho là 0
                lastPurchasePrice: 0 // Thêm trường giá nhập cuối cùng
            });
            displayStatusMessage(addProductForm, 'Thêm sản phẩm thành công!', 'success');
        }
        await loadProducts(); // Reload products after add/edit
        setTimeout(() => hideModal(productModal), 1500);
    } catch (e) {
        console.error("Lỗi khi lưu sản phẩm: ", e);
        displayStatusMessage(addProductForm, 'Lỗi khi lưu sản phẩm. Vui lòng thử lại.', 'error');
    }
}

async function editProduct(id) {
    if (!productModal || !modalTitle || !productIdInput || !productNameInput || !productUnitInput || !productMinStockInput || !saveProductButton) return; // Đã xóa productPriceInput

    if (!id) {
        console.error("ID sản phẩm không hợp lệ.");
        displayStatusMessage(productModal, 'ID sản phẩm không hợp lệ.', 'error');
        return;
    }

    currentEditProductId = id;
    modalTitle.textContent = 'Cập nhật Sản phẩm';
    saveProductButton.innerHTML = '<i class="fas fa-save"></i> Cập nhật sản phẩm';
    showModal(productModal);

    try {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            const productData = productSnap.data();
            productIdInput.value = id;
            productNameInput.value = productData.name;
            // productPriceInput.value = productData.price; // Đã xóa
            productUnitInput.value = productData.unit;
            productMinStockInput.value = productData.minStock;
        } else {
            displayStatusMessage(productModal, 'Không tìm thấy sản phẩm này.', 'error');
            setTimeout(() => hideModal(productModal), 1500);
        }
    } catch (error) { // Changed 'e' to 'error' for consistency
        console.error("Lỗi khi lấy thông tin sản phẩm để chỉnh sửa: ", error);
        displayStatusMessage(productStatusMessage, `Lỗi: ${error.message}`, 'error');
        if (productModal) productModal.classList.add('hidden');
    }
}

// Inventory In
async function loadInventoryIn(startDate = null, endDate = null, page = 1) {
    if (!inventoryInTableBody || !inventoryInTotalValue) return;

    inventoryInTableBody.innerHTML = '<tr><td colspan="5">Đang tải phiếu nhập kho...</td></tr>';

    try {
        let q = collection(db, 'inventoryIn');

        if (startDate && endDate) {
            q = query(q,
                where('timestamp', '>=', Timestamp.fromDate(new Date(startDate))),
                where('timestamp', '<=', Timestamp.fromDate(new Date(endDate)))
            );
        }

        q = query(q, orderBy('timestamp', 'desc'));

        const querySnapshot = await getDocs(q);
        allInventoryInData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cập nhật biến phân trang
        currentPageSize = parseInt(inventoryInPageSize?.value || 10);
        totalInventoryInPages = Math.ceil(allInventoryInData.length / currentPageSize);
        currentInventoryInPage = page;

        // Lấy dữ liệu cho trang hiện tại
        const startIndex = (page - 1) * currentPageSize;
        const endIndex = startIndex + currentPageSize;
        const paginatedData = allInventoryInData.slice(startIndex, endIndex);

        // Tính tổng giá trị
        let totalValue = 0;
        allInventoryInData.forEach(entry => {
            const entryTotal = entry.products.reduce((sum, item) =>
                sum + (item.quantity * item.purchasePrice), 0);
            totalValue += entryTotal;
        });

        // Hiển thị dữ liệu
        if (paginatedData.length === 0) {
            inventoryInTableBody.innerHTML = '<tr><td colspan="5">Không có phiếu nhập kho nào.</td></tr>';
        } else {
            inventoryInTableBody.innerHTML = '';
            paginatedData.forEach(entry => {
                const entryTotal = entry.products.reduce((sum, item) =>
                    sum + (item.quantity * item.purchasePrice), 0);

                const row = inventoryInTableBody.insertRow();
                row.innerHTML = `
                    <td>${entry.id}</td>
                    <td>${formatDateTime(entry.timestamp)}</td>
                    <td>${entry.user || 'Admin'}</td>
                    <td>${formatCurrency(entryTotal)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="view-inventory-in-btn" data-id="${entry.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="delete-inventory-in-btn" data-id="${entry.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                `;
            });
        }

        // Cập nhật tổng giá trị
        if (inventoryInTotalValue) {
            inventoryInTotalValue.textContent = formatCurrency(totalValue);
        }

        // Cập nhật thông tin phân trang
        updateInventoryInPaginationInfo();

        // Setup event listeners cho các nút trong bảng
        setupInventoryInTableButtons();

    } catch (error) {
        console.error("Lỗi khi tải phiếu nhập kho: ", error);
        if (inventoryInTableBody) {
            inventoryInTableBody.innerHTML = '<tr><td colspan="5" class="status-message error">Lỗi khi tải phiếu nhập kho. Vui lòng thử lại.</td></tr>';
        }
        if (inventoryInTotalValue) {
            inventoryInTotalValue.textContent = 'Lỗi';
        }
    }
}

// Hàm cập nhật thông tin phân trang
function updateInventoryInPaginationInfo() {
    if (!inventoryInPageInfo) return;

    inventoryInPageInfo.textContent = `Trang ${currentInventoryInPage} / ${totalInventoryInPages}`;

    if (prevInventoryInPage) {
        prevInventoryInPage.disabled = currentInventoryInPage <= 1;
    }
    if (nextInventoryInPage) {
        nextInventoryInPage.disabled = currentInventoryInPage >= totalInventoryInPages;
    }
}

// Setup event listeners cho phân trang
function setupInventoryInPagination() {
    if (inventoryInPageSize) {
        inventoryInPageSize.addEventListener('change', () => {
            loadInventoryIn(
                inventoryInStartDate?.value || null,
                inventoryInEndDate?.value || null,
                1
            );
        });
    }

    if (prevInventoryInPage) {
        prevInventoryInPage.addEventListener('click', () => {
            if (currentInventoryInPage > 1) {
                loadInventoryIn(
                    inventoryInStartDate?.value || null,
                    inventoryInEndDate?.value || null,
                    currentInventoryInPage - 1
                );
            }
        });
    }

    if (nextInventoryInPage) {
        nextInventoryInPage.addEventListener('click', () => {
            if (currentInventoryInPage < totalInventoryInPages) {
                loadInventoryIn(
                    inventoryInStartDate?.value || null,
                    inventoryInEndDate?.value || null,
                    currentInventoryInPage + 1
                );
            }
        });
    }
}

// Setup event listeners cho filter
function setupInventoryInFilters() {
    if (filterInventoryInButton) {
        filterInventoryInButton.addEventListener('click', () => {
            const startDate = inventoryInStartDate.value;
            const endDate = inventoryInEndDate.value;

            if (!startDate || !endDate) {
                displayStatusMessage(inventoryInSection,
                    'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'error');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                displayStatusMessage(inventoryInSection,
                    'Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                return;
            }

            loadInventoryIn(startDate, endDate, 1);
        });
    }

    if (resetInventoryInFilterButton) {
        resetInventoryInFilterButton.addEventListener('click', () => {
            if (inventoryInStartDate) inventoryInStartDate.value = '';
            if (inventoryInEndDate) inventoryInEndDate.value = '';
            loadInventoryIn();
        });
    }
}

// Setup event listeners cho các nút trong bảng
function setupInventoryInTableButtons() {
    document.querySelectorAll('.view-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => viewInventoryIn(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.delete-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'inventoryIn'));
    });
}

function displayInventoryIn(inventoryIns) {
    if (!inventoryInTableBody) return;
    inventoryInTableBody.innerHTML = '';
    if (inventoryIns.length === 0) {
        inventoryInTableBody.innerHTML = '<tr><td colspan="5">Không có phiếu nhập kho nào.</td></tr>';
        return;
    }

    inventoryIns.forEach(entry => {
        const row = inventoryInTableBody.insertRow();
        const totalValue = entry.products.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${formatDateTime(entry.timestamp)}</td>
            <td>${entry.user || 'Admin'}</td>
            <td>${formatCurrency(totalValue)}</td>
            <td>
                <div class="action-buttons">
                    <button class="view-inventory-in-btn" data-id="${entry.id}"><i class="fas fa-eye"></i></button>
                    <button class="delete-inventory-in-btn" data-id="${entry.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
    });

    document.querySelectorAll('.view-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => viewInventoryIn(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.delete-inventory-in-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'inventoryIn'));
    });
}

async function addInventoryInProduct(productId = null) {
    if (!inventoryInProductsContainer) return;

    // Reset container if it's not a quick inventory in and there are existing items
    //if (!productId && inventoryInProductsContainer.children.length > 0) {
    //inventoryInProductsContainer.innerHTML = ''; // Clear previous items if adding a new form
    //}

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-product-item');
    itemDiv.innerHTML = `
        <select class="inventory-product-select" required>
            <option value="">Chọn sản phẩm</option>
            ${allProducts.map(product => `
                <option value="${product.id}" 
                    ${productId === product.id ? 'selected' : ''}>
                    ${product.name}
                </option>
            `).join('')}
        </select>
        <input type="number" class="inventory-product-quantity" 
            placeholder="Số lượng" min="1" required>
        <input type="number" class="inventory-product-price" 
            placeholder="Giá nhập (VNĐ)" min="0" step="1" required>
        <button type="button" class="remove-product-button">
            <i class="fas fa-minus-circle"></i>
        </button>
    `;
    inventoryInProductsContainer.appendChild(itemDiv);

    // Populate dropdown for new item
    const select = itemDiv.querySelector('.inventory-product-select');
    populateProductDropdown(select);

    // If a productId is provided, select it
    if (productId) {
        select.value = productId;
        // Disable selection if it's a quick inventory-in for a specific product
        select.disabled = true;
    }

    // Add event listeners for quantity/price change to update total
    const quantityInput = itemDiv.querySelector('.inventory-product-quantity');
    const priceInput = itemDiv.querySelector('.inventory-product-price');
    const removeButton = itemDiv.querySelector('.remove-product-button');

    [quantityInput, priceInput].forEach(input => {
        input.addEventListener('input', () => calculateTotalAmount('inventoryInProductsContainer', '.inventory-product-price', '.inventory-product-quantity', inventoryInTotalAmountSpan));
    });

    removeButton.addEventListener('click', () => {
        itemDiv.remove();
        calculateTotalAmount('inventoryInProductsContainer', '.inventory-product-price', '.inventory-product-quantity', inventoryInTotalAmountSpan);
    });

    calculateTotalAmount('inventoryInProductsContainer', '.inventory-product-price', '.inventory-product-quantity', inventoryInTotalAmountSpan); // Initial calculation
}

// New function to handle quick inventory in from Product Management or Dashboard
async function quickInventoryIn(productId) {
    if (!inventoryInModal) return;

    // Reset the form first to clear any previous product items
    resetForm(inventoryInModal);

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    if (inventoryInDateInput) inventoryInDateInput.value = today;

    // Add the specific product to the inventory in form
    await addInventoryInProduct(productId);

    // Show the modal
    showModal(inventoryInModal);
}


async function saveInventoryIn(e) {
    e.preventDefault();
    if (!addInventoryInForm) return;

    const dateTime = inventoryInDateInput.value;
    const supplier = inventoryInSupplierInput.value.trim();
    const products = [];
    let isValid = true;

    document.querySelectorAll('#inventoryInProductsContainer .inventory-product-item').forEach(item => {
        const productId = item.querySelector('.inventory-product-select').value;
        const quantity = parseInt(item.querySelector('.inventory-product-quantity').value);
        const purchasePrice = parseFloat(item.querySelector('.inventory-product-price').value);

        // Re-enable the select temporarily to get the product ID if it was disabled
        const selectElement = item.querySelector('.inventory-product-select');
        const isDisabled = selectElement.disabled;
        if (isDisabled) selectElement.disabled = false;

        if (!productId || isNaN(quantity) || quantity <= 0 || isNaN(purchasePrice) || purchasePrice < 0) {
            isValid = false;
        }
        if (productId) { // Only add if product is selected
            // Find product name from allProducts cache
            const product = allProducts.find(p => p.id === productId);
            products.push({
                productId,
                productName: product ? product.name : 'Unknown Product',
                quantity,
                purchasePrice
            });
        }
        // Re-disable if it was originally disabled
        if (isDisabled) selectElement.disabled = true;
    });

    if (!isValid || products.length === 0) {
        displayStatusMessage(addInventoryInForm, 'Vui lòng chọn sản phẩm và nhập đầy đủ số lượng, giá nhập hợp lệ.', 'error');
        return;
    }

    try {
        const inventoryInRef = await addDoc(collection(db, 'inventoryIn'), {
            timestamp: Timestamp.fromDate(new Date(dateTime)),
            user: 'Admin', // Hardcoded for now
            supplier: supplier,
            products: products
        });

        // Cập nhật tồn kho sản phẩm
        for (const item of products) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const currentStock = productSnap.data().currentStock || 0;
                await updateDoc(productRef, {
                    currentStock: currentStock + item.quantity,
                    lastPurchasePrice: item.purchasePrice // Lưu giá nhập cuối cùng vào sản phẩm
                });
            } else {
                console.warn(`Product with ID ${item.productId} not found for stock update.`);
            }
        }
        displayStatusMessage(addInventoryInForm, 'Tạo phiếu nhập kho thành công!', 'success');
        await loadInventoryIn();
        await loadProducts(); // Reload products to update current stock
        setTimeout(() => hideModal(inventoryInModal), 1500);
    } catch (e) {
        console.error("Lỗi khi tạo phiếu nhập kho: ", e);
        displayStatusMessage(addInventoryInForm, 'Lỗi khi tạo phiếu nhập kho. Vui lòng thử lại.', 'error');
    }
}

async function viewInventoryIn(id) {
    if (!viewInventoryInModal || !viewInventoryInId || !viewInventoryInDate || !viewInventoryInUser || !viewInventoryInSupplier || !viewInventoryInProductsTableBody || !viewInventoryInTotal) return;

    showModal(viewInventoryInModal);
    viewInventoryInProductsTableBody.innerHTML = '<tr><td colspan="4">Đang tải chi tiết...</td></tr>';

    try {
        const docRef = doc(db, 'inventoryIn', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            viewInventoryInId.textContent = id;
            viewInventoryInDate.textContent = formatDateTime(data.timestamp);
            viewInventoryInUser.textContent = data.user || 'Admin';
            viewInventoryInSupplier.textContent = data.supplier || 'N/A';

            viewInventoryInProductsTableBody.innerHTML = '';
            let totalValue = 0;
            data.products.forEach(item => {
                const row = viewInventoryInProductsTableBody.insertRow();
                const itemTotal = item.quantity * item.purchasePrice;
                totalValue += itemTotal;
                row.innerHTML = `
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.purchasePrice)}</td>
                    <td>${formatCurrency(itemTotal)}</td>
                `;
            });
            viewInventoryInTotal.textContent = formatCurrency(totalValue);
        } else {
            // Updated error message element to be consistent
            displayStatusMessage(viewInventoryInModal, 'Không tìm thấy phiếu nhập kho này.', 'error');
            setTimeout(() => hideModal(viewInventoryInModal), 1500);
        }
    } catch (e) {
        console.error("Error viewing inventory in: ", e);
        displayStatusMessage(viewInventoryInModal, 'Lỗi khi tải chi tiết phiếu nhập kho.', 'error');
    }
}


// Inventory History
async function loadInventoryHistory(page = 1, filters = {}) {
    if (!inventoryHistoryTableBody || !currentInventoryHistoryPage || !prevInventoryHistoryPage || !nextInventoryHistoryPage) return;

    // Update the text content of the DOM element, not reassign the variable.
    currentInventoryHistoryPage.textContent = `Trang ${page}`;
    inventoryHistoryTableBody.innerHTML = '<tr><td colspan="6">Đang tải lịch sử nhập kho...</td></tr>';
    filteredInventoryHistory = []; // Reset filtered history

    try {
        let q = collection(db, 'inventoryIn');
        q = query(q, orderBy('timestamp', 'desc')); // Order by timestamp

        const querySnapshot = await getDocs(q);
        let allEntries = [];

        querySnapshot.docs.forEach(docSnap => {
            const entry = docSnap.data();
            if (entry.products && Array.isArray(entry.products)) {
                entry.products.forEach(product => {
                    allEntries.push({
                        id: docSnap.id,
                        timestamp: entry.timestamp,
                        productName: product.productName,
                        quantity: product.quantity,
                        purchasePrice: product.purchasePrice,
                        total: product.quantity * product.purchasePrice
                    });
                });
            }
        });

        // Apply filters
        filteredInventoryHistory = allEntries.filter(item => {
            let matchesProduct = true;
            if (filters.productId && filters.productId !== '') {
                matchesProduct = item.productName === allProducts.find(p => p.id === filters.productId)?.name;
            }

            let matchesDate = true;
            const itemDate = item.timestamp ? item.timestamp.toDate() : null; // Convert Firebase Timestamp to Date

            if (filters.startDate && itemDate) {
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && (itemDate >= startDate);
            }
            if (filters.endDate && itemDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && (itemDate <= endDate);
            }

            return matchesProduct && matchesDate;
        });

        // Pagination logic
        totalInventoryHistoryPages = Math.ceil(filteredInventoryHistory.length / INVENTORY_HISTORY_PAGE_SIZE);
        const startIndex = (page - 1) * INVENTORY_HISTORY_PAGE_SIZE; // Use 'page' parameter
        const endIndex = startIndex + INVENTORY_HISTORY_PAGE_SIZE;
        const pageItems = filteredInventoryHistory.slice(startIndex, endIndex);

        updatePaginationControls(page); // Pass current page to update controls
    } catch (e) {
        console.error("Lỗi khi tải lịch sử nhập kho: ", e);
        inventoryHistoryTableBody.innerHTML = '<tr><td colspan="6" class="status-message error">Lỗi khi tải lịch sử nhập kho. Vui lòng thử lại.</td></tr>';
    }
}

function updatePaginationControls(currentPageNum) { // Accept current page number as argument
    if (!currentInventoryHistoryPage || !totalInventoryHistoryPages || !prevInventoryHistoryPage || !nextInventoryHistoryPage) return;

    currentInventoryHistoryPage.textContent = `Trang ${currentPageNum} / ${totalInventoryHistoryPages}`;
    prevInventoryHistoryPage.disabled = currentPageNum === 1;
    nextInventoryHistoryPage.disabled = currentPageNum === totalInventoryHistoryPages || totalInventoryHistoryPages === 0;
}

/// Hàm load danh sách đã bán
async function loadConsume(startDate = null, endDate = null, page = 1) {
    if (!consumeTableBody || !consumeTotalValue) return;

    consumeTableBody.innerHTML = '<tr><td colspan="5">Đang tải phiếu bán hàng...</td></tr>';

    try {
        let q = collection(db, 'consume');

        if (startDate && endDate) {
            q = query(q,
                where('timestamp', '>=', Timestamp.fromDate(new Date(startDate))),
                where('timestamp', '<=', Timestamp.fromDate(new Date(endDate)))
            );
        }

        q = query(q, orderBy('timestamp', 'desc'));

        const querySnapshot = await getDocs(q);
        allConsumeData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cập nhật phân trang
        currentConsumePageSize = parseInt(consumePageSize?.value || 10);
        totalConsumePages = Math.ceil(allConsumeData.length / currentConsumePageSize);
        currentConsumePage = page;

        // Lấy dữ liệu cho trang hiện tại
        const startIndex = (page - 1) * currentConsumePageSize;
        const endIndex = startIndex + currentConsumePageSize;
        const paginatedData = allConsumeData.slice(startIndex, endIndex);

        // Tính tổng giá trị
        let totalValue = 0;
        allConsumeData.forEach(entry => {
            const entryTotal = entry.products.reduce((sum, item) =>
                sum + (item.quantity * item.priceAtConsumption), 0);
            totalValue += entryTotal;
        });

        // Hiển thị dữ liệu
        if (paginatedData.length === 0) {
            consumeTableBody.innerHTML = '<tr><td colspan="5">Không có phiếu bán hàng nào.</td></tr>';
        } else {
            consumeTableBody.innerHTML = '';
            paginatedData.forEach(entry => {
                const entryTotal = entry.products.reduce((sum, item) =>
                    sum + (item.quantity * item.priceAtConsumption), 0);

                const row = consumeTableBody.insertRow();
                row.innerHTML = `
                    <td>${entry.id}</td>
                    <td>${formatDateTime(entry.timestamp)}</td>
                    <td>${entry.user || 'Admin'}</td>
                    <td>${formatCurrency(entryTotal)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="view-consume-btn" data-id="${entry.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="delete-consume-btn" data-id="${entry.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                `;
            });
        }

        // Cập nhật tổng giá trị
        if (consumeTotalValue) {
            consumeTotalValue.textContent = formatCurrency(totalValue);
        }

        // Cập nhật thông tin phân trang
        updateConsumePaginationInfo();

        // Setup event listeners cho các nút trong bảng
        setupConsumeTableButtons();

    } catch (error) {
        console.error("Lỗi khi tải phiếu bán hàng: ", error);
        if (consumeTableBody) {
            consumeTableBody.innerHTML = '<tr><td colspan="5" class="status-message error">Lỗi khi tải phiếu bán hàng. Vui lòng thử lại.</td></tr>';
        }
        if (consumeTotalValue) {
            consumeTotalValue.textContent = 'Lỗi';
        }
    }
}

// Cập nhật thông tin phân trang
function updateConsumePaginationInfo() {
    if (!consumePageInfo) return;

    consumePageInfo.textContent = `Trang ${currentConsumePage} / ${totalConsumePages}`;

    if (prevConsumePage) {
        prevConsumePage.disabled = currentConsumePage <= 1;
    }
    if (nextConsumePage) {
        nextConsumePage.disabled = currentConsumePage >= totalConsumePages;
    }
}

// Setup event listeners cho phân trang và filter
function setupConsumeControls() {
    // Page size change
    if (consumePageSize) {
        consumePageSize.addEventListener('change', () => {
            loadConsume(
                consumeStartDate?.value || null,
                consumeEndDate?.value || null,
                1
            );
        });
    }

    // Pagination
    if (prevConsumePage) {
        prevConsumePage.addEventListener('click', () => {
            if (currentConsumePage > 1) {
                loadConsume(
                    consumeStartDate?.value || null,
                    consumeEndDate?.value || null,
                    currentConsumePage - 1
                );
            }
        });
    }

    if (nextConsumePage) {
        nextConsumePage.addEventListener('click', () => {
            if (currentConsumePage < totalConsumePages) {
                loadConsume(
                    consumeStartDate?.value || null,
                    consumeEndDate?.value || null,
                    currentConsumePage + 1
                );
            }
        });
    }

    // Filter
    if (filterConsumeButton) {
        filterConsumeButton.addEventListener('click', () => {
            const startDate = consumeStartDate?.value;
            const endDate = consumeEndDate?.value;

            if (!startDate || !endDate) {
                displayStatusMessage(consumeSection,
                    'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'error');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                displayStatusMessage(consumeSection,
                    'Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                return;
            }

            loadConsume(startDate, endDate, 1);
        });
    }

    // Reset filter
    if (resetConsumeFilterButton) {
        resetConsumeFilterButton.addEventListener('click', () => {
            if (consumeStartDate) consumeStartDate.value = '';
            if (consumeEndDate) consumeEndDate.value = '';
            loadConsume(null, null, 1);
        });
    }
}

// Setup event listeners cho các nút trong bảng
function setupConsumeTableButtons() {
    document.querySelectorAll('.view-consume-btn').forEach(button => {
        button.addEventListener('click', (e) => viewConsume(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.delete-consume-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'consume'));
    });
}

function displayConsume(consumes) {
    if (!consumeTableBody) return;
    consumeTableBody.innerHTML = '';
    if (consumes.length === 0) {
        consumeTableBody.innerHTML = '<tr><td colspan="5">Không có phiếu bán hàng nào.</td></tr>';
        return;
    }

    consumes.forEach(entry => {
        const row = consumeTableBody.insertRow();
        const totalValue = entry.products.reduce((sum, item) => sum + (item.quantity * item.priceAtConsumption), 0);
        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${formatDateTime(entry.timestamp)}</td>
            <td>${entry.user || 'Admin'}</td>
            <td>${formatCurrency(totalValue)}</td>
            <td>
                <div class="action-buttons">
                    <button class="view-consume-btn" data-id="${entry.id}"><i class="fas fa-eye"></i></button>
                    <button class="delete-consume-btn" data-id="${entry.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
    });

    document.querySelectorAll('.view-consume-btn').forEach(button => {
        button.addEventListener('click', (e) => viewConsume(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.delete-consume-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'consume'));
    });
}

function addConsumeProduct() {
    if (!consumeProductsContainer) {
        console.error("Consume products container not found");
        return;
    }

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('consume-product-item');

    // Tạo HTML cho item mới
    itemDiv.innerHTML = `
        <div class="product-select-group">
            <select class="consume-product-select" required>
                <option value="">Chọn sản phẩm</option>
                ${allProducts.map(product => `
                    <option value="${product.id}" 
                            data-stock="${product.currentStock}"
                            data-unit="${product.unit}">
                        ${product.name}
                    </option>
                `).join('')}
            </select>
            <span class="current-stock-display"></span>
        </div>
        <input type="number" class="consume-product-quantity" 
               placeholder="Số lượng" min="1" required>
        <button type="button" class="remove-product-button">
            <i class="fas fa-minus-circle"></i>
        </button>
    `;

    // Thêm vào container
    consumeProductsContainer.appendChild(itemDiv);

    // Lấy references đến các elements
    const select = itemDiv.querySelector('.consume-product-select');
    const quantityInput = itemDiv.querySelector('.consume-product-quantity');
    const removeButton = itemDiv.querySelector('.remove-product-button');
    const stockDisplay = itemDiv.querySelector('.current-stock-display');

    if (!select || !quantityInput || !removeButton || !stockDisplay) {
        console.error("Required elements not found in new item");
        return;
    }

    // Event listener cho select
    select.addEventListener('change', async () => {
        try {
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) return;

            const currentStock = parseInt(selectedOption.dataset.stock) || 0;
            const unit = selectedOption.dataset.unit || '';

            if (select.value) {
                stockDisplay.textContent = `Tồn kho: ${currentStock} ${unit}`;
                stockDisplay.classList.toggle('low-stock', currentStock <= 0);

                quantityInput.value = '';
                quantityInput.max = currentStock;
                quantityInput.placeholder = `Tối đa ${currentStock} ${unit}`;
            } else {
                stockDisplay.textContent = '';
                quantityInput.removeAttribute('max');
                quantityInput.placeholder = 'Số lượng';
            }

            await calculateConsumeTotal();
        } catch (error) {
            console.error("Error in select change handler:", error);
        }
    });

    // Event listener cho input số lượng
    quantityInput.addEventListener('input', async () => {
        try {
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) return;

            const currentStock = parseInt(selectedOption.dataset.stock) || 0;
            const quantity = parseInt(quantityInput.value) || 0;

            if (quantity > currentStock) {
                quantityInput.value = currentStock;
                displayStatusMessage(addConsumeForm,
                    `Số lượng không thể vượt quá tồn kho (${currentStock})`, 'error');
            }

            await calculateConsumeTotal();
        } catch (error) {
            console.error("Error in quantity input handler:", error);
        }
    });

    // Event listener cho nút xóa
    removeButton.addEventListener('click', async () => {
        try {
            itemDiv.remove();
            await calculateConsumeTotal();
        } catch (error) {
            console.error("Error in remove button handler:", error);
        }
    });

    // Tính toán tổng ban đầu
    calculateConsumeTotal().catch(error => {
        console.error("Error calculating initial total:", error);
    });
}

async function calculateConsumeTotal() {
    let total = 0;

    // Kiểm tra container tồn tại
    if (!consumeProductsContainer || !consumeTotalAmountSpan) {
        console.log("Container or total span not found");
        return total;
    }

    const items = consumeProductsContainer.querySelectorAll('.consume-product-item');

    for (const item of items) {
        // Lấy các elements cần thiết
        const select = item.querySelector('.consume-product-select');
        const quantityInput = item.querySelector('.consume-product-quantity');

        // Kiểm tra elements tồn tại và có giá trị hợp lệ
        if (!select || !quantityInput) continue;

        const productId = select.value;
        const quantity = parseFloat(quantityInput.value) || 0;

        if (productId && quantity > 0) {
            // Tìm sản phẩm trong cache
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                total += quantity * (product.lastPurchasePrice || 0);
            }
        }
    }

    // Cập nhật tổng tiền
    if (consumeTotalAmountSpan) {
        consumeTotalAmountSpan.textContent = formatCurrency(total);
    }

    return total;
}

async function saveConsume(e) {
    e.preventDefault();
    if (!addConsumeForm) return;

    const dateTime = consumeDateInput.value;
    const reason = consumeReasonInput.value.trim();
    const products = [];
    let isValid = true;

    if (!dateTime) {
        displayStatusMessage(addConsumeForm, 'Vui lòng chọn ngày bán hàng', 'error');
        return;
    }

    const productItems = document.querySelectorAll('#consumeProductsContainer .consume-product-item');

    if (productItems.length === 0) {
        displayStatusMessage(addConsumeForm, 'Vui lòng thêm ít nhất một sản phẩm', 'error');
        return;
    }

    // Validate từng sản phẩm
    for (const item of productItems) {
        const select = item.querySelector('.consume-product-select');
        const quantity = parseInt(item.querySelector('.consume-product-quantity').value);
        const selectedOption = select.options[select.selectedIndex];

        if (!select.value || isNaN(quantity) || quantity <= 0) {
            isValid = false;
            displayStatusMessage(addConsumeForm,
                'Vui lòng điền đầy đủ thông tin cho tất cả sản phẩm', 'error');
            return;
        }

        const currentStock = parseInt(selectedOption.dataset.stock);
        if (quantity > currentStock) {
            isValid = false;
            displayStatusMessage(addConsumeForm,
                `Số lượng bán của ${selectedOption.text} không thể vượt quá tồn kho (${currentStock})`, 'error');
            return;
        }

        // Kiểm tra tồn kho realtime
        const productRef = doc(db, 'products', select.value);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
            const realTimeStock = productSnap.data().currentStock;
            if (quantity > realTimeStock) {
                isValid = false;
                displayStatusMessage(addConsumeForm,
                    `Tồn kho của ${selectedOption.text} đã thay đổi. Vui lòng kiểm tra lại.`, 'error');
                return;
            }
        }

        products.push({
            productId: select.value,
            productName: selectedOption.text,
            quantity: quantity,
            priceAtConsumption: productSnap.data().lastPurchasePrice || 0
        });
    }

    if (!isValid) return;

    try {
        // Thêm phiếu đã bán
        const consumeRef = await addDoc(collection(db, 'consume'), {
            timestamp: Timestamp.fromDate(new Date(dateTime)),
            user: 'Admin',
            reason: reason,
            products: products
        });

        // Cập nhật tồn kho
        for (const item of products) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const currentStock = productSnap.data().currentStock;
                await updateDoc(productRef, {
                    currentStock: currentStock - item.quantity
                });
            }
        }

        displayStatusMessage(addConsumeForm, 'Tạo phiếu bán hàng thành công!', 'success');
        await loadConsume();
        await loadProducts();
        setTimeout(() => hideModal(consumeModal), 1500);

    } catch (error) {
        console.error("Lỗi khi tạo phiếu bán hàng:", error);
        displayStatusMessage(addConsumeForm,
            'Lỗi khi tạo phiếu bán hàng Vui lòng thử lại.', 'error');
    }
}

async function viewConsume(id) {
    if (!viewConsumeModal || !viewConsumeId || !viewConsumeDate || !viewConsumeUser || !viewConsumeReason || !viewConsumeProductsTableBody || !viewConsumeTotal) return;

    showModal(viewConsumeModal);
    viewConsumeProductsTableBody.innerHTML = '<tr><td colspan="4">Đang tải chi tiết...</td></tr>';

    try {
        const docRef = doc(db, 'consume', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            viewConsumeId.textContent = id;
            viewConsumeDate.textContent = formatDateTime(data.timestamp);
            viewConsumeUser.textContent = data.user || 'Admin';
            viewConsumeReason.textContent = data.reason || 'N/A';

            viewConsumeProductsTableBody.innerHTML = '';
            let totalValue = 0;
            data.products.forEach(item => {
                const row = viewConsumeProductsTableBody.insertRow();
                const itemTotal = item.quantity * item.priceAtConsumption;
                totalValue += itemTotal;
                row.innerHTML = `
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.priceAtConsumption)}</td> <td>${formatCurrency(itemTotal)}</td>
                `;
            });
            viewConsumeTotal.textContent = formatCurrency(totalValue);
        } else {
            // Updated error message element to be consistent
            displayStatusMessage(viewConsumeModal, 'Không tìm thấy phiếu bán hàng này.', 'error');
            setTimeout(() => hideModal(viewConsumeModal), 1500);
        }
    } catch (e) {
        console.error("Error viewing consume: ", e);
        displayStatusMessage(viewConsumeModal, 'Lỗi khi tải chi tiết phiếu bán hàng.', 'error');
    }
}

// Delete Confirmation
function confirmDelete(id, collectionName) {
    if (!confirmDeleteModal) return;
    currentDeleteId = id;
    currentDeleteCollection = collectionName;
    showModal(confirmDeleteModal);
}

async function executeDelete() {
    if (!currentDeleteId || !currentDeleteCollection) return;

    try {
        // Kiểm tra điều kiện xóa cho sản phẩm
        if (currentDeleteCollection === 'products') {
            const productRef = doc(db, 'products', currentDeleteId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists() && productSnap.data().currentStock > 0) {
                displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'),
                    'Không thể xóa sản phẩm đang có tồn kho. Vui lòng điều chỉnh tồn kho về 0 trước.', 'error');
                return;
            }
        }

        // Thực hiện xóa
        await deleteDoc(doc(db, currentDeleteCollection, currentDeleteId));
        displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'), 'Xóa thành công!', 'success');

        // Cập nhật dữ liệu sau khi xóa
        switch (currentDeleteCollection) {
            case 'products':
                await loadProducts();
                break;
            case 'inventoryIn':
                await loadInventoryIn();
                await loadProducts(); // Cập nhật tồn kho
                break;
            case 'consume':
                await loadConsume();
                await loadProducts(); // Cập nhật tồn kho
                break;
            case 'dailySales':
                await loadProfitData(profitStartDate?.value, profitEndDate?.value);
                break;
        }

        setTimeout(() => hideModal(confirmDeleteModal), 1500);
    } catch (e) {
        console.error("Lỗi khi xóa: ", e);
        displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'),
            'Lỗi khi xóa. Vui lòng thử lại.', 'error');
    } finally {
        currentDeleteId = null;
        currentDeleteCollection = null;
    }
}


function showSalesModal() {
    if (!salesModal) return;

    // Set ngày mặc định là hôm nay
    const today = new Date().toISOString().split('T')[0];
    if (salesDate) {
        salesDate.value = today;
    }

    // Reset form
    if (dailySalesForm) {
        dailySalesForm.reset();
        salesDate.value = today; // Giữ ngày mặc định sau khi reset
    }

    // Hiển thị modal
    showModal(salesModal);
}

async function saveDailySales(e) {
    e.preventDefault();
    if (!dailySalesForm) return;

    const date = salesDate.value;
    const amount = parseFloat(salesAmount.value);
    const note = salesNote.value.trim();

    if (!date || isNaN(amount)) {
        displayStatusMessage(dailySalesForm, 'Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }

    try {
        // Kiểm tra doanh thu đã tồn tại
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(collection(db, 'dailySales'),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay))
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            displayStatusMessage(dailySalesForm, 'Đã tồn tại doanh thu cho ngày này', 'error');
            return;
        }

        // Lưu doanh thu mới
        await addDoc(collection(db, 'dailySales'), {
            date: Timestamp.fromDate(new Date(date)),
            amount: amount,
            note: note
        });

        displayStatusMessage(dailySalesForm, 'Lưu doanh thu thành công!', 'success');

        // Đóng modal sau 1.5s
        setTimeout(() => {
            hideModal(salesModal);
            loadProfitData(profitStartDate?.value, profitEndDate?.value);
        }, 1500);

    } catch (error) {
        console.error("Lỗi khi lưu doanh thu:", error);
        displayStatusMessage(dailySalesForm, 'Lỗi khi lưu doanh thu', 'error');
    }
}

// Hàm tải và hiển thị dữ liệu lợi nhuận
async function loadProfitData(startDate = null, endDate = null) {
    if (!profitTableBody) return;

    try {
        // Lấy doanh thu
        let salesQuery = collection(db, 'dailySales');
        if (startDate && endDate) {
            salesQuery = query(salesQuery,
                where('date', '>=', Timestamp.fromDate(new Date(startDate))),
                where('date', '<=', Timestamp.fromDate(new Date(endDate)))
            );
        }
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = {};
        salesSnapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = data.date.toDate().toISOString().split('T')[0];
            salesData[dateStr] = {
                id: doc.id,
                amount: data.amount,
                note: data.note
            };
        });

        // Lấy đã bán
        let consumeQuery = collection(db, 'consume');
        if (startDate && endDate) {
            consumeQuery = query(consumeQuery,
                where('timestamp', '>=', Timestamp.fromDate(new Date(startDate))),
                where('timestamp', '<=', Timestamp.fromDate(new Date(endDate)))
            );
        }
        const consumeSnapshot = await getDocs(consumeQuery);
        const consumeData = {};
        consumeSnapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = data.timestamp.toDate().toISOString().split('T')[0];
            if (!consumeData[dateStr]) {
                consumeData[dateStr] = 0;
            }
            data.products.forEach(product => {
                consumeData[dateStr] += product.quantity * product.priceAtConsumption;
            });
        });

        // Tổng hợp dữ liệu
        const allDates = [...new Set([...Object.keys(salesData), ...Object.keys(consumeData)])];
        allDates.sort((a, b) => b.localeCompare(a)); // Sắp xếp ngày giảm dần

        let totalSalesAmount = 0;
        let totalConsumptionAmount = 0;

        profitTableBody.innerHTML = '';
        allDates.forEach(date => {
            const sales = salesData[date]?.amount || 0;
            const consumption = consumeData[date] || 0;
            const profit = sales - consumption;

            totalSalesAmount += sales;
            totalConsumptionAmount += consumption;

            const row = profitTableBody.insertRow();
            row.innerHTML = `
                <td>${formatDateTime(date)}</td>
                <td>${formatCurrency(sales)}</td>
                <td>${formatCurrency(consumption)}</td>
                <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${formatCurrency(profit)}
                </td>
                <td>${salesData[date]?.note || ''}</td>
                <td>
                    ${salesData[date] ? `
                        <div class="action-buttons">
                        <button class="delete-sales-btn" data-id="${salesData[date].id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                         </div>
                    ` : ''}
                </td>
            `;
        });

        // Cập nhật tổng
        if (totalSales) totalSales.textContent = formatCurrency(totalSalesAmount);
        if (totalConsumption) totalConsumption.textContent = formatCurrency(totalConsumptionAmount);
        if (totalProfit) totalProfit.textContent = formatCurrency(totalSalesAmount - totalConsumptionAmount);

        // Setup event listeners cho các nút xóa
        setupDeleteSalesButtons();

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu lợi nhuận:", error);
        profitTableBody.innerHTML = '<tr><td colspan="6" class="error">Lỗi khi tải dữ liệu</td></tr>';
    }
}

// Setup event listeners cho nút xóa doanh thu
function setupDeleteSalesButtons() {
    document.querySelectorAll('.delete-sales-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Sử dụng modal xác nhận chung
            currentDeleteId = e.currentTarget.dataset.id;
            currentDeleteCollection = 'dailySales';
            showModal(confirmDeleteModal);
        });
    });
}

// --- Populate Dropdowns ---
function populateProductDropdowns() {
    const productSelects = document.querySelectorAll('.inventory-product-select, .consume-product-select');
    productSelects.forEach(select => {
        // Only populate if not already pre-selected and disabled (e.g., from quickInventoryIn)
        if (!select.disabled) {
            populateProductDropdown(select);
        }
    });

    if (inventoryHistoryProductFilter) {
        populateProductDropdown(inventoryHistoryProductFilter, true); // Add "All Products" option
    }
}

function populateProductDropdown(selectElement, addAllOption = false) {
    const originalValue = selectElement.value; // Store selected value
    selectElement.innerHTML = ''; // Clear existing options
    if (addAllOption) {
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Tất cả sản phẩm';
        selectElement.appendChild(allOption);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Chọn sản phẩm';
        selectElement.appendChild(defaultOption);
    }

    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        selectElement.appendChild(option);
    });
    selectElement.value = originalValue; // Restore selected value
}

async function loadDashboardKPIs() {
    if (!totalProductsCount || !totalInventoryInValue || !totalConsumedValue ||
        !totalProfitValue || !lowStockProductsList) return;

    try {
        // 1. Tải và hiển thị thông tin sản phẩm
        const productsSnap = await getDocs(collection(db, 'products'));
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allProducts = products;
        totalProductsCount.textContent = products.length;

        // 2. Hiển thị sản phẩm sắp hết và hết hàng
        await displayLowStockProducts(products);

        // 3. Tính toán và hiển thị các giá trị tổng
        const { totalInValue, totalConsumedVal } = await calculateTotalValues();

        totalInventoryInValue.textContent = formatCurrency(totalInValue);
        totalConsumedValue.textContent = formatCurrency(totalConsumedVal);
        totalProfitValue.textContent = formatCurrency(totalInValue - totalConsumedVal);

        // 4. Cập nhật biểu đồ
        await updateDashboardCharts();

        // 5. Thêm dòng này để cập nhật biểu đồ lợi nhuận
        await loadProfitData(profitStartDate?.value, profitEndDate?.value);

    } catch (error) {
        console.error("Lỗi khi tải KPIs Dashboard:", error);
        handleDashboardError();
    }
}

// Hàm hiển thị sản phẩm sắp hết và hết hàng
async function displayLowStockProducts(products) {
    if (!lowStockProductsList) return;

    lowStockProductsList.innerHTML = '';
    const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
    const outOfStock = products.filter(p => p.currentStock === 0);

    // Hiển thị sản phẩm sắp hết
    lowStock.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${p.name}</span>
            <span class="stock-warning">${p.currentStock} ${p.unit}</span>
            <button class="action-button small-button quick-inventory-in-btn-dashboard" 
                    data-id="${p.id}" title="Nhập">
                <i class="fas fa-plus"></i> Nhập
            </button>
        `;
        lowStockProductsList.appendChild(li);
    });

    // Hiển thị sản phẩm hết hàng
    outOfStock.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${p.name}</span>
            <span class="stock-warning-out">Hết hàng</span>
            <button class="action-button small-button quick-inventory-in-btn-dashboard" 
                    data-id="${p.id}" title="Nhập">
                <i class="fas fa-plus"></i> Nhập
            </button>
        `;
        lowStockProductsList.appendChild(li);
    });

    if (lowStock.length === 0 && outOfStock.length === 0) {
        lowStockProductsList.innerHTML = '<li>Không có sản phẩm nào sắp hết hàng hoặc hết hàng.</li>';
    }

    // Thêm event listeners cho các nút nhập hàng nhanh
    document.querySelectorAll('.quick-inventory-in-btn-dashboard').forEach(button => {
        button.addEventListener('click', (e) => quickInventoryIn(e.currentTarget.dataset.id));
    });
}

// Hàm tính toán tổng giá trị
async function calculateTotalValues() {
    let totalInValue = 0;
    let totalConsumedVal = 0;

    // Tính tổng giá trị nhập kho
    const inventoryInSnap = await getDocs(collection(db, 'inventoryIn'));
    inventoryInSnap.forEach(doc => {
        const entry = doc.data();
        if (entry.products) {
            totalInValue += entry.products.reduce((sum, item) =>
                sum + (item.quantity * item.purchasePrice), 0);
        }
    });

    // Tính tổng giá trị đã bán
    const consumeSnap = await getDocs(collection(db, 'consume'));
    consumeSnap.forEach(doc => {
        const entry = doc.data();
        if (entry.products) {
            totalConsumedVal += entry.products.reduce((sum, item) =>
                sum + (item.quantity * item.priceAtConsumption), 0);
        }
    });

    return { totalInValue, totalConsumedVal };
}

// Hàm cập nhật biểu đồ
async function updateDashboardCharts() {
    const consumptionChartCanvas = document.getElementById('consumptionChart');
    if (!consumptionChartCanvas) return;

    // Lấy dữ liệu 7 ngày gần nhất
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Lấy 6 ngày trước
    startDate.setHours(0, 0, 0, 0);

    const dailyData = await getDailyData(startDate);
    const labels = Object.keys(dailyData);

    // Hủy biểu đồ cũ nếu tồn tại
    if (consumptionChart) {
        consumptionChart.destroy();
    }

    // Tạo biểu đồ mới
    consumptionChart = new Chart(consumptionChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Giá trị đã bán (VNĐ)',
                data: Object.values(dailyData).map(data => data.consumed),
                backgroundColor: 'rgba(220, 53, 69, 0.7)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => 'Đã bán: ' + formatCurrency(context.raw)
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Hàm lấy dữ liệu theo ngày
async function getDailyData(startDate) {
    const dailyData = {};

    // Khởi tạo dữ liệu cho 7 ngày, bắt đầu từ ngày hiện tại
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Lấy 6 ngày trước và ngày hiện tại (tổng 7 ngày)
    for (let i = 6; i >= 0; i--) { // Đếm ngược từ 6 xuống 0
        const date = new Date();
        date.setDate(endDate.getDate() - i); // Trừ số ngày từ ngày hiện tại
        date.setHours(0, 0, 0, 0);
        const dateString = date.toLocaleDateString('vi-VN');
        dailyData[dateString] = { consumed: 0 };
    }

    // Lấy dữ liệu đã bán
    const consumeQuery = query(
        collection(db, 'consume'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
    );

    const consumeDocs = await getDocs(consumeQuery);
    consumeDocs.forEach(doc => {
        const data = doc.data();
        const entryDate = data.timestamp.toDate().toLocaleDateString('vi-VN');
        if (dailyData[entryDate]) {
            dailyData[entryDate].consumed += data.products.reduce((sum, item) =>
                sum + (item.quantity * item.priceAtConsumption), 0);
        }
    });

    return dailyData;
}

// Hàm xử lý lỗi
function handleDashboardError() {
    const elements = [
        totalProductsCount,
        totalInventoryInValue,
        totalConsumedValue,
        totalProfitValue
    ];

    elements.forEach(element => {
        if (element) element.textContent = 'Lỗi';
    });

    if (lowStockProductsList) {
        lowStockProductsList.innerHTML = '<li>Lỗi tải dữ liệu.</li>';
    }

    displayStatusMessage(dashboardSection, 'Lỗi khi tải dữ liệu Dashboard', 'error');
}

// --- Event Listeners ---

// Navigation
if (navDashboard) navDashboard.addEventListener('click', () => {
    showSection(dashboardSection, 'Tổng quan Kho hàng');
    loadDashboardKPIs(); // Refresh KPIs on dashboard view
});
if (navProducts) navProducts.addEventListener('click', () => {
    showSection(productsSection, 'Quản lý Sản phẩm');
    loadProducts();
});
if (navInventoryIn) navInventoryIn.addEventListener('click', () => {
    showSection(inventoryInSection, 'Nhập kho');
    loadInventoryIn();
});
if (navInventoryHistory) navInventoryHistory.addEventListener('click', () => {
    showSection(inventoryHistorySection, 'Lịch sử Nhập kho');
    loadProducts().then(() => { // Ensure products are loaded for dropdown
        loadInventoryHistory(1); // Load initial history, starting at page 1

    });
});
if (navConsume) navConsume.addEventListener('click', () => {
    showSection(consumeSection, 'Số lượng đã bán');
    loadConsume();
});
if (navReports) navReports.addEventListener('click', () => {
    showSection(reportsSection, 'Báo cáo');
    setupReportFilters();
});

// Product Modal
if (addProductButton) addProductButton.addEventListener('click', () => {
    currentEditProductId = null;
    if (modalTitle) modalTitle.textContent = 'Thêm Sản phẩm';
    if (saveProductButton) saveProductButton.innerHTML = '<i class="fas fa-plus"></i> Thêm sản phẩm';
    showModal(productModal);
});

if (productModal) {
    productModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(productModal));
    });
}
if (addProductForm) addProductForm.addEventListener('submit', saveProduct);

// Inventory In Modal
if (addInventoryInButton) addInventoryInButton.addEventListener('click', () => {
    // Set datetime mặc định là hiện tại
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Điều chỉnh timezone
    const defaultDateTime = now.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm
    if (inventoryInDateInput) {
        inventoryInDateInput.value = defaultDateTime;
    }
    showModal(inventoryInModal);
    addInventoryInProduct(); // Add first product input row, without pre-selected product
});

if (inventoryInModal) {
    inventoryInModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(inventoryInModal));
    });
}
if (addInventoryInProductButton) {
    addInventoryInProductButton.addEventListener('click', () => {
        addInventoryInProduct();
    });
}

if (addInventoryInForm) addInventoryInForm.addEventListener('submit', saveInventoryIn);

// Consume Modal
if (addConsumeButton) addConsumeButton.addEventListener('click', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Điều chỉnh timezone
    const defaultDateTime = now.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm
    if (consumeDateInput) {
        consumeDateInput.value = defaultDateTime;
    }
    showModal(consumeModal);
    addConsumeProduct(); // Add first product input row
});

if (consumeModal) {
    consumeModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(consumeModal));
    });
}
if (addConsumeProductButton) addConsumeProductButton.addEventListener('click', addConsumeProduct);
if (addConsumeForm) addConsumeForm.addEventListener('submit', saveConsume);

// View Modals
if (viewInventoryInModal) {
    viewInventoryInModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(viewInventoryInModal));
    });
}

if (viewConsumeModal) {
    viewConsumeModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(viewConsumeModal));
    });
}

// Delete Confirmation Modal
if (confirmDeleteModal) {
    confirmDeleteModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(confirmDeleteModal));
    });
    if (confirmDeleteButton) confirmDeleteButton.addEventListener('click', executeDelete);
    if (cancelDeleteButton) cancelDeleteButton.addEventListener('click', () => hideModal(confirmDeleteModal));
}


// Search functionality
if (productSearchInput) { // Event listener for input change (optional, for live search)
    productSearchInput.addEventListener('input', () => {
        const searchTerm = productSearchInput.value.trim();
        loadProducts(searchTerm);
    });
}
if (searchProductButton) searchProductButton.addEventListener('click', () => {
    const searchTerm = productSearchInput ? productSearchInput.value.trim() : '';
    loadProducts(searchTerm);
});

// Search for Inventory In (simplified, client-side filtering)
if (searchInventoryInButton) searchInventoryInButton.addEventListener('click', async () => {
    const searchTerm = inventoryInSearchInput ? inventoryInSearchInput.value.trim().toLowerCase() : '';
    const q = query(collection(db, 'inventoryIn'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const allInventoryIns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const filtered = allInventoryIns.filter(entry => {
        const matchesId = entry.id.toLowerCase().includes(searchTerm);
        const matchesSupplier = (entry.supplier || '').toLowerCase().includes(searchTerm);
        const matchesUser = (entry.user || '').toLowerCase().includes(searchTerm);
        const matchesProduct = entry.products.some(p => p.productName.toLowerCase().includes(searchTerm));
        return matchesId || matchesSupplier || matchesUser || matchesProduct;
    });
    displayInventoryIn(filtered);
});

// Search for Consume (simplified, client-side filtering)
if (searchConsumeButton) searchConsumeButton.addEventListener('click', async () => {
    const searchTerm = consumeSearchInput ? consumeSearchInput.value.trim().toLowerCase() : '';
    const q = query(collection(db, 'consume'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const allConsumes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const filtered = allConsumes.filter(entry => {
        const matchesId = entry.id.toLowerCase().includes(searchTerm);
        const matchesReason = (entry.reason || '').toLowerCase().includes(searchTerm);
        const matchesUser = (entry.user || '').toLowerCase().includes(searchTerm);
        const matchesProduct = entry.products.some(p => p.productName.toLowerCase().includes(searchTerm));
        return matchesId || matchesReason || matchesUser || matchesProduct;
    });
    displayConsume(filtered);
});

function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    // Kiểm tra nếu là Firebase Timestamp
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString('vi-VN');
    }
    // Nếu là Date object hoặc string
    const date = new Date(timestamp);
    if (!isNaN(date)) {
        return date.toLocaleString('vi-VN');
    }
    return 'N/A';
}

// Report Filters
function setupReportFilters() {
    if (reportPeriodSelect && reportStartDateInput && reportEndDateInput) {
        reportPeriodSelect.addEventListener('change', () => {
            if (reportPeriodSelect.value === 'custom') {
                reportStartDateInput.classList.remove('hidden');
                reportEndDateInput.classList.remove('hidden');
            } else {
                reportStartDateInput.classList.add('hidden');
                reportEndDateInput.classList.add('hidden');
            }
        });
    }

    if (generateReportButton && reportsSection) {
        generateReportButton.addEventListener('click', async () => {
            const reportPeriod = reportPeriodSelect ? reportPeriodSelect.value : '';
            let startDate = null;
            let endDate = null;

            if (reportPeriod === 'custom') {
                startDate = reportStartDateInput ? reportStartDateInput.value : null;
                endDate = reportEndDateInput ? reportEndDateInput.value : null;
                if (!startDate || !endDate) {
                    displayStatusMessage(reportsSection, 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc cho báo cáo tùy chỉnh.', 'error');
                    if (profitReportContent) profitReportContent.innerHTML = '';
                    return;
                }
            }

            if (reportPeriod) {
                await generateRevenueReport(reportPeriod, { startDate, endDate });
            } else {
                displayStatusMessage(reportsSection, 'Vui lòng chọn loại báo cáo hợp lệ.', 'error');
                if (profitReportContent) profitReportContent.innerHTML = '';
            }
        });
    }
}

// Get elements
const chartRangeSelect = document.getElementById('chartRangeSelect');
const customDateRange = document.getElementById('customDateRange');
const chartStartDate = document.getElementById('chartStartDate');
const chartEndDate = document.getElementById('chartEndDate');
const applyChartDates = document.getElementById('applyChartDates');

// Function to get data for chart
async function getChartData(startDate, endDate) {
    try {
        // Đảm bảo startDate bắt đầu từ 00:00:00.000
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        // Kết thúc ở 23:59:59.999
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        start.setDate(start.getDate());
        end.setDate(end.getDate() + 1); 

        // Kiểm tra nếu là cùng ngày
        const isSameDay = start.toDateString() === end.toDateString();

        // Khởi tạo mảng các ngày
        const dates = [];
        const currentDate = new Date(start);

        // Nếu là cùng ngày, chỉ thêm một ngày đó
        if (isSameDay) {
            dates.push(currentDate.toISOString().split('T')[0]);
        } 
        // Nếu khác ngày, thêm tất cả các ngày trong khoảng
        else {
            while (currentDate <= end) {
                dates.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Khởi tạo object dữ liệu với giá trị mặc định
        const dailyData = {};
        dates.forEach(date => {
            dailyData[date] = {
                sales: 0,
                consume: 0,
                profit: 0
            };
        });

        // Lấy dữ liệu doanh thu
        const salesQuery = query(
            collection(db, 'dailySales'),
            where('date', '>=', Timestamp.fromDate(start)),
            where('date', '<=', Timestamp.fromDate(end))
        );
        const salesDocs = await getDocs(salesQuery);
        salesDocs.forEach(doc => {
            const data = doc.data();
            const dateStr = data.date.toDate().toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                dailyData[dateStr].sales = data.amount;
            }
        });

        // Lấy dữ liệu tiêu hao
        const consumeQuery = query(
            collection(db, 'consume'),
            where('timestamp', '>=', Timestamp.fromDate(start)),
            where('timestamp', '<=', Timestamp.fromDate(end))
        );
        const consumeDocs = await getDocs(consumeQuery);
        consumeDocs.forEach(doc => {
            const data = doc.data();
            const dateStr = data.timestamp.toDate().toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                data.products.forEach(product => {
                    dailyData[dateStr].consume += product.quantity * product.priceAtConsumption;
                });
            }
        });

        // Trả về dữ liệu theo đúng thứ tự ngày
        return dates.map(date => ({
            date,
            sales: dailyData[date].sales,
            consume: dailyData[date].consume,
            profit: dailyData[date].sales - dailyData[date].consume
        }));
    } catch (error) {
        console.error("Error getting chart data:", error);
        return [];
    }
}



// Function to render chart
function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => formatDate(item.date)),
            datasets: [
                {
                    label: 'Doanh thu',
                    data: data.map(item => item.sales),
                    backgroundColor: 'rgba(26, 179, 148, 0.5)',
                    borderColor: 'rgba(26, 179, 148, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Đã bán',
                    data: data.map(item => item.consume),
                    backgroundColor: 'rgba(237, 85, 101, 0.5)',
                    borderColor: 'rgba(237, 85, 101, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lợi nhuận',
                    data: data.map(item => item.profit),
                    type: 'line',
                    borderColor: 'rgba(28, 132, 198, 1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {

                        label: function (context) {
                            return context.dataset.label + ': ' +
                                formatCurrency(context.raw);
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Function to update chart based on date range
async function updateRevenueChart(startDate, endDate) {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Xử lý trường hợp "Hôm nay"
        if (start.toDateString() === end.toDateString()) {
            // Không cần điều chỉnh ngày
        } 
        // Xử lý các trường hợp khác (7 ngày, 30 ngày, tùy chọn)
        else {
            end.setDate(end.getDate()   );
        }

        const data = await getChartData(start, end);
        renderRevenueChart(data);
    } catch (error) {
        console.error("Error updating revenue chart:", error);
    }
}



function formatDate(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        let date;
        // Xử lý Firebase Timestamp
        if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else {
            // Xử lý string hoặc Date object
            date = new Date(timestamp);
        }

        // Kiểm tra date hợp lệ
        if (isNaN(date)) return 'N/A';

        // Format: DD/MM/YYYY
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
}


// Function to handle range selection
function handleRangeSelection(range) {
    const customDateRange = document.getElementById('customDateRange');
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (range) {
        case 'today':
            customDateRange.classList.add('hidden');
            updateRevenueChart(startDate, endDate);
            break;
        case 'week':
            customDateRange.classList.add('hidden');
            // Lấy 6 ngày trước + ngày hiện tại
            startDate.setDate(endDate.getDate() - 6);
            updateRevenueChart(startDate, endDate);
            break;
        case 'month':
            customDateRange.classList.add('hidden');
            startDate.setDate(endDate.getDate() - 29);
            updateRevenueChart(startDate, endDate);
            break;
        case 'custom':
            customDateRange.classList.remove('hidden');
            // Set mặc định là 7 ngày gần nhất
            const defaultStart = new Date();
            defaultStart.setDate(defaultStart.getDate() - 6);
            if (chartStartDate && chartEndDate) {
                chartStartDate.value = defaultStart.toISOString().split('T')[0];
                chartEndDate.value = new Date().toISOString().split('T')[0];
            }
            break;
    }
}

// Khởi tạo trạng thái ban đầu của Dashboard khi tải trang
document.addEventListener('DOMContentLoaded', async () => {
    // Đảm bảo các phần tử DOM quan trọng đã được lấy
    if (dashboardSection) {
        showSection(dashboardSection, 'Tổng quan Kho hàng');
        setInitialSidebarVisibility();
        await loadDashboardKPIs(); // Load KPIs khi vào trang
    } else {
        console.error("Dashboard section not found.");
    }

    // Các thiết lập ban đầu cho các phần khác
    // Đảm bảo reportPeriodSelect tồn tại trước khi gọi setupReportFilters
    if (navReports && reportPeriodSelect) { // Kiểm tra cả navReports để đảm bảo liên kết được thiết lập
        setupReportFilters();
    }
    // Không cần gọi loadProducts() ở đây vì nó sẽ được gọi bởi navProducts click hoặc loadDashboardKPIs

    const addConsumeButton = document.getElementById('addConsumeButton');
    if (addConsumeButton) {
        addConsumeButton.addEventListener('click', () => {
            showModal(consumeModal);
            if (consumeProductsContainer) {
                consumeProductsContainer.innerHTML = ''; // Clear existing items
                addConsumeProduct(); // Add first row
            }
        });
    }

    if (navInventoryIn) {
        navInventoryIn.addEventListener('click', () => {
            showSection(inventoryInSection, 'Nhập kho');
            loadInventoryIn();
            setupInventoryInFilters();
        });
    }

    if (document.getElementById('reportsSection')) {
        handleRangeSelection('week'); // Mặc định hiển thị 7 ngày
    }

    if (navConsume) {
        navConsume.addEventListener('click', () => {
            showSection(consumeSection, 'Số lượng đã bán');
            loadConsume(null, null, 1);
            setupConsumeControls();
        });
    }

    if (navProducts) {
        navProducts.addEventListener('click', () => {
            showSection(productsSection, 'Quản lý Sản phẩm');
            loadProducts('', 1, '');
            setupProductControls();
        });
    }

    if (dailySalesForm) {
        dailySalesForm.addEventListener('submit', saveDailySales);
    }

    if (filterProfitButton) {
        filterProfitButton.addEventListener('click', () => {
            const startDate = profitStartDate?.value;
            const endDate = profitEndDate?.value;

            if (!startDate || !endDate) {
                displayStatusMessage(reportsSection, 'Vui lòng chọn đầy đủ ngày', 'error');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                displayStatusMessage(reportsSection, 'Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                return;
            }

            loadProfitData(startDate, endDate);
        });
    }

    if (resetProfitFilterButton) {
        resetProfitFilterButton.addEventListener('click', () => {
            if (profitStartDate) profitStartDate.value = '';
            if (profitEndDate) profitEndDate.value = '';
            loadProfitData();
        });
    }

    // Load dữ liệu khi vào trang Reports
    if (navReports) {
        navReports.addEventListener('click', () => {
            showSection(reportsSection, 'Báo cáo Lợi nhuận');
            loadProfitData();
        });
    }
    // Modal controls
    if (addSalesButton) {
        addSalesButton.addEventListener('click', showSalesModal);
    }

    if (salesModal) {
        // Đóng modal khi click nút close
        salesModal.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => hideModal(salesModal));
        });

        // Đóng modal khi click bên ngoài
        salesModal.addEventListener('click', (e) => {
            if (e.target === salesModal) {
                hideModal(salesModal);
            }
        });
    }

    if (dailySalesForm) {
        dailySalesForm.addEventListener('submit', saveDailySales);
    }
    if (chartRangeSelect) {
        chartRangeSelect.addEventListener('change', (e) => {
            handleRangeSelection(e.target.value);
        });
    }

    if (applyChartDates) {
        applyChartDates.addEventListener('click', () => {
            const startDate = document.getElementById('chartStartDate').value;
            const endDate = document.getElementById('chartEndDate').value;

            if (!startDate || !endDate) {
                displayStatusMessage(reportsSection,
                    'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'error');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                displayStatusMessage(reportsSection,
                    'Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                return;
            }

            const start = new Date(startDate);
        const end = new Date(endDate);
        updateRevenueChart(start, end);
        });
    }

    // Initialize revenue chart with today's data
    handleRangeSelection('today');

    handleResponsive();

    // Xử lý khi resize window
    window.addEventListener('resize', handleResponsive);

    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const mainContentArea = document.querySelector('.main-content-area');

            sidebar.classList.toggle('collapsed');
            mainContentArea.classList.toggle('content-collapsed');
        });
    }
});