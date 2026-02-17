const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev').default
const db = require('./db.cjs')

if (isDev) console.log('Starting Electron in dev mode...')

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show until content is ready
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        title: "Insurance Tracking",
        backgroundColor: '#0f172a'
    })

    // Show window only after content has rendered — eliminates white flash
    mainWindow.once('ready-to-show', () => mainWindow.show())

    if (isDev) {
        const devURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
        mainWindow.loadURL(devURL).catch(e => console.error('Failed to load URL:', e))
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
    }

}

app.whenReady().then(() => {
    db.initDB()

    // Auto daily backup on app start
    try {
        const result = db.autoBackup()
        if (result.success) console.log('Daily backup created:', result.path)
    } catch (err) {
        console.error('Auto-backup failed:', err.message)
    }

    // Safe IPC wrapper to catch errors and return them as serializable objects
    const safeHandle = (channel, handler) => {
        ipcMain.handle(channel, async (...args) => {
            try {
                return await handler(...args)
            } catch (err) {
                console.error(`IPC error [${channel}]:`, err.message)
                throw new Error(err.message)
            }
        })
    }

    // Customer IPC handlers
    safeHandle('db:get-customers', () => db.getAllCustomers())
    safeHandle('db:get-customer', (_e, id) => db.getCustomer(id))
    safeHandle('db:add-customer', (_e, data) => db.addCustomer(data))
    safeHandle('db:update-customer', (_e, id, data) => db.updateCustomer(id, data))
    safeHandle('db:delete-customer', (_e, id) => db.deleteCustomer(id))
    safeHandle('db:search-customers', (_e, query) => db.searchCustomers(query))
    safeHandle('db:seed-large-data', (_e, count) => db.seedLargeData(count))

    // Insurance IPC handlers
    safeHandle('db:get-insurances', (_e, customerId) => db.getInsurances(customerId))
    safeHandle('db:add-insurance', (_e, data) => db.addInsurance(data))
    safeHandle('db:update-insurance', (_e, id, data) => db.updateInsurance(id, data))
    safeHandle('db:acknowledge-renewal', (_e, id) => db.acknowledgeRenewal(id))
    safeHandle('db:delete-insurance', (_e, id) => db.deleteInsurance(id))

    // Backup/Restore IPC handlers
    safeHandle('db:export', async () => {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Database Backup',
            defaultPath: `insurance-tracking-backup-${new Date().toISOString().slice(0, 10)}.db`,
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        })
        if (!filePath) return { cancelled: true }
        return db.exportDB(filePath)
    })

    safeHandle('db:import', async () => {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Restore Database from Backup',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
            properties: ['openFile'],
        })
        if (!filePaths || filePaths.length === 0) return { cancelled: true }
        return db.importDB(filePaths[0])
    })

    safeHandle('db:get-db-path', () => db.getDBPath())
    safeHandle('db:get-backup-dir', () => db.getBackupDir())

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}).catch(err => {
    console.error('Failed to start app:', err)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
