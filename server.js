const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const multer = require('multer');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Create directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const HISTORY_FILE = path.join(dataDir, 'history.json');

// Session & Client states
let whatsappStatus = 'disconnected'; // 'disconnected', 'connecting', 'qr_ready', 'ready'
let currentQrCode = null;
let connectedUser = null;
let client = null;

// Campaign state
let activeCampaign = {
    id: null,
    name: '',
    status: 'idle', // 'idle', 'running', 'paused', 'stopped', 'completed'
    total: 0,
    sent: 0,
    failed: 0,
    contacts: [],
    messageTemplate: '',
    delays: { min: 5, max: 15 },
    logs: [],
    startedAt: null,
    completedAt: null
};
let campaignTimeout = null;

// Database helper functions
function getHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            fs.writeFileSync(HISTORY_FILE, '[]');
        }
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        console.error("Error reading history file:", e);
        return [];
    }
}

function saveHistory(data) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error writing history file:", e);
    }
}

// Multer upload config
const upload = multer({ dest: 'uploads/' });

// Initialize WhatsApp client
function initializeWhatsAppClient() {
    console.log('Initializing WhatsApp Client...');
    whatsappStatus = 'connecting';
    currentQrCode = null;
    connectedUser = null;
    io.emit('whatsapp-status', { status: whatsappStatus });

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        webVersionCache: {
            type: 'local'
        },
        puppeteer: {
            headless: true,
            executablePath: process.env.PREFIX ? `${process.env.PREFIX}/bin/chromium-browser` : undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--no-zygote',
                '--disable-renderer-backgrounding',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--password-store=basic',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-extensions',
                '--js-flags="--max-old-space-size=512"'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('QR Received');
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error generating QR data URL:', err);
                return;
            }
            currentQrCode = url;
            whatsappStatus = 'qr_ready';
            io.emit('whatsapp-status', { status: whatsappStatus, qr: currentQrCode });
        });
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Client Authenticated');
        whatsappStatus = 'connecting'; // wait for ready
        currentQrCode = null;
        io.emit('whatsapp-status', { status: whatsappStatus });
    });

    client.on('ready', async () => {
        console.log('WhatsApp Client is Ready');
        whatsappStatus = 'ready';
        currentQrCode = null;
        
        try {
            const info = client.info;
            connectedUser = {
                number: info.wid.user,
                pushname: info.pushname || 'Connected Device'
            };
        } catch (e) {
            connectedUser = {
                number: 'Unknown',
                pushname: 'Connected Device'
            };
        }

        io.emit('whatsapp-status', { status: whatsappStatus, user: connectedUser });
    });

    client.on('auth_failure', (msg) => {
        console.error('Authentication failure:', msg);
        whatsappStatus = 'disconnected';
        currentQrCode = null;
        connectedUser = null;
        io.emit('whatsapp-status', { status: whatsappStatus, error: msg });
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp Client Disconnected:', reason);
        whatsappStatus = 'disconnected';
        currentQrCode = null;
        connectedUser = null;
        io.emit('whatsapp-status', { status: whatsappStatus, reason });
        
        // Clean up client session
        try {
            client.destroy();
        } catch (e) {}
        
        // Re-initialize client
        setTimeout(initializeWhatsAppClient, 5000);
    });

    client.initialize().catch((err) => {
        console.error('Failed to initialize client:', err);
        whatsappStatus = 'disconnected';
        io.emit('whatsapp-status', { status: whatsappStatus, error: err.message });
    });
}

// Restart crashed or detached browser page session
async function restartWhatsAppClient() {
    console.log('Re-initializing crashed or detached WhatsApp Client...');
    whatsappStatus = 'connecting';
    connectedUser = null;
    currentQrCode = null;
    io.emit('whatsapp-status', { status: whatsappStatus });
    
    try {
        if (client) {
            await client.destroy();
        }
    } catch (e) {}
    
    initializeWhatsAppClient();
}

// Initial boot
initializeWhatsAppClient();

// WebSocket Events
io.on('connection', (socket) => {
    console.log('Browser Client Connected:', socket.id);
    
    // Send current states
    socket.emit('whatsapp-status', {
        status: whatsappStatus,
        qr: currentQrCode,
        user: connectedUser
    });
    
    socket.emit('campaign-update', activeCampaign);
    socket.emit('check-update', activeCheck);

    socket.on('disconnect', () => {
        console.log('Browser Client Disconnected:', socket.id);
    });
});

// Campaign engine
async function runCampaignNext() {
    if (activeCampaign.status !== 'running') return;

    const currentIndex = activeCampaign.sent + activeCampaign.failed;
    if (currentIndex >= activeCampaign.total) {
        finishCampaign('completed');
        return;
    }

    const contact = activeCampaign.contacts[currentIndex];
    const rawNumber = contact.number;
    const name = contact.name || 'Valued Customer';
    const company = contact.company || '';

    // Clean number: keep only digits
    let formattedNumber = rawNumber.replace(/\D/g, '');
    
    // Add WhatsApp domain if not present
    if (!formattedNumber.endsWith('@c.us')) {
        // Quick prefix check. If user typed e.g. 017... without country code, they might need a country code
        // For convenience, if it is 11 digits and starts with 0 (BD format), let's pre-append 88 (or leave it as is if they handle it)
        // We will assume the user provides country code. We'll do some basic cleanup.
        if (formattedNumber.length === 11 && formattedNumber.startsWith('0')) {
            formattedNumber = '88' + formattedNumber;
        }
        // If it starts with '+', it was removed by \D filter.
    }

    let text = activeCampaign.messageTemplate
        .replace(/{name}/gi, name)
        .replace(/{company}/gi, company);

    try {
        if (whatsappStatus !== 'ready') {
            throw new Error('WhatsApp Client is not connected');
        }

        const serializedNumber = formattedNumber + '@c.us';
        
        // Double check number registration to avoid sending to invalid numbers
        const numberId = await client.getNumberId(serializedNumber);
        if (numberId) {
            await client.sendMessage(numberId._serialized, text);
            activeCampaign.sent++;
            activeCampaign.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `Sent to ${name} (${formattedNumber})`,
                type: 'success'
            });
        } else {
            activeCampaign.failed++;
            activeCampaign.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `Failed: ${formattedNumber} is not on WhatsApp`,
                type: 'error'
            });
        }
    } catch (err) {
        const isBrowserCrash = err.message.includes('detached Frame') || 
                               err.message.includes('Session closed') || 
                               err.message.includes('target closed') || 
                               err.message.includes('Protocol error');
                               
        if (isBrowserCrash) {
            activeCampaign.status = 'paused';
            activeCampaign.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `CRITICAL ERROR: WhatsApp browser page detached or crashed. Campaign paused. Auto-healing client...`,
                type: 'error'
            });
            io.emit('campaign-update', activeCampaign);
            restartWhatsAppClient();
            return;
        }

        activeCampaign.failed++;
        activeCampaign.logs.push({
            time: new Date().toLocaleTimeString(),
            text: `Error sending to ${name} (${formattedNumber}): ${err.message}`,
            type: 'error'
        });
    }

    io.emit('campaign-update', activeCampaign);

    const nextIndex = activeCampaign.sent + activeCampaign.failed;
    if (nextIndex < activeCampaign.total && activeCampaign.status === 'running') {
        // Schedule next message with a random delay
        const minDelay = parseInt(activeCampaign.delays.min) || 5;
        const maxDelay = parseInt(activeCampaign.delays.max) || 15;
        const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        activeCampaign.logs.push({
            time: new Date().toLocaleTimeString(),
            text: `Waiting ${delaySeconds}s to avoid ban risk...`,
            type: 'info'
        });
        io.emit('campaign-update', activeCampaign);

        campaignTimeout = setTimeout(runCampaignNext, delaySeconds * 1000);
    } else if (nextIndex >= activeCampaign.total) {
        finishCampaign('completed');
    }
}

function finishCampaign(finalStatus) {
    activeCampaign.status = finalStatus;
    activeCampaign.completedAt = new Date().toISOString();
    activeCampaign.logs.push({
        time: new Date().toLocaleTimeString(),
        text: `Campaign ${finalStatus === 'completed' ? 'completed successfully!' : 'stopped.'}`,
        type: finalStatus === 'completed' ? 'success' : 'info'
    });

    // Save to local JSON history
    const history = getHistory();
    history.unshift({
        id: activeCampaign.id,
        name: activeCampaign.name,
        status: activeCampaign.status,
        total: activeCampaign.total,
        sent: activeCampaign.sent,
        failed: activeCampaign.failed,
        messageTemplate: activeCampaign.messageTemplate,
        startedAt: activeCampaign.startedAt,
        completedAt: activeCampaign.completedAt
    });
    saveHistory(history);

    io.emit('campaign-update', activeCampaign);
    console.log(`Campaign ${activeCampaign.name} finished with status: ${finalStatus}`);
}

// API Routes

// Test single message sending
app.post('/api/send-single', async (req, res) => {
    const { number, message } = req.body;

    if (whatsappStatus !== 'ready') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected. Please scan the QR code first.' });
    }

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Phone number and message are required.' });
    }

    let formattedNumber = number.replace(/\D/g, '');
    if (formattedNumber.length === 11 && formattedNumber.startsWith('0')) {
        formattedNumber = '88' + formattedNumber;
    }
    const serializedNumber = formattedNumber + '@c.us';

    try {
        const numberId = await client.getNumberId(serializedNumber);
        if (!numberId) {
            return res.status(404).json({ success: false, error: 'Phone number is not registered on WhatsApp.' });
        }

        await client.sendMessage(numberId._serialized, message);
        return res.json({ success: true, message: 'Test message sent successfully!' });
    } catch (err) {
        console.error('Error sending single message:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// CSV parser endpoint
app.post('/api/parse-csv', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const contacts = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            // Standardize columns (ignore case/spacing)
            const cleanedRow = {};
            for (const key in row) {
                cleanedRow[key.toLowerCase().trim()] = row[key];
            }

            // Find number and name keys
            const number = cleanedRow.number || cleanedRow.phone || cleanedRow.contact || cleanedRow.whatsapp;
            const name = cleanedRow.name || cleanedRow.customer || cleanedRow.user || 'Valued Customer';
            const company = cleanedRow.company || cleanedRow.organization || '';

            if (number) {
                contacts.push({ number: number.trim(), name: name.trim(), company: company.trim() });
            }
        })
        .on('end', () => {
            // Delete temporary upload file
            fs.unlinkSync(filePath);
            return res.json({ success: true, contactsCount: contacts.length, contacts });
        })
        .on('error', (err) => {
            console.error('CSV Parsing Error:', err);
            try {
                fs.unlinkSync(filePath);
            } catch (e) {}
            return res.status(500).json({ success: false, error: 'Failed to parse CSV file: ' + err.message });
        });
});

// Start campaign
app.post('/api/campaign/start', (req, res) => {
    if (whatsappStatus !== 'ready') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected.' });
    }

    if (activeCampaign.status === 'running') {
        return res.status(400).json({ success: false, error: 'A campaign is already running.' });
    }

    const { name, contacts, messageTemplate, minDelay, maxDelay } = req.body;

    if (!contacts || !contacts.length) {
        return res.status(400).json({ success: false, error: 'Contacts list is empty.' });
    }

    if (!messageTemplate) {
        return res.status(400).json({ success: false, error: 'Message template is required.' });
    }

    // Set up or resume campaign
    if (activeCampaign.status === 'paused' && activeCampaign.id) {
        // Resuming
        activeCampaign.status = 'running';
        activeCampaign.logs.push({
            time: new Date().toLocaleTimeString(),
            text: 'Campaign resumed.',
            type: 'info'
        });
    } else {
        // New campaign
        activeCampaign = {
            id: 'camp_' + Date.now(),
            name: name || `Campaign ${new Date().toLocaleDateString()}`,
            status: 'running',
            total: contacts.length,
            sent: 0,
            failed: 0,
            contacts: contacts,
            messageTemplate: messageTemplate,
            delays: { min: minDelay || 5, max: maxDelay || 15 },
            logs: [{ time: new Date().toLocaleTimeString(), text: 'Campaign started.', type: 'info' }],
            startedAt: new Date().toISOString(),
            completedAt: null
        };
    }

    io.emit('campaign-update', activeCampaign);
    res.json({ success: true, campaign: activeCampaign });

    // Begin execution loop
    runCampaignNext();
});

// Pause campaign
app.post('/api/campaign/pause', (req, res) => {
    if (activeCampaign.status !== 'running') {
        return res.status(400).json({ success: false, error: 'No active running campaign to pause.' });
    }

    if (campaignTimeout) {
        clearTimeout(campaignTimeout);
        campaignTimeout = null;
    }

    activeCampaign.status = 'paused';
    activeCampaign.logs.push({
        time: new Date().toLocaleTimeString(),
        text: 'Campaign paused by user.',
        type: 'warning'
    });

    io.emit('campaign-update', activeCampaign);
    res.json({ success: true, campaign: activeCampaign });
});

// Stop campaign
app.post('/api/campaign/stop', (req, res) => {
    if (activeCampaign.status !== 'running' && activeCampaign.status !== 'paused') {
        return res.status(400).json({ success: false, error: 'No campaign in progress.' });
    }

    if (campaignTimeout) {
        clearTimeout(campaignTimeout);
        campaignTimeout = null;
    }

    finishCampaign('stopped');
    res.json({ success: true, campaign: activeCampaign });
});

// Reset campaign builder
app.post('/api/campaign/reset', (req, res) => {
    if (activeCampaign.status === 'running') {
        return res.status(400).json({ success: false, error: 'Cannot reset a running campaign.' });
    }

    activeCampaign = {
        id: null,
        name: '',
        status: 'idle',
        total: 0,
        sent: 0,
        failed: 0,
        contacts: [],
        messageTemplate: '',
        delays: { min: 5, max: 15 },
        logs: [],
        startedAt: null,
        completedAt: null
    };

    io.emit('campaign-update', activeCampaign);
    res.json({ success: true, campaign: activeCampaign });
});

// Get campaign history
app.get('/api/history', (req, res) => {
    return res.json(getHistory());
});

// Clear history
app.delete('/api/history', (req, res) => {
    saveHistory([]);
    return res.json({ success: true, message: 'Campaign history cleared.' });
});

// Country validation parameters
const COUNTRY_RULES = {
    '880': { name: 'Bangladesh (+880)', prefix: '880', lengthNoPrefix: 10, totalLengthWithPrefix: 13 },
    '91': { name: 'India (+91)', prefix: '91', lengthNoPrefix: 10, totalLengthWithPrefix: 12 },
    '1': { name: 'USA/Canada (+1)', prefix: '1', lengthNoPrefix: 10, totalLengthWithPrefix: 11 },
    '44': { name: 'United Kingdom (+44)', prefix: '44', lengthNoPrefix: 10, totalLengthWithPrefix: 12 },
    '92': { name: 'Pakistan (+92)', prefix: '92', lengthNoPrefix: 10, totalLengthWithPrefix: 12 },
    '971': { name: 'UAE (+971)', prefix: '971', lengthNoPrefix: 9, totalLengthWithPrefix: 12 },
    '966': { name: 'Saudi Arabia (+966)', prefix: '966', lengthNoPrefix: 9, totalLengthWithPrefix: 12 }
};

// Formatting & validation pre-processor
function cleanAndValidateNumber(rawNumber, defaultCountryPrefix) {
    if (!rawNumber) return { success: false, reason: 'Empty row/value' };
    
    let cleaned = String(rawNumber).replace(/\D/g, '');
    if (!cleaned) {
        return { success: false, reason: 'No numeric digits found' };
    }

    if (defaultCountryPrefix && defaultCountryPrefix !== 'none') {
        const rule = COUNTRY_RULES[defaultCountryPrefix];
        if (rule) {
            // Strip leading zero BD/India style (e.g. 017XXXXXXXX -> 17XXXXXXXX)
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            // Prepend prefix if missing
            if (!cleaned.startsWith(rule.prefix)) {
                cleaned = rule.prefix + cleaned;
            }
            // Validate expected digit length
            if (cleaned.length !== rule.totalLengthWithPrefix) {
                return {
                    success: false,
                    formatted: cleaned,
                    reason: `Wrong length: expected ${rule.totalLengthWithPrefix} digits for ${rule.name}, got ${cleaned.length}`
                };
            }
        }
    } else {
        // Loose validation when no country prefix is selected (length must represent a country JID)
        if (cleaned.length < 9 || cleaned.length > 15) {
            return {
                success: false,
                formatted: cleaned,
                reason: `Wrong length: loose validation requires 9-15 digits, got ${cleaned.length}`
            };
        }
    }

    return { success: true, formatted: cleaned };
}

// Number Checker State
let activeCheck = {
    status: 'idle', // 'idle', 'running', 'stopped', 'completed'
    total: 0,
    checked: 0,
    contacts: [],
    valid: [],   // Array of { number, name, company }
    invalid: [], // Array of { number, name, company }
    invalidFormat: [], // Array of { number, name, company, reason }
    logs: [],
    startedAt: null,
    completedAt: null
};
let checkTimeout = null;

// Checking recursive scheduler
async function runCheckNext() {
    if (activeCheck.status !== 'running') return;

    if (activeCheck.checked >= activeCheck.total) {
        finishCheck('completed');
        return;
    }

    const contact = activeCheck.contacts[activeCheck.checked];
    const formattedNumber = contact.number;
    const name = contact.name || 'Valued Customer';
    const company = contact.company || '';

    try {
        if (whatsappStatus !== 'ready') {
            throw new Error('WhatsApp Client is not connected');
        }

        const serializedNumber = formattedNumber + '@c.us';
        const numberId = await client.getNumberId(serializedNumber);
        
        if (numberId) {
            activeCheck.valid.push({ number: formattedNumber, name, company });
            activeCheck.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `ACTIVE: ${formattedNumber} (${name}) is on WhatsApp`,
                type: 'success'
            });
        } else {
            activeCheck.invalid.push({ number: formattedNumber, name, company });
            activeCheck.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `INACTIVE: ${formattedNumber} (${name}) is not on WhatsApp`,
                type: 'error'
            });
        }
    } catch (err) {
        const isBrowserCrash = err.message.includes('detached Frame') || 
                               err.message.includes('Session closed') || 
                               err.message.includes('target closed') || 
                               err.message.includes('Protocol error');
                               
        if (isBrowserCrash) {
            activeCheck.status = 'stopped';
            activeCheck.logs.push({
                time: new Date().toLocaleTimeString(),
                text: `CRITICAL ERROR: WhatsApp browser page detached or crashed. Checker stopped. Auto-healing client...`,
                type: 'error'
            });
            io.emit('check-update', activeCheck);
            restartWhatsAppClient();
            return;
        }

        activeCheck.invalid.push({ number: formattedNumber, name, company });
        activeCheck.logs.push({
            time: new Date().toLocaleTimeString(),
            text: `Error checking ${formattedNumber}: ${err.message}`,
            type: 'error'
        });
    }

    activeCheck.checked++;
    io.emit('check-update', activeCheck);

    if (activeCheck.checked < activeCheck.total && activeCheck.status === 'running') {
        checkTimeout = setTimeout(runCheckNext, 1000);
    } else if (activeCheck.checked >= activeCheck.total) {
        finishCheck('completed');
    }
}

function finishCheck(finalStatus) {
    activeCheck.status = finalStatus;
    activeCheck.completedAt = Date.now();
    activeCheck.logs.push({
        time: new Date().toLocaleTimeString(),
        text: `Filtering finished with status: ${finalStatus === 'completed' ? 'Success' : 'Stopped'}. Valid: ${activeCheck.valid.length}, Inactive: ${activeCheck.invalid.length}, Invalid Format: ${activeCheck.invalidFormat.length}`,
        type: 'info'
    });
    io.emit('check-update', activeCheck);
}

// Multi-format upload parser route
app.post('/api/parse-any-file', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase();
    const contacts = [];

    try {
        if (extension === '.xlsx' || extension === '.xls') {
            // Parse Excel Sheets using cell matrix lookup
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (matrix.length > 0) {
                let numberColIdx = -1;
                let nameColIdx = -1;
                let companyColIdx = -1;

                const firstRow = matrix[0];
                
                // Match column indices by checking typical headers
                for (let i = 0; i < firstRow.length; i++) {
                    const val = String(firstRow[i]).toLowerCase().trim();
                    if (
                        val.includes('number') || val.includes('phone') || 
                        val.includes('contact') || val.includes('whatsapp') || 
                        val.includes('mobile') || val.includes('numbers') || 
                        val.includes('মোবাইল') || val.includes('নাম্বার')
                    ) {
                        numberColIdx = i;
                    } else if (
                        val.includes('name') || val.includes('customer') || 
                        val.includes('user') || val.includes('গ্রাহক') || 
                        val.includes('নাম')
                    ) {
                        nameColIdx = i;
                    } else if (
                        val.includes('company') || val.includes('organization')
                    ) {
                        companyColIdx = i;
                    }
                }

                // If the first row already contains a valid phone number (no headers sheet)
                // we set starting row to 0 instead of 1.
                let startRowIdx = 1;
                let firstRowHasNumber = false;
                for (let i = 0; i < firstRow.length; i++) {
                    const cleanedVal = String(firstRow[i]).replace(/\D/g, '');
                    if (cleanedVal.length >= 9 && cleanedVal.length <= 15) {
                        firstRowHasNumber = true;
                        break;
                    }
                }

                if (firstRowHasNumber) {
                    startRowIdx = 0;
                }

                // Scan rows
                for (let r = startRowIdx; r < matrix.length; r++) {
                    const row = matrix[r];
                    if (!row || row.length === 0) continue;

                    let number = '';
                    let name = 'Contact';
                    let company = '';

                    // Lookup by matched index or fallback search
                    if (numberColIdx !== -1 && row[numberColIdx] !== undefined) {
                        number = String(row[numberColIdx]).trim();
                    } else {
                        // Scan columns for the first cell containing a phone number length digit
                        for (let c = 0; c < row.length; c++) {
                            const cleanedVal = String(row[c]).replace(/\D/g, '');
                            if (cleanedVal.length >= 9 && cleanedVal.length <= 15) {
                                number = String(row[c]).trim();
                                break;
                            }
                        }
                    }

                    if (nameColIdx !== -1 && row[nameColIdx] !== undefined) {
                        name = String(row[nameColIdx]).trim() || 'Contact';
                    }
                    if (companyColIdx !== -1 && row[companyColIdx] !== undefined) {
                        company = String(row[companyColIdx]).trim();
                    }

                    if (number) {
                        contacts.push({ number, name, company });
                    }
                }
            }
        } 
        else if (extension === '.txt') {
            // Parse TXT File
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);

            lines.forEach(line => {
                if (!line.trim()) return;

                const parts = line.split(/[,\t;]/);
                const number = parts[0] ? parts[0].trim() : '';
                const name = parts[1] ? parts[1].trim() : 'Contact';
                const company = parts[2] ? parts[2].trim() : '';

                if (number) {
                    contacts.push({ number, name, company });
                }
            });
        } 
        else {
            // Fallback: Parse CSV via standard csvParser
            const parserContacts = [];
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    const cleanedRow = {};
                    for (const key in row) {
                        cleanedRow[key.toLowerCase().trim()] = row[key];
                    }
                    const number = cleanedRow.number || cleanedRow.phone || cleanedRow.contact || cleanedRow.whatsapp;
                    const name = cleanedRow.name || cleanedRow.customer || cleanedRow.user || 'Contact';
                    const company = cleanedRow.company || cleanedRow.organization || '';
                    if (number) {
                        parserContacts.push({
                            number: String(number).trim(),
                            name: String(name).trim(),
                            company: String(company).trim()
                        });
                    }
                })
                .on('end', () => {
                    fs.unlinkSync(filePath);
                    return res.json({ success: true, contactsCount: parserContacts.length, contacts: parserContacts });
                })
                .on('error', (err) => {
                    try { fs.unlinkSync(filePath); } catch (e) {}
                    return res.status(500).json({ success: false, error: err.message });
                });
            return;
        }

        // Cleanup temp upload files for Excel and TXT
        fs.unlinkSync(filePath);
        return res.json({ success: true, contactsCount: contacts.length, contacts });
    } catch (err) {
        console.error('File parsing error:', err);
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(500).json({ success: false, error: 'Failed to parse file: ' + err.message });
    }
});

// Start checks endpoint
app.post('/api/check-numbers/start', (req, res) => {
    if (whatsappStatus !== 'ready') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected.' });
    }

    if (activeCheck.status === 'running') {
        return res.status(400).json({ success: false, error: 'Checker is already running.' });
    }

    const { contacts, countryCode } = req.body;

    if (!contacts || !contacts.length) {
        return res.status(400).json({ success: false, error: 'Contacts list is empty.' });
    }

    const validFormatContacts = [];
    const invalidFormatContacts = [];
    const preLogs = [];

    contacts.forEach(contact => {
        const validation = cleanAndValidateNumber(contact.number, countryCode);
        if (validation.success) {
            validFormatContacts.push({
                number: validation.formatted,
                name: contact.name || 'Contact',
                company: contact.company || ''
            });
        } else {
            invalidFormatContacts.push({
                number: contact.number,
                name: contact.name || 'Contact',
                company: contact.company || '',
                reason: validation.reason
            });
            preLogs.push({
                time: new Date().toLocaleTimeString(),
                text: `FORMAT ERROR: ${contact.number} - ${validation.reason}`,
                type: 'warning'
            });
        }
    });

    activeCheck = {
        status: 'running',
        startedAt: Date.now(),
        completedAt: null,
        total: validFormatContacts.length,
        checked: 0,
        contacts: validFormatContacts,
        valid: [],
        invalid: [],
        invalidFormat: invalidFormatContacts,
        logs: [
            { time: new Date().toLocaleTimeString(), text: `Number Checker initialized. Query count: ${validFormatContacts.length}, Pre-flagged format errors: ${invalidFormatContacts.length}`, type: 'info' },
            ...preLogs
        ]
    };

    io.emit('check-update', activeCheck);
    res.json({ success: true, checkState: activeCheck });

    if (validFormatContacts.length > 0) {
        runCheckNext();
    } else {
        finishCheck('completed');
    }
});

// Stop checks endpoint
app.post('/api/check-numbers/stop', (req, res) => {
    if (activeCheck.status !== 'running') {
        return res.status(400).json({ success: false, error: 'No active checking process running.' });
    }

    if (checkTimeout) {
        clearTimeout(checkTimeout);
        checkTimeout = null;
    }

    finishCheck('stopped');
    res.json({ success: true, checkState: activeCheck });
});

// Reset checks endpoint
app.post('/api/check-numbers/reset', (req, res) => {
    if (activeCheck.status === 'running') {
        return res.status(400).json({ success: false, error: 'Cannot reset while checker is running.' });
    }

    if (checkTimeout) {
        clearTimeout(checkTimeout);
        checkTimeout = null;
    }

    activeCheck = {
        status: 'idle',
        total: 0,
        checked: 0,
        contacts: [],
        valid: [],
        invalid: [],
        invalidFormat: [],
        logs: [],
        startedAt: null,
        completedAt: null
    };

    io.emit('check-update', activeCheck);
    res.json({ success: true, checkState: activeCheck });
});

// Logout WhatsApp Session
app.post('/api/logout', async (req, res) => {
    try {
        if (client) {
            await client.logout();
            await client.destroy();
        }
        // Delete session auth folder completely
        const authPath = path.join(__dirname, '.wwebjs_auth');
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }
        res.json({ success: true, message: 'Logged out successfully.' });
        // Re-initialize a fresh client
        setTimeout(initializeWhatsAppClient, 2000);
    } catch (err) {
        console.error('Error logging out:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start Express server
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

