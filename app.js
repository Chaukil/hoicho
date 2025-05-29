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
const navLogout = document.getElementById('navLogout');

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
let profitChart; // Biến để lưu trữ biểu đồ lợi nhuận


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

// Global variables
let allProducts = []; // Cache all products
let currentEditProductId = null;
let currentDeleteId = null;
let currentDeleteCollection = null; // 'products', 'inventoryIn', 'consume'

const INVENTORY_HISTORY_PAGE_SIZE = 10;
let totalInventoryHistoryPages = 1;
let filteredInventoryHistory = [];

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
    if (section === settingsSection && navSettings) navSettings.classList.add('active');
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

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    // Kiểm tra nếu là Firebase Timestamp object
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('vi-VN');
    }
    // Nếu là đối tượng Date hoặc chuỗi ngày ISO
    const date = new Date(timestamp);
    if (!isNaN(date)) {
        return date.toLocaleDateString('vi-VN');
    }
    return 'N/A';
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
        if (mainContentArea) mainContentArea.style.marginLeft = '0'; // Reset margin
    }
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('collapsed');
    });
}

// --- Data Operations (Firestore) ---

// Products
async function loadProducts(searchTerm = '') {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '<tr><td colspan="6">Đang tải sản phẩm...</td></tr>'; // Đã giảm colspan
    try {
        let q = collection(db, 'products');
        if (searchTerm) {
            // Firestore doesn't support full-text search directly.
            // This is a basic prefix/exact match. For more advanced, use Algolia/Elasticsearch.
            q = query(q, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
        }
        const querySnapshot = await getDocs(q);
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayProducts(allProducts);
        populateProductDropdowns(); // Update dropdowns after loading
        loadDashboardKPIs(); // Refresh KPIs including low stock products
    } catch (e) {
        console.error("Lỗi khi tải sản phẩm: ", e);
        productsTableBody.innerHTML = '<tr><td colspan="6" class="status-message error">Lỗi khi tải sản phẩm. Vui lòng thử lại.</td></tr>'; // Đã giảm colspan
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
async function loadInventoryIn() {
    if (!inventoryInTableBody) return;
    inventoryInTableBody.innerHTML = '<tr><td colspan="5">Đang tải phiếu nhập kho...</td></tr>';
    try {
        const q = query(collection(db, 'inventoryIn'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        displayInventoryIn(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
        console.error("Lỗi khi tải phiếu nhập kho: ", e);
        inventoryInTableBody.innerHTML = '<tr><td colspan="5" class="status-message error">Lỗi khi tải phiếu nhập kho. Vui lòng thử lại.</td></tr>';
    }
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
            <td>${formatDate(entry.timestamp)}</td>
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
    if (!productId && inventoryInProductsContainer.children.length > 0) {
        inventoryInProductsContainer.innerHTML = ''; // Clear previous items if adding a new form
    }

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-product-item');
    itemDiv.innerHTML = `
        <select class="inventory-product-select" required>
            <option value="">Chọn sản phẩm</option>
        </select>
        <input type="number" class="inventory-product-quantity" placeholder="Số lượng" min="1" required>
        <input type="number" class="inventory-product-price" placeholder="Giá nhập (VNĐ)" min="0" step="0.01" required>
        <button type="button" class="remove-product-button"><i class="fas fa-minus-circle"></i></button>
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

    const date = inventoryInDateInput.value;
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
            timestamp: Timestamp.fromDate(new Date(date)),
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
            viewInventoryInDate.textContent = formatDate(data.timestamp);
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

        displayInventoryHistory(pageItems);
        updatePaginationControls(page); // Pass current page to update controls
    } catch (e) {
        console.error("Lỗi khi tải lịch sử nhập kho: ", e);
        inventoryHistoryTableBody.innerHTML = '<tr><td colspan="6" class="status-message error">Lỗi khi tải lịch sử nhập kho. Vui lòng thử lại.</td></tr>';
    }
}

function displayInventoryHistory(historyItems) {
    if (!inventoryHistoryTableBody) return;
    inventoryHistoryTableBody.innerHTML = '';
    if (historyItems.length === 0) {
        inventoryHistoryTableBody.innerHTML = '<tr><td colspan="6">Không có mục lịch sử nhập kho nào phù hợp.</td></tr>';
        return;
    }

    historyItems.forEach(item => {
        const row = inventoryHistoryTableBody.insertRow();
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.productName}</td>
            <td>${formatDate(item.timestamp)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td>${formatCurrency(item.total)}</td>
        `;
    });
}

function updatePaginationControls(currentPageNum) { // Accept current page number as argument
    if (!currentInventoryHistoryPage || !totalInventoryHistoryPages || !prevInventoryHistoryPage || !nextInventoryHistoryPage) return;

    currentInventoryHistoryPage.textContent = `Trang ${currentPageNum} / ${totalInventoryHistoryPages}`;
    prevInventoryHistoryPage.disabled = currentPageNum === 1;
    nextInventoryHistoryPage.disabled = currentPageNum === totalInventoryHistoryPages || totalInventoryHistoryPages === 0;
}

// Consume
async function loadConsume() {
    if (!consumeTableBody) return;
    consumeTableBody.innerHTML = '<tr><td colspan="5">Đang tải phiếu tiêu hao...</td></tr>';
    try {
        const q = query(collection(db, 'consume'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        displayConsume(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
        console.error("Lỗi khi tải phiếu tiêu hao: ", e);
        consumeTableBody.innerHTML = '<tr><td colspan="5" class="status-message error">Lỗi khi tải phiếu tiêu hao. Vui lòng thử lại.</td></tr>';
    }
}

function displayConsume(consumes) {
    if (!consumeTableBody) return;
    consumeTableBody.innerHTML = '';
    if (consumes.length === 0) {
        consumeTableBody.innerHTML = '<tr><td colspan="5">Không có phiếu tiêu hao nào.</td></tr>';
        return;
    }

    consumes.forEach(entry => {
        const row = consumeTableBody.insertRow();
        const totalValue = entry.products.reduce((sum, item) => sum + (item.quantity * item.priceAtConsumption), 0);
        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${formatDate(entry.timestamp)}</td>
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

async function addConsumeProduct() {
    if (!consumeProductsContainer) return;
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('consume-product-item');
    itemDiv.innerHTML = `
        <select class="consume-product-select" required>
            <option value="">Chọn sản phẩm</option>
        </select>
        <input type="number" class="consume-product-quantity" placeholder="Số lượng" min="1" required>
        <button type="button" class="remove-product-button"><i class="fas fa-minus-circle"></i></button>
    `;
    consumeProductsContainer.appendChild(itemDiv);

    // Populate dropdown for new item
    const select = itemDiv.querySelector('.consume-product-select');
    populateProductDropdown(select);

    // Add event listeners for quantity change to update total
    const quantityInput = itemDiv.querySelector('.consume-product-quantity');
    const removeButton = itemDiv.querySelector('.remove-product-button');

    quantityInput.addEventListener('input', () => calculateConsumeTotal());
    select.addEventListener('change', () => calculateConsumeTotal()); // Also update on product change

    removeButton.addEventListener('click', () => {
        itemDiv.remove();
        calculateConsumeTotal();
    });

    calculateConsumeTotal(); // Initial calculation
}

async function calculateConsumeTotal() {
    let total = 0;
    const items = document.querySelectorAll('#consumeProductsContainer .consume-product-item');
    for (const item of items) {
        const productId = item.querySelector('.consume-product-select').value;
        const quantity = parseFloat(item.querySelector('.consume-product-quantity').value) || 0;

        if (productId && quantity > 0) {
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                total += quantity * (product.lastPurchasePrice || 0); // Sử dụng lastPurchasePrice (giá nhập cuối cùng)
            }
        }
    }
    if (consumeTotalAmountSpan) {
        consumeTotalAmountSpan.textContent = formatCurrency(total);
    }
    return total;
}

async function saveConsume(e) {
    e.preventDefault();
    if (!addConsumeForm) return;

    const date = consumeDateInput.value;
    const reason = consumeReasonInput.value.trim();
    const productsToConsume = [];
    let isValid = true;

    for (const item of document.querySelectorAll('#consumeProductsContainer .consume-product-item')) {
        const productId = item.querySelector('.consume-product-select').value;
        const quantity = parseInt(item.querySelector('.consume-product-quantity').value);

        if (!productId || isNaN(quantity) || quantity <= 0) {
            isValid = false;
            break;
        }

        const productInCache = allProducts.find(p => p.id === productId);
        if (!productInCache) {
            isValid = false;
            displayStatusMessage(addConsumeForm, `Sản phẩm với ID ${productId} không tìm thấy.`, 'error');
            return;
        }
        if (quantity > productInCache.currentStock) {
            isValid = false;
            displayStatusMessage(addConsumeForm, `Số lượng tiêu hao của ${productInCache.name} (${quantity}) vượt quá tồn kho hiện tại (${productInCache.currentStock}).`, 'error');
            return;
        }

        productsToConsume.push({
            productId,
            productName: productInCache.name,
            quantity,
            priceAtConsumption: productInCache.lastPurchasePrice || 0 // Lưu giá nhập cuối cùng tại thời điểm tiêu hao
        });
    }

    if (!isValid || productsToConsume.length === 0) {
        displayStatusMessage(addConsumeForm, 'Vui lòng chọn sản phẩm và nhập đầy đủ số lượng hợp lệ, và đảm bảo số lượng tồn kho đủ.', 'error');
        return;
    }

    try {
        const consumeRef = await addDoc(collection(db, 'consume'), {
            timestamp: Timestamp.fromDate(new Date(date)),
            user: 'Admin', // Hardcoded for now
            reason: reason,
            products: productsToConsume
        });

        // Cập nhật tồn kho sản phẩm
        for (const item of productsToConsume) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const currentStock = productSnap.data().currentStock || 0;
                await updateDoc(productRef, {
                    currentStock: currentStock - item.quantity
                });
            }
        }
        displayStatusMessage(addConsumeForm, 'Tạo phiếu tiêu hao thành công!', 'success');
        await loadConsume();
        await loadProducts(); // Reload products to update current stock
        setTimeout(() => hideModal(consumeModal), 1500);
    } catch (e) {
        console.error("Lỗi khi tạo phiếu tiêu hao: ", e);
        displayStatusMessage(addConsumeForm, 'Lỗi khi tạo phiếu tiêu hao. Vui lòng thử lại.', 'error');
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
            viewConsumeDate.textContent = formatDate(data.timestamp);
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
            displayStatusMessage(viewConsumeModal, 'Không tìm thấy phiếu tiêu hao này.', 'error');
            setTimeout(() => hideModal(viewConsumeModal), 1500);
        }
    } catch (e) {
        console.error("Error viewing consume: ", e);
        displayStatusMessage(viewConsumeModal, 'Lỗi khi tải chi tiết phiếu tiêu hao.', 'error');
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
        if (currentDeleteCollection === 'products') {
            const productRef = doc(db, 'products', currentDeleteId);
            const productSnap = await getDoc(productRef);
            // Modified: Allow deleting if stock is 0
            if (productSnap.exists() && productSnap.data().currentStock > 0) {
                displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'), 'Không thể xóa sản phẩm đang có tồn kho. Vui lòng điều chỉnh tồn kho về 0 trước.', 'error');
                return;
            }
        }

        await deleteDoc(doc(db, currentDeleteCollection, currentDeleteId));
        displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'), 'Xóa thành công!', 'success');

        // Reload appropriate data
        if (currentDeleteCollection === 'products') await loadProducts();
        else if (currentDeleteCollection === 'inventoryIn') {
            // If an inventoryIn entry is deleted, we need to reverse the stock changes
            // This is complex and usually handled by more robust transaction logs.
            // For now, we'll just reload. A proper solution would require decrementing stock for each product in the deleted inventoryIn.
            // For a simpler approach, you might disallow deleting inventoryIn entries that have already affected stock significantly.
            await loadInventoryIn();
            await loadProducts(); // Stock might be affected
        }
        else if (currentDeleteCollection === 'consume') {
            // Similar to inventoryIn, deleting a consume entry implies reversing stock changes.
            // This would also need a more robust approach.
            await loadConsume();
            await loadProducts(); // Stock might be affected
        }

        setTimeout(() => hideModal(confirmDeleteModal), 1500);
    } catch (e) {
        console.error("Lỗi khi xóa: ", e);
        displayStatusMessage(confirmDeleteModal.querySelector('.modal-content'), 'Lỗi khi xóa. Vui lòng thử lại.', 'error');
    } finally {
        currentDeleteId = null;
        currentDeleteCollection = null;
    }
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

// --- Dashboard KPIs and Charts ---
async function loadDashboardKPIs() {
    if (!totalProductsCount || !totalInventoryInValue || !totalConsumedValue || !totalProfitValue || !lowStockProductsList || !profitChartCanvas) return;

    try {
        // Total Products
        const productsSnap = await getDocs(collection(db, 'products'));
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allProducts = products; // Update global cache
        totalProductsCount.textContent = products.length;

        // Low Stock Products
        lowStockProductsList.innerHTML = '';
        const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
        const outOfStock = products.filter(p => p.currentStock === 0);

        if (lowStock.length > 0) {
            lowStock.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${p.name}</span>
                    <span class="stock-warning">${p.currentStock} ${p.unit}</span>
                    <button class="action-button small-button quick-inventory-in-btn-dashboard" data-id="${p.id}" title="Nhập kho nhanh"><i class="fas fa-plus"></i> Nhập</button>
                `;
                lowStockProductsList.appendChild(li);
            });
        }
        // Display out of stock products separately or combine
        if (outOfStock.length > 0) {
            outOfStock.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${p.name}</span>
                    <span class="stock-warning out-of-stock-dashboard">Hết hàng</span>
                    <button class="action-button small-button quick-inventory-in-btn-dashboard" data-id="${p.id}" title="Nhập kho nhanh"><i class="fas fa-plus"></i> Nhập</button>
                `;
                lowStockProductsList.appendChild(li);
            });
        }

        if (lowStock.length === 0 && outOfStock.length === 0) {
            lowStockProductsList.innerHTML = '<li>Không có sản phẩm nào sắp hết hàng hoặc hết hàng.</li>';
        }

        // Add event listeners for these newly created buttons (for both low stock and out of stock)
        document.querySelectorAll('.quick-inventory-in-btn-dashboard').forEach(button => {
            button.addEventListener('click', (e) => quickInventoryIn(e.currentTarget.dataset.id));
        });


        // Total Inventory In Value
        const inventoryInSnap = await getDocs(collection(db, 'inventoryIn'));
        let totalInValue = 0;
        inventoryInSnap.forEach(docSnap => {
            const entry = docSnap.data();
            if (entry.products) {
                totalInValue += entry.products.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
            }
        });
        totalInventoryInValue.textContent = formatCurrency(totalInValue);

        // Total Consumed Value & Profit Calculation
        const consumeSnap = await getDocs(collection(db, 'consume'));
        let totalConsumedVal = 0;
        consumeSnap.forEach(docSnap => {
            const entry = docSnap.data();
            if (entry.products) {
                totalConsumedVal += entry.products.reduce((sum, item) => sum + (item.quantity * item.priceAtConsumption), 0);
            }
        });
        totalConsumedValue.textContent = formatCurrency(totalConsumedVal);

        // Đây là giá trị hàng còn lại ước tính, không phải lợi nhuận ròng
        totalProfitValue.textContent = formatCurrency(totalInValue - totalConsumedVal);
        // Bạn có thể đổi textContent của totalProfitValue thành 'Giá trị còn lại ước tính:' trong index.html
        // Ví dụ: <p><strong>Giá trị còn lại ước tính:</strong> <span id="totalProfitValue"></span></p>

        // --- Biểu đồ tổng lợi nhuận 7 ngày gần nhất ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 ngày bao gồm cả hôm nay
        sevenDaysAgo.setHours(0, 0, 0, 0); // Đặt giờ về 0 để so sánh chính xác

        const dailyData = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);
            const dateString = date.toLocaleDateString('vi-VN');
            dailyData[dateString] = { in: 0, consumed: 0 };
        }

        // Lấy dữ liệu nhập kho 7 ngày gần nhất
        const qInventoryIn = query(
            collection(db, 'inventoryIn'),
            where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo))
        );
        const inventoryInDocs = await getDocs(qInventoryIn);
        inventoryInDocs.forEach(docSnap => {
            const data = docSnap.data();
            const entryDate = data.timestamp.toDate().toLocaleDateString('vi-VN');
            if (dailyData[entryDate]) {
                dailyData[entryDate].in += data.products.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
            }
        });

        // Lấy dữ liệu tiêu hao 7 ngày gần nhất
        const qConsume = query(
            collection(db, 'consume'),
            where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo))
        );
        const consumeDocs = await getDocs(qConsume);
        consumeDocs.forEach(docSnap => {
            const data = docSnap.data();
            const entryDate = data.timestamp.toDate().toLocaleDateString('vi-VN');
            if (dailyData[entryDate]) {
                dailyData[entryDate].consumed += data.products.reduce((sum, item) => sum + (item.quantity * item.priceAtConsumption), 0);
            }
        });

        const labels = Object.keys(dailyData);
        const dailyProfit = Object.values(dailyData).map(data => data.in - data.consumed); // "Lợi nhuận" = nhập - tiêu hao

        if (profitChart) {
            profitChart.destroy(); // Hủy biểu đồ cũ nếu có
        }

        profitChart = new Chart(profitChartCanvas, {
            type: 'bar', // Có thể dùng 'line' hoặc 'bar'
            data: {
                labels: labels,
                datasets: [{
                    label: 'Giá trị còn lại (VNĐ)', // Hoặc 'Lợi nhuận ước tính (VNĐ)'
                    data: dailyProfit,
                    backgroundColor: 'rgba(26, 179, 148, 0.7)',
                    borderColor: 'rgba(26, 179, 148, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });

    } catch (e) {
        console.error("Lỗi khi tải KPIs Dashboard hoặc biểu đồ: ", e);
        if (totalProductsCount) totalProductsCount.textContent = 'Lỗi';
        if (totalInventoryInValue) totalInventoryInValue.textContent = 'Lỗi';
        if (totalConsumedValue) totalConsumedValue.textContent = 'Lỗi';
        if (totalProfitValue) totalProfitValue.textContent = 'Lỗi';
        if (lowStockProductsList) lowStockProductsList.innerHTML = '<li>Lỗi tải dữ liệu.</li>';
        if (profitChartCanvas) {
            const parent = profitChartCanvas.parentElement;
            if (parent) {
                parent.innerHTML = '<p class="status-message error" style="margin: 20px;">Lỗi tải biểu đồ. Vui lòng thử lại.</p>';
            }
        }
    }
}

// --- Report Generation ---
async function generateRevenueReport(period, customDates = {}) {
    if (!profitReportContent) return;
    profitReportContent.innerHTML = '<h3>Đang tạo báo cáo...</h3>';

    let startDate, endDate;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    switch (period) {
        case 'today':
            startDate = now;
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisWeek':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay()); // Start of Sunday
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // End of Saturday
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Last day of month
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'custom':
            if (customDates.startDate) {
                startDate = new Date(customDates.startDate);
                startDate.setHours(0, 0, 0, 0);
            }
            if (customDates.endDate) {
                endDate = new Date(customDates.endDate);
                endDate.setHours(23, 59, 59, 999);
            }
            if (!startDate || !endDate || startDate > endDate) {
                displayStatusMessage(reportsSection, 'Ngày tùy chỉnh không hợp lệ.', 'error');
                profitReportContent.innerHTML = '';
                return;
            }
            break;
        default:
            displayStatusMessage(reportsSection, 'Vui lòng chọn kỳ báo cáo.', 'error');
            profitReportContent.innerHTML = '';
            return;
    }

    try {
        let totalValueIn = 0;
        let totalValueConsumed = 0;

        // Get all inventory in entries within the period
        const inventoryInQuery = query(
            collection(db, 'inventoryIn'),
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            where('timestamp', '<=', Timestamp.fromDate(endDate))
        );
        const inventoryInSnap = await getDocs(inventoryInQuery);

        inventoryInSnap.forEach(inventoryInDoc => {
            const inventoryInData = inventoryInDoc.data();
            if (inventoryInData.products) {
                totalValueIn += inventoryInData.products.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
            }
        });

        // Get all consumed items within the period
        const consumeQuery = query(
            collection(db, 'consume'),
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            where('timestamp', '<=', Timestamp.fromDate(endDate))
        );
        const consumeSnap = await getDocs(consumeQuery);

        consumeSnap.forEach(consumeDoc => {
            const consumeData = consumeDoc.data();
            if (consumeData.products) {
                consumeData.products.forEach(item => {
                    // Giá trị tiêu hao được tính bằng giá nhập tại thời điểm tiêu hao
                    totalValueConsumed += item.quantity * item.priceAtConsumption;
                });
            }
        });

        profitReportContent.innerHTML = `
            <h3>Báo cáo Giá trị Hàng hóa</h3>
            <p><strong>Kỳ báo cáo:</strong> ${formatDate(startDate)} - ${formatDate(endDate)}</p>
            <p><strong>Tổng giá trị hàng nhập:</strong> ${formatCurrency(totalValueIn)}</p>
            <p><strong>Tổng giá trị hàng đã tiêu hao:</strong> ${formatCurrency(totalValueConsumed)}</p>
            <p class="total-profit"><strong>Giá trị hàng còn lại (ước tính):</strong> ${formatCurrency(totalValueIn - totalValueConsumed)}</p>
            <p style="font-size: 0.9em; color: #777; margin-top: 20px;">
                *Lưu ý: Báo cáo này theo dõi tổng giá trị hàng nhập và hàng đã tiêu hao dựa trên giá nhập.
                Giá trị hàng còn lại là ước tính và không phản ánh tồn kho vật lý hiện tại.
            </p>
        `;
        displayStatusMessage(reportsSection, 'Tạo báo cáo thành công!', 'success');

    } catch (e) {
        console.error("Lỗi khi tạo báo cáo: ", e);
        profitReportContent.innerHTML = '<p class="status-message error">Lỗi khi tạo báo cáo. Vui lòng thử lại.</p>';
        displayStatusMessage(reportsSection, 'Lỗi khi tạo báo cáo. Vui lòng thử lại.', 'error');
    }
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
        setupInventoryHistoryFilters();
    });
});
if (navConsume) navConsume.addEventListener('click', () => {
    showSection(consumeSection, 'Tiêu hao Hàng hóa');
    loadConsume();
});
if (navReports) navReports.addEventListener('click', () => {
    showSection(reportsSection, 'Báo cáo');
    setupReportFilters();
});
if (navSettings) navSettings.addEventListener('click', () => {
    showSection(settingsSection, 'Cài đặt');
});
if (navLogout) navLogout.addEventListener('click', () => {
    // Trong môi trường này, không có chức năng đăng xuất thực tế.
    // Có thể thêm window.location.href = 'login.html'; nếu có trang login.
    alert('Chức năng đăng xuất sẽ đưa bạn về trang đăng nhập nếu có.');
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
    showModal(inventoryInModal);
    addInventoryInProduct(); // Add first product input row, without pre-selected product
});

if (inventoryInModal) {
    inventoryInModal.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => hideModal(inventoryInModal));
    });
}
if (addInventoryInProductButton) addInventoryInProductButton.addEventListener('click', () => addInventoryInProduct()); // Ensure this adds a new empty row
if (addInventoryInForm) addInventoryInForm.addEventListener('submit', saveInventoryIn);

// Consume Modal
if (addConsumeButton) addConsumeButton.addEventListener('click', () => {
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

// Inventory History Filter
function setupInventoryHistoryFilters() {
    if (filterInventoryHistoryButton) {
        filterInventoryHistoryButton.addEventListener('click', () => {
            const filters = {
                productId: inventoryHistoryProductFilter ? inventoryHistoryProductFilter.value : '',
                startDate: inventoryHistoryStartDate ? inventoryHistoryStartDate.value : '',
                endDate: inventoryHistoryEndDate ? inventoryHistoryEndDate.value : ''
            };
            loadInventoryHistory(1, filters); // Load first page with filters
        });
    }

    if (resetInventoryHistoryFilterButton) {
        resetInventoryHistoryFilterButton.addEventListener('click', () => {
            if (inventoryHistoryProductFilter) inventoryHistoryProductFilter.value = '';
            if (inventoryHistoryStartDate) inventoryHistoryStartDate.value = '';
            if (inventoryHistoryEndDate) inventoryHistoryEndDate.value = '';
            loadInventoryHistory(1); // Reload without filters, reset to page 1
        });
    }

    if (prevInventoryHistoryPage) {
        prevInventoryHistoryPage.addEventListener('click', () => {
            const currentPageNumber = parseInt(currentInventoryHistoryPage.textContent.split('/')[0].replace('Trang ', '').trim());
            if (currentPageNumber > 1) {
                loadInventoryHistory(currentPageNumber - 1, {
                    productId: inventoryHistoryProductFilter ? inventoryHistoryProductFilter.value : '',
                    startDate: inventoryHistoryStartDate ? inventoryHistoryStartDate.value : '',
                    endDate: inventoryHistoryEndDate ? inventoryHistoryEndDate.value : ''
                });
            }
        });
    }

    if (nextInventoryHistoryPage) {
        nextInventoryHistoryPage.addEventListener('click', () => {
            const currentPageNumber = parseInt(currentInventoryHistoryPage.textContent.split('/')[0].replace('Trang ', '').trim());
            if (currentPageNumber < totalInventoryHistoryPages) {
                loadInventoryHistory(currentPageNumber + 1, {
                    productId: inventoryHistoryProductFilter ? inventoryHistoryProductFilter.value : '',
                    startDate: inventoryHistoryStartDate ? inventoryHistoryStartDate.value : '',
                    endDate: inventoryHistoryEndDate ? inventoryHistoryEndDate.value : ''
                });
            }
        });
    }
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
});