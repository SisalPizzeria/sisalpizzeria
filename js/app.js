// Main application JavaScript for Sisal Pizzeria

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Inizializzazione del carrello
    window.cartItems = [];
    
    // Imposta la data e ora di default subito
    setDefaultDateTime();
    
    // E chiamala di nuovo dopo un ritardo per sicurezza
    setTimeout(setDefaultDateTime, 800);
    
    // Controlla lo stato del form quando la pagina viene ricaricata/aggiornata
    window.addEventListener('load', function() {
        console.log("%c[SISAL] Pagina completamente caricata - Controllo form", "background: #2196F3; color: white; padding: 5px;");
        setDefaultDateTime();
    });
    
    // Assicuriamoci che il form sia resettato correttamente
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.reset();
        console.log("%c[SISAL] Form prenotazione resettato", "color: #2196F3;");
        setTimeout(setDefaultDateTime, 100);
    }
    
    // Debug
    console.log("%c[SISAL] Tutti gli event listener configurati", "background: #4CAF50; color: white; padding: 5px;");
});

// Global variables
window.tuttiProdotti = [];
window.cartItems = [];

// Initialize the application
function initApp() {
    console.log("Inizializzazione applicazione...");
    
    if (!window.menuData) {
        console.error('Errore: Menu data non caricato correttamente');
        alert('Errore nel caricamento dei dati del menu. Controlla la console per dettagli.');
        return;
    }
    
    try {
        // Combine all menu categories into a single array
        window.tuttiProdotti = [];
        for (const category in window.menuData) {
            window.tuttiProdotti = [...window.tuttiProdotti, ...window.menuData[category]];
        }
        console.log("Menu dati caricati:", window.tuttiProdotti.length, "prodotti trovati");

        // Render the menu
        renderMenu(window.tuttiProdotti);

        // Set up event listeners
        setupEventListeners();

        // Initialize mobile menu
        initMobileMenu();

        // Initialize glitter effect
        initGlitterEffect();
        
        // Carica il carrello dal localStorage se disponibile
        loadCartFromStorage();
        
        // Verifica che gli event listener per i dettagli prodotto siano applicati
        verifyDetailEventListeners();
        
        // Debug
        console.log("App inizializzata con successo");
    } catch (error) {
        console.error("Errore durante l'inizializzazione dell'app:", error);
        alert("Si è verificato un errore durante il caricamento dell'applicazione. Controlla la console per dettagli.");
    }
}

// Imposta la data corrente come default e l'ora dalle 19:00 alle 22:00
function setDefaultDateTime() {
    console.log("%c[SISAL] Impostazione data e ora di default", "background: #4CAF50; color: white; padding: 5px;");
    
    // Seleziona l'input della data sia per ID che per attributo name
    let pickupDateInput = document.getElementById('pickup-date');
    if (!pickupDateInput) {
        pickupDateInput = document.querySelector('input[name="pickup-date"]');
    }
    
    // Seleziona l'input dell'ora sia per ID che per attributo name
    let pickupTimeInput = document.getElementById('pickup-time');
    if (!pickupTimeInput) {
        pickupTimeInput = document.querySelector('input[name="pickup-time"]');
    }
    
    if (pickupDateInput) {
        // Imposta la data di oggi come default
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        pickupDateInput.value = formattedDate;
        pickupDateInput.min = formattedDate; // Non permettere date passate
        console.log("%c[SISAL] Data impostata a: " + formattedDate, "color: #4CAF50;");
        
        // Forza un evento change per assicurarsi che sia riconosciuto come modificato
        pickupDateInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        console.warn("%c[SISAL] Elemento input data non trovato", "color: #FF9800;");
    }
    
    if (pickupTimeInput) {
        // Imposta 19:00 come orario default
        pickupTimeInput.value = "19:00";
        console.log("%c[SISAL] Ora impostata a: 19:00", "color: #4CAF50;");
        
        // Forza un evento change per assicurarsi che sia riconosciuto come modificato
        pickupTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        console.warn("%c[SISAL] Elemento input ora non trovato", "color: #FF9800;");
    }
}

// Render the menu items
function renderMenu(items) {
    const menuContainer = document.querySelector('.menu-items');
    if (!menuContainer) {
        console.error('Menu container not found');
        return;
    }
    
    menuContainer.innerHTML = '';

    if (items.length === 0) {
        menuContainer.innerHTML = '<p class="no-results">Nessun elemento del menu trovato. Prova una ricerca diversa.</p>';
        return;
    }

    // Crea gli elementi del menu
    let menuHTML = '';
    
    items.forEach((item, index) => {
        menuHTML += `
            <div class="menu-item" data-category="${item.category}" data-id="${item.id}" style="--animation-order: ${index % 10}">
                <div class="menu-item-image" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="menu-image" 
                         onerror="this.onerror=null; this.src='images/menu/placeholder.jpg';">
                </div>
                <div class="menu-item-info">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title" data-id="${item.id}">${item.name}</h3>
                        <span class="menu-item-price">€${item.price.toFixed(2)}</span>
                    </div>
                    <p class="menu-item-desc">${item.description}</p>
                    <button class="add-to-cart-btn" data-id="${item.id}">
                        <i class="fas fa-cart-plus"></i> Aggiungi al carrello
                    </button>
                </div>
            </div>
        `;
    });
    
    // Inserisci l'HTML nel contenitore
    menuContainer.innerHTML = menuHTML;
    
    // Aggiungi event listener ai bottoni "Aggiungi al carrello"
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Impedisci il bubbling per non attivare il modale
            handleAddToCart(e);
        });
    });
    
    // Aggiungi event listener per aprire il modale 
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Verifica che il click non sia sul bottone del carrello
            if (!e.target.closest('.add-to-cart-btn')) {
                const itemId = this.dataset.id;
                if (itemId) {
                    const fakeEvent = { 
                        currentTarget: { dataset: { id: itemId } },
                        preventDefault: () => {},
                        stopPropagation: () => {}
                    };
                    showItemDetails(fakeEvent);
                }
            }
        });
    });
    
    console.log("Menu renderizzato con " + items.length + " elementi e event listener applicati");
}

// Set up event listeners
function setupEventListeners() {
    // Menu search
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Category filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleCategoryFilter);
    });

    // Order form
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
    
    // Close modal when clicking close button or outside the modal
    document.addEventListener('click', function(e) {
        const itemModal = document.getElementById('item-details-modal');
        if (itemModal && itemModal.style.display === 'block') {
            if (e.target.classList.contains('close-modal') || 
                e.target.id === 'item-details-modal' || 
                e.target.id === 'close-item-modal') {
                closeItemModal();
            }
        }
    });
}

// Initialize mobile menu
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const body = document.body;

    if (!mobileMenuToggle || !mainNav) {
        console.error('Mobile menu elements not found');
        return;
    }

    mobileMenuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('show');
        document.body.classList.toggle('menu-open');
        
        // Cambia l'icona quando il menu è aperto/chiuso
        const icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            if (mainNav.classList.contains('show')) {
                icon.className = 'fas fa-times'; // Cambia in X quando il menu è aperto
            } else {
                icon.className = 'fas fa-bars'; // Torna all'icona hamburger quando chiuso
            }
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('show');
            document.body.classList.remove('menu-open');
            
            // Ripristina l'icona hamburger
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mainNav.classList.contains('show') && 
            !mainNav.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            mainNav.classList.remove('show');
            document.body.classList.remove('menu-open');
            
            // Ripristina l'icona hamburger
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    });
}

// Handle search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = window.tuttiProdotti.filter(item => {
        return (
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    });
    renderMenu(filteredItems);
}

// Handle category filter
function handleCategoryFilter(e) {
    const category = e.target.dataset.category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Filter items
    let filteredItems = window.tuttiProdotti;
    if (category !== 'all') {
        filteredItems = window.tuttiProdotti.filter(item => item.category === category);
    }
    
    renderMenu(filteredItems);
}

// Handle showing item details in modal
function showItemDetails(e) {
    try {
        console.log("Click su elemento del menu per visualizzare dettagli");
        e.preventDefault(); // Previeni comportamento predefinito del link
        e.stopPropagation(); // Ferma propagazione dell'evento
        
        // Ottieni l'ID dell'elemento su cui si è cliccato
        const itemId = e.currentTarget.dataset.id;
        console.log("ID prodotto:", itemId);
        
        if (!itemId) {
            console.error('ID prodotto non trovato');
            return;
        }
        
        // Trova l'elemento corrispondente
        const item = window.tuttiProdotti.find(product => product.id === itemId);
        
        if (!item) {
            console.error('Prodotto non trovato:', itemId);
            return;
        }
        
        console.log("Prodotto trovato:", item.name);
        
        // Verifica se il modale esiste già
        let itemModal = document.getElementById('item-details-modal');
        
        // Se non esiste, crealo
        if (!itemModal) {
            itemModal = document.createElement('div');
            itemModal.id = 'item-details-modal';
            itemModal.className = 'modal';
            document.body.appendChild(itemModal);
        }
        
        // Popola il modale con i dettagli dell'elemento
        itemModal.innerHTML = `
            <div class="modal-content item-details-content">
                <span id="close-item-modal" class="close-modal">&times;</span>
                <div class="item-details-container">
                    <div class="item-details-image">
                        <img src="${item.image}" alt="${item.name}" 
                             onerror="this.onerror=null; this.src='images/menu/placeholder.jpg';">
                    </div>
                    <div class="item-details-info">
                        <h2>${item.name}</h2>
                        <div class="item-details-price">€${item.price.toFixed(2)}</div>
                        <div class="item-details-description">
                            <h3>Descrizione</h3>
                            <p>${item.description}</p>
                        </div>
                        <div class="item-quantity-control">
                            <button class="quantity-btn item-minus">-</button>
                            <span id="item-quantity">1</span>
                            <button class="quantity-btn item-plus">+</button>
                        </div>
                        <button class="add-to-cart-btn modal-add-btn" data-id="${item.id}">
                            <i class="fas fa-cart-plus"></i> Aggiungi al carrello
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Mostra il modale
        itemModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Blocca lo scroll della pagina
        
        // Aggiungi event listener ai bottoni di quantità
        const minusBtn = itemModal.querySelector('.item-minus');
        const plusBtn = itemModal.querySelector('.item-plus');
        const quantitySpan = itemModal.querySelector('#item-quantity');
        let quantity = 1;
        
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                quantitySpan.textContent = quantity;
            }
        });
        
        plusBtn.addEventListener('click', () => {
            quantity++;
            quantitySpan.textContent = quantity;
        });
        
        // Aggiungi event listener al bottone "Aggiungi al carrello"
        const addToCartBtn = itemModal.querySelector('.modal-add-btn');
        addToCartBtn.addEventListener('click', () => {
            addToCartFromModal(item, quantity);
            closeItemModal();
        });
        
        // Aggiungi event listener per chiudere il modale
        const closeModalBtn = itemModal.querySelector('#close-item-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeItemModal);
        }
        
        // Chiudi il modale quando si clicca fuori dal contenuto
        itemModal.addEventListener('click', (event) => {
            if (event.target === itemModal) {
                closeItemModal();
            }
        });
        
        console.log("Modale dettagli prodotto aperto");
        
    } catch (error) {
        console.error("Errore durante l'apertura del modale dettagli:", error);
    }
}

// Close item details modal
function closeItemModal() {
    const itemModal = document.getElementById('item-details-modal');
    if (itemModal) {
        itemModal.style.display = 'none';
        document.body.style.overflow = ''; // Ripristina lo scroll della pagina
    }
}

// Add to cart from modal with specified quantity
function addToCartFromModal(item, quantity) {
    try {
        console.log(`Aggiunta di ${quantity} ${item.name} al carrello`);
        
        // Inizializza window.cartItems se non esiste
        if (!window.cartItems) {
            window.cartItems = [];
        }
        
        // Check if item is already in cart
        const existingItem = window.cartItems.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            // Increase quantity if already in cart
            existingItem.quantity += quantity;
            console.log(`Quantità incrementata per ${item.name}, nuova quantità: ${existingItem.quantity}`);
        } else {
            // Add new item to cart with specified quantity
            window.cartItems.push({
                ...item,
                quantity: quantity
            });
            console.log(`Nuovo prodotto aggiunto al carrello: ${item.name} x${quantity}`);
        }
        
        // Save cart to localStorage
        saveCartToStorage();
        
        // Update cart UI
        updateCartUI();
        
        // Show notification
        showNotification(`${quantity} x ${item.name} aggiunto al carrello!`, 'success');
        
    } catch (error) {
        console.error('Errore durante l\'aggiunta al carrello dal modale:', error);
        showNotification('Si è verificato un errore durante l\'aggiunta al carrello', 'error');
    }
}

// Handle add to cart functionality
function handleAddToCart(e) {
    try {
        console.log("Click su Aggiungi al carrello");
        const button = e.currentTarget;
        
        if (!button || !button.dataset || !button.dataset.id) {
            console.error('Errore: bottone non valido o ID prodotto mancante');
            return;
        }
        
        const itemId = button.dataset.id;
        console.log("ID prodotto:", itemId);
        
        if (!window.tuttiProdotti || !Array.isArray(window.tuttiProdotti)) {
            console.error('Errore: dati prodotti non disponibili o non validi');
            return;
        }
        
        const item = window.tuttiProdotti.find(product => product.id === itemId);
        
        if (!item) {
            console.error('Prodotto non trovato:', itemId);
            return;
        }
        
        console.log("Prodotto trovato:", item.name);
        
        // Inizializza window.cartItems se non esiste
        if (!window.cartItems) {
            window.cartItems = [];
        }
        
        // Check if item is already in cart
        const existingItem = window.cartItems.find(cartItem => cartItem.id === itemId);
        
        if (existingItem) {
            // Increase quantity if already in cart
            existingItem.quantity += 1;
            console.log(`Quantità incrementata per ${item.name}, nuova quantità: ${existingItem.quantity}`);
        } else {
            // Add new item to cart
            window.cartItems.push({
                ...item,
                quantity: 1
            });
            console.log(`Nuovo prodotto aggiunto al carrello: ${item.name}`);
        }
        
        // Save cart to localStorage
        saveCartToStorage();
        
        // Update cart UI
        updateCartUI();
        
        // Show animation and notification
        animateAddToCart(button);
        showNotification(`${item.name} aggiunto al carrello!`, 'success');
        
        // Aggiungi classe 'added' temporaneamente per feedback visivo
        button.classList.add('added');
        setTimeout(() => {
            button.classList.remove('added');
        }, 1500);
        
    } catch (error) {
        console.error('Errore durante l\'aggiunta al carrello:', error);
        showNotification('Si è verificato un errore durante l\'aggiunta al carrello', 'error');
    }
}

// Animate adding to cart
function animateAddToCart(button) {
    try {
        console.log("Avvio animazione aggiungi al carrello");
        
        // Controlla se l'icona del carrello esiste
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon) {
            console.error("Errore: icona carrello non trovata");
            return;
        }
        
        // Create a clone of the button for animation
        const clone = button.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.zIndex = '1000';
        clone.style.transform = 'translate(-50%, -50%)';
        clone.style.opacity = '1';
        clone.style.pointerEvents = 'none'; // Impedisce interazioni con il clone
        
        // Get positions
        const buttonRect = button.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();
        
        // Verifica se le coordinate sono valide
        if (!buttonRect || !cartRect) {
            console.error("Errore: impossibile ottenere le coordinate degli elementi");
            return;
        }
        
        // Position clone at button location
        clone.style.left = buttonRect.left + buttonRect.width / 2 + 'px';
        clone.style.top = buttonRect.top + buttonRect.height / 2 + 'px';
        clone.style.width = buttonRect.width + 'px';
        clone.style.height = buttonRect.height + 'px';
        
        // Add to DOM
        document.body.appendChild(clone);
        console.log("Clone aggiunto al DOM");
        
        // Apply animation
        setTimeout(() => {
            clone.style.transition = 'all 0.8s ease-in-out';
            clone.style.left = cartRect.left + cartRect.width / 2 + 'px';
            clone.style.top = cartRect.top + cartRect.height / 2 + 'px';
            clone.style.opacity = '0.2';
            clone.style.transform = 'translate(-50%, -50%) scale(0.3)';
            
            setTimeout(() => {
                // Rimuovi il clone se ancora esiste nel DOM
                if (clone && clone.parentNode) {
                    document.body.removeChild(clone);
                    console.log("Clone rimosso dal DOM");
                }
                
                // Animate cart icon
                cartIcon.classList.add('cart-pulse');
                setTimeout(() => {
                    cartIcon.classList.remove('cart-pulse');
                }, 300);
            }, 800);
        }, 10);
    } catch (error) {
        console.error("Errore durante l'animazione aggiungi al carrello:", error);
    }
}

// Update cart UI
function updateCartUI() {
    try {
        console.log("Aggiornamento UI carrello");
        
        // Assicuriamo che window.cartItems sia un array
        if (!window.cartItems) {
            window.cartItems = [];
            console.log("Inizializzato cartItems come array vuoto");
        }
        
        // Update cart count
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = window.cartItems.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
            console.log(`Aggiornato conteggio carrello: ${totalItems} prodotti`);
            
            // Add animation class if items in cart
            if (totalItems > 0) {
                cartCount.classList.add('has-items');
            } else {
                cartCount.classList.remove('has-items');
            }
        } else {
            console.error("Elemento carrello non trovato (id='cart-count')");
        }
        
        // Update cart items in order section
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            if (window.cartItems.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Il tuo carrello è vuoto</p>';
                console.log("Carrello vuoto: visualizzato messaggio");
            } else {
                let cartHTML = '';
                window.cartItems.forEach(item => {
                    cartHTML += `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <h4>${item.name}</h4>
                                <p>€${item.price.toFixed(2)} x ${item.quantity}</p>
                            </div>
                            <div class="cart-item-actions">
                                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn plus" data-id="${item.id}">+</button>
                                <button class="remove-btn" data-id="${item.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                cartItemsContainer.innerHTML = cartHTML;
                console.log(`Generato HTML per ${window.cartItems.length} prodotti nel carrello`);
                
                // Add event listeners to cart item buttons
                try {
                    cartItemsContainer.querySelectorAll('.quantity-btn.minus').forEach(button => {
                        button.addEventListener('click', decreaseQuantity);
                    });
                    
                    cartItemsContainer.querySelectorAll('.quantity-btn.plus').forEach(button => {
                        button.addEventListener('click', increaseQuantity);
                    });
                    
                    cartItemsContainer.querySelectorAll('.remove-btn').forEach(button => {
                        button.addEventListener('click', removeFromCart);
                    });
                    console.log("Event listener per bottoni carrello aggiunti");
                } catch (error) {
                    console.error("Errore nell'aggiunta degli event listener ai bottoni del carrello:", error);
                }
            }
        } else {
            console.error("Contenitore elementi carrello non trovato (id='cart-items')");
        }
        
        // Update totals
        updateCartTotals();
        
    } catch (error) {
        console.error("Errore durante l'aggiornamento UI del carrello:", error);
    }
}

// Update cart totals
function updateCartTotals() {
    const subtotalElement = document.getElementById('subtotal-amount');
    const totalElement = document.getElementById('total-amount');
    
    if (subtotalElement && totalElement) {
        const subtotal = window.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Assumiamo che il totale sia uguale al subtotale per ora
        // Ma potrebbe includere consegna, tasse, ecc. in futuro
        const total = subtotal;
        
        subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
        totalElement.textContent = `€${total.toFixed(2)}`;
    }
}

// Decrease quantity
function decreaseQuantity(e) {
    const itemId = e.currentTarget.dataset.id;
    const itemIndex = window.cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        if (window.cartItems[itemIndex].quantity > 1) {
            window.cartItems[itemIndex].quantity -= 1;
        } else {
            window.cartItems.splice(itemIndex, 1);
        }
        
        saveCartToStorage();
        updateCartUI();
    }
}

// Increase quantity
function increaseQuantity(e) {
    const itemId = e.currentTarget.dataset.id;
    const itemIndex = window.cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        window.cartItems[itemIndex].quantity += 1;
        saveCartToStorage();
        updateCartUI();
    }
}

// Remove from cart
function removeFromCart(e) {
    const itemId = e.currentTarget.dataset.id;
    const itemIndex = window.cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        const removedItem = window.cartItems[itemIndex];
        window.cartItems.splice(itemIndex, 1);
        saveCartToStorage();
        updateCartUI();
        showNotification(`${removedItem.name} rimosso dal carrello`, 'info');
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    try {
        if (!window.cartItems) {
            console.error("Errore: cartItems è undefined");
            return;
        }
        
        const cartJSON = JSON.stringify(window.cartItems);
        localStorage.setItem('cartItems', cartJSON);
        console.log(`Carrello salvato in localStorage: ${window.cartItems.length} prodotti`);
    } catch (error) {
        console.error("Errore durante il salvataggio del carrello:", error);
    }
}

// Load cart from localStorage
function loadCartFromStorage() {
    try {
        console.log("Caricamento carrello da localStorage...");
        const storedCart = localStorage.getItem('cartItems');
        
        if (!storedCart) {
            console.log("Nessun carrello trovato in localStorage");
            window.cartItems = [];
            return;
        }
        
        try {
            window.cartItems = JSON.parse(storedCart);
            
            // Verifica che cartItems sia un array
            if (!Array.isArray(window.cartItems)) {
                console.error("Dati del carrello non validi (non è un array)");
                window.cartItems = [];
                return;
            }
            
            console.log(`Carrello caricato: ${window.cartItems.length} prodotti`);
            updateCartUI();
        } catch (e) {
            console.error('Errore durante il parsing del carrello:', e);
            window.cartItems = [];
        }
    } catch (error) {
        console.error("Errore durante il caricamento del carrello:", error);
        window.cartItems = [];
    }
}

// Handle reservation submission
function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Verifica se ci sono prodotti nel carrello
    if (!window.cartItems || window.cartItems.length === 0) {
        showNotification('Aggiungi almeno un prodotto al carrello prima di procedere con la prenotazione.', 'warning');
        return;
    }
    
    // Get form data
    const formData = new FormData(e.target);
    const customerData = Object.fromEntries(formData.entries());
    
    // Validazione dell'orario (tra le 19:00 e le 22:00)
    const pickupTime = customerData['pickup-time'];
    if (pickupTime < "19:00" || pickupTime > "22:00") {
        showNotification('L\'orario di ritiro deve essere compreso tra le 19:00 e le 22:00.', 'warning');
        return;
    }
    
    // Calcola i totali
    const subtotal = window.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const total = subtotal; // Per ora il totale è uguale al subtotale
    
    // Genera un ID unico per l'ordine
    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    // Prepare order data with cart items
    const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customer: {
            name: customerData['full-name'],  // Aggiornato per usare 'full-name' invece di 'name'
            phone: customerData.phone,
            notes: customerData.notes || ''
        },
        reservationDate: customerData['pickup-date'],
        reservationTime: customerData['pickup-time'],
        items: JSON.parse(JSON.stringify(window.cartItems)), // Crea una copia profonda degli elementi del carrello
        subtotal: subtotal,
        total: total,
        status: 'nuovo' // Stato iniziale
    };
    
    console.log('Ordine creato:', orderData);
    
    // Salva l'ordine nel localStorage
    try {
        // Ottieni gli ordini esistenti
        const existingOrders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        
        // Aggiungi il nuovo ordine
        existingOrders.push(orderData);
        
        // Salva nel localStorage
        localStorage.setItem('sisalOrders', JSON.stringify(existingOrders));
        
        console.log('Ordine salvato con successo nel localStorage');
        
        // Mostra il modale di conferma
        const orderConfirmation = document.getElementById('order-confirmation');
        if (orderConfirmation) {
            orderConfirmation.style.display = 'block';
            
            // Aggiungi event listener per chiudere il modale
            const closeConfirmation = document.getElementById('close-confirmation');
            const closeConfirmationBtn = document.getElementById('close-confirmation-btn');
            
            if (closeConfirmation) {
                closeConfirmation.addEventListener('click', () => {
                    orderConfirmation.style.display = 'none';
                });
            }
            
            if (closeConfirmationBtn) {
                closeConfirmationBtn.addEventListener('click', () => {
                    orderConfirmation.style.display = 'none';
                });
            }
        }
        
        // Svuota il carrello
        window.cartItems = [];
        saveCartToStorage();
        updateCartUI();
        
        // Show notification
        showNotification('Prenotazione ricevuta! Ti contatteremo presto.');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        console.error('Errore nel salvataggio dell\'ordine:', error);
        showNotification('Si è verificato un errore nel salvataggio dell\'ordine. Riprova più tardi.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Helper function to format date (YYYY-MM-DD to more readable format)
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function to format time (24h to 12h format)
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Funzione per creare l'effetto glitter
function initGlitterEffect() {
    try {
        console.log("Inizializzazione effetto glitter");
        
        // Verifica se container glitter esiste già
        let glitterContainer = document.querySelector('.glitter');
        
        // Se esiste, rimuovilo per evitare duplicati
        if (glitterContainer) {
            glitterContainer.remove();
        }
        
        // Crea il contenitore per le particelle glitter
        glitterContainer = document.createElement('div');
        glitterContainer.className = 'glitter';
        document.body.appendChild(glitterContainer);
        
        // Numero di particelle da generare - riduciamo per migliori performance
        const particleCount = 15;
        
        // Funzione per creare una singola particella
        function createParticle() {
            try {
                const particle = document.createElement('div');
                particle.className = 'glitter-particle';
                
                // Posizione casuale
                const x = Math.random() * 100;
                const y = Math.random() * 100 + 100; // Inizia fuori dallo schermo in basso
                
                // Dimensione casuale
                const size = Math.random() * 2 + 1;
                
                // Colori pastello casuali
                const hue = Math.floor(Math.random() * 360);
                const saturation = Math.floor(Math.random() * 30) + 70;
                const lightness = Math.floor(Math.random() * 20) + 70;
                
                // Velocità casuale
                const duration = Math.random() * 4 + 3;
                
                // Applica lo stile alla particella
                particle.style.cssText = `
                    left: ${x}%;
                    bottom: -${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    background-color: hsla(${hue}, ${saturation}%, ${lightness}%, 0.8);
                    animation-duration: ${duration}s;
                    animation-delay: ${Math.random() * 5}s;
                `;
                
                glitterContainer.appendChild(particle);
                
                // Rimuovi la particella dopo che l'animazione è completata
                particle.addEventListener('animationend', () => {
                    // Verifica che la particella e il contenitore esistano ancora
                    if (particle && particle.parentNode && glitterContainer && !glitterContainer.classList.contains('removing')) {
                        particle.remove();
                        createParticle(); // Crea una nuova particella
                    }
                });
            } catch (error) {
                console.error("Errore nella creazione di una particella glitter:", error);
            }
        }
        
        // Crea le particelle iniziali
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }
        
        console.log("Effetto glitter inizializzato con successo");
    } catch (error) {
        console.error("Errore durante l'inizializzazione dell'effetto glitter:", error);
    }
}

// Verifica che gli event listener per i dettagli prodotto siano applicati
function verifyDetailEventListeners() {
    try {
        const menuTitles = document.querySelectorAll('.menu-item-title');
        const menuImages = document.querySelectorAll('.menu-item-image');
        
        console.log(`Trovati ${menuTitles.length} titoli e ${menuImages.length} immagini di prodotti`);
        
        if (menuTitles.length === 0 && menuImages.length === 0) {
            console.error("Nessun elemento di menu trovato per applicare event listener dettagli");
            
            // Riapplicare gli event listener dopo un breve ritardo
            setTimeout(() => {
                const allMenuItems = document.querySelectorAll('.menu-item');
                console.log(`Ritentativo: trovati ${allMenuItems.length} elementi menu`);
                
                allMenuItems.forEach(item => {
                    // Assicurati che l'intero elemento menu sia cliccabile
                    item.addEventListener('click', function(e) {
                        // Previeni la propagazione se l'evento è sul bottone aggiungi al carrello
                        if (!e.target.closest('.add-to-cart-btn')) {
                            const itemId = this.dataset.id;
                            if (itemId) {
                                const fakeEvent = { currentTarget: { dataset: { id: itemId } }, preventDefault: () => {}, stopPropagation: () => {} };
                                showItemDetails(fakeEvent);
                            }
                        }
                    });
                });
                
                console.log("Event listeners applicati agli elementi menu completi");
            }, 500);
        }
    } catch (error) {
        console.error("Errore durante la verifica degli event listener:", error);
    }
}