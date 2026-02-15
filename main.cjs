const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev').default
const db = require('./db.cjs')

console.log('Starting Electron...')
console.log('isDev:', isDev)

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        title: "Insurance Dashboard",
        backgroundColor: '#0f172a'
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173').catch(e => console.error('Failed to load URL:', e))
        // mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
    }

    // OTA auto-updater (production only)
    if (!isDev) {
        try {
            const { autoUpdater } = require('electron-updater')
            autoUpdater.checkForUpdatesAndNotify()
            autoUpdater.on('update-available', () => {
                mainWindow.webContents.send('update-available')
            })
            autoUpdater.on('update-downloaded', () => {
                mainWindow.webContents.send('update-downloaded')
            })
        } catch (err) {
            console.log('Auto-updater not configured:', err.message)
        }
    }
}

app.whenReady().then(() => {
    db.initDB()

    // Customer IPC handlers
    ipcMain.handle('db:get-customers', () => db.getAllCustomers())
    ipcMain.handle('db:get-customer', (_e, id) => db.getCustomer(id))
    ipcMain.handle('db:add-customer', (_e, data) => db.addCustomer(data))
    ipcMain.handle('db:update-customer', (_e, id, data) => db.updateCustomer(id, data))
    ipcMain.handle('db:delete-customer', (_e, id) => db.deleteCustomer(id))
    ipcMain.handle('db:search-customers', (_e, query) => db.searchCustomers(query))

    // Insurance IPC handlers
    ipcMain.handle('db:get-insurances', (_e, customerId) => db.getInsurances(customerId))
    ipcMain.handle('db:add-insurance', (_e, data) => db.addInsurance(data))
    ipcMain.handle('db:update-insurance', (_e, id, data) => db.updateInsurance(id, data))
    ipcMain.handle('db:delete-insurance', (_e, id) => db.deleteInsurance(id))

    // Backup/Restore IPC handlers
    ipcMain.handle('db:export', async () => {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Database Backup',
            defaultPath: `insuretrack-backup-${new Date().toISOString().slice(0, 10)}.db`,
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        })
        if (!filePath) return { cancelled: true }
        return db.exportDB(filePath)
    })

    ipcMain.handle('db:import', async () => {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Restore Database from Backup',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
            properties: ['openFile'],
        })
        if (!filePaths || filePaths.length === 0) return { cancelled: true }
        return db.importDB(filePaths[0])
    })

    ipcMain.handle('db:get-db-path', () => db.getDBPath())

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
