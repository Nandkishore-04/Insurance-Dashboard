import { useState, useEffect } from 'react'
import { Download, Upload, Database, CheckCircle, AlertTriangle, HardDrive, FolderOpen, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function BackupRestore() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [backupDir, setBackupDir] = useState('')

  const isElectron = !!window.electronAPI?.exportDB

  useEffect(() => {
    if (isElectron && window.electronAPI.getBackupDir) {
      window.electronAPI.getBackupDir().then(setBackupDir).catch(() => {})
    }
  }, [isElectron])

  const handleExport = async () => {
    if (!isElectron) {
      toast.error('Backup is only available in the desktop app')
      return
    }
    setExporting(true)
    try {
      const result = await window.electronAPI.exportDB()
      if (result.cancelled) {
        toast('Export cancelled', { icon: '📁' })
      } else {
        toast.success(`Backup saved to: ${result.path}`)
      }
    } catch (err) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!isElectron) {
      toast.error('Restore is only available in the desktop app')
      return
    }
    setImporting(true)
    try {
      const result = await window.electronAPI.importDB()
      if (result.cancelled) {
        toast('Restore cancelled', { icon: '📁' })
      } else {
        toast.success('Database restored successfully! Reloading...')
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (err) {
      toast.error('Restore failed: ' + err.message)
    } finally {
      setImporting(false)
      setConfirmRestore(false)
    }
  }

  const handleOpenFolder = async () => {
    try {
      await window.electronAPI.openBackupFolder()
    } catch (err) {
      toast.error('Could not open folder: ' + err.message)
    }
  }

  return (
    <div className="space-y-8" data-testid="backup-restore-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Backup & Restore
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
          Your data is backed up automatically every day — even when the app is running in the background
        </p>
      </div>

      {/* Auto-backup info banner */}
      {isElectron && (
        <div
          className="rounded-2xl border p-5 flex items-start gap-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Automatic Daily Backup
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
              One backup is created per day inside{' '}
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                Documents / Insurance Tracking / [date] /
              </span>
              . Each backup contains a full database copy and readable CSV files.
            </p>
            {backupDir && (
              <p className="text-xs mt-1 font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                {backupDir}
              </p>
            )}
          </div>
          {window.electronAPI?.openBackupFolder && (
            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors shrink-0"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }}
              title="Open backup folder in Explorer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open Folder
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div
          className="rounded-2xl border p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Download className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Export Backup</h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Save a manual copy to any location
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Exports all customers and insurance policies</span>
            </div>
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Safe SQLite backup (consistent snapshot)</span>
            </div>
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <HardDrive className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Save to any location — USB drive, cloud folder, etc.</span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !isElectron}
            data-testid="btn-export-backup"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-md shadow-emerald-500/25"
          >
            {exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Backup (.db)
              </>
            )}
          </button>
        </div>

        {/* Import Card */}
        <div
          className="rounded-2xl border p-8 space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Restore Backup</h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Replace current data with a backup file
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>This will replace ALL current data</span>
            </div>
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Validates backup file before restoring</span>
            </div>
            <div className="flex items-start gap-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <Database className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>App will reload after successful restore</span>
            </div>
          </div>

          <button
            onClick={() => setConfirmRestore(true)}
            disabled={importing || !isElectron}
            data-testid="btn-import-backup"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-all duration-200"
          >
            {importing ? (
              <>
                <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Restore from Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* What's inside each backup */}
      {isElectron && (
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            What's inside each daily backup
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { file: 'backup.db', desc: 'Full SQLite database — used for Restore', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { file: 'customers.csv', desc: 'All customer master records — opens in Excel', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { file: 'policies.csv', desc: 'All policies with customer name and code', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map(({ file, desc, color, bg }) => (
              <div key={file} className={`rounded-xl p-4 ${bg}`}>
                <p className={`text-xs font-bold font-mono ${color}`}>{file}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isElectron && (
        <div
          className="rounded-2xl border p-6 flex items-center gap-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Backup and restore features require the desktop (Electron) version of Insurance Tracking.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmRestore}
        title="Restore Database"
        message="This will replace ALL current data with the backup file. This action cannot be undone. Are you sure you want to proceed?"
        onConfirm={handleImport}
        onCancel={() => setConfirmRestore(false)}
      />
    </div>
  )
}
