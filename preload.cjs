const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Customer operations
    getCustomers: () => ipcRenderer.invoke('db:get-customers'),
    getCustomer: (id) => ipcRenderer.invoke('db:get-customer', id),
    addCustomer: (data) => ipcRenderer.invoke('db:add-customer', data),
    updateCustomer: (id, data) => ipcRenderer.invoke('db:update-customer', id, data),
    deleteCustomer: (id) => ipcRenderer.invoke('db:delete-customer', id),
    searchCustomers: (query) => ipcRenderer.invoke('db:search-customers', query),

    // Insurance operations
    getInsurances: (customerId) => ipcRenderer.invoke('db:get-insurances', customerId),
    addInsurance: (data) => ipcRenderer.invoke('db:add-insurance', data),
    updateInsurance: (id, data) => ipcRenderer.invoke('db:update-insurance', id, data),
    acknowledgeRenewal: (id) => ipcRenderer.invoke('db:acknowledge-renewal', id),
    deleteInsurance: (id) => ipcRenderer.invoke('db:delete-insurance', id),

    // Backup/Restore operations
    exportDB: () => ipcRenderer.invoke('db:export'),
    importDB: () => ipcRenderer.invoke('db:import'),
    getDBPath: () => ipcRenderer.invoke('db:get-db-path'),
    getBackupDir: () => ipcRenderer.invoke('db:get-backup-dir'),

    // System operations
    getPlatform: () => process.platform,
    seedLargeData: (count) => ipcRenderer.invoke('db:seed-large-data', count),
    openBackupFolder: () => ipcRenderer.invoke('shell:open-backup-folder'),

    // Keyboard shortcut listener (from main process menu accelerators)
    onShortcut: (callback) => {
        ipcRenderer.on('shortcut', (_e, action) => callback(action))
    },
    removeShortcutListeners: () => {
        ipcRenderer.removeAllListeners('shortcut')
    },

    // Auto-update operations
    checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
    getAppVersion: () => ipcRenderer.invoke('app:get-version'),
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (_e, data) => callback(data))
    },
    removeUpdateListeners: () => {
        ipcRenderer.removeAllListeners('update-status')
    },
})
