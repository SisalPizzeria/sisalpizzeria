// Sistema di gestione ordini per Sisal Wincity Pizzeria

// Funzione per formattare gli articoli dell'ordine
function formatOrderItems(items) {
    return items.map(item => 
        `${item.name} x${item.quantity}: €${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
}

// Funzione di supporto per formattare la data (da YYYY-MM-DD a un formato più leggibile)
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
}

// Funzione di supporto per formattare l'ora (mantiene il formato 24h per l'italiano)
function formatTime(timeString) {
    return timeString;
}

// Funzione per inizializzare il servizio di gestione ordini
function initEmailService() {
    console.log('Sistema di gestione ordini inizializzato');
    return true;
}

// Funzione per salvare l'ordine nel localStorage
function saveOrderToLocalStorage(reservationData) {
    try {
        // Verifichiamo che i dati dell'ordine contengano tutte le informazioni necessarie
        if (!reservationData.customer || !reservationData.items || !reservationData.reservationDate || !reservationData.reservationTime) {
            console.error('Dati ordine incompleti:', reservationData);
            return false;
        }
        
        // Aggiungiamo un ID univoco e un timestamp all'ordine
        const orderWithId = {
            ...reservationData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: 'nuovo' // Stato iniziale dell'ordine
        };
        
        // Recuperiamo gli ordini esistenti
        let orders = JSON.parse(localStorage.getItem('sisalOrders') || '[]');
        
        // Aggiungiamo il nuovo ordine
        orders.push(orderWithId);
        
        // Salviamo nel localStorage
        localStorage.setItem('sisalOrders', JSON.stringify(orders));
        
        console.log('Ordine salvato nel sistema:', orderWithId);
        return true;
    } catch (error) {
        console.error('Impossibile salvare l\'ordine:', error);
        return false;
    }
}

// Funzione per inviare email al cliente (ora salva solo l'ordine)
async function sendCustomerEmail(reservationData) {
    return saveOrderToLocalStorage(reservationData);
}

// Funzione per inviare notifica al ristorante (ora salva solo l'ordine)
async function sendRestaurantEmail(reservationData) {
    return true; // Ritorniamo true perché l'ordine è già stato salvato in sendCustomerEmail
}