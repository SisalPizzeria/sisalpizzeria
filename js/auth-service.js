// Sistema di autenticazione per Sisal Wincity Pizzeria

// Credenziali di amministrazione
const ADMIN_CREDENTIALS = [
    {
        username: 'admin',
        password: 'sisal2025',
        role: 'admin'
    },
    {
        username: 'manager',
        password: 'wincity2025',
        role: 'manager'
    }
];

// Funzione per verificare le credenziali
function verifyCredentials(username, password) {
    const user = ADMIN_CREDENTIALS.find(user => 
        user.username === username && user.password === password
    );
    
    return user ? user : null;
}

// Funzione per salvare lo stato di autenticazione nella sessione
function saveAuthState(user) {
    // Rimuoviamo la password per sicurezza
    const userInfo = {
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString()
    };
    
    // Salviamo nel sessionStorage (valido solo per la sessione corrente)
    sessionStorage.setItem('sisalAdminAuth', JSON.stringify(userInfo));
    return true;
}

// Funzione per verificare se l'utente è autenticato
function isAuthenticated() {
    const authData = sessionStorage.getItem('sisalAdminAuth');
    return authData ? JSON.parse(authData) : null;
}

// Funzione per effettuare il logout
function logout() {
    sessionStorage.removeItem('sisalAdminAuth');
    return true;
}

// Esportiamo le funzioni
window.authService = {
    verifyCredentials,
    saveAuthState,
    isAuthenticated,
    logout
};