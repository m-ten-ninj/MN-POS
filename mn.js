// ==========================================
// 1. نظام التنبيهات المخصصة بديل alert لمنع تجميد Electron
// ==========================================
function showAlert(message) {
    const alertModal = document.getElementById('customAlertModal');
    const alertMsg = document.getElementById('customAlertMessage');
    if (alertModal && alertMsg) { 
        alertMsg.textContent = message;
        alertModal.style.display = 'flex';
    } else {
        setTimeout(() => { window.alert(message); }, 10);
    }
}

function closeCustomAlert() {
    const alertModal = document.getElementById('customAlertModal');
    if (alertModal) alertModal.style.display = 'none';
}

// ==========================================
// 2. البيانات والحالة العامة (State)
// ==========================================
let products = JSON.parse(localStorage.getItem('mn_products')) || [];
let cart = [];
let sales = JSON.parse(localStorage.getItem('mn_sales')) || [];
let debts = JSON.parse(localStorage.getItem('mn_debts')) || [];
let appPassword = localStorage.getItem('mn_password') || '1234';

// ==========================================
// 3. الأحداث الأساسية
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCart();
    resetFormInputs();

    let barcodeBuffer = '';
    let barcodeTimer;

    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        const isInput = active && (
            active.tagName === 'INPUT' || 
            active.tagName === 'TEXTAREA' || 
            active.tagName === 'SELECT' ||
            active.isContentEditable
        );

        if (isInput) return;

        if (e.key === 'Enter') {
            if (barcodeBuffer.trim()) {
                handleBarcodeScanner(barcodeBuffer.trim());
                barcodeBuffer = '';
            }
        } else if (e.key.length === 1) {
            barcodeBuffer += e.key;
            clearTimeout(barcodeTimer);
            barcodeTimer = setTimeout(() => barcodeBuffer = '', 250);
        }
    });
});

// ==========================================
// 4. إدارة المنتجات وحذفها بكلمة السر
// ==========================================
function renderProducts(itemsToRender = products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    itemsToRender.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <div class="product-title">${prod.name}</div>
                <div style="font-size: 0.8rem; color: #666;">كود: ${prod.code}</div>
                <div class="product-price">$${parseFloat(prod.price).toFixed(2)}</div>
                <div class="product-stock">المخزون: ${prod.stock}</div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 8px;">
                <button type="button" class="btn btn-primary btn-sm btn-add" style="flex: 1; padding: 4px;">إضافة</button>
                <button type="button" class="btn btn-warning btn-sm btn-edit" style="padding: 4px 8px;">تعديل</button>
                <button type="button" class="btn btn-danger btn-sm btn-del" style="padding: 4px 8px;">حذف</button>
            </div>
        `;

        card.querySelector('.btn-add').addEventListener('click', (e) => { e.preventDefault(); addToCart(prod.id); });
        card.querySelector('.btn-edit').addEventListener('click', (e) => { e.preventDefault(); openProductModal(prod.id); });
        card.querySelector('.btn-del').addEventListener('click', (e) => { e.preventDefault(); openDeleteAuthModal(prod.id); });

        grid.appendChild(card);
    });
}

function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

function openProductModal(id = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    
    document.getElementById('editProductId').value = '';
    document.getElementById('prodCode').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodCost').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodStock').value = '';

    if (id) {
        const prod = products.find(p => p.id === id);
        if (prod) {
            if (title) title.textContent = 'تعديل منتج';
            document.getElementById('editProductId').value = prod.id;
            document.getElementById('prodCode').value = prod.code;
            document.getElementById('prodName').value = prod.name;
            document.getElementById('prodCost').value = prod.cost;
            document.getElementById('prodPrice').value = prod.price;
            document.getElementById('prodStock').value = prod.stock;
        }
    } else {
        if (title) title.textContent = 'إضافة منتج جديد';
    }

    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => document.getElementById('prodCode').focus(), 50);
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

function saveProduct(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('editProductId').value;
    const code = document.getElementById('prodCode').value.trim();
    const name = document.getElementById('prodName').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;

    if (!code || !name) {
        showAlert('يرجى ملء كود واسم المنتج');
        return;
    }

    if (id) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { id, code, name, cost, price, stock };
        }
    } else {
        products.push({ id: Date.now().toString(), code, name, cost, price, stock });
    }

    localStorage.setItem('mn_products', JSON.stringify(products));
    renderProducts();
    closeProductModal();
}

function openDeleteAuthModal(id) {
    const modal = document.getElementById('deleteAuthModal');
    const idInput = document.getElementById('deleteProductIdHidden');
    const passInput = document.getElementById('deleteAuthPassword');

    if (modal && idInput && passInput) {
        idInput.value = id;
        passInput.value = '';
        modal.style.display = 'flex';
        setTimeout(() => passInput.focus(), 50);
    }
}

function closeDeleteAuthModal() {
    const modal = document.getElementById('deleteAuthModal');
    if (modal) modal.style.display = 'none';
}

function confirmDeleteProduct() {
    const id = document.getElementById('deleteProductIdHidden').value;
    const inputPass = document.getElementById('deleteAuthPassword').value;

    if (inputPass !== appPassword) {
        showAlert('كلمة السر غير صحيحة!');
        return;
    }

    products = products.filter(p => p.id !== id);
    localStorage.setItem('mn_products', JSON.stringify(products));
    renderProducts();
    closeDeleteAuthModal();
    showAlert('تم حذف المنتج بنجاح.');
}

// ==========================================
// 5. سلة المشتريات
// ==========================================
function addToCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock <= 0) {
        showAlert('المنتج غير متوفر في المخزون!');
        return;
    }

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.qty < prod.stock) {
            existing.qty++;
        } else {
            showAlert('لقد تجاوزت الكمية المتاحة بالمخزون!');
        }
    } else {
        cart.push({ ...prod, qty: 1 });
    }

    renderCart();
}

function handleBarcodeScanner(code) {
    const prod = products.find(p => p.code === code);
    if (prod) {
        addToCart(prod.id);
    }
}

function updateCartQtyDirect(id, inputElement) {
    const prod = products.find(p => p.id === id);
    const item = cart.find(i => i.id === id);
    if (!item) return;

    let rawVal = inputElement.value;
    if (rawVal === '') return;

    let newQty = parseInt(rawVal);
    if (isNaN(newQty) || newQty <= 0) {
        newQty = 1;
        inputElement.value = 1;
    }

    if (prod && newQty > prod.stock) {
        newQty = prod.stock;
        inputElement.value = prod.stock;
    }

    item.qty = newQty;

    const row = inputElement.closest('tr');
    if (row) {
        const itemTotalCell = row.querySelector('.item-total');
        if (itemTotalCell) {
            itemTotalCell.textContent = `$${(item.price * item.qty).toFixed(2)}`;
        }
    }

    updateTotalsOnly();
}

function updateTotalsOnly() {
    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const grandTotalEl = document.getElementById('grandTotal');
    if (grandTotalEl) {
        grandTotalEl.textContent = `$${total.toFixed(2)}`;
    }
    calculateChange();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    renderCart();
}

function resetFormInputs() {
    const received = document.getElementById('receivedAmount');
    if (received) received.value = '';

    const debtorName = document.getElementById('debtorName');
    if (debtorName) debtorName.value = '';

    const debtorPhone = document.getElementById('debtorPhone');
    if (debtorPhone) debtorPhone.value = '';

    const isDebtCheck = document.getElementById('isDebt');
    if (isDebtCheck) isDebtCheck.checked = false;

    const debtInputs = document.getElementById('debtInputs');
    if (debtInputs) debtInputs.style.display = 'none';

    const changeEl = document.getElementById('changeAmount');
    if (changeEl) changeEl.textContent = '$0.00';
}

function clearCart() {
    cart = [];
    resetFormInputs();
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cartItems');
    if (!tbody) return;
    tbody.innerHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
            <td>
                <input type="number" min="1" max="${item.stock}" value="${item.qty}" 
                    style="width: 70px; text-align: center;" class="form-control cart-qty-input">
            </td>
            <td class="item-total">$${itemTotal.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm btn-remove">✕</button>
            </td>
        `;

        const qtyInput = tr.querySelector('.cart-qty-input');
        qtyInput.addEventListener('input', () => updateCartQtyDirect(item.id, qtyInput));
        
        // إعادة الضبط إلى 1 إذا أزال المستخدم الرقم تماماً عند التركيز للخارج
        qtyInput.addEventListener('blur', () => {
            if (qtyInput.value === '' || parseInt(qtyInput.value) <= 0) {
                qtyInput.value = 1;
                updateCartQtyDirect(item.id, qtyInput);
            }
        });

        const removeBtn = tr.querySelector('.btn-remove');
        removeBtn.addEventListener('click', (e) => { e.preventDefault(); removeFromCart(item.id); });

        tbody.appendChild(tr);
    });

    updateTotalsOnly();
}

function calculateChange() {
    const grandTotalEl = document.getElementById('grandTotal');
    if (!grandTotalEl) return;
    const grandTotal = parseFloat(grandTotalEl.textContent.replace('$', '')) || 0;
    
    const receivedInput = document.getElementById('receivedAmount');
    const received = receivedInput ? (parseFloat(receivedInput.value) || 0) : 0;
    const change = received - grandTotal;
    
    const changeEl = document.getElementById('changeAmount');
    if (changeEl) {
        changeEl.textContent = `$${(change > 0 ? change : 0).toFixed(2)}`;
    }
}

function toggleDebtInputs() {
    const isDebtCheck = document.getElementById('isDebt');
    const isDebt = isDebtCheck ? isDebtCheck.checked : false;
    const debtInputs = document.getElementById('debtInputs');
    
    if (debtInputs) {
        debtInputs.style.display = isDebt ? 'block' : 'none';
        if (isDebt) {
            const debtorNameInput = document.getElementById('debtorName');
            if (debtorNameInput) setTimeout(() => debtorNameInput.focus(), 50);
        }
    }
}

function processCheckout() {
    if (cart.length === 0) {
        showAlert('سلة المشتريات فارغة!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const isDebtCheck = document.getElementById('isDebt');
    const isDebt = isDebtCheck ? isDebtCheck.checked : false;
    
    const receivedInput = document.getElementById('receivedAmount');
    const receivedAmount = receivedInput ? (parseFloat(receivedInput.value) || 0) : 0;

    const debtorNameInput = document.getElementById('debtorName');
    const debtorPhoneInput = document.getElementById('debtorPhone');
    const debtorName = debtorNameInput ? debtorNameInput.value.trim() : '';
    const debtorPhone = debtorPhoneInput ? debtorPhoneInput.value.trim() : '';

    let debtAmount = 0;

    if (isDebt) {
        if (!debtorName) {
            showAlert('يرجى كتابة اسم المستدين عند التسجيل كدين!');
            return;
        }

        debtAmount = total - receivedAmount;

        if (debtAmount <= 0) {
            showAlert('المبلغ المستلم يغطي إجمالي الفاتورة بالكامل! لا داعي للتسجيل كدين.');
            return;
        }
    }

    cart.forEach(cartItem => {
        const prod = products.find(p => p.id === cartItem.id);
        if (prod) prod.stock -= cartItem.qty;
    });
    localStorage.setItem('mn_products', JSON.stringify(products));

    const saleRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: [...cart],
        total,
        receivedAmount,
        debtAmount: isDebt ? debtAmount : 0,
        isDebt,
        debtorName: isDebt ? debtorName : null
    };
    sales.push(saleRecord);
    localStorage.setItem('mn_sales', JSON.stringify(sales));

    if (isDebt && debtAmount > 0) {
        const existingDebtor = debts.find(d => d.name.toLowerCase() === debtorName.toLowerCase());
        if (existingDebtor) {
            existingDebtor.amount += debtAmount;
            if (debtorPhone) existingDebtor.phone = debtorPhone;
        } else {
            debts.push({
                name: debtorName,
                phone: debtorPhone || 'غير محدد',
                amount: debtAmount
            });
        }
        localStorage.setItem('mn_debts', JSON.stringify(debts));
    }

    showAlert(isDebt ? `تم تسجيل البيع! المبلغ المستلم: $${receivedAmount.toFixed(2)}، والمتبقي كدين: $${debtAmount.toFixed(2)}` : 'تمت عملية البيع بنجاح!');
    
    clearCart();
    renderProducts();
}

// ==========================================
// 6. سجل الديون
// ==========================================
function openDebtsModal() {
    const modal = document.getElementById('debtsModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            const searchInput = document.getElementById('searchDebtor');
            if (searchInput) searchInput.focus();
        }, 50);
    }
    renderDebtorsList();
}

function closeDebtsModal() {
    const modal = document.getElementById('debtsModal');
    if (modal) modal.style.display = 'none';
}

function renderDebtorsList() {
    const container = document.getElementById('debtorsList');
    const searchInput = document.getElementById('searchDebtor');
    const query = searchInput ? (searchInput.value || '').toLowerCase().trim() : '';
    if (!container) return;

    container.innerHTML = '';
    const filteredDebts = debts.filter(d => 
        d.name.toLowerCase().includes(query) || d.phone.toLowerCase().includes(query)
    );

    if (filteredDebts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px;">لا يوجد ديون مسجلة.</div>';
        return;
    }

    filteredDebts.forEach(debtor => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #ccc; background:#fff; margin-bottom:5px; border-radius:4px;';
        
        const currentAmount = Number(debtor.amount) || 0;

        item.innerHTML = `
            <div>
                <strong>${debtor.name}</strong> (${debtor.phone})
                <div style="color:red; font-weight:bold;">المبلغ: $${currentAmount.toFixed(2)}</div>
            </div>
            <button type="button" class="btn btn-success btn-sm btn-pay">تسديد</button>
        `;

        item.querySelector('.btn-pay').addEventListener('click', (e) => {
            e.preventDefault();
            openPayDebtModal(debtor.name, currentAmount);
        });

        container.appendChild(item);
    });
}

function openPayDebtModal(name, amount) {
    document.getElementById('payDebtorNameHidden').value = name;
    document.getElementById('payDebtorNameDisplay').textContent = name;
    
    const numAmount = Number(amount) || 0;
    document.getElementById('payDebtorTotalDisplay').textContent = `$${numAmount.toFixed(2)}`;
    document.getElementById('payAmountInput').value = '';
    
    const modal = document.getElementById('payDebtModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => document.getElementById('payAmountInput').focus(), 50);
    }
}

function closePayDebtModal() {
    const modal = document.getElementById('payDebtModal');
    if (modal) modal.style.display = 'none';
}

function processDebtPayment() {
    const name = document.getElementById('payDebtorNameHidden').value;
    const rawPayAmount = document.getElementById('payAmountInput').value;
    
    const payAmount = Math.round((parseFloat(rawPayAmount) || 0) * 100) / 100;
    const debtor = debts.find(d => d.name === name);

    if (!debtor) return;

    const currentDebt = Math.round((Number(debtor.amount) || 0) * 100) / 100;

    if (payAmount <= 0) {
        showAlert('أدخل مبلغاً صحيحاً للتسديد!');
        return;
    }

    if (payAmount > currentDebt + 0.001) {
        showAlert('المبلغ المدفوع أعلى من الدين المسجل!');
        return;
    }

    debtor.amount = Math.round((currentDebt - payAmount) * 100) / 100;

    if (debtor.amount <= 0.001) {
        debts = debts.filter(d => d.name !== name);
    }

    localStorage.setItem('mn_debts', JSON.stringify(debts));
    showAlert('تم تسديد المبلغ بنجاح!');
    closePayDebtModal();
    renderDebtorsList();
}

// ==========================================
// 7. إعدادات كلمة السر
// ==========================================
function openPasswordSettingsModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        setTimeout(() => {
            const oldPassInput = document.getElementById('oldPassword');
            if (oldPassInput) oldPassInput.focus();
        }, 50);
    }
}

function closePasswordSettingsModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'none';
}

function savePassword() {
    const oldP = document.getElementById('oldPassword').value;
    const newP = document.getElementById('newPassword').value;
    const confP = document.getElementById('confirmPassword').value;

    if (oldP !== appPassword) {
        showAlert('كلمة السر الحالية غير صحيحة!');
        return;
    }
    if (!newP || newP !== confP) {
        showAlert('تأكد من إدخال وتطابق كلمة السر الجديدة!');
        return;
    }

    appPassword = newP;
    localStorage.setItem('mn_password', appPassword);
    showAlert('تم تغيير كلمة السر بنجاح!');
    closePasswordSettingsModal();
}

// ==========================================
// 8. التقارير والتصدير والطباعة
// ==========================================
function openReportsModal() {
    const modal = document.getElementById('reportsModal');
    if (modal) modal.style.display = 'flex';
    filterReports('all');
}

function closeReportsModal() {
    const modal = document.getElementById('reportsModal');
    if (modal) modal.style.display = 'none';
}

function filterReports(period, btn = null) {
    if (btn) {
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const now = new Date();
    let filteredSales = sales.filter(s => {
        const sDate = new Date(s.date);
        if (period === 'daily') return sDate.toDateString() === now.toDateString();
        if (period === 'weekly') return (now - sDate) / (1000 * 60 * 60 * 24) <= 7;
        if (period === 'monthly') return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
        return true;
    });

    let totalSales = 0;
    let totalProfit = 0;
    let topProdMap = {};

    filteredSales.forEach(s => {
        totalSales += s.total;
        s.items.forEach(item => {
            const profit = (item.price - item.cost) * item.qty;
            totalProfit += profit;
            topProdMap[item.name] = (topProdMap[item.name] || 0) + item.qty;
        });
    });

    const totalDebtsSum = debts.reduce((sum, d) => sum + d.amount, 0);

    const reportTotalSales = document.getElementById('reportTotalSales');
    const reportTotalProfit = document.getElementById('reportTotalProfit');
    const reportTotalDebts = document.getElementById('reportTotalDebts');
    const reportSalesCount = document.getElementById('reportSalesCount');

    if (reportTotalSales) reportTotalSales.textContent = `$${totalSales.toFixed(2)}`;
    if (reportTotalProfit) reportTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
    if (reportTotalDebts) reportTotalDebts.textContent = `$${totalDebtsSum.toFixed(2)}`;
    if (reportSalesCount) reportSalesCount.textContent = filteredSales.length;

    const topList = document.getElementById('topProductsList');
    if (topList) {
        topList.innerHTML = '';
        Object.entries(topProdMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([name, qty]) => {
                const div = document.createElement('div');
                div.style.padding = '4px 0';
                div.textContent = `${name}: تم بيع (${qty}) قطعة`;
                topList.appendChild(div);
            });
    }
}

function exportData() {
    const data = { products, sales, debts, appPassword };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MN_POS_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.products) products = data.products;
            if (data.sales) sales = data.sales;
            if (data.debts) debts = data.debts;
            if (data.appPassword) appPassword = data.appPassword;

            localStorage.setItem('mn_products', JSON.stringify(products));
            localStorage.setItem('mn_sales', JSON.stringify(sales));
            localStorage.setItem('mn_debts', JSON.stringify(debts));
            localStorage.setItem('mn_password', appPassword);

            showAlert('تم استرجاع البيانات بنجاح!');
            renderProducts();
            renderCart();
        } catch (err) {
            showAlert('ملف البيانات غير صالح!');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// دالة الطباعة المحدثة للعمل مع الورقة المروسة
// ==========================================
function printReceipt() {
    if (cart.length === 0) {
        showAlert('سلة المشتريات فارغة!');
        return;
    }

    const printLetterhead = document.getElementById('print-letterhead');
    if (!printLetterhead) {
        showAlert('عنصر الترويسة غير موجود في ملف HTML!');
        return;
    }

    // 1. تحديث بيانات الهيدر
    const pInvoiceId = document.getElementById('p-invoice-id');
    const pDate = document.getElementById('p-date');
    const pClient = document.getElementById('p-client');

    if (pInvoiceId) pInvoiceId.innerText = '#' + Math.floor(1000 + Math.random() * 9000);
    if (pDate) pDate.innerText = new Date().toLocaleDateString('ar-EG');
    
    const isDebtCheck = document.getElementById('isDebt');
    const isDebt = isDebtCheck ? isDebtCheck.checked : false;
    const debtorNameInput = document.getElementById('debtorName');
    const debtorName = debtorNameInput ? debtorNameInput.value.trim() : '';

    if (pClient) {
        pClient.innerText = (isDebt && debtorName) ? debtorName : 'عميل نقدي';
    }

    // 2. تعبئة عناصر الفاتورة
    const pItems = document.getElementById('p-items');
    if (pItems) {
        pItems.innerHTML = '';
        cart.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>$${parseFloat(item.price).toFixed(2)}</td>
                <td>$${(item.price * item.qty).toFixed(2)}</td>
            `;
            pItems.appendChild(tr);
        });
    }

    // 3. تحديث الإجمالي
    const grandTotalEl = document.getElementById('grandTotal');
    const pTotal = document.getElementById('p-total');
    if (pTotal && grandTotalEl) {
        pTotal.innerText = grandTotalEl.innerText;
    }

    // 4. تنفيذ الطباعة ثم إنهاء البيع تلقائياً
    window.print();
    processCheckout();
}