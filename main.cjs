const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = require('electron-is-dev').default
const db = require('./db.cjs')
const { autoUpdater } = require('electron-updater')

// ─── #4: Crash logging to file ────────────────────────────────────
const logDir = path.join(app.getPath('userData'), 'logs')
const logFile = path.join(logDir, 'app.log')

function initLogger() {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    // Rotate log if > 5MB
    try {
        if (fs.existsSync(logFile) && fs.statSync(logFile).size > 5 * 1024 * 1024) {
            const rotated = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
            fs.renameSync(logFile, rotated)
        }
    } catch { /* ignore rotation errors */ }
}

function log(level, ...args) {
    const timestamp = new Date().toISOString()
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    const line = `[${timestamp}] [${level}] ${message}\n`
    try { fs.appendFileSync(logFile, line) } catch { /* ignore */ }
    if (level === 'ERROR') console.error(...args)
    else console.log(...args)
}

// Catch uncaught errors and log them
process.on('uncaughtException', (err) => {
    log('ERROR', 'Uncaught exception:', err.stack || err.message)
})
process.on('unhandledRejection', (reason) => {
    log('ERROR', 'Unhandled rejection:', reason?.stack || reason)
})

initLogger()
log('INFO', `App starting — version ${app.getVersion()}, dev=${isDev}`)

// ─── #1: Single instance lock ─────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    log('INFO', 'Another instance is running — quitting')
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to open a second instance — focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            if (!mainWindow.isVisible()) mainWindow.show()
            mainWindow.focus()
        }
    })
}

let mainWindow
let tray = null
let quitting = false

// Allow the close event to actually quit when triggered from tray menu
app.on('before-quit', () => { quitting = true })

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        title: "Insurance Tracking",
        backgroundColor: '#0f172a'
    })

    // ─── #6: CSP headers ──────────────────────────────────────────
    // Only apply CSP to http(s) requests — file:// doesn't support 'self'
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.url.startsWith('file://')) {
            return callback({ responseHeaders: details.responseHeaders })
        }
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';" +
                    " script-src 'self' 'unsafe-inline';" +
                    " style-src 'self' 'unsafe-inline';" +
                    " img-src 'self' data: blob:;" +
                    " font-src 'self' data:;" +
                    " connect-src 'self';"
                ]
            }
        })
    })

    // Show window only after content has rendered — eliminates white flash
    mainWindow.once('ready-to-show', () => mainWindow.show())

    // Hide to tray instead of quitting when window is closed
    mainWindow.on('close', (e) => {
        if (!quitting) {
            e.preventDefault()
            mainWindow.hide()
        }
    })

    // Log renderer crashes
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
        log('ERROR', 'Renderer crashed:', details.reason, details.exitCode)
    })

    if (isDev) {
        const devURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
        mainWindow.loadURL(devURL).catch(e => log('ERROR', 'Failed to load URL:', e.message))
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
    }
}

function createTray() {
    const iconPath = path.join(__dirname, 'build', 'icon.png')
    tray = new Tray(iconPath)
    tray.setToolTip('Insurance Tracking — Running in background')

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Insurance Tracking',
            click: () => { mainWindow.show(); mainWindow.focus() }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => { quitting = true; app.quit() }
        },
    ])

    tray.setContextMenu(contextMenu)

    // Single click on tray icon → show window
    tray.on('click', () => { mainWindow.show(); mainWindow.focus() })
}

// ─── #5: Keyboard shortcuts via application menu ──────────────────
function registerShortcuts() {
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Insurance',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow?.webContents.send('shortcut', 'new-insurance')
                },
                {
                    label: 'Export PDF',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => mainWindow?.webContents.send('shortcut', 'export-pdf')
                },
                { type: 'separator' },
                {
                    label: 'Backup & Restore',
                    accelerator: 'CmdOrCtrl+B',
                    click: () => mainWindow?.webContents.send('shortcut', 'backup')
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => { quitting = true; app.quit() }
                },
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Search',
                    accelerator: 'CmdOrCtrl+F',
                    click: () => mainWindow?.webContents.send('shortcut', 'search')
                },
                { type: 'separator' },
                {
                    label: 'Dashboard',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow?.webContents.send('shortcut', 'nav-dashboard')
                },
                {
                    label: 'Customers',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow?.webContents.send('shortcut', 'nav-customers')
                },
                {
                    label: 'Analytics',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => mainWindow?.webContents.send('shortcut', 'nav-analytics')
                },
                { type: 'separator' },
                { role: 'toggleDevTools' },
                { role: 'togglefullscreen' },
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: `Version ${app.getVersion()}`,
                    enabled: false,
                },
                {
                    label: 'Open Logs Folder',
                    click: () => shell.openPath(logDir)
                },
            ]
        }
    ])

    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
    db.initDB()
    log('INFO', 'Database initialized')

    // Auto-start on Windows login (production only — skip in dev)
    if (!isDev) {
        app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true })
    }

    // Auto daily backup on app start
    try {
        const result = db.autoBackup()
        if (result.success) log('INFO', 'Daily backup created:', result.path)
        else if (result.skipped) log('INFO', 'Backup skipped:', result.reason)
    } catch (err) {
        log('ERROR', 'Auto-backup failed:', err.message)
    }

    // Hourly backup check — catches the case where app runs past midnight in the tray
    setInterval(() => {
        try {
            const result = db.autoBackup()
            if (result.success) log('INFO', 'Scheduled backup created:', result.path)
        } catch (err) {
            log('ERROR', 'Scheduled backup failed:', err.message)
        }
    }, 60 * 60 * 1000) // every hour

    // Safe IPC wrapper to catch errors and return them as serializable objects
    const safeHandle = (channel, handler) => {
        ipcMain.handle(channel, async (...args) => {
            try {
                return await handler(...args)
            } catch (err) {
                log('ERROR', `IPC error [${channel}]:`, err.message)
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

    // Open the backup folder in Windows Explorer
    safeHandle('shell:open-backup-folder', async () => {
        const backupDir = db.getBackupDir()
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
        return shell.openPath(backupDir)
    })

    registerShortcuts()
    createWindow()
    createTray()

    // ─── #8: Auto updater (production only) ───────────────────────
    if (!isDev) {
        autoUpdater.logger = {
            info: (...a) => log('INFO', '[updater]', ...a),
            warn: (...a) => log('WARN', '[updater]', ...a),
            error: (...a) => log('ERROR', '[updater]', ...a),
        }
        autoUpdater.autoDownload = true
        autoUpdater.autoInstallOnAppQuit = true

        autoUpdater.on('checking-for-update', () => {
            log('INFO', 'Checking for updates...')
        })

        autoUpdater.on('update-available', (info) => {
            log('INFO', 'Update available:', info.version)
            mainWindow?.webContents.send('update-status', { status: 'available', version: info.version })
        })

        autoUpdater.on('download-progress', (progress) => {
            mainWindow?.webContents.send('update-status', {
                status: 'downloading',
                percent: Math.round(progress.percent),
            })
        })

        autoUpdater.on('update-downloaded', (info) => {
            log('INFO', 'Update downloaded:', info.version)
            mainWindow?.webContents.send('update-status', { status: 'downloaded', version: info.version })

            // Show a dialog asking the user to restart
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: `Version ${info.version} has been downloaded.`,
                detail: 'The update will be installed when you restart the app. Restart now?',
                buttons: ['Restart Now', 'Later'],
                defaultId: 0,
            }).then(({ response }) => {
                if (response === 0) {
                    quitting = true
                    autoUpdater.quitAndInstall()
                }
            })
        })

        autoUpdater.on('update-not-available', () => {
            log('INFO', 'App is up to date')
        })

        autoUpdater.on('error', (err) => {
            log('ERROR', 'Auto-update error:', err.message)
        })

        // Check for updates 10 seconds after launch, then every 5 minutes
        setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 10000)
        setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 5 * 60 * 1000)
    }

    // IPC handler for manual update check from renderer
    safeHandle('app:check-for-updates', () => {
        if (!isDev) {
            autoUpdater.checkForUpdates().catch(() => {})
            return { checking: true }
        }
        return { checking: false, reason: 'dev-mode' }
    })

    // IPC handler to install downloaded update
    safeHandle('app:install-update', () => {
        quitting = true
        autoUpdater.quitAndInstall()
    })

    // IPC handler for current app version
    safeHandle('app:get-version', () => app.getVersion())

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}).catch(err => {
    log('ERROR', 'Failed to start app:', err.stack || err.message)
})

// Don't quit when all windows are closed — stay alive in system tray
app.on('window-all-closed', () => {
    if (process.platform === 'darwin') app.quit()
    // Windows: keep running in tray (quitting flag handles explicit quit)
})

// ─── #2: Graceful DB shutdown ─────────────────────────────────────
app.on('will-quit', () => {
    log('INFO', 'App quitting — closing database')
    try {
        db.closeDB()
    } catch (err) {
        log('ERROR', 'Failed to close database:', err.message)
    }
})
