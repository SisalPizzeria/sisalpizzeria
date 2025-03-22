// Script per il pannello di amministrazione di Sisal Wincity Pizzeria

document.addEventListener('DOMContentLoaded', function() {
    
    // Elementi DOM
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersList = document.getElementById('orders-list');
    const allOrdersList = document.getElementById('all-orders-list');
    const canceledOrdersList = document.getElementById('canceled-orders-list');
    const noOrdersMsg = document.getElementById('no-orders');
    const noAllOrdersMsg = document.getElementById('no-all-orders');
    const noCanceledOrdersMsg = document.getElementById('no-canceled-orders');
    const orderDetailsModal = document.getElementById('order-details');
    const orderDetailsContent = document.getElementById('order-details-content');
    const editStatusModal = document.getElementById('edit-status');
    const statusSelect = document.getElementById('status-select');
    const editOrderId = document.getElementById('edit-order-id');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const allDateFilter = document.getElementById('all-date-filter');
    const canceledDateFilter = document.getElementById('canceled-date-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters');
    const clearCanceledFiltersBtn = document.getElementById('clear-canceled-filters');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Gestione dei tab
    tabBtns.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Rimuovi active da tutti i tab
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Aggiungi active al tab selezionato
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Carica i dati appropriati
            if (tabId === 'canceled') {
                loadCanceledOrders();
            } else if (tabId === 'all') {
                loadAllOrders();
            } else {
                loadOrders();
            }
        });
    });
    
    // Verifica se l'utente è già autenticato
    const checkAuthState = function() {
        const authUser = window.authService.isAuthenticated();
        if (authUser) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            // Mostra il nome utente nel pannello admin
            const adminTitle = document.querySelector('.admin-title');
            adminTitle.textContent = `Gestione Ordini - ${authUser.username} (${authUser.role})`;
            
            // Carica gli ordini in base al tab attivo
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabId = activeTab.getAttribute('data-tab');
                if (tabId === 'canceled') {
                    loadCanceledOrders();
                } else if (tabId === 'all') {
                    loadAllOrders();
                } else {
                    loadOrders();
                }
            } else {
                // Default: carica gli ordini normali
                loadOrders();
            }
        }
    };
    
    // Controlla lo stato di autenticazione all'avvio
    checkAuthState();
    
    // Gestione login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = window.authService.verifyCredentials(username, password);
        
        if (user) {
            window.authService.saveAuthState(user);
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            // Mostra il nome utente nel pannello admin
            const adminTitle = document.querySelector('.admin-title');
            adminTitle.textContent = `Gestione Ordini - ${user.username} (${user.role})`;
            loadOrders();
        } else {
            alert('Credenziali non valide. Riprova.');
        }
    });
    
    // Gestione logout
    logoutBtn.addEventListener('click', function() {
        window.authService.logout();
        adminSection.style.display = 'none';
        loginSection.style.display = 'block';
        document.getElementById('login-form').reset();
    });
    
    // Gestione filtri
    statusFilter.addEventListener('change', loadOrders);
    dateFilter.addEventListener('change', loadOrders);
    allDateFilter.addEventListener('change', loadAllOrders);
    canceledDateFilter.addEventListener('change', loadCanceledOrders);
    
    clearFiltersBtn.addEventListener('click', function() {
        statusFilter.value = 'all';
        dateFilter.value = '';
        loadOrders();
    });
    
    clearAllFiltersBtn.addEventListener('click', function() {
        allDateFilter.value = '';
        loadAllOrders();
    });
    
    clearCanceledFiltersBtn.addEventListener('click', function() {
        canceledDateFilter.value = '';
        loadCanceledOrders();
    });
    
    // Gestione chiusura modali
    document.querySelectorAll('.close-modal').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            orderDetailsModal.style.display = 'none';
            editStatusModal.style.display = 'none';
        });
    });
    
    document.getElementById('close-details-btn').addEventListener('click', function() {
        orderDetailsModal.style.display = 'none';
    });
    
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        editStatusModal.style.display = 'none';
    });
    
    // Salvataggio stato ordine
    document.getElementById('save-status-btn').addEventListener('click', function() {
        const orderId = editOrderId.value;
        const newStatus = statusSelect.value;
        
        updateOrderStatus(orderId, newStatus);
        editStatusModal.style.display = 'none';
        loadOrders();
    });
    
    // Caricamento ordini dal localStorage
    function loadOrders() {
        // Recupera gli ordini dal localStorage
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        
        // Applica i filtri
        const statusFilterValue = statusFilter.value;
        const dateFilterValue = dateFilter.value;
        
        const filteredOrders = orders.filter(order => {
            // Non mostrare ordini cancellati nella sezione principale
            if (order.status === 'annullato') {
                return false;
            }
            
            // Filtro per stato
            if (statusFilterValue !== 'all') {
                // Per gli altri filtri, mostra solo gli ordini con quello specifico stato
                if (order.status !== statusFilterValue) {
                    return false;
                }
            }
            
            // Filtro per data
            if (dateFilterValue) {
                const orderDate = new Date(order.reservationDate).toISOString().split('T')[0];
                if (orderDate !== dateFilterValue) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Ordina gli ordini per data (più recenti prima)
        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Aggiorna la UI
        renderOrders(filteredOrders, ordersList, noOrdersMsg);
    }
    
    // Caricamento ordini cancellati
    function loadCanceledOrders() {
        // Recupera gli ordini dal localStorage
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        
        // Applica i filtri
        const dateFilterValue = canceledDateFilter.value;
        
        const filteredOrders = orders.filter(order => {
            // Mostra solo ordini cancellati
            if (order.status !== 'annullato') {
                return false;
            }
            
            // Filtro per data
            if (dateFilterValue) {
                const orderDate = new Date(order.reservationDate).toISOString().split('T')[0];
                if (orderDate !== dateFilterValue) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Ordina gli ordini per data (più recenti prima)
        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Aggiorna la UI
        renderOrders(filteredOrders, canceledOrdersList, noCanceledOrdersMsg);
    }
    
    // Caricamento di tutti gli ordini (sezione "Tutti gli Ordini")
    function loadAllOrders() {
        // Recupera gli ordini dal localStorage
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        
        // Applica solo il filtro per data, mostra tutti gli stati
        const dateFilterValue = allDateFilter.value;
        
        const filteredOrders = orders.filter(order => {
            // Filtro per data
            if (dateFilterValue) {
                const orderDate = new Date(order.reservationDate).toISOString().split('T')[0];
                if (orderDate !== dateFilterValue) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Ordina gli ordini per data (più recenti prima)
        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Aggiorna la UI
        renderOrders(filteredOrders, allOrdersList, noAllOrdersMsg);
    }
    
    // Renderizza gli ordini nella tabella appropriata
    function renderOrders(orders, listElement, noOrdersElement) {
        if (orders.length === 0) {
            listElement.innerHTML = '';
            noOrdersElement.style.display = 'block';
            return;
        }
        
        noOrdersElement.style.display = 'none';
        listElement.innerHTML = '';
        
        orders.forEach(order => {
            // Ensure order structure is compatible with the new version
            if (order.customer && order.customer.payment) {
                // For backward compatibility - remove payment field from customer object
                delete order.customer.payment;
            }
            
            const row = document.createElement('tr');
            
            // Formatta la data di ritiro
            const pickupDate = formatDate(order.reservationDate);
            
            // Determina se stiamo visualizzando nella sezione ordini cancellati
            const isCanceledSection = listElement.id === 'canceled-orders-list';
            
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.customer.name}</td>
                <td>${pickupDate}</td>
                <td>${order.reservationTime}</td>
                <td>€${order.total.toFixed(2)}</td>
                <td><span class="order-status status-${order.status}">${formatStatus(order.status)}</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                    ${!isCanceledSection ? `<button class="action-btn edit-btn" data-id="${order.id}"><i class="fas fa-edit"></i></button>` : ''}
                    <button class="action-btn delete-btn" data-id="${order.id}" data-permanent="${isCanceledSection}"><i class="fas fa-trash"></i></button>
                    ${isCanceledSection ? `<button class="action-btn restore-btn" data-id="${order.id}"><i class="fas fa-undo"></i></button>` : ''}
                </td>
            `;
            
            listElement.appendChild(row);
        });
        
        // Aggiungi event listeners ai pulsanti
        listElement.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                showOrderDetails(orderId);
            });
        });
        
        listElement.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                showEditStatusModal(orderId);
            });
        });
        
        listElement.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                const isPermanent = this.dataset.permanent === 'true';
                
                if (isPermanent) {
                    if (confirm('Sei sicuro di voler eliminare permanentemente questo ordine? Questa azione è irreversibile.')) {
                        permanentlyDeleteOrder(orderId);
                    }
                } else {
                    if (confirm('Sei sicuro di voler spostare questo ordine nella sezione Ordini Cancellati?')) {
                        deleteOrder(orderId);
                    }
                }
            });
        });
        
        // Aggiungi event listener ai pulsanti di ripristino se presenti
        listElement.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.id;
                if (confirm('Sei sicuro di voler ripristinare questo ordine?')) {
                    restoreOrder(orderId);
                }
            });
        });
    }
    
    // Mostra i dettagli dell'ordine
    function showOrderDetails(orderId) {
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            alert('Ordine non trovato!');
            return;
        }
        
        // Formatta i dettagli dell'ordine
        const orderDate = new Date(order.timestamp).toLocaleString('it-IT');
        const pickupDate = formatDate(order.reservationDate);
        
        let orderItemsHtml = '';
        order.items.forEach(item => {
            orderItemsHtml += `
                <div class="order-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>€${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        orderDetailsContent.innerHTML = `
            <div class="order-info">
                <p><strong>ID Ordine:</strong> ${order.id}</p>
                <p><strong>Data Ordine:</strong> ${orderDate}</p>
                <p><strong>Stato:</strong> <span class="order-status status-${order.status}">${formatStatus(order.status)}</span></p>
                <p><strong>Cliente:</strong> ${order.customer.name}</p>
                <p><strong>Telefono:</strong> ${order.customer.phone}</p>
                <p><strong>Data Ritiro:</strong> ${pickupDate}</p>
                <p><strong>Ora Ritiro:</strong> ${order.reservationTime}</p>
                <p><strong>Istruzioni Speciali:</strong> ${order.customer.notes || 'Nessuna'}</p>
            </div>
            <div class="order-items">
                <h4>Articoli Ordinati</h4>
                ${orderItemsHtml}
                <div class="order-item" style="font-weight: bold; margin-top: 10px;">
                    <span>Subtotale:</span>
                    <span>€${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="order-item" style="font-weight: bold;">
                    <span>Totale:</span>
                    <span>€${order.total.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        orderDetailsModal.style.display = 'block';
    }
    
    // Mostra il modale per modificare lo stato dell'ordine
    function showEditStatusModal(orderId) {
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            alert('Ordine non trovato!');
            return;
        }
        
        statusSelect.value = order.status;
        editOrderId.value = orderId;
        editStatusModal.style.display = 'block';
    }
    
    // Aggiorna lo stato di un ordine
    function updateOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            alert('Ordine non trovato!');
            return;
        }
        
        orders[orderIndex].status = newStatus;
        localStorage.setItem('sisalOrders', JSON.stringify(orders));
        
        // Aggiorna tutte le viste
        loadOrders();
        loadAllOrders();
        loadCanceledOrders();
    }
    
    // Elimina un ordine
    function deleteOrder(orderId) {
        let orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            alert('Ordine non trovato!');
            return;
        }
        
        // Invece di eliminare l'ordine, cambia il suo stato in "annullato"
        orders[orderIndex].status = 'annullato';
        localStorage.setItem('sisalOrders', JSON.stringify(orders));
        
        // Aggiorna tutte le viste
        loadOrders();
        loadAllOrders();
        loadCanceledOrders();
    }
    
    // Elimina permanentemente un ordine cancellato
    function permanentlyDeleteOrder(orderId) {
        let orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('sisalOrders', JSON.stringify(orders));
        
        // Aggiorna tutte le viste
        loadOrders();
        loadAllOrders();
        loadCanceledOrders();
    }
    
    // Ripristina un ordine cancellato
    function restoreOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            alert('Ordine non trovato!');
            return;
        }
        
        // Riporta lo stato a "nuovo" (o altro stato predefinito)
        orders[orderIndex].status = 'nuovo';
        localStorage.setItem('sisalOrders', JSON.stringify(orders));
        
        // Aggiorna tutte le viste
        loadOrders();
        loadAllOrders();
        loadCanceledOrders();
    }
    
    // Funzione di supporto per formattare la data
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }
    
    // Funzione di supporto per formattare lo stato
    function formatStatus(status) {
        const statusMap = {
            'nuovo': 'Nuovo',
            'in-preparazione': 'In Preparazione',
            'pronto': 'Pronto',
            'consegnato': 'Consegnato',
            'annullato': 'Annullato'
        };
        
        return statusMap[status] || status;
    }
});