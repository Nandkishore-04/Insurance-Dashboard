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
    deleteInsurance: (id) => ipcRenderer.invoke('db:delete-insurance', id),

    // Backup/Restore operations
    exportDB: () => ipcRenderer.invoke('db:export'),
    importDB: () => ipcRenderer.invoke('db:import'),
    getDBPath: () => ipcRenderer.invoke('db:get-db-path'),

    // Update events
    onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
    onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),

    // System operations
    getPlatform: () => process.platform,
})
