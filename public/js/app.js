// Currency Converter JavaScript - Banking Design
// Developed by Maks0101aps © 2025

// DOM Elements
const fromAmountEl = document.getElementById('fromAmount');
const fromCurrencyEl = document.getElementById('fromCurrency');
const toAmountEl = document.getElementById('toAmount');
const toCurrencyEl = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const resultEl = document.getElementById('result');
const conversionResultEl = document.getElementById('conversionResult');
const updateTimeEl = document.getElementById('updateTime');
const ratesTableEl = document.getElementById('ratesTable');

// Global variables
let exchangeRates = {};
let lastUpdated = '';

// List of supported currencies
const supportedCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 
    'CNY', 'RUB', 'UAH', 'BYN'
];

// Currency names and symbols for banking display
let currencyNames = {
    USD: { name: 'US Dollar', symbol: '$' },
    EUR: { name: 'Euro', symbol: '€' },
    GBP: { name: 'British Pound', symbol: '£' },
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$' },
    AUD: { name: 'Australian Dollar', symbol: 'A$' },
    CHF: { name: 'Swiss Franc', symbol: 'Fr' },
    CNY: { name: 'Chinese Yuan', symbol: '¥' },
    INR: { name: 'Indian Rupee', symbol: '₹' },
    RUB: { name: 'Russian Ruble', symbol: '₽' },
    UAH: { name: 'Ukrainian Hryvnia', symbol: '₴' },
    BYN: { name: 'Belarusian Ruble', symbol: 'Br' },
    TRY: { name: 'Turkish Lira', symbol: '₺' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' },
    MXN: { name: 'Mexican Peso', symbol: 'Mex$' },
    PLN: { name: 'Polish Złoty', symbol: 'zł' },
    SEK: { name: 'Swedish Krona', symbol: 'kr' }
};

// Easter egg - Konami code sequence
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'KeyM', 'KeyA', 'KeyK', 'KeyS'];
let konamiCodePosition = 0;

// Currency flag codes mapping (ISO 2-letter country codes)
const currencyFlagMap = {
    'USD': 'us',
    'EUR': 'eu',
    'GBP': 'gb',
    'JPY': 'jp',
    'AUD': 'au',
    'CAD': 'ca',
    'CHF': 'ch',
    'CNY': 'cn',
    'HKD': 'hk',
    'NZD': 'nz',
    'SEK': 'se',
    'KRW': 'kr',
    'SGD': 'sg',
    'NOK': 'no',
    'MXN': 'mx',
    'INR': 'in',
    'RUB': 'ru',
    'ZAR': 'za',
    'TRY': 'tr',
    'BRL': 'br',
    'TWD': 'tw',
    'DKK': 'dk',
    'PLN': 'pl',
    'THB': 'th',
    'IDR': 'id',
    'HUF': 'hu',
    'CZK': 'cz',
    'ILS': 'il',
    'CLP': 'cl',
    'PHP': 'ph',
    'AED': 'ae',
    'COP': 'co',
    'SAR': 'sa',
    'MYR': 'my',
    'RON': 'ro',
    'UAH': 'ua',
    'BYN': 'by'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded, initializing application...');
    
    // Initialize DOM references globally to avoid confusion
    window.ratesTableEl = document.getElementById('ratesTable');
    if (!window.ratesTableEl) {
        console.error('Rates table element not found on page load');
    } else {
        console.log('Rates table element found:', window.ratesTableEl);
    }
    
    // Setup offline mode
    setupOfflineMode();
    
    // Event listeners for the new UI
    const convertButton = document.getElementById('convertButton');
    const swapButton = document.getElementById('swapButton');
    const multiConvertButton = document.getElementById('multiConvertButton');
    const exportButton = document.getElementById('exportButton');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const amount = document.getElementById('amount');
    
    if (convertButton) convertButton.addEventListener('click', convertCurrency);
    if (swapButton) swapButton.addEventListener('click', swapCurrencies);
    if (multiConvertButton) multiConvertButton.addEventListener('click', performMultiCurrencyConversion);
    if (exportButton) exportButton.addEventListener('click', exportConversionResult);
    
    // Currency select change events
    if (fromCurrency) fromCurrency.addEventListener('change', updateCurrencyFlags);
    if (toCurrency) toCurrency.addEventListener('change', updateCurrencyFlags);
    
    // Amount input events
    if (amount) {
        amount.addEventListener('input', () => {
            if (document.getElementById('result')?.value) {
                convertCurrency();
            }
        });
    }
    
    // Handle legacy UI event listeners if they exist
    const convertBtn = document.getElementById('convertBtn');
    const swapBtn = document.getElementById('swapBtn');
    const fromAmountEl = document.getElementById('fromAmount');
    const fromCurrencyEl = document.getElementById('fromCurrency');
    const toCurrencyEl = document.getElementById('toCurrency');
    
    if (convertBtn) convertBtn.addEventListener('click', performConversion);
    if (swapBtn) swapBtn.addEventListener('click', swapCurrencies);
    if (fromAmountEl) fromAmountEl.addEventListener('input', performConversion);
    if (fromCurrencyEl && !fromCurrencyEl.onchange) fromCurrencyEl.addEventListener('change', performConversion);
    if (toCurrencyEl && !toCurrencyEl.onchange) toCurrencyEl.addEventListener('change', performConversion);
    
    // IMPORTANT: Fetch initial rates
    console.log('Initializing application and fetching rates...');
    
    // Use the correct API fetching function - this is the one that works with the server
    try {
        // Create loading state in the rates table
        if (window.ratesTableEl) {
            window.ratesTableEl.innerHTML = `
                <tr>
                    <td colspan="2" class="py-4 px-4 text-center text-secondary-500">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        Loading exchange rates...
                    </td>
                </tr>
            `;
        }
        
        // Try to fetch rates from multiple sources in sequence
        let success = false;
        
        // First try: Use the primary API endpoint
        console.log('Attempting to fetch rates from API...');
        success = await fetchRates();
        
        if (success) {
            console.log('Successfully fetched rates from API');
        } else {
            console.warn('Primary rate fetch failed, trying alternatives...');
            
            // Second try: Load from local storage
            if (loadRatesFromLocalStorage()) {
                success = true;
                console.log('Successfully loaded rates from local storage');
                if (window.ratesTableEl) updateRatesTableWithData(rates);
            } else {
                console.warn('Local storage fallback failed, using hardcoded rates...');
                
                // Last resort: Use hardcoded fallback rates
                if (useFallbackRates()) {
                    success = true;
                    console.log('Using fallback rates');
                    if (window.ratesTableEl) updateRatesTableWithData(rates);
                }
            }
        }
        
        // Perform initial conversion based on UI version
        if (success) {
            if (document.getElementById('result')) {
                convertCurrency();
            } else if (fromAmountEl) {
                performConversion();
            }
        } else {
            console.error('All attempts to get rates failed');
            showNotification('Could not load exchange rates. Please check your connection and try again.', 'error');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Failed to initialize the application. Please try refreshing the page.', 'error');
    }
    
    // Easter Egg - Konami Code with M A K S
    let konamiCodeSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'KeyM', 'KeyA', 'KeyK', 'KeyS'];
    let konamiCodePosition = 0;
    
    document.addEventListener('keydown', function(e) {
        // Check if the correct key in the sequence was pressed
        if (e.code === konamiCodeSequence[konamiCodePosition]) {
            konamiCodePosition++;
            
            // If the entire sequence is entered correctly
            if (konamiCodePosition === konamiCodeSequence.length) {
                activateEasterEgg();
                konamiCodePosition = 0; // Reset position
            }
        } else {
            konamiCodePosition = 0; // Reset on incorrect key
        }
    });
    
    // Add hidden console message
    console.log("%c🔍 Easter Egg Hunt: Try typing 'Maks0101aps' in the console or using Konami code!", "color: #0ea5e9; font-size: 14px; font-weight: bold;");
});

// Easter egg - Check for Konami code sequence
function checkKonamiCode(e) {
    // Get the key that was pressed
    const key = e.code;
    
    // Check if the key matches the expected key in the sequence
    if (key === konamiCode[konamiCodePosition]) {
        // Move to the next key in the sequence
        konamiCodePosition++;
        
        // If the entire sequence has been entered correctly
        if (konamiCodePosition === konamiCode.length) {
            activateEasterEgg();
            konamiCodePosition = 0; // Reset for next time
        }
    } else {
        // Reset if wrong key is pressed
        konamiCodePosition = 0;
    }
}

// Easter egg - Activate the easter egg
function activateEasterEgg() {
    document.body.classList.add('show-easter-egg');
    
    // Create a special message
    const easterEggMessage = document.createElement('div');
    easterEggMessage.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 pointer-events-none';
    easterEggMessage.innerHTML = `
        <div class="text-center">
            <h2 class="text-6xl font-bold gradient-text animate-pulse">Maks0101aps</h2>
            <p class="text-secondary-600 mt-2">You found the easter egg! 🎉</p>
        </div>
    `;
    document.body.appendChild(easterEggMessage);
    
    // Remove after 3 seconds
    setTimeout(() => {
        easterEggMessage.remove();
        document.body.classList.remove('show-easter-egg');
    }, 3000);
}

// Easter egg - Console easter egg
window.Maks0101aps = function() {
    console.log("%c👋 Hello from Maks0101aps!", "color: #1e3a8a; font-size: 20px; font-weight: bold;");
    console.log("%c🔗 GitHub: https://github.com/Maks0101aps", "color: #0ea5e9;");
    console.log("%c© 2025 All rights reserved", "color: #64748b;");
    return "Thanks for checking out my Currency Converter!";
};

// Fetch currency rates
async function fetchRates() {
    try {
        showNotification('Fetching current rates...', 'info');
        
        // Try to get rates from the server
        const response = await fetch('/api/rates');
        
        if (!response.ok) {
            console.error('Server response error:', response.status);
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.rates || Object.keys(data.rates).length === 0) {
            console.error('Invalid data from server:', data);
            throw new Error('Invalid data received from server');
        }
        
        // Store the data - filter to only include supported currencies
        const filteredRates = {};
        supportedCurrencies.forEach(currency => {
            if (data.rates[currency]) {
                filteredRates[currency] = data.rates[currency];
            } else {
                console.warn(`Currency ${currency} not found in API response`);
            }
        });
        
        // Check if we have enough currencies
        if (Object.keys(filteredRates).length === 0) {
            console.error('No supported currencies found in API response');
            throw new Error('No supported currencies available');
        }
        
        // Store the filtered rates
        rates = filteredRates;
        exchangeRates = { ...filteredRates }; // Make a copy for consistency
        baseRate = data.base || 'USD';
        lastUpdated = new Date().toLocaleString();
        
        // Update the last updated time display
        if (updateTimeEl) {
            updateTimeEl.textContent = lastUpdated;
        }
        
        console.log('Successfully fetched and processed rates:', Object.keys(rates).length, 'currencies');
        
        // Update the currency selectors
        populateCurrencyOptions();
        
        // Update the rates table with the new data
        if (window.ratesTableEl) {
            console.log('Updating rates table with fresh data');
            updateRatesTableWithData(rates);
        } else {
            console.error('Cannot update rates table - element not found');
        }
        
        showNotification('Exchange rates updated successfully', 'success');
        
        // Save to local storage for offline use
        saveRatesToLocalStorage(rates, baseRate);
        
        return true;
    } catch (error) {
        console.error('Error fetching rates:', error);
        showNotification('Failed to fetch exchange rates: ' + error.message, 'error');
        return false;
    }
}

// Show error in a user-friendly way
function showErrorMessage(message) {
    // Create a dismissible error alert
    const alertEl = document.createElement('div');
    alertEl.className = 'bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 flex items-start';
    alertEl.innerHTML = `
        <div class="flex-shrink-0 mr-3">
            <i class="fas fa-exclamation-circle text-red-500 text-lg"></i>
        </div>
        <div class="flex-grow">
            <p>${message}</p>
        </div>
        <button class="text-red-500 hover:text-red-700 ml-auto" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Insert at the top of the main content
    const mainEl = document.querySelector('main');
    mainEl.insertBefore(alertEl, mainEl.firstChild);
    
    // Auto dismiss after 10 seconds
    setTimeout(() => {
        if (alertEl.parentElement) {
            alertEl.remove();
        }
    }, 10000);
}

// Update currency options in dropdowns
function updateCurrencyOptions() {
    // Clear existing options
    fromCurrencyEl.innerHTML = '';
    toCurrencyEl.innerHTML = '';
    
    // Add options for each currency
    Object.keys(exchangeRates).forEach(currency => {
        const currencyInfo = currencyNames[currency] || { name: currency, symbol: '' };
        
        const fromOption = document.createElement('option');
        fromOption.value = currency;
        fromOption.textContent = `${currency} (${currencyInfo.symbol})`;
        
        const toOption = document.createElement('option');
        toOption.value = currency;
        toOption.textContent = `${currency} (${currencyInfo.symbol})`;
        
        fromCurrencyEl.appendChild(fromOption);
        toCurrencyEl.appendChild(toOption);
    });
    
    // Set default values
    fromCurrencyEl.value = 'USD';
    toCurrencyEl.value = 'EUR';
}

// Update the rates table - redirects to the more specific function
function updateRatesTable() {
    console.log('updateRatesTable called - forwarding to updateRatesTableWithData');
    
    const dataToUse = rates || exchangeRates || {};
    updateRatesTableWithData(dataToUse);
}

// Perform currency conversion
function performConversion() {
    const fromAmount = parseFloat(fromAmountEl.value);
    const fromCurrency = fromCurrencyEl.value;
    const toCurrency = toCurrencyEl.value;
    
    if (isNaN(fromAmount)) {
        toAmountEl.value = '';
        resultEl.classList.add('hidden');
        return;
    }
    
    if (exchangeRates && exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
        // Convert the amount
        const fromRate = exchangeRates[fromCurrency];
        const toRate = exchangeRates[toCurrency];
        const convertedAmount = (fromAmount * toRate) / fromRate;
        
        // Display result
        toAmountEl.value = convertedAmount.toFixed(2);
        
        const fromInfo = currencyNames[fromCurrency] || { symbol: '' };
        const toInfo = currencyNames[toCurrency] || { symbol: '' };
        
        conversionResultEl.innerHTML = `
            ${fromAmount.toFixed(2)} ${fromCurrency} ${fromInfo.symbol} = 
            <span class="font-bold">${convertedAmount.toFixed(2)} ${toCurrency} ${toInfo.symbol}</span>
        `;
        
        resultEl.classList.remove('hidden');
    }
}

// Swap from and to currencies
function swapCurrencies() {
    const fromCurrency = fromCurrencyEl.value;
    const toCurrency = toCurrencyEl.value;
    
    fromCurrencyEl.value = toCurrency;
    toCurrencyEl.value = fromCurrency;
    
    // Animate the swap button
    swapBtn.classList.add('animate-bounce');
    setTimeout(() => {
        swapBtn.classList.remove('animate-bounce');
    }, 500);
    
    performConversion();
}

// Show/hide loading state
function showLoading(isLoading) {
    const container = document.querySelector('.container');
    if (isLoading) {
        container.classList.add('loading');
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading...';
    } else {
        container.classList.remove('loading');
        convertBtn.disabled = false;
        convertBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Convert Currency';
    }
}

// Cached data for offline mode
let cachedRates = null;
let lastUpdateTime = null;

// Multiple currencies to convert to - only show these major currencies
const multiCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'RUB', 'UAH', 'BYN'
];

// Format date and time for UI display
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    }).format(date);
}

// Setup offline mode detection
function setupOfflineMode() {
    // Check if we're online at startup
    window.isOnline = navigator.onLine;
    
    // Listen for online status changes
    window.addEventListener('online', function() {
        window.isOnline = true;
        console.log('App is now online');
        showNotification('You are back online! Refreshing rates...', 'success');
        
        // Refresh rates when coming back online
        fetchRates().then(success => {
            if (success) {
                showNotification('Exchange rates refreshed', 'success');
            }
        });
    });
    
    window.addEventListener('offline', function() {
        window.isOnline = false;
        console.log('App is now offline');
        showNotification('You are offline. Using saved rates.', 'warning');
    });
    
    // Initialize online status
    if (!navigator.onLine) {
        showNotification('You are offline. Using saved rates if available.', 'warning');
    }
    
    return navigator.onLine;
}

// Function to update currency flag icons
function updateCurrencyFlags() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    const fromFlag = document.getElementById('fromCurrencyFlag');
    const toFlag = document.getElementById('toCurrencyFlag');
    
    // Update currency code displays
    document.getElementById('amountCurrencyCode').textContent = fromCurrency;
    document.getElementById('resultCurrencyCode').textContent = toCurrency;
    
    // Update flag icons
    fromFlag.className = `fi fi-${currencyFlagMap[fromCurrency] || 'xx'} mr-2`;
    toFlag.className = `fi fi-${currencyFlagMap[toCurrency] || 'xx'} mr-2`;
}

// Multiple currency conversion
function performMultiCurrencyConversion() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (!amount || isNaN(amount)) {
        showNotification('Please enter a valid amount and try again.', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('multiConversionResults');
    const tableBody = document.getElementById('multiConversionTableBody');
    
    // Clear previous results
    tableBody.innerHTML = '';
    
    // Convert to multiple currencies
    const baseRate = rates[fromCurrency] || exchangeRates[fromCurrency];
    
    if (!baseRate) {
        showNotification('Currency rates unavailable. Please try again later.', 'error');
        return;
    }
    
    // Filter currencies that actually have rates
    const availableCurrencies = multiCurrencies.filter(currency => 
        (rates[currency] || exchangeRates[currency]) && currency !== fromCurrency
    );
    
    availableCurrencies.forEach(currency => {
        // Get the rate from either rates or exchangeRates
        const targetRate = rates[currency] || exchangeRates[currency];
        
        if (targetRate) {
            const rate = targetRate / baseRate;
            const convertedAmount = amount * rate;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3 px-4 border-b border-secondary-200">
                    <div class="flex items-center">
                        <span class="fi fi-${currencyFlagMap[currency] || 'xx'} mr-2"></span>
                        <span class="font-medium">${currency}</span>
                        <span class="text-secondary-500 ml-2 text-sm">- ${getCurrencyName(currency)}</span>
                    </div>
                </td>
                <td class="py-3 px-4 text-right border-b border-secondary-200 font-medium">
                    ${convertedAmount.toFixed(2)} ${currency}
                </td>
                <td class="py-3 px-4 text-right border-b border-secondary-200 text-secondary-500">
                    1 ${fromCurrency} = ${rate.toFixed(4)} ${currency}
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
    
    // Show results
    resultsContainer.classList.remove('hidden');
}

// Get currency full name
function getCurrencyName(code) {
    const currencyNames = {
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'JPY': 'Japanese Yen',
        'AUD': 'Australian Dollar',
        'CAD': 'Canadian Dollar',
        'CHF': 'Swiss Franc',
        'CNY': 'Chinese Yuan',
        'HKD': 'Hong Kong Dollar',
        'NZD': 'New Zealand Dollar',
        'SEK': 'Swedish Krona',
        'KRW': 'South Korean Won',
        'SGD': 'Singapore Dollar',
        'NOK': 'Norwegian Krone',
        'MXN': 'Mexican Peso',
        'INR': 'Indian Rupee',
        'RUB': 'Russian Ruble',
        'ZAR': 'South African Rand',
        'TRY': 'Turkish Lira',
        'BRL': 'Brazilian Real',
        'TWD': 'New Taiwan Dollar',
        'DKK': 'Danish Krone',
        'PLN': 'Polish Zloty',
        'THB': 'Thai Baht',
        'IDR': 'Indonesian Rupiah',
        'HUF': 'Hungarian Forint',
        'CZK': 'Czech Koruna',
        'ILS': 'Israeli New Shekel',
        'CLP': 'Chilean Peso',
        'PHP': 'Philippine Peso',
        'AED': 'UAE Dirham',
        'COP': 'Colombian Peso',
        'SAR': 'Saudi Riyal',
        'MYR': 'Malaysian Ringgit',
        'RON': 'Romanian Leu'
    };
    
    return currencyNames[code] || code;
}

// Export conversion result
function exportConversionResult() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const result = document.getElementById('result').value;
    
    if (!amount || isNaN(amount) || !result) {
        showNotification('No conversion result to export.', 'warning');
        return;
    }
    
    const conversionDate = new Date();
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Currency Conversion Report\r\n';
    csvContent += `Date:,${conversionDate.toLocaleDateString()}\r\n`;
    csvContent += `Time:,${conversionDate.toLocaleTimeString()}\r\n\r\n`;
    csvContent += 'From Currency,Amount,To Currency,Converted Amount,Exchange Rate\r\n';
    
    const exchangeRate = (parseFloat(result.replace(/[^0-9.-]+/g, '')) / amount).toFixed(6);
    csvContent += `${fromCurrency},${amount},${toCurrency},${result},${exchangeRate}\r\n\r\n`;
    
    // If we have multi-currency results
    if (!document.getElementById('multiConversionResults').classList.contains('hidden')) {
        csvContent += '\r\nMulti-Currency Conversion Results\r\n';
        csvContent += 'Currency,Converted Amount,Exchange Rate\r\n';
        
        const baseRate = exchangeRates[fromCurrency];
        multiCurrencies.forEach(currency => {
            if (currency !== fromCurrency) {
                const rate = exchangeRates[currency] / baseRate;
                const convertedAmount = amount * rate;
                csvContent += `${currency},${convertedAmount.toFixed(2)},${rate.toFixed(6)}\r\n`;
            }
        });
    }
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `currency_conversion_${fromCurrency}_to_${toCurrency}_${conversionDate.toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Conversion result exported successfully!', 'success');
}

// Show notification to the user
function showNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    // Check if we have a notification container
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Create one if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add appropriate icon
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Set notification content
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <div class="notification-close"><i class="fas fa-times"></i></div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
    
    return notification;
}

let rates = {};

// Update rates table with specific data
function updateRatesTableWithData(ratesData) {
    console.log('Updating rates table with data:', Object.keys(ratesData).length, 'currencies');
    
    // First make sure we have the element
    if (!window.ratesTableEl) {
        window.ratesTableEl = document.getElementById('ratesTable');
    }
    
    if (!window.ratesTableEl) {
        console.error('Rates table element not found in the DOM');
        return;
    }
    
    // Clear existing content
    window.ratesTableEl.innerHTML = '';
    
    if (!ratesData || Object.keys(ratesData).length === 0) {
        window.ratesTableEl.innerHTML = '<tr><td colspan="2" class="py-4 px-4 text-center text-secondary-500">No rates available. Please try again later.</td></tr>';
        return;
    }
    
    // Filter currencies based on our supported list
    const currencies = Object.keys(ratesData).filter(currency => 
        supportedCurrencies.includes(currency) && currency !== 'USD'
    );
    
    // Priority currencies first, then alphabetical
    const mainCurrencies = ['EUR', 'GBP', 'JPY', 'CNY', 'RUB', 'UAH', 'BYN'];
    
    const sortedCurrencies = [
        ...mainCurrencies.filter(c => currencies.includes(c)),
        ...currencies.filter(c => !mainCurrencies.includes(c)).sort()
    ];
    
    if (sortedCurrencies.length === 0) {
        window.ratesTableEl.innerHTML = '<tr><td colspan="2" class="py-4 px-4 text-center text-secondary-500">No rates available for display.</td></tr>';
        return;
    }
    
    // Add USD first if it exists in rates
    if (ratesData['USD']) {
        const row = document.createElement('tr');
        row.classList.add('currency-item', 'hover:bg-secondary-50');
        const currencyInfo = currencyNames['USD'] || { name: 'US Dollar', symbol: '$' };
        
        row.innerHTML = `
            <td class="py-3 px-4 border-b">
                <div class="flex items-center">
                    <span class="fi fi-us mr-2"></span>
                    <span class="text-secondary-800 font-medium">USD</span>
                    <span class="text-secondary-500 ml-2">$</span>
                    <span class="ml-2 text-secondary-600 text-sm hidden md:inline">- ${currencyInfo.name}</span>
                </div>
            </td>
            <td class="py-3 px-4 border-b text-right font-medium">${ratesData['USD'].toFixed(4)}</td>
        `;
        window.ratesTableEl.appendChild(row);
    }
    
    // Add each currency row to the table
    sortedCurrencies.forEach(currency => {
        const rate = ratesData[currency];
        if (!rate) return; // Skip if rate is missing
        
        const currencyInfo = currencyNames[currency] || { name: currency, symbol: '' };
        
        const row = document.createElement('tr');
        row.classList.add('currency-item', 'hover:bg-secondary-50');
        row.innerHTML = `
            <td class="py-3 px-4 border-b">
                <div class="flex items-center">
                    <span class="fi fi-${currencyFlagMap[currency] || 'xx'} mr-2"></span>
                    <span class="text-secondary-800 font-medium">${currency}</span>
                    <span class="text-secondary-500 ml-2">${currencyInfo.symbol}</span>
                    <span class="ml-2 text-secondary-600 text-sm hidden md:inline">- ${currencyInfo.name}</span>
                </div>
            </td>
            <td class="py-3 px-4 border-b text-right font-medium">${rate.toFixed(4)}</td>
        `;
        window.ratesTableEl.appendChild(row);
    });
    
    console.log('Rates table updated successfully with', sortedCurrencies.length, 'currencies');
}

// Populate currency options in dropdowns
function populateCurrencyOptions() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
    // Save current selections
    const fromValue = fromCurrency.value || 'USD';
    const toValue = toCurrency.value || 'EUR';
    
    // Clear options
    fromCurrency.innerHTML = '';
    toCurrency.innerHTML = '';
    
    // Get sorted currencies
    const sortedCurrencies = Object.keys(rates).sort();
    
    // Populate options
    sortedCurrencies.forEach(currency => {
        const fromOption = document.createElement('option');
        fromOption.value = currency;
        fromOption.textContent = `${currency} - ${getCurrencyName(currency)}`;
        fromCurrency.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = currency;
        toOption.textContent = `${currency} - ${getCurrencyName(currency)}`;
        toCurrency.appendChild(toOption);
    });
    
    // Restore selections
    fromCurrency.value = fromValue;
    toCurrency.value = toValue;
    
    // Update flags
    updateCurrencyFlags();
}

// Perform conversion
function convertCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (!amount || isNaN(amount) || !rates) {
        showNotification('Please enter a valid amount and try again.', 'warning');
        return;
    }
    
    if (!rates[fromCurrency] || !rates[toCurrency]) {
        showNotification('Currency rates unavailable. Please try again later.', 'error');
        return;
    }
    
    // Calculate conversion
    const rate = rates[toCurrency] / rates[fromCurrency];
    const result = amount * rate;
    
    // Update result
    document.getElementById('result').value = result.toFixed(2);
    
    // Show notification
    showNotification(`Converted ${amount} ${fromCurrency} to ${result.toFixed(2)} ${toCurrency} successfully!`, 'success');
}

// Swap currencies
function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    // Update flags and perform conversion
    updateCurrencyFlags();
    convertCurrency();
}

// Easter egg activation
function activateEasterEgg() {
    // Create the Easter egg element
    const easterEgg = document.createElement('div');
    easterEgg.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70';
    easterEgg.innerHTML = `
        <div class="text-center p-8 rounded-xl transform transition-all duration-1000 scale-0 rotate-180">
            <h2 class="text-6xl font-bold gradient-text mb-4">Maks0101aps</h2>
            <p class="text-white text-xl mb-6">You've discovered the secret code!</p>
            <button class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(easterEgg);
    
    // Animate in
    setTimeout(() => {
        const container = easterEgg.querySelector('div');
        container.classList.remove('scale-0', 'rotate-180');
        container.classList.add('scale-100', 'rotate-0');
    }, 10);
    
    // Add close functionality
    easterEgg.querySelector('button').addEventListener('click', () => {
        const container = easterEgg.querySelector('div');
        container.classList.add('scale-0', 'rotate-180');
        setTimeout(() => {
            easterEgg.remove();
        }, 1000);
    });
}

// Console Easter egg
window.Maks0101aps = function() {
    console.log("%c👋 Hello! You've found the hidden function by Maks0101aps!", 
        "font-size: 20px; font-weight: bold; color: #3b82f6; text-shadow: 1px 1px 2px #9ca3af;");
    console.log("%cThanks for exploring my Currency Converter app!", 
        "font-size: 16px; color: #8b5cf6;");
    return "🎉 Congratulations on finding this Easter egg!";
};

// Save rates to local storage
function saveRatesToLocalStorage(ratesData, base) {
    try {
        const data = {
            rates: ratesData,
            base: base || 'USD',
            timestamp: new Date().getTime()
        };
        localStorage.setItem('currencyRates', JSON.stringify(data));
        console.log('Rates saved to local storage');
        return true;
    } catch (error) {
        console.error('Error saving rates to local storage:', error);
        return false;
    }
}

// Load rates from local storage
function loadRatesFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('currencyRates');
        if (!storedData) {
            console.log('No saved rates found in local storage');
            return false;
        }
        
        const data = JSON.parse(storedData);
        const now = new Date().getTime();
        const storedTime = data.timestamp;
        const hoursSinceUpdate = (now - storedTime) / (1000 * 60 * 60);
        
        // Check if the stored data is less than 24 hours old
        if (hoursSinceUpdate < 24) {
            rates = data.rates;
            exchangeRates = { ...data.rates }; // Make a copy
            baseRate = data.base;
            lastUpdated = new Date(storedTime).toLocaleString();
            console.log('Loaded rates from local storage (updated ' + hoursSinceUpdate.toFixed(1) + ' hours ago)');
            return true;
        } else {
            console.log('Stored rates are too old (' + hoursSinceUpdate.toFixed(1) + ' hours)');
            return false;
        }
    } catch (error) {
        console.error('Error loading rates from local storage:', error);
        return false;
    }
}

// Use fallback rates when all else fails
function useFallbackRates() {
    try {
        // Default fallback rates (major currencies only)
        const fallbackRates = {
            'USD': 1.0,
            'EUR': 0.93,
            'GBP': 0.79,
            'JPY': 151.12,
            'CAD': 1.36,
            'AUD': 1.52,
            'CHF': 0.91,
            'CNY': 7.24,
            'RUB': 91.50,
            'UAH': 39.65,
            'BYN': 3.26
        };
        
        rates = fallbackRates;
        exchangeRates = { ...fallbackRates }; // Make a copy
        baseRate = 'USD';
        lastUpdated = 'Using fallback rates';
        
        console.log('Using fallback rates as last resort');
        return true;
    } catch (error) {
        console.error('Error setting fallback rates:', error);
        return false;
    }
} 