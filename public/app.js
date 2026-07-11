// Initialize Socket.io Connection
const socket = io();

// State variables
let loadedContacts = [];
let whatsappConnected = false;
let currentActiveTab = 'dashboard';
let renderedCampaignLogCount = 0;
let renderedCampaignId = null;
let contactGroups = [];
let selectedMediaFile = null;

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    currentTabTitle: document.getElementById('current-tab-title'),
    sidebarStatusDot: document.getElementById('sidebar-status-dot'),
    sidebarStatusText: document.getElementById('sidebar-status-text'),
    
    // Top Bar & Profile
    profileBadge: document.getElementById('profile-badge'),
    profileInitial: document.getElementById('profile-initial'),
    profileName: document.getElementById('profile-name'),
    profileNumber: document.getElementById('profile-number'),
    logoutButton: document.getElementById('logout-button'),
    
    // Dashboard Tab
    qrContainer: document.getElementById('qr-container'),
    qrStatusMsg: document.getElementById('qr-status-msg'),
    qrCodeImg: document.getElementById('qr-code-img'),
    connectedStateContainer: document.getElementById('connected-state-container'),
    cardProfileName: document.getElementById('card-profile-name'),
    cardProfileNumber: document.getElementById('card-profile-number'),
    cardLogoutBtn: document.getElementById('card-logout-btn'),
    
    statOutboxStatus: document.getElementById('stat-outbox-status'),
    statTotalSent: document.getElementById('stat-total-sent'),
    statPendingQueue: document.getElementById('stat-pending-queue'),
    
    testSendForm: document.getElementById('test-send-form'),
    testNumber: document.getElementById('test-number'),
    testMessage: document.getElementById('test-message'),
    testSendBtn: document.getElementById('test-send-btn'),
    
    // Bulk Sender Tab
    uploadTabBtns: document.querySelectorAll('.upload-tab-btn'),
    csvUploadSection: document.getElementById('csv-upload-section'),
    manualNumbersSection: document.getElementById('manual-numbers-section'),
    dropZone: document.getElementById('drop-zone'),
    csvFileInput: document.getElementById('csv-file-input'),
    csvStatusBox: document.getElementById('csv-status-box'),
    csvFileName: document.getElementById('csv-file-name'),
    csvContactsCount: document.getElementById('csv-contacts-count'),
    clearCsvBtn: document.getElementById('clear-csv-btn'),
    
    manualContactsInput: document.getElementById('manual-contacts-input'),
    parseManualBtn: document.getElementById('parse-manual-btn'),
    
    minDelay: document.getElementById('min-delay'),
    maxDelay: document.getElementById('max-delay'),
    
    tagBtns: document.querySelectorAll('.btn-tag'),
    messageTemplate: document.getElementById('message-template'),
    messagePreview: document.getElementById('message-preview'),
    
    campaignName: document.getElementById('campaign-name'),
    startCampaignBtn: document.getElementById('start-campaign-btn'),
    pauseCampaignBtn: document.getElementById('pause-campaign-btn'),
    stopCampaignBtn: document.getElementById('stop-campaign-btn'),
    resetCampaignBtn: document.getElementById('reset-campaign-btn'),
    
    activeCampaignProgress: document.getElementById('active-campaign-progress'),
    campaignStatusBadge: document.getElementById('campaign-status-badge'),
    displayCampaignName: document.getElementById('display-campaign-name'),
    progressProcessed: document.getElementById('progress-processed'),
    progressSent: document.getElementById('progress-sent'),
    progressFailed: document.getElementById('progress-failed'),
    campaignProgressBar: document.getElementById('campaign-progress-bar'),
    consoleLogs: document.getElementById('console-logs'),
    clearConsoleBtn: document.getElementById('clear-console-btn'),
    
    // Contacts Queue
    queueCard: document.getElementById('campaign-contacts-queue-card'),
    queueCountBadge: document.getElementById('queue-count-badge'),
    queueTableBody: document.getElementById('queue-table-body'),

    // Bulk Campaign Media Attachment Elements
    mediaFileInput: document.getElementById('campaign-media-input'),
    mediaDropZone: document.getElementById('campaign-media-dropzone'),
    mediaStatusBox: document.getElementById('campaign-media-status-box'),
    mediaFileName: document.getElementById('campaign-media-filename'),
    mediaFileSize: document.getElementById('campaign-media-filesize'),
    mediaPreview: document.getElementById('campaign-media-preview'),
    mediaIcon: document.getElementById('campaign-media-icon'),
    clearMediaBtn: document.getElementById('clear-media-btn'),

    // Group Selector (Bulk Sender Tab)
    groupSelect: document.getElementById('group-select'),
    deleteGroupBtn: document.getElementById('delete-group-btn'),

    // Contact Groups Tab Elements
    groupCreateName: document.getElementById('group-create-name'),
    groupFileInput: document.getElementById('group-file-input'),
    groupDropZone: document.getElementById('group-drop-zone'),
    groupFileName: document.getElementById('group-file-name'),
    groupFileCount: document.getElementById('group-file-count'),
    groupFileStatusBox: document.getElementById('group-file-status-box'),
    groupClearFileBtn: document.getElementById('group-clear-file-btn'),
    groupManualInput: document.getElementById('group-manual-input'),
    groupTabBtnFile: document.getElementById('group-tab-btn-file'),
    groupTabBtnManual: document.getElementById('group-tab-btn-manual'),
    groupUploadFileSection: document.getElementById('group-upload-file-section'),
    groupUploadManualSection: document.getElementById('group-upload-manual-section'),
    groupCreateSubmitBtn: document.getElementById('group-create-submit-btn'),
    groupsListContainer: document.getElementById('groups-list-container'),

    // History Tab
    historyTableBody: document.getElementById('history-table-body'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),

    // Safe Sleep elements
    safeSleepEnable: document.getElementById('safe-sleep-enable'),
    safeSleepBatchGroup: document.getElementById('safe-sleep-batch-group'),
    safeSleepBatchSize: document.getElementById('safe-sleep-batch-size'),
    safeSleepDelayGroup: document.getElementById('safe-sleep-delay-group'),
    safeSleepDelayMin: document.getElementById('safe-sleep-delay-min'),

    // Composer Layout elements
    composerLayoutContainer: document.getElementById('composer-layout-container'),
    composerRulesSidebar: document.getElementById('composer-rules-sidebar'),
    
    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Number Checker Tab Elements
    checkerUploadTabBtns: document.querySelectorAll('.checker-upload-tab-btn'),
    checkerCsvSection: document.getElementById('checker-csv-section'),
    checkerManualSection: document.getElementById('checker-manual-section'),
    checkerDropZone: document.getElementById('checker-drop-zone'),
    checkerCsvInput: document.getElementById('checker-csv-input'),
    checkerCsvStatus: document.getElementById('checker-csv-status'),
    checkerCsvFileName: document.getElementById('checker-csv-file-name'),
    checkerCsvCount: document.getElementById('checker-csv-count'),
    checkerClearCsv: document.getElementById('checker-clear-csv'),
    checkerManualInput: document.getElementById('checker-manual-input'),
    checkerParseManual: document.getElementById('checker-parse-manual'),
    checkerStartBtn: document.getElementById('checker-start-btn'),
    checkerStopBtn: document.getElementById('checker-stop-btn'),
    checkerResetBtn: document.getElementById('checker-reset-btn'),
    checkerStatusBadge: document.getElementById('checker-status-badge'),
    checkerProgressText: document.getElementById('checker-progress-text'),
    checkerProgressBar: document.getElementById('checker-progress-bar'),
    checkerLogs: document.getElementById('checker-logs'),
    checkerCopyValidBtn: document.getElementById('checker-copy-valid-btn'),
    checkerDownloadReportBtn: document.getElementById('checker-download-report-btn'),
    checkerValidCount: document.getElementById('checker-valid-count'),
    checkerInvalidCount: document.getElementById('checker-invalid-count'),
    checkerFormatCount: document.getElementById('checker-format-count'),
    checkerValidList: document.getElementById('checker-valid-list'),
    checkerInvalidList: document.getElementById('checker-invalid-list'),
    checkerFormatList: document.getElementById('checker-format-list'),
    checkerCountryCode: document.getElementById('checker-country-code'),
    checkerParseFileBtn: document.getElementById('checker-parse-file-btn'),
    checkerElapsedTime: document.getElementById('checker-elapsed-time'),
    checkerRemainingTime: document.getElementById('checker-remaining-time')
};

// Initial App Boot Setup
document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initCsvUploader();
    initCampaignMediaUploader();
    initManualContactsParser();
    initTemplateComposer();
    initCampaignControls();
    initTestSender();
    initHistoryTab();
    initNumberChecker();
    initContactGroups();
});

// Toast Alerts Notification Helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:inherit;cursor:pointer;margin-left:12px;font-weight:bold;">&times;</button>
    `;
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ----------------------------------------------------
// 1. NAVIGATION & TABS HANDLER
// ----------------------------------------------------
function initTabNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    currentActiveTab = tabId;
    
    // Update nav links active class
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Display targeted panels
    elements.tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
    
    // Update Header Text Title
    const titleMap = {
        'dashboard': 'System Dashboard',
        'bulksender': 'Bulk Marketing Campaign Builder',
        'history': 'Campaign Outreach Archives',
        'numberchecker': 'WhatsApp Number Checker & Filter',
        'contactgroups': 'Contact Group Database'
    };
    elements.currentTabTitle.textContent = titleMap[tabId] || 'WapDam';

    // If history is loaded, fetch records
    if (tabId === 'history') {
        loadCampaignHistory();
    }
}

// ----------------------------------------------------
// 2. WHATSAPP CONNECTION (SOCKET EVENTS)
// ----------------------------------------------------
socket.on('whatsapp-status', (data) => {
    console.log('WhatsApp connection status update:', data);
    const { status, qr, user, error, reason } = data;
    
    // Reset connection status visual
    elements.sidebarStatusDot.className = 'status-dot';
    
    switch (status) {
        case 'disconnected':
            whatsappConnected = false;
            elements.sidebarStatusDot.classList.add('disconnected');
            elements.sidebarStatusText.textContent = 'Disconnected';
            
            // Connect card update (show QR placeholders)
            elements.qrContainer.style.display = 'flex';
            elements.qrCodeImg.style.display = 'none';
            elements.qrStatusMsg.innerHTML = error ? `<span class="text-red">Error: ${error}</span>` : 'Awaiting initialization. Please stand by...';
            elements.connectedStateContainer.style.display = 'none';
            
            // Hide header badge
            elements.profileBadge.style.display = 'none';
            break;
            
        case 'connecting':
            whatsappConnected = false;
            elements.sidebarStatusDot.classList.add('connecting');
            elements.sidebarStatusText.textContent = 'Connecting...';
            
            elements.qrContainer.style.display = 'flex';
            elements.qrCodeImg.style.display = 'none';
            elements.qrStatusMsg.innerHTML = '<div class="spinner"></div><p style="margin-top:10px;">Connecting to WhatsApp...</p>';
            elements.connectedStateContainer.style.display = 'none';
            
            elements.profileBadge.style.display = 'none';
            break;
            
        case 'qr_ready':
            whatsappConnected = false;
            elements.sidebarStatusDot.classList.add('connecting');
            elements.sidebarStatusText.textContent = 'QR Code Ready';
            
            elements.qrContainer.style.display = 'flex';
            if (qr) {
                elements.qrCodeImg.src = qr;
                elements.qrCodeImg.style.display = 'block';
                elements.qrStatusMsg.style.display = 'none';
            }
            elements.connectedStateContainer.style.display = 'none';
            elements.profileBadge.style.display = 'none';
            break;
            
        case 'ready':
            whatsappConnected = true;
            elements.sidebarStatusDot.classList.add('ready');
            elements.sidebarStatusText.textContent = 'Connected';
            
            // Show Connected Panel inside Dashboard
            elements.qrContainer.style.display = 'none';
            elements.connectedStateContainer.style.display = 'flex';
            
            if (user) {
                elements.cardProfileName.textContent = user.pushname;
                elements.cardProfileNumber.textContent = '+' + user.number;
                
                // Show header badge
                elements.profileBadge.style.display = 'flex';
                elements.profileInitial.textContent = user.pushname.charAt(0).toUpperCase();
                elements.profileName.textContent = user.pushname;
                elements.profileNumber.textContent = '+' + user.number;
            }
            break;
    }
});

// Logout buttons click handler
async function logoutWhatsApp() {
    if (confirm('Are you sure you want to disconnect WhatsApp? This will reset the current session and require reskinning the QR Code.')) {
        try {
            const res = await fetch('/api/logout', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast('Successfully logged out.', 'success');
            } else {
                showToast(data.error || 'Failed to logout.', 'error');
            }
        } catch (e) {
            showToast('Error connecting to server to logout.', 'error');
        }
    }
}
elements.logoutButton.addEventListener('click', logoutWhatsApp);
elements.cardLogoutBtn.addEventListener('click', logoutWhatsApp);

// ----------------------------------------------------
// 3. TARGET CONTACTS & FILE UPLOAD
// ----------------------------------------------------
function initCsvUploader() {
    // Switch upload options layout
    elements.uploadTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.uploadTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const uploadType = btn.getAttribute('data-type');
            if (uploadType === 'csv') {
                elements.csvUploadSection.style.display = 'block';
                elements.manualNumbersSection.style.display = 'none';
            } else {
                elements.csvUploadSection.style.display = 'none';
                elements.manualNumbersSection.style.display = 'block';
            }
        });
    });

    // Dropzone click triggers hidden file input
    elements.dropZone.addEventListener('click', () => elements.csvFileInput.click());
    
    // File selection
    elements.csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleCsvFile(e.target.files[0]);
        }
    });

    // Drag-over styling hooks
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    });

    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('drag-over');
    });

    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            elements.csvFileInput.files = e.dataTransfer.files;
            handleCsvFile(e.dataTransfer.files[0]);
        }
    });

    // Clear CSV button
    elements.clearCsvBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetCsvUploadState();
    });
}

function initCampaignMediaUploader() {
    if (!elements.mediaDropZone || !elements.mediaFileInput) return;

    // Trigger file selection on dropzone click
    elements.mediaDropZone.addEventListener('click', () => elements.mediaFileInput.click());

    // Input changes
    elements.mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleCampaignMediaSelect(e.target.files[0]);
        }
    });

    // Drag events
    elements.mediaDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.mediaDropZone.classList.add('drag-over');
    });

    elements.mediaDropZone.addEventListener('dragleave', () => {
        elements.mediaDropZone.classList.remove('drag-over');
    });

    elements.mediaDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.mediaDropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            elements.mediaFileInput.files = e.dataTransfer.files;
            handleCampaignMediaSelect(e.dataTransfer.files[0]);
        }
    });

    // Detach button
    elements.clearMediaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetCampaignMediaState();
    });
}

function handleCampaignMediaSelect(file) {
    // WhatsApp file size limit is 16MB
    const maxSize = 16 * 1024 * 1024; 
    if (file.size > maxSize) {
        showToast('File is too large! Maximum limit is 16MB.', 'error');
        resetCampaignMediaState();
        return;
    }

    selectedMediaFile = file;
    elements.mediaDropZone.style.display = 'none';
    elements.mediaStatusBox.style.display = 'flex';
    elements.mediaFileName.textContent = file.name;
    
    // Format file size
    let sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    if (file.size > 1024 * 1024) {
        sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }
    elements.mediaFileSize.textContent = sizeStr;

    // Create thumbnail if image
    if (file.type.startsWith('image/')) {
        elements.mediaPreview.src = URL.createObjectURL(file);
        elements.mediaPreview.style.display = 'block';
        elements.mediaIcon.style.display = 'none';
    } else {
        elements.mediaPreview.src = '';
        elements.mediaPreview.style.display = 'none';
        elements.mediaIcon.style.display = 'block';
    }
}

function resetCampaignMediaState() {
    selectedMediaFile = null;
    elements.mediaFileInput.value = '';
    elements.mediaDropZone.style.display = 'block';
    elements.mediaStatusBox.style.display = 'none';
    elements.mediaPreview.src = '';
    elements.mediaPreview.style.display = 'none';
    elements.mediaIcon.style.display = 'block';
}

async function handleCsvFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        elements.dropZone.style.opacity = '0.5';
        const res = await fetch('/api/parse-any-file', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        elements.dropZone.style.opacity = '1';
        
        if (data.success) {
            loadedContacts = data.contacts;
            
            // Update CSV display state
            elements.dropZone.style.display = 'none';
            elements.csvStatusBox.style.display = 'flex';
            elements.csvFileName.textContent = file.name;
            elements.csvContactsCount.textContent = `${data.contactsCount} contacts imported successfully!`;
            
            showToast(`${data.contactsCount} contacts loaded from file.`, 'success');
            updateStatsUI();
        } else {
            showToast(data.error || 'Failed to parse file.', 'error');
            resetCsvUploadState();
        }
    } catch (err) {
        elements.dropZone.style.opacity = '1';
        showToast('Error uploading file: ' + err.message, 'error');
        resetCsvUploadState();
    }
}

function resetCsvUploadState() {
    loadedContacts = [];
    elements.csvFileInput.value = '';
    elements.dropZone.style.display = 'flex';
    elements.csvStatusBox.style.display = 'none';
    elements.csvFileName.textContent = '';
    elements.csvContactsCount.textContent = '';
    if (elements.groupSelect) elements.groupSelect.value = '';
    if (elements.deleteGroupBtn) elements.deleteGroupBtn.style.display = 'none';
    updateStatsUI();
}

function initManualContactsParser() {
    elements.parseManualBtn.addEventListener('click', () => {
        const text = elements.manualContactsInput.value.trim();
        if (!text) {
            showToast('Please paste contacts before parsing.', 'warning');
            return;
        }

        const lines = text.split('\n');
        const parsed = [];
        
        lines.forEach((line, index) => {
            const parts = line.split(',');
            const number = parts[0] ? parts[0].trim() : '';
            const name = parts[1] ? parts[1].trim() : 'Valued Customer';
            const company = parts[2] ? parts[2].trim() : '';

            if (number) {
                parsed.push({ number, name, company });
            }
        });

        if (parsed.length > 0) {
            loadedContacts = parsed;
            showToast(`Loaded ${parsed.length} contacts manually.`, 'success');
            updateStatsUI();
        } else {
            showToast('Could not find any numbers. Ensure format matches: Number,Name,Company', 'error');
        }
    });
}

function updateStatsUI() {
    elements.statPendingQueue.textContent = loadedContacts.length;
    renderContactsQueue();
}

async function loadContactGroups() {
    try {
        const res = await fetch('/api/contact-groups');
        const data = await res.json();
        if (data.success) {
            contactGroups = data.groups;
            
            // Populate select dropdown options in Bulk Sender
            if (elements.groupSelect) {
                elements.groupSelect.innerHTML = '<option value="">-- Select Saved Group --</option>';
                
                contactGroups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = `${group.name} (${group.contactsCount} contacts)`;
                    elements.groupSelect.appendChild(option);
                });
            }
            
            // Render the groups list grid in the dedicated tab
            renderSavedGroupsList();
        }
    } catch (err) {
        console.error('Error fetching contact groups:', err);
    }
}

function renderSavedGroupsList() {
    if (!elements.groupsListContainer) return;
    
    if (contactGroups.length === 0) {
        elements.groupsListContainer.innerHTML = `
            <div class="empty-groups-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>No saved groups found. Create one using the form on the left.</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    contactGroups.forEach(group => {
        const dateStr = new Date(group.createdAt).toLocaleDateString();
        html += `
            <div class="group-card-item">
                <div class="group-card-info">
                    <span class="group-card-title">${group.name}</span>
                    <div class="group-card-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 2px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            ${group.contactsCount} contacts
                        </span>
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${dateStr}
                        </span>
                    </div>
                </div>
                <div class="group-card-actions">
                    <button class="btn btn-emerald btn-sm btn-icon-label send-campaign-btn" data-id="${group.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Send Campaign
                    </button>
                    <button class="btn btn-secondary btn-sm delete-card-group-btn" data-id="${group.id}" style="border: 1px solid var(--accent-red); color: var(--accent-red); background: transparent; padding: 6px 10px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; vertical-align: middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    });
    elements.groupsListContainer.innerHTML = html;
    
    // Add event listeners to card actions
    elements.groupsListContainer.querySelectorAll('.send-campaign-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const groupId = btn.getAttribute('data-id');
            const group = contactGroups.find(g => g.id === groupId);
            if (group) {
                // Set Bulk Sender targets list state
                loadedContacts = group.contacts;
                
                // Set Bulk Sender tab dropdown selection state
                if (elements.groupSelect) {
                    elements.groupSelect.value = groupId;
                }
                
                // Show file/group info on Bulk Sender Tab
                elements.csvFileInput.value = '';
                elements.dropZone.style.display = 'none';
                elements.csvStatusBox.style.display = 'flex';
                elements.csvFileName.textContent = `Group: ${group.name}`;
                elements.csvContactsCount.textContent = `${group.contactsCount} contacts loaded from saved group.`;
                elements.deleteGroupBtn.style.display = 'inline-flex';
                
                showToast(`Group "${group.name}" loaded into campaign builder.`, 'success');
                updateStatsUI();
                
                // Switch tab to Bulk Sender
                switchTab('bulksender');
            }
        });
    });
    
    elements.groupsListContainer.querySelectorAll('.delete-card-group-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const groupId = btn.getAttribute('data-id');
            const group = contactGroups.find(g => g.id === groupId);
            if (group) {
                if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                    try {
                        const res = await fetch(`/api/contact-groups/${groupId}`, {
                            method: 'DELETE'
                        });
                        const data = await res.json();
                        if (data.success) {
                            showToast(`Group "${group.name}" deleted.`, 'info');
                            
                            // If this group was active in bulk sender, reset it
                            if (elements.groupSelect && elements.groupSelect.value === groupId) {
                                resetCsvUploadState();
                            }
                            
                            await loadContactGroups();
                        } else {
                            showToast(data.error || 'Failed to delete group.', 'error');
                        }
                    } catch (err) {
                        showToast('Error deleting group: ' + err.message, 'error');
                    }
                }
            }
        });
    });
}

function initContactGroups() {
    loadContactGroups();

    // Dropdown change listener (Bulk Sender Selector)
    elements.groupSelect.addEventListener('change', (e) => {
        const groupId = e.target.value;
        if (!groupId) {
            resetCsvUploadState();
            return;
        }

        const selectedGroup = contactGroups.find(g => g.id === groupId);
        if (selectedGroup) {
            loadedContacts = selectedGroup.contacts;
            
            // Sync with CSV dropzone metadata UI
            elements.csvFileInput.value = '';
            elements.dropZone.style.display = 'none';
            elements.csvStatusBox.style.display = 'flex';
            elements.csvFileName.textContent = `Group: ${selectedGroup.name}`;
            elements.csvContactsCount.textContent = `${selectedGroup.contactsCount} contacts loaded from saved group.`;
            
            elements.deleteGroupBtn.style.display = 'inline-flex';
            
            showToast(`Loaded group "${selectedGroup.name}" containing ${selectedGroup.contactsCount} contacts.`, 'success');
            updateStatsUI();
        }
    });

    // Toggle Create Group upload method tabs
    let currentGroupUploadType = 'file';
    
    elements.groupTabBtnFile.addEventListener('click', () => {
        elements.groupTabBtnFile.classList.add('active');
        elements.groupTabBtnManual.classList.remove('active');
        elements.groupUploadFileSection.style.display = 'block';
        elements.groupUploadManualSection.style.display = 'none';
        currentGroupUploadType = 'file';
    });
    
    elements.groupTabBtnManual.addEventListener('click', () => {
        elements.groupTabBtnManual.classList.add('active');
        elements.groupTabBtnFile.classList.remove('active');
        elements.groupUploadManualSection.style.display = 'block';
        elements.groupUploadFileSection.style.display = 'none';
        currentGroupUploadType = 'manual';
    });

    // Dropzone click triggers hidden file input
    elements.groupDropZone.addEventListener('click', () => elements.groupFileInput.click());
    
    let groupFileToUpload = null;
    
    // File selection
    elements.groupFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleGroupFileSelect(e.target.files[0]);
        }
    });

    elements.groupDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.groupDropZone.classList.add('drag-over');
    });

    elements.groupDropZone.addEventListener('dragleave', () => {
        elements.groupDropZone.classList.remove('drag-over');
    });

    elements.groupDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.groupDropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            elements.groupFileInput.files = e.dataTransfer.files;
            handleGroupFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    elements.groupClearFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetGroupFileSelectState();
    });
    
    function handleGroupFileSelect(file) {
        groupFileToUpload = file;
        elements.groupDropZone.style.display = 'none';
        elements.groupFileStatusBox.style.display = 'flex';
        elements.groupFileName.textContent = file.name;
        elements.groupFileCount.textContent = 'Ready to parse & save';
    }
    
    function resetGroupFileSelectState() {
        groupFileToUpload = null;
        elements.groupFileInput.value = '';
        elements.groupDropZone.style.display = 'block';
        elements.groupFileStatusBox.style.display = 'none';
    }

    // Create group submit button click handler
    elements.groupCreateSubmitBtn.addEventListener('click', async () => {
        const groupName = elements.groupCreateName.value.trim();
        if (!groupName) {
            showToast('Please enter a group name.', 'warning');
            return;
        }
        
        let parsedContacts = [];
        
        if (currentGroupUploadType === 'file') {
            if (!groupFileToUpload) {
                showToast('Please select or upload a contacts file.', 'warning');
                return;
            }
            
            // Upload to server to parse
            const formData = new FormData();
            formData.append('file', groupFileToUpload);
            
            try {
                elements.groupCreateSubmitBtn.disabled = true;
                elements.groupCreateSubmitBtn.textContent = 'Parsing File...';
                
                const parseRes = await fetch('/api/parse-any-file', {
                    method: 'POST',
                    body: formData
                });
                const parseData = await parseRes.json();
                
                if (!parseData.success) {
                    throw new Error(parseData.error || 'Failed to parse file.');
                }
                
                parsedContacts = parseData.contacts;
            } catch (err) {
                elements.groupCreateSubmitBtn.disabled = false;
                elements.groupCreateSubmitBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Create Contact Group
                `;
                showToast(err.message, 'error');
                return;
            }
        } else {
            // Manual paste parsing
            const manualText = elements.groupManualInput.value.trim();
            if (!manualText) {
                showToast('Please paste contacts.', 'warning');
                return;
            }
            
            const lines = manualText.split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = line.split(',');
                const number = parts[0] ? parts[0].trim() : '';
                const name = parts[1] ? parts[1].trim() : 'Valued Customer';
                const company = parts[2] ? parts[2].trim() : '';
                
                if (number) {
                    parsedContacts.push({ number, name, company });
                }
            });
            
            if (parsedContacts.length === 0) {
                showToast('Could not find any numbers. Ensure format matches: Number,Name,Company', 'warning');
                return;
            }
        }
        
        // Save to Database
        try {
            elements.groupCreateSubmitBtn.disabled = true;
            elements.groupCreateSubmitBtn.textContent = 'Saving Group...';
            
            const saveRes = await fetch('/api/contact-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName, contacts: parsedContacts })
            });
            const saveData = await saveRes.json();
            
            elements.groupCreateSubmitBtn.disabled = false;
            elements.groupCreateSubmitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Create Contact Group
            `;
            
            if (saveData.success) {
                showToast(`Group "${groupName}" containing ${parsedContacts.length} contacts saved!`, 'success');
                
                // Clear fields
                elements.groupCreateName.value = '';
                elements.groupManualInput.value = '';
                resetGroupFileSelectState();
                
                // Refresh list and dropdowns
                await loadContactGroups();
            } else {
                showToast(saveData.error || 'Failed to save group.', 'error');
            }
        } catch (err) {
            elements.groupCreateSubmitBtn.disabled = false;
            elements.groupCreateSubmitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Create Contact Group
            `;
            showToast('Error saving group: ' + err.message, 'error');
        }
    });

    // Delete group dropdown button listener
    elements.deleteGroupBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const groupId = elements.groupSelect.value;
        if (!groupId) return;

        const selectedGroup = contactGroups.find(g => g.id === groupId);
        const name = selectedGroup ? selectedGroup.name : 'this group';

        if (confirm(`Are you sure you want to delete the group "${name}"?`)) {
            try {
                const res = await fetch(`/api/contact-groups/${groupId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.success) {
                    showToast(`Group "${name}" deleted.`, 'info');
                    resetCsvUploadState();
                    loadContactGroups();
                } else {
                    showToast(data.error || 'Failed to delete group.', 'error');
                }
            } catch (err) {
                showToast('Error deleting group: ' + err.message, 'error');
            }
        }
    });
}

function renderContactsQueue() {
    if (!elements.queueTableBody || !elements.queueCard || !elements.queueCountBadge) return;

    if (loadedContacts.length === 0) {
        elements.queueTableBody.innerHTML = '';
        elements.queueCard.style.display = 'none';
        elements.queueCountBadge.textContent = '0 Loaded';
        return;
    }

    elements.queueCountBadge.textContent = `${loadedContacts.length} Loaded`;
    elements.queueCard.style.display = 'block';

    let html = '';
    loadedContacts.forEach((contact, index) => {
        const num = contact.number;
        const name = contact.name || 'Valued Customer';
        const company = contact.company || '';
        const status = contact.status || 'pending';
        
        html += `
            <tr id="q-row-${index}" class="${status === 'typing' || status === 'sending' ? 'active-row' : ''}">
                <td style="padding: 10px; color: var(--text-secondary); font-weight: 500;">${index + 1}</td>
                <td style="padding: 10px; font-weight: 500; font-family: monospace;">${num}</td>
                <td style="padding: 10px;">${name}</td>
                <td style="padding: 10px; color: var(--text-secondary);">${company}</td>
                <td style="padding: 10px; text-align: center;">
                    <span class="q-status ${status}">${status}</span>
                </td>
            </tr>
        `;
    });
    elements.queueTableBody.innerHTML = html;
}

// ----------------------------------------------------
// 4. TEMPLATE WRITER & PREVIEW COMPOSER
// ----------------------------------------------------
let activeTextarea = null;
let variantCount = 0;

function initTemplateComposer() {
    activeTextarea = elements.messageTemplate;
    
    // Set active text area on focus
    elements.messageTemplate.addEventListener('focus', () => {
        activeTextarea = elements.messageTemplate;
    });

    // Dynamic preview drawing
    elements.messageTemplate.addEventListener('input', updateMessagePreview);
    
    // Tag buttons clicked
    elements.tagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            if (activeTextarea) {
                insertTextAtCursor(activeTextarea, tag);
                updateMessagePreview();
            }
        });
    });

    // Toggle Multi-Variant Mode
    const antiBanToggle = document.getElementById('anti-ban-toggle');
    const singleTemplateGroup = document.getElementById('single-template-group');
    const multiVariantGroup = document.getElementById('multi-variant-group');
    const addVariantBtn = document.getElementById('add-variant-btn');

    antiBanToggle.addEventListener('change', () => {
        if (antiBanToggle.checked) {
            singleTemplateGroup.style.display = 'none';
            multiVariantGroup.style.display = 'block';
            
            // Turn on split layout & rules sidebar
            if (elements.composerRulesSidebar && elements.composerLayoutContainer) {
                elements.composerRulesSidebar.style.display = 'block';
                elements.composerLayoutContainer.style.gridTemplateColumns = '1.3fr 1fr';
            }
            
            const container = document.getElementById('variants-container');
            if (container.children.length === 0) {
                // Pre-populate with 3 variants
                addVariantBox("Hello {Name}, hope you are doing well.");
                addVariantBox("Hi {Name}, hope your company {Company} is doing great.");
                addVariantBox("Hey {Name}! Quick question about {Company}...");
            }
            
            // Set active text area to the first variant
            const firstVariant = container.querySelector('.variant-textarea');
            if (firstVariant) {
                firstVariant.focus();
                activeTextarea = firstVariant;
            }
        } else {
            singleTemplateGroup.style.display = 'block';
            multiVariantGroup.style.display = 'none';
            activeTextarea = elements.messageTemplate;
            
            // Turn off split layout & hide rules sidebar
            if (elements.composerRulesSidebar && elements.composerLayoutContainer) {
                elements.composerRulesSidebar.style.display = 'none';
                elements.composerLayoutContainer.style.gridTemplateColumns = '1fr';
            }
        }
        updateMessagePreview();
    });

    // Add variant button click
    addVariantBtn.addEventListener('click', () => {
        addVariantBox();
    });
}

function addVariantBox(initialValue = '') {
    variantCount++;
    const container = document.getElementById('variants-container');
    const box = document.createElement('div');
    box.className = 'variant-box';
    box.id = `variant-box-${variantCount}`;
    
    box.innerHTML = `
        <div class="variant-header">
            <span class="variant-title">Variant ${container.children.length + 1}</span>
            <button type="button" class="remove-variant-btn" data-id="${variantCount}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px; margin-right: 4px;">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
            </button>
        </div>
        <textarea class="variant-textarea" rows="4" placeholder="Variant ${container.children.length + 1} template text...">${initialValue}</textarea>
    `;
    
    container.appendChild(box);
    
    const textarea = box.querySelector('.variant-textarea');
    
    // Setup listeners
    textarea.addEventListener('input', updateMessagePreview);
    textarea.addEventListener('focus', () => {
        activeTextarea = textarea;
    });
    
    const deleteBtn = box.querySelector('.remove-variant-btn');
    deleteBtn.addEventListener('click', () => {
        box.remove();
        reindexVariants();
        updateMessagePreview();
    });
    
    reindexVariants();
}

function reindexVariants() {
    const container = document.getElementById('variants-container');
    const boxes = container.querySelectorAll('.variant-box');
    
    boxes.forEach((box, index) => {
        const title = box.querySelector('.variant-title');
        title.textContent = `Variant ${index + 1}`;
        
        const textarea = box.querySelector('.variant-textarea');
        textarea.placeholder = `Variant ${index + 1} template text...`;
        
        const deleteBtn = box.querySelector('.remove-variant-btn');
        // Hide delete option if there are only 3 variants left
        if (boxes.length <= 3) {
            deleteBtn.style.display = 'none';
        } else {
            deleteBtn.style.display = 'flex';
        }
    });
}

function updateMessagePreview() {
    let template = '';
    const antiBanToggle = document.getElementById('anti-ban-toggle');
    
    if (antiBanToggle && antiBanToggle.checked) {
        const variantTextareas = document.querySelectorAll('.variant-textarea');
        // Retrieve value of currently focused variant textarea, otherwise fallback to first
        let targetTextarea = activeTextarea;
        if (!targetTextarea || !targetTextarea.classList.contains('variant-textarea')) {
            targetTextarea = variantTextareas[0];
        }
        template = targetTextarea ? targetTextarea.value : '';
    } else {
        template = elements.messageTemplate.value;
    }

    if (!template) {
        elements.messagePreview.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">Awaiting message input template...</span>';
        return;
    }
    
    // Example tags replace logic for preview
    const samplePreview = template
        .replace(/{name}/gi, '<strong class="text-green">Karim Rahman</strong>')
        .replace(/{company}/gi, '<strong class="text-green">ByteCode BD</strong>');
        
    elements.messagePreview.innerHTML = samplePreview;
}

function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    
    textarea.value = currentVal.substring(0, start) + text + currentVal.substring(end);
    textarea.focus();
    
    // Re-position selection cursor after inserted tag
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

// ----------------------------------------------------
// 5. TEST SINGLE MESSAGE SENDER
// ----------------------------------------------------
function initTestSender() {
    elements.testSendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!whatsappConnected) {
            showToast('Cannot send test message. WhatsApp is disconnected.', 'error');
            return;
        }

        const number = elements.testNumber.value.trim();
        const message = elements.testMessage.value.trim();

        elements.testSendBtn.disabled = true;
        elements.testSendBtn.querySelector('span').textContent = 'Sending...';

        try {
            const res = await fetch('/api/send-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, message })
            });
            const data = await res.json();

            if (data.success) {
                showToast('Test message sent successfully!', 'success');
                elements.testMessage.value = '';
            } else {
                showToast(data.error || 'Failed to send test message.', 'error');
            }
        } catch (err) {
            showToast('Network error sending message: ' + err.message, 'error');
        } finally {
            elements.testSendBtn.disabled = false;
            elements.testSendBtn.querySelector('span').textContent = 'Send Test';
        }
    });
}

// ----------------------------------------------------
// 6. CAMPAIGN RUNNER AND STATUS TRACKER
// ----------------------------------------------------
function initCampaignControls() {
    // Start Campaign
    elements.startCampaignBtn.addEventListener('click', async () => {
        if (!whatsappConnected) {
            showToast('WhatsApp is not connected. Connect first.', 'error');
            return;
        }

        if (loadedContacts.length === 0) {
            showToast('Please load target contacts list first.', 'warning');
            return;
        }

        let template;
        const antiBanToggle = document.getElementById('anti-ban-toggle');
        if (antiBanToggle && antiBanToggle.checked) {
            const variantTextareas = document.querySelectorAll('.variant-textarea');
            const templates = Array.from(variantTextareas)
                .map(ta => ta.value.trim())
                .filter(val => val !== '');
            
            if (templates.length < 3) {
                showToast('Anti-Ban requires at least 3 non-empty message variants.', 'warning');
                return;
            }
            template = templates;
        } else {
            template = elements.messageTemplate.value.trim();
            if (!template) {
                showToast('Message template is empty.', 'warning');
                return;
            }
        }

        const minVal = parseInt(elements.minDelay.value) || 5;
        const maxVal = parseInt(elements.maxDelay.value) || 15;
        if (minVal > maxVal) {
            showToast('Min delay cannot be larger than Max delay.', 'warning');
            return;
        }

        let mediaPayload = null;

        try {
            elements.startCampaignBtn.disabled = true;
            
            // If user attached a media file, upload it first
            if (selectedMediaFile) {
                elements.startCampaignBtn.textContent = 'Uploading Media...';
                const formData = new FormData();
                formData.append('file', selectedMediaFile);

                const uploadRes = await fetch('/api/upload-media', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (!uploadData.success) {
                    throw new Error(uploadData.error || 'Failed to upload media attachment.');
                }
                mediaPayload = uploadData.media;
            }

            elements.startCampaignBtn.textContent = 'Starting...';

            const payload = {
                name: elements.campaignName.value.trim(),
                contacts: loadedContacts,
                messageTemplate: template,
                minDelay: minVal,
                maxDelay: maxVal,
                media: mediaPayload,
                safeSleep: {
                    enabled: elements.safeSleepEnable.checked,
                    batchSize: parseInt(elements.safeSleepBatchSize.value) || 15,
                    delayMin: parseInt(elements.safeSleepDelayMin.value) || 3
                }
            };

            const res = await fetch('/api/campaign/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            // Restore button text
            elements.startCampaignBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg-icon">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Campaign
            `;

            if (data.success) {
                showToast('Campaign started successfully.', 'success');
            } else {
                showToast(data.error || 'Failed to start campaign.', 'error');
                elements.startCampaignBtn.disabled = false;
            }
        } catch (e) {
            elements.startCampaignBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg-icon">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Campaign
            `;
            showToast('Error starting campaign: ' + e.message, 'error');
            elements.startCampaignBtn.disabled = false;
        }
    });

    // Pause Campaign
    elements.pauseCampaignBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/campaign/pause', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast('Campaign paused.', 'info');
            }
        } catch (e) {
            showToast('Error pausing campaign: ' + e.message, 'error');
        }
    });

    // Stop Campaign
    elements.stopCampaignBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to stop this campaign? It cannot be resumed.')) {
            try {
                const res = await fetch('/api/campaign/stop', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showToast('Campaign stopped.', 'info');
                }
            } catch (e) {
                showToast('Error stopping campaign: ' + e.message, 'error');
            }
        }
    });

    // Reset Campaign
    elements.resetCampaignBtn.addEventListener('click', async () => {
        if (confirm('Clear form and reset campaign settings?')) {
            try {
                const res = await fetch('/api/campaign/reset', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    elements.campaignName.value = '';
                    elements.messageTemplate.value = '';
                    elements.manualContactsInput.value = '';
                    elements.minDelay.value = '5';
                    elements.maxDelay.value = '15';
                    updateMessagePreview();
                    resetCsvUploadState();
                    resetCampaignMediaState();
                    if (elements.safeSleepEnable) {
                        elements.safeSleepEnable.checked = false;
                        elements.safeSleepEnable.dispatchEvent(new Event('change'));
                    }
                    showToast('Form reset.', 'info');
                }
            } catch (e) {
                showToast('Error resetting: ' + e.message, 'error');
            }
        }
    });

    // Clear Terminal Logs console
    elements.clearConsoleBtn.addEventListener('click', () => {
        elements.consoleLogs.innerHTML = '<div class="log-row info">Console cleared. Logs will continue on next message.</div>';
    });

    // Toggle Safe Sleep input groups opacity dynamically
    if (elements.safeSleepEnable) {
        elements.safeSleepEnable.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            if (enabled) {
                elements.safeSleepBatchGroup.style.opacity = '1';
                elements.safeSleepBatchGroup.style.pointerEvents = 'auto';
                elements.safeSleepDelayGroup.style.opacity = '1';
                elements.safeSleepDelayGroup.style.pointerEvents = 'auto';
            } else {
                elements.safeSleepBatchGroup.style.opacity = '0.5';
                elements.safeSleepBatchGroup.style.pointerEvents = 'none';
                elements.safeSleepDelayGroup.style.opacity = '0.5';
                elements.safeSleepDelayGroup.style.pointerEvents = 'none';
            }
        });
    }

    // Toggle Collapsible Strategy Tips Guide
    const tipsHeader = document.getElementById('tips-header-toggle');
    const tipsBody = document.getElementById('tips-body-content');
    const tipsIcon = document.getElementById('tips-toggle-icon');
    if (tipsHeader && tipsBody) {
        tipsHeader.addEventListener('click', () => {
            const isHidden = tipsBody.style.display === 'none';
            tipsBody.style.display = isHidden ? 'block' : 'none';
            tipsIcon.textContent = isHidden ? '[Hide Tips]' : '[Show Tips]';
        });
    }
}

// Socket updates for Campaign state
socket.on('campaign-update', (campaign) => {
    updateCampaignProgressUI(campaign);
});

socket.on('contact-status-update', (data) => {
    const { index, status } = data;
    
    // Update local loadedContacts state
    if (loadedContacts[index]) {
        loadedContacts[index].status = status;
    }
    
    const row = document.getElementById(`q-row-${index}`);
    if (row) {
        row.classList.remove('active-row');
        if (status === 'typing' || status === 'sending') {
            row.classList.add('active-row');
        }
        
        const badge = row.querySelector('.q-status');
        if (badge) {
            badge.className = `q-status ${status}`;
            badge.textContent = status;
        }
        
        // Auto scroll active contact row into view inside queue scroll container
        if (status === 'typing' || status === 'sending') {
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

function updateCampaignProgressUI(campaign) {
    const { status, total, sent, failed, logs, name, id, contacts } = campaign;
    
    // Sync queue once on campaign change/load
    if (contacts && contacts.length > 0 && id !== renderedCampaignId) {
        renderedCampaignId = id;
        loadedContacts = contacts;
        renderContactsQueue();
    }
    
    // Set outbox stats inside dashboard
    elements.statOutboxStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    elements.statOutboxStatus.className = `stat-value ${status === 'running' ? 'text-green text-blink' : status === 'paused' ? 'text-amber' : ''}`;
    elements.statTotalSent.textContent = sent + failed;
    
    if (status === 'idle') {
        elements.activeCampaignProgress.style.display = 'none';
        elements.startCampaignBtn.disabled = false;
        elements.pauseCampaignBtn.disabled = true;
        elements.stopCampaignBtn.disabled = true;
        elements.resetCampaignBtn.disabled = false;
        renderedCampaignLogCount = 0;
        renderedCampaignId = null;
        return;
    }

    // Show Progress panel
    elements.activeCampaignProgress.style.display = 'block';
    
    // Update badge status UI
    elements.campaignStatusBadge.textContent = status;
    elements.campaignStatusBadge.className = `status-indicator-pill ${status}`;
    elements.displayCampaignName.textContent = name;
    
    // Progress numbers
    const processed = sent + failed;
    elements.progressProcessed.textContent = `${processed} / ${total}`;
    elements.progressSent.textContent = sent;
    elements.progressFailed.textContent = failed;
    
    // Progress fill animation
    const progressPercent = total > 0 ? (processed / total) * 100 : 0;
    elements.campaignProgressBar.style.width = `${progressPercent}%`;

    // Active button toggles
    if (status === 'running') {
        elements.startCampaignBtn.disabled = true;
        elements.pauseCampaignBtn.disabled = false;
        elements.stopCampaignBtn.disabled = false;
        elements.resetCampaignBtn.disabled = true;
    } else if (status === 'paused') {
        elements.startCampaignBtn.disabled = false;
        elements.startCampaignBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg-icon">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Resume Campaign
        `;
        elements.pauseCampaignBtn.disabled = true;
        elements.stopCampaignBtn.disabled = false;
        elements.resetCampaignBtn.disabled = true;
    } else if (status === 'stopped' || status === 'completed') {
        elements.startCampaignBtn.disabled = false;
        elements.startCampaignBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg-icon">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Campaign
        `;
        elements.pauseCampaignBtn.disabled = true;
        elements.stopCampaignBtn.disabled = true;
        elements.resetCampaignBtn.disabled = false;
    }

    // Refresh logs console incrementally
    if (processed === 0 || logs.length < renderedCampaignLogCount) {
        renderedCampaignLogCount = 0;
        elements.consoleLogs.innerHTML = '';
    }

    if (logs && logs.length > 0) {
        if (renderedCampaignLogCount === 0) {
            elements.consoleLogs.innerHTML = '';
        }
        for (let i = renderedCampaignLogCount; i < logs.length; i++) {
            const log = logs[i];
            const row = document.createElement('div');
            row.className = `log-row ${log.type}`;
            row.innerHTML = `<span>[${log.time}]</span> ${log.text}`;
            elements.consoleLogs.appendChild(row);
        }
        renderedCampaignLogCount = logs.length;
        // Auto-scroll terminal console to bottom
        elements.consoleLogs.scrollTop = elements.consoleLogs.scrollHeight;
    } else {
        elements.consoleLogs.innerHTML = '<div class="log-row info">No logs output received.</div>';
        renderedCampaignLogCount = 0;
    }
}

// ----------------------------------------------------
// 7. ARCHIVES & HISTORY MANAGER
// ----------------------------------------------------
function initHistoryTab() {
    elements.clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Clear all campaign archives? This action is permanent.')) {
            try {
                const res = await fetch('/api/history', { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showToast('History cleared.', 'success');
                    loadCampaignHistory();
                }
            } catch (e) {
                showToast('Failed to clear history.', 'error');
            }
        }
    });
}

async function loadCampaignHistory() {
    try {
        elements.historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading history...</td></tr>';
        
        const res = await fetch('/api/history');
        const data = await res.json();
        
        elements.historyTableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            elements.historyTableBody.innerHTML = `
                <tr class="table-empty-row">
                    <td colspan="7">No campaigns run yet. Create a campaign inside the Bulk Sender tab.</td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Format dates
            const startD = new Date(item.startedAt);
            const startStr = startD.toLocaleDateString() + ' ' + startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let durationStr = '-';
            if (item.completedAt) {
                const endD = new Date(item.completedAt);
                const diffMs = endD - startD;
                const diffMin = Math.floor(diffMs / 60000);
                const diffSec = Math.floor((diffMs % 60000) / 1000);
                durationStr = diffMin > 0 ? `${diffMin}m ${diffSec}s` : `${diffSec}s`;
            }

            // Success percentage
            const totalSent = item.sent + item.failed;
            const successRate = totalSent > 0 ? Math.round((item.sent / totalSent) * 100) : 0;
            const successColorClass = successRate > 80 ? 'text-green' : successRate > 40 ? 'text-amber' : 'text-red';

            row.innerHTML = `
                <td style="font-weight: 600; color: var(--text-primary);">${item.name}</td>
                <td><span class="status-indicator-pill ${item.status}">${item.status}</span></td>
                <td>${startStr}</td>
                <td>${durationStr}</td>
                <td>Processed ${totalSent} contacts</td>
                <td><span class="${successColorClass}" style="font-weight:700;">${successRate}%</span> (${item.sent} sent)</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewCampaignDetails('${encodeURIComponent(JSON.stringify(item))}')">Inspect</button>
                </td>
            `;
            elements.historyTableBody.appendChild(row);
        });
    } catch (e) {
        elements.historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--accent-red);">Error loading history logs.</td></tr>';
    }
}

// Global inspect helper
window.viewCampaignDetails = function(itemStr) {
    const item = JSON.parse(decodeURIComponent(itemStr));
    alert(`Campaign details for: ${item.name}
----------------------------------------
- Status: ${item.status}
- Targets: ${item.sent + item.failed} contacts
- Successfully Delivered: ${item.sent}
- Failed Delivery: ${item.failed}
- Date Run: ${new Date(item.startedAt).toLocaleString()}
- Template: 
"${item.messageTemplate}"
`);
};

// ----------------------------------------------------
// 8. WHATSAPP NUMBER CHECKER & FILTER UI HANDLERS
// ----------------------------------------------------
let checkerContacts = [];
let checkedValidNumbers = [];
let checkedInvalidNumbers = [];
let checkedInvalidFormatNumbers = [];

// Incremental rendering and state tracking counters
let previousCheckerStatus = 'idle';
let renderedValidCount = 0;
let renderedInvalidCount = 0;
let renderedFormatCount = 0;
let renderedLogCount = 0;
let checkerTimerInterval = null;

function initNumberChecker() {
    // Switch checker upload tabs
    elements.checkerUploadTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.checkerUploadTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const uploadType = btn.getAttribute('data-type');
            if (uploadType === 'csv') {
                elements.checkerCsvSection.style.display = 'block';
                elements.checkerManualSection.style.display = 'none';
            } else {
                elements.checkerCsvSection.style.display = 'none';
                elements.checkerManualSection.style.display = 'block';
            }
        });
    });

    // Dropzone logic
    elements.checkerDropZone.addEventListener('click', () => elements.checkerCsvInput.click());
    elements.checkerCsvInput.addEventListener('change', (e) => {
        if (e.target.files.length) prepareCheckerFile(e.target.files[0]);
    });

    elements.checkerDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.checkerDropZone.classList.add('drag-over');
    });
    elements.checkerDropZone.addEventListener('dragleave', () => {
        elements.checkerDropZone.classList.remove('drag-over');
    });
    elements.checkerDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.checkerDropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            elements.checkerCsvInput.files = e.dataTransfer.files;
            prepareCheckerFile(e.dataTransfer.files[0]);
        }
    });

    elements.checkerClearCsv.addEventListener('click', (e) => {
        e.stopPropagation();
        resetCheckerCsvState();
    });

    // Parse selected file action
    elements.checkerParseFileBtn.addEventListener('click', () => {
        if (selectedCheckerFile) {
            parseAndLoadCheckerFile(selectedCheckerFile);
        }
    });

    // Manual parser
    elements.checkerParseManual.addEventListener('click', () => {
        const text = elements.checkerManualInput.value.trim();
        if (!text) {
            showToast('Please paste numbers before loading.', 'warning');
            return;
        }
        const lines = text.split('\n');
        const parsed = [];
        lines.forEach(line => {
            const num = line.trim();
            if (num) {
                parsed.push({ number: num, name: 'Contact', company: '' });
            }
        });

        if (parsed.length > 0) {
            checkerContacts = parsed;
            showToast(`Loaded ${parsed.length} numbers manually.`, 'success');
        } else {
            showToast('No valid numbers found.', 'error');
        }
    });

    // Control triggers
    elements.checkerStartBtn.addEventListener('click', async () => {
        if (!whatsappConnected) {
            showToast('WhatsApp is not connected.', 'error');
            return;
        }
        if (checkerContacts.length === 0) {
            showToast('Please load numbers list first.', 'warning');
            return;
        }

        try {
            elements.checkerStartBtn.disabled = true;
            const res = await fetch('/api/check-numbers/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contacts: checkerContacts,
                    countryCode: elements.checkerCountryCode.value 
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Number checker started.', 'success');
            } else {
                showToast(data.error || 'Failed to start checker.', 'error');
                elements.checkerStartBtn.disabled = false;
            }
        } catch (e) {
            showToast('Error starting checker: ' + e.message, 'error');
            elements.checkerStartBtn.disabled = false;
        }
    });

    elements.checkerStopBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/check-numbers/stop', { method: 'POST' });
            const data = await res.json();
            if (data.success) showToast('Checker stopped.', 'info');
        } catch (e) {
            showToast('Error stopping checker: ' + e.message, 'error');
        }
    });

    elements.checkerResetBtn.addEventListener('click', async () => {
        if (confirm('Reset checker data and logs?')) {
            try {
                const res = await fetch('/api/check-numbers/reset', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    checkerContacts = [];
                    checkedValidNumbers = [];
                    checkedInvalidNumbers = [];
                    checkedInvalidFormatNumbers = [];
                    elements.checkerManualInput.value = '';
                    resetCheckerCsvState();
                    clearCheckerResultsUI();
                    showToast('Checker reset.', 'info');
                }
            } catch (e) {
                showToast('Error resetting checker: ' + e.message, 'error');
            }
        }
    });

    // Copy to clipboard valid numbers
    elements.checkerCopyValidBtn.addEventListener('click', () => {
        if (checkedValidNumbers.length === 0) return;
        const numbersCsv = checkedValidNumbers.map(c => c.number).join(',');
        
        navigator.clipboard.writeText(numbersCsv).then(() => {
            showToast(`Successfully copied ${checkedValidNumbers.length} valid numbers to clipboard!`, 'success');
        }).catch(err => {
            showToast('Failed to copy numbers: ' + err.message, 'error');
        });
    });

    // Download CSV Report trigger
    elements.checkerDownloadReportBtn.addEventListener('click', () => {
        if (checkedValidNumbers.length === 0 && checkedInvalidNumbers.length === 0 && checkedInvalidFormatNumbers.length === 0) return;

        // Compile CSV rows
        let csvContent = 'Number,Name,Company,Status,Details\n';

        checkedValidNumbers.forEach(c => {
            const cleanNumber = String(c.number || '').replace(/"/g, '""');
            const cleanName = String(c.name || '').replace(/"/g, '""');
            const cleanCompany = String(c.company || '').replace(/"/g, '""');
            csvContent += `"${cleanNumber}","${cleanName}","${cleanCompany}","Active","WhatsApp Registered"\n`;
        });

        checkedInvalidNumbers.forEach(c => {
            const cleanNumber = String(c.number || '').replace(/"/g, '""');
            const cleanName = String(c.name || '').replace(/"/g, '""');
            const cleanCompany = String(c.company || '').replace(/"/g, '""');
            csvContent += `"${cleanNumber}","${cleanName}","${cleanCompany}","Inactive","Not on WhatsApp"\n`;
        });

        checkedInvalidFormatNumbers.forEach(c => {
            const cleanNumber = String(c.number || '').replace(/"/g, '""');
            const cleanName = String(c.name || '').replace(/"/g, '""');
            const cleanCompany = String(c.company || '').replace(/"/g, '""');
            const cleanReason = String(c.reason || 'Invalid format').replace(/"/g, '""');
            csvContent += `"${cleanNumber}","${cleanName}","${cleanCompany}","Format Error","${cleanReason}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        link.setAttribute('download', `WapDam_Report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Report CSV downloaded.', 'success');
    });
}

let selectedCheckerFile = null;

function prepareCheckerFile(file) {
    selectedCheckerFile = file;
    elements.checkerDropZone.style.display = 'none';
    elements.checkerCsvStatus.style.display = 'flex';
    elements.checkerCsvFileName.textContent = file.name;
    elements.checkerCsvCount.textContent = 'File selected. Ready to parse.';
    elements.checkerParseFileBtn.disabled = false;
    elements.checkerParseFileBtn.textContent = 'Load File Numbers';
}

async function parseAndLoadCheckerFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        elements.checkerParseFileBtn.disabled = true;
        elements.checkerParseFileBtn.textContent = 'Parsing File...';
        
        const res = await fetch('/api/parse-any-file', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            checkerContacts = data.contacts;
            elements.checkerCsvCount.textContent = `${data.contactsCount} numbers loaded successfully.`;
            elements.checkerParseFileBtn.textContent = 'Parsed Successfully';
            showToast(`${data.contactsCount} numbers loaded from file.`, 'success');
        } else {
            showToast(data.error || 'Failed to parse file.', 'error');
            resetCheckerCsvState();
        }
    } catch (err) {
        showToast('Error uploading file: ' + err.message, 'error');
        resetCheckerCsvState();
    }
}

function resetCheckerCsvState() {
    selectedCheckerFile = null;
    elements.checkerCsvInput.value = '';
    elements.checkerDropZone.style.display = 'flex';
    elements.checkerCsvStatus.style.display = 'none';
    elements.checkerCsvFileName.textContent = '';
    elements.checkerCsvCount.textContent = '';
    elements.checkerParseFileBtn.disabled = true;
    elements.checkerParseFileBtn.textContent = 'Load File Numbers';
}

function clearCheckerResultsUI() {
    elements.checkerValidCount.textContent = '0';
    elements.checkerInvalidCount.textContent = '0';
    elements.checkerFormatCount.textContent = '0';
    elements.checkerValidList.innerHTML = '<div class="empty-list-msg">No active numbers found yet.</div>';
    elements.checkerInvalidList.innerHTML = '<div class="empty-list-msg">No inactive numbers found yet.</div>';
    elements.checkerFormatList.innerHTML = '<div class="empty-list-msg">No format errors found yet.</div>';
    elements.checkerCopyValidBtn.disabled = true;
    elements.checkerDownloadReportBtn.disabled = true;
    elements.checkerProgressText.textContent = '0 / 0';
    elements.checkerProgressBar.style.width = '0%';
    elements.checkerLogs.innerHTML = '<div class="log-row info">Ready. Please load numbers and click "Start Filter".</div>';
    elements.checkerStatusBadge.textContent = 'Idle';
    elements.checkerStatusBadge.className = 'status-indicator-pill Idle';
    
    // Reset checker rendering counts
    renderedValidCount = 0;
    renderedInvalidCount = 0;
    renderedFormatCount = 0;
    renderedLogCount = 0;
    previousCheckerStatus = 'idle';
    
    if (checkerTimerInterval) {
        clearInterval(checkerTimerInterval);
        checkerTimerInterval = null;
    }
    if (elements.checkerElapsedTime) elements.checkerElapsedTime.textContent = '00:00';
    if (elements.checkerRemainingTime) elements.checkerRemainingTime.textContent = '00:00';
}

// Helper for automatic valid numbers download
function autoDownloadValidNumbers(valid) {
    if (!valid || valid.length === 0) return;

    // Compile CSV rows
    let csvContent = 'Number,Name,Company\n';
    valid.forEach(c => {
        const cleanNumber = String(c.number || '').replace(/"/g, '""');
        const cleanName = String(c.name || '').replace(/"/g, '""');
        const cleanCompany = String(c.company || '').replace(/"/g, '""');
        csvContent += `"${cleanNumber}","${cleanName}","${cleanCompany}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Format timestamp for file name: YYYYMMDD_HHMMSS
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
    link.setAttribute('download', `WapDam_Valid_Numbers_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Valid numbers auto-downloaded (${valid.length} contacts).`, 'success');
}

// Helper to format duration in milliseconds to MM:SS or HH:MM:SS
function formatDuration(ms) {
    if (ms <= 0 || isNaN(ms)) return '00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (num) => String(num).padStart(2, '0');
    
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

// Socket updates for Checker state
socket.on('check-update', (checkState) => {
    const { status, total, checked, valid, invalid, invalidFormat, logs, startedAt, completedAt } = checkState;
    
    // Update badge status
    elements.checkerStatusBadge.textContent = status;
    elements.checkerStatusBadge.className = `status-indicator-pill ${status}`;
    
    // Progress texts
    elements.checkerProgressText.textContent = `${checked} / ${total}`;
    const progressPercent = total > 0 ? (checked / total) * 100 : 0;
    elements.checkerProgressBar.style.width = `${progressPercent}%`;

    // Active button toggles
    if (status === 'running') {
        elements.checkerStartBtn.disabled = true;
        elements.checkerStopBtn.disabled = false;
        elements.checkerResetBtn.disabled = true;
        elements.checkerCopyValidBtn.disabled = true;
        elements.checkerDownloadReportBtn.disabled = true;
    } else {
        elements.checkerStartBtn.disabled = false;
        elements.checkerStopBtn.disabled = true;
        elements.checkerResetBtn.disabled = false;
        elements.checkerCopyValidBtn.disabled = valid.length === 0;
        elements.checkerDownloadReportBtn.disabled = (valid.length === 0 && invalid.length === 0 && (!invalidFormat || invalidFormat.length === 0));
    }

    // Handle Timer display
    if (status === 'running') {
        if (!checkerTimerInterval && startedAt) {
            checkerTimerInterval = setInterval(() => {
                const now = Date.now();
                const elapsedMs = now - startedAt;
                elements.checkerElapsedTime.textContent = formatDuration(elapsedMs);
                
                // Calculate dynamic remaining time (ETA)
                if (checked > 0) {
                    const avgTimePerContact = elapsedMs / checked;
                    const remainingContacts = total - checked;
                    const remainingMs = remainingContacts * avgTimePerContact;
                    elements.checkerRemainingTime.textContent = formatDuration(remainingMs);
                } else {
                    // Default estimate before checking first number (approx 1.2s per number)
                    elements.checkerRemainingTime.textContent = formatDuration(total * 1200);
                }
            }, 1000);
        }
    } else {
        // stopped, completed, or idle
        if (checkerTimerInterval) {
            clearInterval(checkerTimerInterval);
            checkerTimerInterval = null;
        }
        
        if (startedAt) {
            const end = completedAt || Date.now();
            const elapsedMs = end - startedAt;
            elements.checkerElapsedTime.textContent = formatDuration(elapsedMs);
        } else {
            elements.checkerElapsedTime.textContent = '00:00';
        }
        elements.checkerRemainingTime.textContent = '00:00';
    }

    // Check if checker has transitioned from 'running' to 'completed' or 'stopped' for auto-download
    if ((status === 'completed' || status === 'stopped') && previousCheckerStatus === 'running') {
        if (valid && valid.length > 0) {
            autoDownloadValidNumbers(valid);
        }
    }
    previousCheckerStatus = status;

    // Reset render counters if it's a fresh scan or clear
    if (checked === 0 || valid.length < renderedValidCount || invalid.length < renderedInvalidCount || (invalidFormat && invalidFormat.length < renderedFormatCount) || logs.length < renderedLogCount) {
        renderedValidCount = 0;
        renderedInvalidCount = 0;
        renderedFormatCount = 0;
        renderedLogCount = 0;
        elements.checkerValidList.innerHTML = '<div class="empty-list-msg">No active numbers found yet.</div>';
        elements.checkerInvalidList.innerHTML = '<div class="empty-list-msg">No inactive numbers found yet.</div>';
        elements.checkerFormatList.innerHTML = '<div class="empty-list-msg">No format errors found yet.</div>';
        elements.checkerLogs.innerHTML = '';
    }

    // Refresh logs terminal incrementally
    if (logs && logs.length > 0) {
        if (renderedLogCount === 0) {
            elements.checkerLogs.innerHTML = '';
        }
        for (let i = renderedLogCount; i < logs.length; i++) {
            const log = logs[i];
            const row = document.createElement('div');
            row.className = `log-row ${log.type}`;
            row.innerHTML = `<span>[${log.time}]</span> ${log.text}`;
            elements.checkerLogs.appendChild(row);
        }
        renderedLogCount = logs.length;
        elements.checkerLogs.scrollTop = elements.checkerLogs.scrollHeight;
    } else {
        elements.checkerLogs.innerHTML = '<div class="log-row info">Ready. Please load numbers and click "Start Filter".</div>';
        renderedLogCount = 0;
    }

    // Refresh active valid lists incrementally
    checkedValidNumbers = valid;
    elements.checkerValidCount.textContent = valid.length;
    if (valid.length > 0) {
        if (renderedValidCount === 0) {
            elements.checkerValidList.innerHTML = '';
        }
        for (let i = renderedValidCount; i < valid.length; i++) {
            const c = valid[i];
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-item-meta">
                    <span class="result-item-name">${c.name}</span>
                    <span class="result-item-number">+${c.number}</span>
                </div>
                ${c.company ? `<span class="result-item-company">${c.company}</span>` : ''}
            `;
            elements.checkerValidList.appendChild(item);
        }
        renderedValidCount = valid.length;
    } else {
        elements.checkerValidList.innerHTML = '<div class="empty-list-msg">No active numbers found yet.</div>';
        renderedValidCount = 0;
    }

    // Refresh active invalid lists incrementally
    checkedInvalidNumbers = invalid;
    elements.checkerInvalidCount.textContent = invalid.length;
    if (invalid.length > 0) {
        if (renderedInvalidCount === 0) {
            elements.checkerInvalidList.innerHTML = '';
        }
        for (let i = renderedInvalidCount; i < invalid.length; i++) {
            const c = invalid[i];
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-item-meta">
                    <span class="result-item-name">${c.name}</span>
                    <span class="result-item-number">+${c.number}</span>
                </div>
                ${c.company ? `<span class="result-item-company">${c.company}</span>` : ''}
            `;
            elements.checkerInvalidList.appendChild(item);
        }
        renderedInvalidCount = invalid.length;
    } else {
        elements.checkerInvalidList.innerHTML = '<div class="empty-list-msg">No inactive numbers found yet.</div>';
        renderedInvalidCount = 0;
    }

    // Refresh active invalid format lists incrementally
    checkedInvalidFormatNumbers = invalidFormat || [];
    elements.checkerFormatCount.textContent = checkedInvalidFormatNumbers.length;
    if (checkedInvalidFormatNumbers.length > 0) {
        if (renderedFormatCount === 0) {
            elements.checkerFormatList.innerHTML = '';
        }
        for (let i = renderedFormatCount; i < checkedInvalidFormatNumbers.length; i++) {
            const c = checkedInvalidFormatNumbers[i];
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-item-meta" style="flex-grow:1;">
                    <span class="result-item-name" style="color:var(--text-secondary);">${c.name}</span>
                    <span class="result-item-number" style="color:var(--text-muted);">${c.number}</span>
                    <span class="result-item-reason" style="color:var(--accent-amber); font-size:0.7rem; font-weight:600; margin-top:2px;">${c.reason}</span>
                </div>
            `;
            elements.checkerFormatList.appendChild(item);
        }
        renderedFormatCount = checkedInvalidFormatNumbers.length;
    } else {
        elements.checkerFormatList.innerHTML = '<div class="empty-list-msg">No format errors found yet.</div>';
        renderedFormatCount = 0;
    }
});
