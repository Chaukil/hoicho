// Biến toàn cục
let currentSection = 'overview';
let productsData = [];
let importsData = [];
let soldData = [];
let profitData = [];
let salesChart = null;
let firebaseReady = false;

// Cài đặt phân trang
const ITEMS_PER_PAGE = 10;
let currentPage = {
    products: 1,
    import: 1,
    sold: 1,
    profit: 1
};

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Đang khởi tạo ứng dụng...');
        
        // Hiển thị loading state
        showLoadingOverlay();
        
        // Đợi Firebase được khởi tạo
        await waitForFirebase();
        firebaseReady = true;
        
        // Khởi tạo event listeners
        initializeEventListeners();
        
        // Tải dữ liệu
        await loadAllData();
        
        // Hiển thị trang overview
        showSection('overview');
        
        // Ẩn loading
        hideLoadingOverlay();
        
        console.log('Ứng dụng khởi tạo thành công!');
        
    } catch (error) {
        console.error('Lỗi khởi tạo ứng dụng:', error);
        hideLoadingOverlay();
        showAlert('Lỗi khởi tạo ứng dụng: ' + error.message, 'danger');
    }
});

function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-overlay">
            <div class="loading-content">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <h5>Đang khởi tạo ứng dụng...</h5>
                <p class="text-muted">Vui lòng đợi trong giây lát</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Sửa hàm waitForFirebase() trong script.js
async function waitForFirebase(maxWait = 10000) {
    const startTime = Date.now();
    
    console.log('Đang chờ Firebase khởi tạo...');
    
    while (!window.firebaseDB && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (!window.firebaseDB) {
        throw new Error('Firebase không thể khởi tạo sau 15 giây');
    }
    
    console.log('Firebase đã sẵn sàng');
    return true;
}


// Các sự kiện lắng nghe
function initializeEventListeners() {
    // Sự kiện tìm kiếm và lọc
    document.getElementById('productSearch').addEventListener('input', () => filterProducts());
    document.getElementById('productStatusFilter').addEventListener('change', () => filterProducts());
    
    document.getElementById('importSearch').addEventListener('input', () => filterImports());
    document.getElementById('importDateFilter').addEventListener('change', () => filterImports());
    
    document.getElementById('soldSearch').addEventListener('input', () => filterSold());
    document.getElementById('soldDateFilter').addEventListener('change', () => filterSold());
    
    document.getElementById('profitSearch').addEventListener('input', () => filterProfit());
    document.getElementById('profitDateFilter').addEventListener('change', () => filterProfit());
}

async function showSection(section, element = null) {
    // Kiểm tra Firebase đã sẵn sàng chưa
    if (!firebaseReady || !window.firebaseDB) {
        console.log('Firebase chưa sẵn sàng, đang chờ...');
        try {
            await waitForFirebase();
            firebaseReady = true;
        } catch (error) {
            console.error('Lỗi Firebase:', error);
            showAlert('Lỗi kết nối cơ sở dữ liệu!', 'danger');
            return;
        }
    }
    
    // Ẩn tất cả các phần
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.add('d-none');
    });
    
    // Xóa class active khỏi tất cả nav link
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
    });
    
    // Hiển thị phần được chọn
    document.getElementById(section).classList.remove('d-none');
    
    // Thêm class active cho nav link hiện tại
    if (element) {
        element.classList.add('active');
    } else {
        // Tìm nav link tương ứng
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${section}'`)) {
                link.classList.add('active');
            }
        });
    }
    
    // Ẩn sidebar trên mobile sau khi chọn
    hideMobileSidebar();
    
    currentSection = section;
    
    // Tải dữ liệu cho phần hiện tại
    try {
        switch(section) {
            case 'overview':
                updateOverview();
                break;
            case 'products':
                displayProducts();
                break;
            case 'import':
                displayImports();
                break;
            case 'sold':
                displaySold();
                break;
            case 'profit':
                displayProfit();
                break;
        }
    } catch (error) {
        console.error(`Lỗi hiển thị section ${section}:`, error);
        showAlert(`Lỗi hiển thị ${section}`, 'warning');
    }
}


function showLoadingState(section) {
    const sectionElement = document.getElementById(section);
    const loader = document.createElement('div');
    loader.className = 'text-center p-4 loading-indicator';
    loader.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải dữ liệu...</p>
    `;
    sectionElement.appendChild(loader);
}

function hideLoadingState(section) {
    const loader = document.querySelector(`#${section} .loading-indicator`);
    if (loader) loader.remove();
}

async function loadDataWithRetry(loadFunction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await loadFunction();
            return;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            // Đợi trước khi thử lại
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

function validateProductData(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.trim() === '') {
        errors.push('Tên sản phẩm không được để trống');
    }
    
    if (!productData.minStock || productData.minStock < 0) {
        errors.push('Tồn kho tối thiểu phải >= 0');
    }
    
    if (!productData.price || productData.price <= 0) {
        errors.push('Giá phải > 0');
    }
    
    if (!productData.ticketCalc || productData.ticketCalc <= 0) {
        errors.push('Tính vé phải > 0');
    }
    
    return errors;
}

async function saveProduct() {
    const productData = {
        name: document.getElementById('productName').value.trim(),
        minStock: parseInt(document.getElementById('minStock').value),
        unit: document.getElementById('unit').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        ticketCalc: parseFloat(document.getElementById('ticketCalc').value)
    };
    
    // Kiểm tra dữ liệu
    const errors = validateProductData(productData);
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return;
    }
    
    const productId = document.getElementById('productId').value;
    
    try {
        if (productId) {
            await window.firebaseDB.collection('products').doc(productId).update(productData);
            showAlert('Cập nhật sản phẩm thành công!', 'success');
        } else {
            await window.firebaseDB.collection('products').add(productData);
            showAlert('Thêm sản phẩm thành công!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        await loadProducts();
        if (currentSection === 'products') displayProducts();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi lưu sản phẩm!', 'danger');
    }
}

// Sửa hàm loadAllData() trong script.js
async function loadAllData() {
    // Kiểm tra Firebase
    if (!firebaseReady || !window.firebaseDB) {
        await waitForFirebase();
        firebaseReady = true;
    }
    
    try {
        console.log('Đang tải dữ liệu...');
        
        // Tải dữ liệu song song
        await Promise.all([
            loadProducts(),
            loadImports(),
            loadSold(),
            loadProfit()
        ]);
        
        console.log('Tải dữ liệu thành công');
        
        // Tự động tạo profit cho các ngày bán hàng
        if (soldData.length > 0) {
            await autoGenerateProfit();
        }
        
        console.log('Dữ liệu đã sẵn sàng');
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showAlert('Lỗi khi tải dữ liệu: ' + error.message, 'danger');
        throw error;
    }
}

async function loadProducts() {
    try {
        const snapshot = await window.firebaseDB.collection('products').get();
        
        productsData = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            if (data && typeof data === 'object') {
                productsData.push({
                    id: doc.id,
                    ...data
                });
            } else {
                console.warn('Invalid product data structure:', doc.id, data);
            }
        });
        
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
    }
}

function validateAndFixData() {
    
    // Kiểm tra imports
    importsData.forEach((importItem, index) => {
        if (!importItem.products || !Array.isArray(importItem.products)) {
            importsData[index].products = [];
        }
        
        if (!importItem.date) {
            importsData[index].date = new Date().toISOString().split('T')[0];
        }
        
        if (!importItem.person) {
            importsData[index].person = 'Không xác định';
        }
    });
    
    // Kiểm tra sold
    soldData.forEach((soldItem, index) => {
        if (!soldItem.products || !Array.isArray(soldItem.products)) {
            soldData[index].products = [];
        }
        
        if (!soldItem.date) {
            soldData[index].date = new Date().toISOString().split('T')[0];
        }
        
        if (!soldItem.person) {
            soldData[index].person = 'Không xác định';
        }
    });
    
}

async function loadImports() {
    try {
        const snapshot = await window.firebaseDB.collection('imports').orderBy('date', 'desc').get();
        
        importsData = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Kiểm tra cấu trúc dữ liệu
            if (data && typeof data === 'object') {
                importsData.push({
                    id: doc.id,
                    ...data
                });
            } else {
                console.warn('Invalid import data structure:', doc.id, data);
            }
        });
        
    } catch (error) {
        
        // Thử load không có orderBy
        try {
            const snapshot = await window.firebaseDB.collection('imports').get();
            importsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (fallbackError) {
            console.error('Lỗi fallback load imports:', fallbackError);
        }
    }
}

async function loadSold() {
    try {
        const snapshot = await window.firebaseDB.collection('sold').orderBy('date', 'desc').get();
        
        soldData = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            if (data && typeof data === 'object') {
                soldData.push({
                    id: doc.id,
                    ...data
                });
            } else {
                console.warn('Invalid sold data structure:', doc.id, data);
            }
        });
        
    } catch (error) {
        
        // Fallback
        try {
            const snapshot = await window.firebaseDB.collection('sold').get();
            soldData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (fallbackError) {
            console.error('Lỗi fallback load sold:', fallbackError);
        }
    }
}

async function loadProfit() {
    try {
        const snapshot = await window.firebaseDB.collection('profit').orderBy('date', 'desc').get();
        profitData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Lỗi khi tải lợi nhuận:', error);
    }
}

// Các hàm tổng quan
function updateOverview() {
    try {
        validateAndFixData();
        updateStatsCards();
        updateLowStockAlert();
        updateSalesChart();
        autoGenerateProfit();
    } catch (error) {
        showAlert('Lỗi khi hiển thị tổng quan', 'warning');
    }
    
}

// Thêm hàm này vào script.js
async function autoGenerateProfit() {
    try {
        // Lấy tất cả ngày bán hàng
        const salesDates = [...new Set(soldData.map(item => item.date))];
        
        for (const date of salesDates) {
            // Kiểm tra xem ngày này đã có profit chưa
            const existingProfit = profitData.find(p => p.date === date);
            
            if (!existingProfit) {
                // Tính toán các giá trị cho ngày này
                const dayStats = calculateDayStats(date);
                
                if (dayStats.totalTickets > 0) {
                    const profitData = {
                        date: date,
                        revenue: dayStats.totalTickets * 120000, // tổng vé * 120,000
                        expense: dayStats.totalValue, // tổng giá trị bán
                        tax: dayStats.totalTickets * 30000, // tổng vé * 30,000
                        note: ''
                    };
                    
                    // Lưu vào Firebase
                    await window.firebaseDB.collection('profit').add(profitData);
                    console.log(`Đã tạo profit cho ngày ${date}`);
                }
            }
        }
        
        // Tải lại dữ liệu profit
        await loadProfit();
        
    } catch (error) {
        console.error('Lỗi khi tự động tạo profit:', error);
    }
}

// Hàm tính toán thống kê theo ngày
function calculateDayStats(date) {
    const daysSold = soldData.filter(item => item.date === date);
    
    let totalTickets = 0;
    let totalValue = 0;
    
    daysSold.forEach(soldItem => {
        soldItem.products.forEach(product => {
            const productData = productsData.find(p => p.id === product.productId);
            if (productData) {
                // Tính vé
                totalTickets += (product.quantity / productData.ticketCalc);
                // Tính giá trị
                totalValue += (product.quantity * productData.price);
            }
        });
    });
    
    return {
        totalTickets: totalTickets,
        totalValue: totalValue
    };
}


async function reloadAllData() {
    try {
        showAlert('Đang tải lại dữ liệu...', 'info');
        await loadAllData();
        
        // Refresh hiển thị hiện tại
        switch(currentSection) {
            case 'overview':
                updateOverview();
                break;
            case 'products':
                displayProducts();
                break;
            case 'import':
                displayImports();
                break;
            case 'sold':
                displaySold();
                break;
            case 'profit':
                displayProfit();
                break;
        }
        
        showAlert('Tải lại dữ liệu thành công!', 'success');
    } catch (error) {
        showAlert('Lỗi khi tải lại dữ liệu!', 'danger');
    }
}

function updateStatsCards() {
    // Tính tổng
    const totalProducts = productsData.length;
    const totalImportedValue = calculateTotalImportedValue(); // Đổi thành giá trị
    const totalSoldValue = calculateTotalSoldValue(); // Đổi thành giá trị
    const totalStockValue = calculateTotalStockValue(); // Đổi thành giá trị
    
    // Cập nhật thẻ
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalImported').textContent = formatCurrency(totalImportedValue);
    document.getElementById('totalSold').textContent = formatCurrency(totalSoldValue);
    document.getElementById('totalStock').textContent = formatCurrency(totalStockValue);
}

function calculateTotalImportedValue() {
    return importsData.reduce((total, importItem) => {
        return total + importItem.products.reduce((sum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return sum + (productData ? product.quantity * productData.price : 0);
        }, 0);
    }, 0);
}

// Tính tổng giá trị đã bán
function calculateTotalSoldValue() {
    return soldData.reduce((total, soldItem) => {
        return total + soldItem.products.reduce((sum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return sum + (productData ? product.quantity * productData.price : 0);
        }, 0);
    }, 0);
}

// Tính tổng giá trị tồn kho
function calculateTotalStockValue() {
    return productsData.reduce((total, product) => {
        const imported = getProductImported(product.id);
        const sold = getProductSold(product.id);
        const currentStock = imported - sold;
        return total + (currentStock * product.price);
    }, 0);
}

function getProductImported(productId) {
    return importsData.reduce((total, importItem) => {
        const productImport = importItem.products.find(p => p.productId === productId);
        return total + (productImport ? productImport.quantity : 0);
    }, 0);
}

function getProductSold(productId) {
    return soldData.reduce((total, soldItem) => {
        const productSold = soldItem.products.find(p => p.productId === productId);
        return total + (productSold ? productSold.quantity : 0);
    }, 0);
}

function updateLowStockAlert() {
    const alertContainer = document.getElementById('lowStockAlert');
    const lowStockProducts = [];
    const outOfStockProducts = [];
    
    productsData.forEach(product => {
        const currentStock = getProductImported(product.id) - getProductSold(product.id);
        
        if (currentStock <= 0) {
            outOfStockProducts.push(product);
        } else if (currentStock <= product.minStock) {
            lowStockProducts.push(product);
        }
    });
    
    let alertHTML = '';
    
    if (outOfStockProducts.length > 0) {
        alertHTML += '<h6 class="text-danger">Sản phẩm hết hàng:</h6>';
        outOfStockProducts.forEach(product => {
            alertHTML += `<div class="out-of-stock-item">${product.name}</div>`;
        });
    }
    
    if (lowStockProducts.length > 0) {
        alertHTML += '<h6 class="text-warning mt-3">Sản phẩm sắp hết hàng:</h6>';
        lowStockProducts.forEach(product => {
            const currentStock = getProductImported(product.id) - getProductSold(product.id);
            alertHTML += `<div class="low-stock-item">${product.name} (Còn: ${currentStock})</div>`;
        });
    }
    
    if (alertHTML === '') {
        alertHTML = '<div class="alert alert-success">Tất cả sản phẩm đều còn đủ hàng!</div>';
    }
    
    alertContainer.innerHTML = alertHTML;
}

// Có thể cập nhật biểu đồ để hiển thị giá trị thay vì số lượng
function updateSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Lấy 7 ngày gần nhất có bán hàng
    const salesByDate = {};
    
    soldData.forEach(soldItem => {
        const date = soldItem.date;
        const totalValue = soldItem.products.reduce((sum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return sum + (productData ? product.quantity * productData.price : 0);
        }, 0);
        
        if (salesByDate[date]) {
            salesByDate[date] += totalValue;
        } else {
            salesByDate[date] = totalValue;
        }
    });
    
    // Lấy 7 ngày gần nhất có dữ liệu bán hàng
    const sortedDates = Object.keys(salesByDate).sort().slice(-7);
    const labels = sortedDates;
    const data = sortedDates.map(date => salesByDate[date] || 0);
    
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Giá trị bán (VND)',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value, index, values) {
                            return new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Giá trị bán: ' + new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}


function displayProducts() {
    const filteredProducts = filterProductsData();
    const paginatedProducts = paginateData(filteredProducts, currentPage.products, ITEMS_PER_PAGE);
    
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        const message = productsData.length === 0
            ? '<i class="fas fa-box-open"></i>Chưa có sản phẩm nào được thêm.'
            : '<i class="fas fa-search"></i>Không tìm thấy sản phẩm nào phù hợp.';
        
        tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="8">${message}</td>
            </tr>
        `;
    } else {
        paginatedProducts.forEach(product => {
            const imported = getProductImported(product.id);
            const sold = getProductSold(product.id);
            const currentStock = imported - sold;
            const status = getStockStatus(currentStock, product.minStock);
        
        const row = `
            <tr>
                <td>${product.name}</td>
                <td>${imported}</td>
                <td>${sold}</td>
                <td class="current-stock-value">
                    <strong>${currentStock}</strong>
                    ${currentStock <= 0 ? '<i class="fas fa-exclamation-triangle text-danger ms-1"></i>' : 
                      currentStock <= product.minStock ? '<i class="fas fa-exclamation-circle text-warning ms-1"></i>' : 
                      '<i class="fas fa-check-circle text-success ms-1"></i>'}
                </td>
                <td>${product.minStock}</td>
                <td>${product.unit}</td>
                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewProduct('${product.id}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editProduct('${product.id}')" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
    
    // Cập nhật tổng
    updateProductTotals(filteredProducts);
    
    // Cập nhật phân trang
    updatePagination('products', filteredProducts.length);
}

// Thêm hàm này vào script.js
function viewProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const imported = getProductImported(product.id);
    const sold = getProductSold(product.id);
    const currentStock = imported - sold;
    const status = getStockStatus(currentStock, product.minStock);
    
    // Lấy lịch sử nhập kho
    const importHistory = getProductImportHistory(product.id);
    
    // Lấy lịch sử bán hàng
    const soldHistory = getProductSoldHistory(product.id);
    
    const modalHTML = `
        <div class="modal fade" id="viewProductModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi Tiết Sản Phẩm - ${product.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Thông tin tổng quan -->
                        <div class="row mb-4">
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card bg-primary text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Tổng Nhập</h6>
                                        <h4 class="mb-0">${imported}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card bg-warning text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Đã Bán</h6>
                                        <h4 class="mb-0">${sold}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card ${currentStock <= 0 ? 'bg-danger' : currentStock <= product.minStock ? 'bg-warning' : 'bg-success'} text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Tồn Kho</h6>
                                        <h4 class="mb-0">${currentStock}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card bg-info text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Tối Thiểu</h6>
                                        <h4 class="mb-0">${product.minStock}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card bg-secondary text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Giá</h6>
                                        <h4 class="mb-0">${formatCurrency(product.price)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 col-sm-4 col-6 mb-3">
                                <div class="card bg-dark text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Tính Vé</h6>
                                        <h4 class="mb-0">${product.ticketCalc}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Thông tin chi tiết -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Thông Tin Cơ Bản</h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-borderless mb-0">
                                            <tr>
                                                <td><strong>Tên/Mã hàng:</strong></td>
                                                <td>${product.name}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Đơn vị:</strong></td>
                                                <td>${product.unit}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Giá bán:</strong></td>
                                                <td>${formatCurrency(product.price)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tính vé:</strong></td>
                                                <td>${product.ticketCalc} ${product.unit}/vé</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Trạng thái:</strong></td>
                                                <td><span class="status-badge ${status.class}">${status.text}</span></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Thống Kê Kinh Doanh</h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-borderless mb-0">
                                            <tr>
                                                <td><strong>Doanh thu (ước tính):</strong></td>
                                                <td>${formatCurrency(sold * product.price)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tổng vé bán:</strong></td>
                                                <td>${(sold / product.ticketCalc)} vé</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Giá trị tồn kho:</strong></td>
                                                <td>${formatCurrency(currentStock * product.price)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tỷ lệ bán:</strong></td>
                                                <td>${imported > 0 ? ((sold / imported) * 100).toFixed(1) : 0}%</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Lịch sử nhập kho -->
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0">Lịch Sử Nhập Kho</h6>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-striped mb-0">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Ngày</th>
                                                <th>Người nhập</th>
                                                <th>Số lượng</th>
                                                <th>Giá trị</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${importHistory}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Lịch sử bán hàng -->
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Lịch Sử Bán Hàng</h6>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-striped mb-0">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Ngày</th>
                                                <th>Người bán</th>
                                                <th>Số lượng</th>
                                                <th>Vé</th>
                                                <th>Giá trị</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${soldHistory}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="editProduct('${product.id}'); bootstrap.Modal.getInstance(document.getElementById('viewProductModal')).hide();">
                            <i class="fas fa-edit"></i> Sửa Sản Phẩm
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('viewProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('viewProductModal')).show();
}

// Thêm các hàm này vào script.js
function getProductImportHistory(productId) {
    let historyHTML = '';
    let totalImported = 0;
    
    importsData.forEach(importItem => {
        const productImport = importItem.products.find(p => p.productId === productId);
        if (productImport) {
            const product = productsData.find(p => p.id === productId);
            const value = product ? productImport.quantity * product.price : 0;
            totalImported += productImport.quantity;
            
            historyHTML += `
                <tr>
                    <td>${formatDate(importItem.date)}</td>
                    <td>${importItem.person}</td>
                    <td>${productImport.quantity}</td>
                    <td>${formatCurrency(value)}</td>
                </tr>
            `;
        }
    });
    
    if (historyHTML === '') {
        historyHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có lịch sử nhập kho</td></tr>';
    } else {
        const product = productsData.find(p => p.id === productId);
        const totalValue = product ? totalImported * product.price : 0;
        historyHTML += `
            <tr class="table-info">
                <th colspan="2">Tổng cộng</th>
                <th>${totalImported}</th>
                <th>${formatCurrency(totalValue)}</th>
            </tr>
        `;
    }
    
    return historyHTML;
}

function getProductSoldHistory(productId) {
    let historyHTML = '';
    let totalSold = 0;
    
    soldData.forEach(soldItem => {
        const productSold = soldItem.products.find(p => p.productId === productId);
        if (productSold) {
            const product = productsData.find(p => p.id === productId);
            const value = product ? productSold.quantity * product.price : 0;
            const tickets = product ? (productSold.quantity / product.ticketCalc).toFixed(2) : 0;
            totalSold += productSold.quantity;
            
            historyHTML += `
                <tr>
                    <td>${formatDate(soldItem.date)}</td>
                    <td>${soldItem.person}</td>
                    <td>${productSold.quantity}</td>
                    <td>${tickets}</td>
                    <td>${formatCurrency(value)}</td>
                </tr>
            `;
        }
    });
    
    if (historyHTML === '') {
        historyHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có lịch sử bán hàng</td></tr>';
    } else {
        const product = productsData.find(p => p.id === productId);
        const totalValue = product ? totalSold * product.price : 0;
        const totalTickets = product ? (totalSold / product.ticketCalc).toFixed(2) : 0;
        historyHTML += `
            <tr class="table-info">
                <th colspan="2">Tổng cộng</th>
                <th>${totalSold}</th>
                <th>${totalTickets}</th>
                <th>${formatCurrency(totalValue)}</th>
            </tr>
        `;
    }
    
    return historyHTML;
}

function filterProductsData() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const statusFilter = document.getElementById('productStatusFilter').value;
    
    return productsData.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
        
        if (statusFilter) {
            const currentStock = getProductImported(product.id) - getProductSold(product.id);
            const status = getStockStatusType(currentStock, product.minStock);
            return status === statusFilter;
        }
        
        return true;
    });
}

function getStockStatus(currentStock, minStock) {
    if (currentStock <= 0) {
        return { text: 'Hết hàng', class: 'status-out-of-stock' };
    } else if (currentStock <= minStock) {
        return { text: 'Sắp hết', class: 'status-low-stock' };
    } else {
        return { text: 'Còn hàng', class: 'status-in-stock' };
    }
}

function getStockStatusType(currentStock, minStock) {
    if (currentStock <= 0) {
        return 'out-of-stock';
    } else if (currentStock <= minStock) {
        return 'low-stock';
    } else {
        return 'in-stock';
    }
}

function updateProductTotals(products) {
    const totalImported = products.reduce((sum, product) => sum + getProductImported(product.id), 0);
    const totalSold = products.reduce((sum, product) => sum + getProductSold(product.id), 0);
    const totalStock = products.reduce((sum, product) => sum + (getProductImported(product.id) - getProductSold(product.id)), 0);
    
    document.getElementById('totalImportValue').textContent = totalImported;
    document.getElementById('totalSoldValue').textContent = totalSold;
    document.getElementById('totalCurrentStock').textContent = totalStock;
}

function filterProducts() {
    currentPage.products = 1;
    displayProducts();
}

function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Thêm Sản Phẩm';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function editProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('productModalTitle').textContent = 'Sửa Sản Phẩm';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('minStock').value = product.minStock;
    document.getElementById('unit').value = product.unit;
    document.getElementById('price').value = product.price;
    document.getElementById('ticketCalc').value = product.ticketCalc;
    
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function saveProduct() {
    const productData = {
        name: document.getElementById('productName').value.trim(),
        minStock: parseInt(document.getElementById('minStock').value),
        unit: document.getElementById('unit').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        ticketCalc: parseFloat(document.getElementById('ticketCalc').value)
    };
    
    // Kiểm tra dữ liệu
    const errors = validateProductData(productData);
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return;
    }
    
    const productId = document.getElementById('productId').value;
    
    try {
        if (productId) {
            await window.firebaseDB.collection('products').doc(productId).update(productData);
            showAlert('Cập nhật sản phẩm thành công!', 'success');
        } else {
            await window.firebaseDB.collection('products').add(productData);
            showAlert('Thêm sản phẩm thành công!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        await loadProducts();
        if (currentSection === 'products') displayProducts();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi lưu sản phẩm!', 'danger');
    }
}

function showConfirmDialog(message, onConfirm, onCancel = null) {
    const modalHTML = `
        <div class="modal fade" id="confirmModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Xác nhận</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-danger" id="confirmBtn">Xác nhận</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    
    document.getElementById('confirmBtn').addEventListener('click', () => {
        modal.hide();
        onConfirm();
    });
    
    modal.show();
}

async function deleteProduct(productId) {
    showConfirmDialog('Bạn có chắc chắn muốn xóa sản phẩm này?', async () => {
        try {
            await window.firebaseDB.collection('products').doc(productId).delete();
            showAlert('Xóa sản phẩm thành công!', 'success');
            await loadProducts();
            if (currentSection === 'products') displayProducts();
            updateOverview();
        } catch (error) {
            showAlert('Lỗi khi xóa sản phẩm!', 'danger');
        }
    });
}

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case '1':
                event.preventDefault();
                showSection('overview');
                break;
            case '2':
                event.preventDefault();
                showSection('products');
                break;
            case '3':
                event.preventDefault();
                showSection('import');
                break;
            case '4':
                event.preventDefault();
                showSection('sold');
                break;
            case '5':
                event.preventDefault();
                showSection('profit');
                break;
        }
    }
});

function exportToCSV(data, filename) {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function displayImports() {
    const filteredImports = filterImportsData();
    const paginatedImports = paginateData(filteredImports, currentPage.import, ITEMS_PER_PAGE);
    
    const tbody = document.getElementById('importTable');
    tbody.innerHTML = '';
    
    if (filteredImports.length === 0) {
        const message = importsData.length === 0
            ? '<i class="fas fa-file-invoice"></i>Chưa có phiếu nhập kho nào.'
            : '<i class="fas fa-search"></i>Không tìm thấy phiếu nhập kho nào phù hợp.';
            
        tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="5">${message}</td>
            </tr>
        `;
    } else {
        paginatedImports.forEach(importItem => {
            const totalProducts = importItem.products.length;
            const totalValue = importItem.products.reduce((sum, product) => {
                const productData = productsData.find(p => p.id === product.productId);
                return sum + (productData ? product.quantity * productData.price : 0);
            }, 0);
        
        const row = `
            <tr>
                <td>${formatDate(importItem.date)}</td>
                <td>${importItem.person}</td>
                <td>${totalProducts}</td>
                <td>${formatCurrency(totalValue)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewImport('${importItem.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editImport('${importItem.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteImport('${importItem.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
    
    // Cập nhật tổng nhập kho
    updateImportTotals(filteredImports);
    updatePagination('import', filteredImports.length);
}

// Thêm hàm này vào script.js
function updateImportTotals(importItems) {
    const totalAmount = importItems.reduce((sum, importItem) => {
        return sum + importItem.products.reduce((productSum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return productSum + (productData ? product.quantity * productData.price : 0);
        }, 0);
    }, 0);
    
    document.getElementById('totalImportAmount').textContent = formatCurrency(totalAmount);
}

// Thêm các function bị thiếu cho Import
function viewImport(importId) {
    const importItem = importsData.find(item => item.id === importId);
    if (!importItem) return;
    
    let productDetails = '';
    importItem.products.forEach(product => {
        const productData = productsData.find(p => p.id === product.productId);
        const productName = productData ? productData.name : 'Sản phẩm không tồn tại';
        productDetails += `
            <tr>
                <td>${productName}</td>
                <td>${product.quantity}</td>
                <td>${productData ? formatCurrency(productData.price) : 'N/A'}</td>
                <td>${productData ? formatCurrency(product.quantity * productData.price) : 'N/A'}</td>
            </tr>
        `;
    });
    
    const totalValue = importItem.products.reduce((sum, product) => {
        const productData = productsData.find(p => p.id === product.productId);
        return sum + (productData ? product.quantity * productData.price : 0);
    }, 0);
    
    const modalHTML = `
        <div class="modal fade" id="viewImportModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi Tiết Nhập Kho</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Ngày nhập:</strong> ${formatDate(importItem.date)}
                            </div>
                            <div class="col-md-6">
                                <strong>Người nhập:</strong> ${importItem.person}
                            </div>
                        </div>
                        <h6>Danh sách sản phẩm:</h6>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productDetails}
                            </tbody>
                            <tfoot>
                                <tr class="table-info">
                                    <th colspan="3">Tổng cộng</th>
                                    <th>${formatCurrency(totalValue)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('viewImportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('viewImportModal')).show();
}

function editImport(importId) {
    const importItem = importsData.find(item => item.id === importId);
    if (!importItem) return;
    
    document.getElementById('importModalTitle').textContent = 'Sửa Nhập Kho';
    document.getElementById('importId').value = importItem.id;
    document.getElementById('importDate').value = importItem.date;
    document.getElementById('importPerson').value = importItem.person;
    
    // Xóa các sản phẩm hiện tại
    const container = document.getElementById('importProducts');
    container.innerHTML = '';
    
    // Thêm các sản phẩm từ dữ liệu
    importItem.products.forEach(product => {
        const newRow = document.createElement('div');
        newRow.className = 'product-row-container import-product-row';
        newRow.innerHTML = `
            <div class="row g-2">
                <div class="col-md-5 col-sm-6 col-12">
                    <label class="form-label d-block d-md-none">Sản phẩm</label>
                    <select class="form-select product-select" required>
                        <option value="">Chọn sản phẩm</option>
                    </select>
                </div>
                <div class="col-md-4 col-sm-4 col-8">
                    <label class="form-label d-block d-md-none">Số lượng</label>
                    <input type="number" class="form-control quantity-input" placeholder="Số lượng" value="${product.quantity}" required>
                </div>
                <div class="col-md-3 col-sm-2 col-4">
                    <label class="form-label d-block d-md-none">&nbsp;</label>
                    <button type="button" class="btn btn-danger w-100" onclick="removeImportProduct(this)" title="Xóa">
                        <i class="fas fa-trash"></i><span class="d-none d-sm-inline ms-1">Xóa</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(newRow);
        
        // Cập nhật select với giá trị đã chọn
        const select = newRow.querySelector('.product-select');
        updateSingleProductSelect(select, product.productId);
    });
    
    new bootstrap.Modal(document.getElementById('importModal')).show();
}


// Thêm các function bị thiếu cho Sold
function viewSold(soldId) {
    const soldItem = soldData.find(item => item.id === soldId);
    if (!soldItem) return;
    
    let productDetails = '';
    soldItem.products.forEach(product => {
        const productData = productsData.find(p => p.id === product.productId);
        const productName = productData ? productData.name : 'Sản phẩm không tồn tại';
        const tickets = productData ? (product.quantity / productData.ticketCalc).toFixed(2) : 'N/A';
        productDetails += `
            <tr>
                <td>${productName}</td>
                <td>${product.quantity}</td>
                <td>${productData ? formatCurrency(productData.price) : 'N/A'}</td>
                <td>${tickets}</td>
                <td>${productData ? formatCurrency(product.quantity * productData.price) : 'N/A'}</td>
            </tr>
        `;
    });
    
    const totalValue = soldItem.products.reduce((sum, product) => {
        const productData = productsData.find(p => p.id === product.productId);
        return sum + (productData ? product.quantity * productData.price : 0);
    }, 0);
    
    const totalTickets = soldItem.products.reduce((sum, product) => {
        const productData = productsData.find(p => p.id === product.productId);
        return sum + (productData ? (product.quantity / productData.ticketCalc) : 0);
    }, 0);
    
    const modalHTML = `
        <div class="modal fade" id="viewSoldModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi Tiết Bán Hàng</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Ngày tạo:</strong> ${formatDate(soldItem.date)}
                            </div>
                            <div class="col-md-6">
                                <strong>Người tạo:</strong> ${soldItem.person}
                            </div>
                        </div>
                        <h6>Danh sách sản phẩm:</h6>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Vé</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productDetails}
                            </tbody>
                            <tfoot>
                                <tr class="table-info">
                                    <th colspan="3">Tổng cộng</th>
                                    <th>${totalTickets.toFixed(2)}</th>
                                    <th>${formatCurrency(totalValue)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('viewSoldModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('viewSoldModal')).show();
}

function editSold(soldId) {
    const soldItem = soldData.find(item => item.id === soldId);
    if (!soldItem) return;
    
    document.getElementById('soldModalTitle').textContent = 'Sửa Bán Hàng';
    document.getElementById('soldId').value = soldItem.id;
    document.getElementById('soldDate').value = soldItem.date;
    document.getElementById('soldPerson').value = soldItem.person;
    
    // Xóa các sản phẩm hiện tại
    const container = document.getElementById('soldProducts');
    container.innerHTML = '';
    
    // Thêm các sản phẩm từ dữ liệu
    soldItem.products.forEach(product => {
        const newRow = document.createElement('div');
        newRow.className = 'product-row-container sold-product-row';
        newRow.innerHTML = `
            <div class="row g-2">
                <div class="col-md-5 col-sm-5 col-12">
                    <label class="form-label d-block d-md-none">Sản phẩm</label>
                    <select class="form-select product-select" required onchange="updateStockInfo(this)">
                        <option value="">Chọn sản phẩm</option>
                    </select>
                </div>
                <div class="col-md-1 col-sm-2 col-4">
                    <label class="form-label d-block d-md-none">Tồn</label>
                    <div class="stock-display">
                        <span class="badge bg-secondary">-</span>
                    </div>
                </div>
                <div class="col-md-3 col-sm-3 col-5">
                    <label class="form-label d-block d-md-none">Số lượng</label>
                    <input type="number" class="form-control quantity-input" placeholder="Số lượng" value="${product.quantity}" required onchange="validateQuantity(this)">
                </div>
                <div class="col-md-3 col-sm-2 col-3">
                    <label class="form-label d-block d-md-none">&nbsp;</label>
                    <button type="button" class="btn btn-danger w-100" onclick="removeSoldProduct(this)" title="Xóa">
                        <i class="fas fa-trash"></i><span class="d-none d-lg-inline ms-1">Xóa</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(newRow);
        
        // Cập nhật select với giá trị đã chọn
        const select = newRow.querySelector('.product-select');
        updateSingleProductSelect(select, product.productId);
        
        // Cập nhật thông tin tồn kho
        setTimeout(() => {
            updateStockInfo(select);
        }, 100);
    });
    
    new bootstrap.Modal(document.getElementById('soldModal')).show();
}

// Hàm hỗ trợ cập nhật single select
function updateSingleProductSelect(selectElement, selectedProductId = null) {
    selectElement.innerHTML = '<option value="">Chọn sản phẩm</option>';
    
    productsData.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        if (product.id === selectedProductId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

function filterImportsData() {
    const searchTerm = document.getElementById('importSearch').value.toLowerCase();
    const dateFilter = document.getElementById('importDateFilter').value;
    
    return importsData.filter(importItem => {
        const matchesSearch = importItem.person.toLowerCase().includes(searchTerm);
        const matchesDate = !dateFilter || importItem.date === dateFilter;
        
        return matchesSearch && matchesDate;
    });
}

function filterImports() {
    currentPage.import = 1;
    displayImports();
}

function showAddImportModal() {
    document.getElementById('importModalTitle').textContent = 'Thêm Nhập Kho';
    document.getElementById('importForm').reset();
    document.getElementById('importId').value = '';
    document.getElementById('importDate').value = new Date().toISOString().split('T')[0];
    
    // Reset sản phẩm
    const container = document.getElementById('importProducts');
    container.innerHTML = `
        <div class="product-row-container import-product-row">
            <div class="row g-2">
                <div class="col-md-5 col-sm-6 col-12">
                    <label class="form-label d-block d-md-none">Sản phẩm</label>
                    <select class="form-select product-select" required>
                        <option value="">Chọn sản phẩm</option>
                    </select>
                </div>
                <div class="col-md-4 col-sm-4 col-8">
                    <label class="form-label d-block d-md-none">Số lượng</label>
                    <input type="number" class="form-control quantity-input" placeholder="Số lượng" required>
                </div>
                <div class="col-md-3 col-sm-2 col-4">
                    <label class="form-label d-block d-md-none">&nbsp;</label>
                    <button type="button" class="btn btn-danger w-100" onclick="removeImportProduct(this)" title="Xóa">
                        <i class="fas fa-trash"></i><span class="d-none d-sm-inline ms-1">Xóa</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    updateProductSelects();
    new bootstrap.Modal(document.getElementById('importModal')).show();
}


function addImportProduct() {
    const container = document.getElementById('importProducts');
    const newRow = document.createElement('div');
    newRow.className = 'product-row-container import-product-row';
    newRow.innerHTML = `
        <div class="row g-2">
            <div class="col-md-5 col-sm-6 col-12">
                <label class="form-label d-block d-md-none">Sản phẩm</label>
                <select class="form-select product-select" required>
                    <option value="">Chọn sản phẩm</option>
                </select>
            </div>
            <div class="col-md-4 col-sm-4 col-8">
                <label class="form-label d-block d-md-none">Số lượng</label>
                <input type="number" class="form-control quantity-input" placeholder="Số lượng" required>
            </div>
            <div class="col-md-3 col-sm-2 col-4">
                <label class="form-label d-block d-md-none">&nbsp;</label>
                <button type="button" class="btn btn-danger w-100" onclick="removeImportProduct(this)" title="Xóa">
                    <i class="fas fa-trash"></i><span class="d-none d-sm-inline ms-1">Xóa</span>
                </button>
            </div>
        </div>
    `;
    container.appendChild(newRow);
    updateProductSelects();
}


function removeImportProduct(button) {
    const rows = document.querySelectorAll('.import-product-row');
    if (rows.length > 1) {
        button.closest('.product-row-container').remove();
    }
}

function updateProductSelects() {
    const selects = document.querySelectorAll('.product-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Chọn sản phẩm</option>';
        
        productsData.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            if (product.id === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

async function saveImport() {
    const importId = document.getElementById('importId').value;
    const products = [];
    
    const productRows = document.querySelectorAll('.import-product-row');
    for (let row of productRows) {
        const productSelect = row.querySelector('.product-select');
        const quantityInput = row.querySelector('.quantity-input');
        
        if (productSelect.value && quantityInput.value) {
            products.push({
                productId: productSelect.value,
                quantity: parseInt(quantityInput.value)
            });
        }
    }
    
    if (products.length === 0) {
        showAlert('Vui lòng thêm ít nhất một sản phẩm!', 'warning');
        return;
    }
    
    const importData = {
        date: document.getElementById('importDate').value,
        person: document.getElementById('importPerson').value,
        products: products
    };
    
    try {
        if (importId) {
            await window.firebaseDB.collection('imports').doc(importId).update(importData);
            showAlert('Cập nhật nhập kho thành công!', 'success');
        } else {
            await window.firebaseDB.collection('imports').add(importData);
            showAlert('Thêm nhập kho thành công!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
        await loadImports();
        if (currentSection === 'import') displayImports();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi lưu nhập kho!', 'danger');
    }
}

async function deleteImport(importId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi nhập kho này?')) return;
    
    try {
        await window.firebaseDB.collection('imports').doc(importId).delete();
        showAlert('Xóa nhập kho thành công!', 'success');
        await loadImports();
        if (currentSection === 'import') displayImports();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi xóa nhập kho!', 'danger');
    }
}

// Các hàm đã bán
function displaySold() {
    const filteredSold = filterSoldData();
    const paginatedSold = paginateData(filteredSold, currentPage.sold, ITEMS_PER_PAGE);
    
    const tbody = document.getElementById('soldTable');
    tbody.innerHTML = '';
    
    if (filteredSold.length === 0) {
        const message = soldData.length === 0
            ? '<i class="fas fa-receipt"></i>Chưa có phiếu bán hàng nào.'
            : '<i class="fas fa-search"></i>Không tìm thấy phiếu bán hàng nào phù hợp.';
            
        tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="6">${message}</td>
            </tr>
        `;
    } else {
        paginatedSold.forEach(soldItem => {
            const totalProducts = soldItem.products.length;
            const totalValue = soldItem.products.reduce((sum, product) => {
                const productData = productsData.find(p => p.id === product.productId);
                return sum + (productData ? product.quantity * productData.price : 0);
            }, 0);
            
            const totalTickets = soldItem.products.reduce((sum, product) => {
                const productData = productsData.find(p => p.id === product.productId);
                return sum + (productData ? (product.quantity / productData.ticketCalc) : 0);
            }, 0);
        
        const row = `
            <tr>
                <td>${formatDate(soldItem.date)}</td>
                <td>${soldItem.person}</td>
                <td>${totalProducts}</td>
                <td>${formatCurrency(totalValue)}</td>
                <td>${totalTickets.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewSold('${soldItem.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editSold('${soldItem.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSold('${soldItem.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
    
    // Cập nhật tổng
    updateSoldTotals(filteredSold);
    updatePagination('sold', filteredSold.length);
}

function filterSoldData() {
    const searchTerm = document.getElementById('soldSearch').value.toLowerCase();
    const dateFilter = document.getElementById('soldDateFilter').value;
    
    return soldData.filter(soldItem => {
        const matchesSearch = soldItem.person.toLowerCase().includes(searchTerm);
        const matchesDate = !dateFilter || soldItem.date === dateFilter;
        
        return matchesSearch && matchesDate;
    });
}

function updateSoldTotals(soldItems) {
    const totalAmount = soldItems.reduce((sum, soldItem) => {
        return sum + soldItem.products.reduce((productSum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return productSum + (productData ? product.quantity * productData.price : 0);
        }, 0);
    }, 0);
    
    const totalTickets = soldItems.reduce((sum, soldItem) => {
        return sum + soldItem.products.reduce((productSum, product) => {
            const productData = productsData.find(p => p.id === product.productId);
            return productSum + (productData ? (product.quantity / productData.ticketCalc) : 0);
        }, 0);
    }, 0);
    
    document.getElementById('totalSoldAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('totalTickets').textContent = totalTickets.toFixed(2);
}

function filterSold() {
    currentPage.sold = 1;
    displaySold();
}

function showAddSoldModal() {
    document.getElementById('soldModalTitle').textContent = 'Thêm Bán Hàng';
    document.getElementById('soldForm').reset();
    document.getElementById('soldId').value = '';
    document.getElementById('soldDate').value = new Date().toISOString().split('T')[0];
    
    // Reset sản phẩm
    const container = document.getElementById('soldProducts');
    container.innerHTML = `
        <div class="product-row-container sold-product-row">
            <div class="row g-2">
                <div class="col-md-5 col-sm-5 col-12">
                    <label class="form-label d-block d-md-none">Sản phẩm</label>
                    <select class="form-select product-select" required onchange="updateStockInfo(this)">
                        <option value="">Chọn sản phẩm</option>
                    </select>
                </div>
                <div class="col-md-1 col-sm-2 col-4">
                    <label class="form-label d-block d-md-none">Tồn</label>
                    <div class="stock-display">
                        <span class="badge bg-secondary">-</span>
                    </div>
                </div>
                <div class="col-md-3 col-sm-3 col-5">
                    <label class="form-label d-block d-md-none">Số lượng</label>
                    <input type="number" class="form-control quantity-input" placeholder="Số lượng" required onchange="validateQuantity(this)">
                </div>
                <div class="col-md-3 col-sm-2 col-3">
                    <label class="form-label d-block d-md-none">&nbsp;</label>
                    <button type="button" class="btn btn-danger w-100" onclick="removeSoldProduct(this)" title="Xóa">
                        <i class="fas fa-trash"></i><span class="d-none d-lg-inline ms-1">Xóa</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    updateProductSelects();
    new bootstrap.Modal(document.getElementById('soldModal')).show();
}

function addSoldProduct() {
    const container = document.getElementById('soldProducts');
    const newRow = document.createElement('div');
    newRow.className = 'product-row-container sold-product-row';
    newRow.innerHTML = `
        <div class="row g-2">
            <div class="col-md-5 col-sm-5 col-12">
                <label class="form-label d-block d-md-none">Sản phẩm</label>
                <select class="form-select product-select" required onchange="updateStockInfo(this)">
                    <option value="">Chọn sản phẩm</option>
                </select>
            </div>
            <div class="col-md-1 col-sm-2 col-4">
                <label class="form-label d-block d-md-none">Tồn</label>
                <div class="stock-display">
                    <span class="badge bg-secondary">-</span>
                </div>
            </div>
            <div class="col-md-3 col-sm-3 col-5">
                <label class="form-label d-block d-md-none">Số lượng</label>
                <input type="number" class="form-control quantity-input" placeholder="Số lượng" required onchange="validateQuantity(this)">
            </div>
            <div class="col-md-3 col-sm-2 col-3">
                <label class="form-label d-block d-md-none">&nbsp;</label>
                <button type="button" class="btn btn-danger w-100" onclick="removeSoldProduct(this)" title="Xóa">
                    <i class="fas fa-trash"></i><span class="d-none d-lg-inline ms-1">Xóa</span>
                </button>
            </div>
        </div>
    `;
    container.appendChild(newRow);
    updateProductSelects();
}


function removeSoldProduct(button) {
    const rows = document.querySelectorAll('.sold-product-row');
    if (rows.length > 1) {
        button.closest('.product-row-container').remove();
    }
}

function updateStockInfo(selectElement) {
    const productId = selectElement.value;
    const row = selectElement.closest('.product-row-container');
    const stockDisplay = row.querySelector('.stock-display');
    const quantityInput = row.querySelector('.quantity-input');
    
    if (productId) {
        const imported = getProductImported(productId);
        const sold = getProductSold(productId);
        const currentStock = imported - sold;
        
        // Cập nhật hiển thị tồn kho
        let badgeClass = 'bg-success';
        let stockText = currentStock;
        
        if (currentStock <= 0) {
            badgeClass = 'bg-danger';
            stockText = '0';
        } else {
            const product = productsData.find(p => p.id === productId);
            if (product && currentStock <= product.minStock) {
                badgeClass = 'bg-warning';
            }
            
            // Rút gọn số nếu quá lớn
            if (currentStock >= 1000) {
                stockText = (currentStock / 1000).toFixed(1) + 'k';
            }
        }
        
        stockDisplay.innerHTML = `<span class="badge ${badgeClass}" title="Tồn kho: ${currentStock}">${stockText}</span>`;
        
        // Reset và giới hạn số lượng input
        quantityInput.value = '';
        quantityInput.setAttribute('max', currentStock);
        
        if (currentStock <= 0) {
            quantityInput.disabled = true;
            quantityInput.placeholder = 'Hết hàng';
        } else {
            quantityInput.disabled = false;
            quantityInput.placeholder = `Max: ${currentStock}`;
        }
    } else {
        // Reset khi không chọn sản phẩm
        stockDisplay.innerHTML = '<span class="badge bg-secondary">-</span>';
        quantityInput.value = '';
        quantityInput.disabled = false;
        quantityInput.placeholder = 'Số lượng';
        quantityInput.removeAttribute('max');
    }
}


// Kiểm tra số lượng nhập có hợp lệ không
function validateQuantity(inputElement) {
    const row = inputElement.closest('.product-row-container');
    const selectElement = row.querySelector('.product-select');
    const productId = selectElement.value;
    const quantity = parseInt(inputElement.value);
    
    if (productId && quantity) {
        const imported = getProductImported(productId);
        const sold = getProductSold(productId);
        const currentStock = imported - sold;
        
        if (quantity > currentStock) {
            showAlert(`Số lượng vượt quá tồn kho! Tồn kho hiện tại: ${currentStock}`, 'warning');
            inputElement.value = currentStock;
        } else if (quantity <= 0) {
            showAlert('Số lượng phải lớn hơn 0!', 'warning');
            inputElement.value = '';
        }
    }
}

// Sửa hàm saveSold() trong script.js
async function saveSold() {
    const soldId = document.getElementById('soldId').value;
    const products = [];
    
    const productRows = document.querySelectorAll('.sold-product-row');
    for (let row of productRows) {
        const productSelect = row.querySelector('.product-select');
        const quantityInput = row.querySelector('.quantity-input');
        
        if (productSelect.value && quantityInput.value) {
            products.push({
                productId: productSelect.value,
                quantity: parseInt(quantityInput.value)
            });
        }
    }
    
    if (products.length === 0) {
        showAlert('Vui lòng thêm ít nhất một sản phẩm!', 'warning');
        return;
    }
    
    const soldDataRecord = {
        date: document.getElementById('soldDate').value,
        person: document.getElementById('soldPerson').value,
        products: products
    };
    
    try {
        if (soldId) {
            await window.firebaseDB.collection('sold').doc(soldId).update(soldDataRecord);
            showAlert('Cập nhật bán hàng thành công!', 'success');
        } else {
            await window.firebaseDB.collection('sold').add(soldDataRecord);
            showAlert('Thêm bán hàng thành công!', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('soldModal')).hide();
        await loadSold();
        
        // Tự động tạo/cập nhật profit cho ngày này
        await autoGenerateProfitForDate(soldDataRecord.date);
        
        if (currentSection === 'sold') displaySold();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi lưu bán hàng!', 'danger');
    }
}

// Sửa hàm autoGenerateProfitForDate() trong script.js
async function autoGenerateProfitForDate(date) {
    try {
        // Tính toán lại stats cho ngày này
        const dayStats = calculateDayStats(date);
        
        if (dayStats.totalTickets > 0) {
            const newProfitData = {
                date: date,
                revenue: dayStats.totalTickets * 120000,
                expense: dayStats.totalValue,
                tax: dayStats.totalTickets * 30000
                // Bỏ trường note
            };
            
            // Kiểm tra xem đã có profit cho ngày này chưa
            const existingProfit = profitData.find(p => p.date === date);
            
            if (existingProfit) {
                // Cập nhật
                await window.firebaseDB.collection('profit').doc(existingProfit.id).update(newProfitData);
                console.log(`Đã cập nhật profit cho ngày ${date}`);
            } else {
                // Tạo mới
                await window.firebaseDB.collection('profit').add(newProfitData);
                console.log(`Đã tạo profit mới cho ngày ${date}`);
            }
            
            // Tải lại dữ liệu
            await loadProfit();
        }
        
    } catch (error) {
        console.error('Lỗi khi tự động tạo profit cho ngày:', error);
    }
}

async function deleteSold(soldId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi bán hàng này?')) return;
    
    try {
        await window.firebaseDB.collection('sold').doc(soldId).delete();
        showAlert('Xóa bán hàng thành công!', 'success');
        await loadSold();
        if (currentSection === 'sold') displaySold();
        updateOverview();
    } catch (error) {
        showAlert('Lỗi khi xóa bán hàng!', 'danger');
    }
}

function displayProfit() {
    const filteredProfit = filterProfitData();
    const paginatedProfit = paginateData(filteredProfit, currentPage.profit, ITEMS_PER_PAGE);
    
    const tbody = document.getElementById('profitTable');
    tbody.innerHTML = '';
    
    if (filteredProfit.length === 0) {
        const message = profitData.length === 0
            ? '<i class="fas fa-chart-line"></i>Chưa có dữ liệu lợi nhuận.'
            : '<i class="fas fa-search"></i>Không tìm thấy dữ liệu lợi nhuận phù hợp.';
            
        tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="6">${message}</td>
            </tr>
        `;
    } else {
        paginatedProfit.forEach(profitItem => {
            const profit = profitItem.revenue - profitItem.expense - profitItem.tax;
            const tickets = profitItem.revenue / 120000;
        
        const row = `
            <tr>
                <td>${formatDate(profitItem.date)}</td>
                <td>${formatCurrency(profitItem.revenue)}<br><small class="text-muted">(${tickets.toFixed(2)} vé × 120k)</small></td>
                <td>${formatCurrency(profitItem.expense)}<br><small class="text-muted">(Giá trị bán)</small></td>
                <td>${formatCurrency(profitItem.tax)}<br><small class="text-muted">(${tickets.toFixed(2)} vé × 30k)</small></td>
                <td class="${profit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(profit)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewProfitDetails('${profitItem.id}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProfit('${profitItem.id}')" title="Xóa bản ghi">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
    
    // Cập nhật tổng
    updateProfitTotals(filteredProfit);
    updatePagination('profit', filteredProfit.length);
}

// Sửa hàm viewProfitDetails() - bỏ phần ghi chú ở cuối
function viewProfitDetails(profitId) {
    const profitItem = profitData.find(p => p.id === profitId);
    if (!profitItem) return;
    
    const tickets = profitItem.revenue / 120000;
    const profit = profitItem.revenue - profitItem.expense - profitItem.tax;
    
    // Lấy dữ liệu bán hàng cho ngày này
    const daysSold = soldData.filter(item => item.date === profitItem.date);
    let soldDetailsTable = '';
    let totalDayQuantity = 0;
    let totalDayTickets = 0;
    let totalDayValue = 0;
    
    daysSold.forEach(soldItem => {    
        soldItem.products.forEach(product => {
            const productData = productsData.find(p => p.id === product.productId);
            if (productData) {
                const productTickets = product.quantity / productData.ticketCalc;
                const productValue = product.quantity * productData.price;
                
                totalDayQuantity += product.quantity;
                totalDayTickets += productTickets;
                totalDayValue += productValue;
                
                soldDetailsTable += `
                    <tr>
                        <td>${productData.name}</td>
                        <td>${product.quantity} ${productData.unit}</td>
                        <td>${formatCurrency(productData.price)}</td>
                        <td>${productTickets.toFixed(2)}</td>
                        <td>${formatCurrency(productValue)}</td>
                    </tr>
                `;
            }
        });
    });
    
    const modalHTML = `
        <div class="modal fade" id="viewProfitModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi Tiết Lợi Nhuận - ${formatDate(profitItem.date)}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Thẻ thống kê -->
                        <div class="row mb-4">
                            <div class="col-md-3 col-sm-6 mb-2">
                                <div class="card bg-success text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Doanh Thu</h6>
                                        <h5 class="mb-1">${formatCurrency(profitItem.revenue)}</h5>
                                        <small>${tickets.toFixed(2)} vé × 120k</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-2">
                                <div class="card bg-warning text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Tổng giá trị bán</h6>
                                        <h5 class="mb-1">${formatCurrency(profitItem.expense)}</h5>
                                        <small>Giá trị bán</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-2">
                                <div class="card bg-info text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Thuế</h6>
                                        <h5 class="mb-1">${formatCurrency(profitItem.tax)}</h5>
                                        <small>${tickets.toFixed(2)} vé × 30k</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-2">
                                <div class="card ${profit >= 0 ? 'bg-primary' : 'bg-danger'} text-white">
                                    <div class="card-body text-center p-2">
                                        <h6 class="card-title mb-1">Lợi Nhuận</h6>
                                        <h5 class="mb-1">${formatCurrency(profit)}</h5>
                                        <small>${profit >= 0 ? 'Có lãi' : 'Thua lỗ'}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Bảng chi tiết bán hàng -->
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Chi tiết bán hàng trong ngày</h6>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover mb-0">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Số lượng</th>
                                                <th>Đơn giá</th>
                                                <th>Vé</th>
                                                <th>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${soldDetailsTable}
                                        </tbody>
                                        <tfoot class="table-info">
                                            <tr>
                                                <th>Tổng cộng</th>
                                                <th>${totalDayQuantity}</th>
                                                <th>-</th>
                                                <th>${totalDayTickets.toFixed(2)}</th>
                                                <th>${formatCurrency(totalDayValue)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('viewProfitModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('viewProfitModal')).show();
}

function filterProfitData() {
    const searchTerm = document.getElementById('profitSearch').value.toLowerCase();
    const dateFilter = document.getElementById('profitDateFilter').value;
    
    return profitData.filter(profitItem => {
        // Bỏ tìm kiếm theo ghi chú, chỉ tìm theo ngày
        const matchesSearch = !searchTerm || profitItem.date.includes(searchTerm);
        const matchesDate = !dateFilter || profitItem.date === dateFilter;
        
        return matchesSearch && matchesDate;
    });
}

function updateProfitTotals(profitItems) {
    const totals = profitItems.reduce((acc, item) => {
        acc.revenue += item.revenue;
        acc.expense += item.expense;
        acc.tax += item.tax;
        acc.profit += (item.revenue - item.expense - item.tax);
        return acc;
    }, { revenue: 0, expense: 0, tax: 0, profit: 0 });
    
    document.getElementById('totalRevenue').textContent = formatCurrency(totals.revenue);
    document.getElementById('totalExpense').textContent = formatCurrency(totals.expense);
    document.getElementById('totalTax').textContent = formatCurrency(totals.tax);
    document.getElementById('totalProfit').textContent = formatCurrency(totals.profit);
    document.getElementById('totalProfit').className = totals.profit >= 0 ? 'text-success' : 'text-danger';
}

function filterProfit() {
    currentPage.profit = 1;
    displayProfit();
}

async function deleteProfit(profitId) {
    showConfirmDialog(
        'Bạn có chắc chắn muốn xóa bản ghi lợi nhuận này?<br><small class="text-warning">Lưu ý: Bản ghi này sẽ được tự động tạo lại nếu vẫn có dữ liệu bán hàng cho ngày đó.</small>', 
        async () => {
            try {
                await window.firebaseDB.collection('profit').doc(profitId).delete();
                showAlert('Xóa bản ghi lợi nhuận thành công!', 'success');
                await loadProfit();
                if (currentSection === 'profit') displayProfit();
            } catch (error) {
                showAlert('Lỗi khi xóa bản ghi lợi nhuận!', 'danger');
            }
        }
    );
}

// Các hàm tiện ích
function paginateData(data, page, itemsPerPage) {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
}

function updatePagination(section, totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentPageNum = currentPage[section];
    const paginationContainer = document.getElementById(`${section}Pagination`);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Nút trước
    paginationHTML += `
        <li class="page-item ${currentPageNum === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage('${section}', ${currentPageNum - 1})">Trước</a>
        </li>
    `;
    
    // Số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPageNum - 2 && i <= currentPageNum + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPageNum ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage('${section}', ${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPageNum - 3 || i === currentPageNum + 3) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Nút sau
    paginationHTML += `
        <li class="page-item ${currentPageNum === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage('${section}', ${currentPageNum + 1})">Sau</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(section, page) {
    currentPage[section] = page;
    
    switch(section) {
        case 'products':
            displayProducts();
            break;
        case 'import':
            displayImports();
            break;
        case 'sold':
            displaySold();
            break;
        case 'profit':
            displayProfit();
            break;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function showAlert(message, type) {
    // Tạo phần tử thông báo
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Thêm vào body
    document.body.appendChild(alertDiv);
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Toggle menu di động
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay') || createOverlay();
    
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = hideMobileSidebar;
    document.body.appendChild(overlay);
    return overlay;
}

function hideMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

// Đóng menu di động khi click bên ngoài
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isMenuButton = event.target.closest('.mobile-menu-btn');
    
    if (!isClickInsideSidebar && !isMenuButton && sidebar.classList.contains('show')) {
        hideMobileSidebar();
    }
});

window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        hideMobileSidebar();
    }
});

window.showSectionSafe = async function(section) {
    try {
        await showSection(section);
    } catch (error) {
        console.error('Lỗi chuyển section:', error);
        showAlert('Lỗi chuyển trang', 'warning');
    }
};