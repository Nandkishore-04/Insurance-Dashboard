const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const crypto = require('crypto')

let db

function initDB() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'insurance.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Customer table with expanded fields
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        cust_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        dob TEXT,
        sex TEXT,
        email TEXT,
        pan_number TEXT,
        aadhar_number TEXT,
        pob TEXT,
        father_name TEXT,
        mother_name TEXT,
        spouse_name TEXT,
        nominee TEXT,
        nominee_dob TEXT,
        nominee_pan TEXT,
        relation TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)

    // Ensure columns exist for existing databases
    const columns = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name)
    const requiredColumns = [
      'dob', 'sex', 'aadhar_number', 'pob', 'father_name', 'mother_name',
      'spouse_name', 'nominee', 'nominee_dob', 'nominee_pan', 'relation', 'email', 'pan_number',
      'name_as_per_it'
    ]
    requiredColumns.forEach(col => {
      if (!columns.includes(col)) {
        db.exec(`ALTER TABLE customers ADD COLUMN ${col} TEXT`)
      }
    })

    // Policies table with flexible JSON details for specialized fields
    db.exec(`
      CREATE TABLE IF NOT EXISTS insurances (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        policy_no TEXT,
        insurance_type TEXT NOT NULL, -- 'Motor', 'Mediclaim', 'General'
        insurer TEXT,
        premium REAL,
        agency_code TEXT,
        expiry_date TEXT,
        details TEXT, -- JSON block for specialized fields (Motor/Mediclaim specific)
        renewal_acknowledged INTEGER DEFAULT 0, -- 1 if admin has handled the renewal reminder
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `)

    // Add renewal_acknowledged column to existing databases
    const insColumns = db.prepare("PRAGMA table_info(insurances)").all().map(c => c.name)
    if (!insColumns.includes('renewal_acknowledged')) {
      db.exec(`ALTER TABLE insurances ADD COLUMN renewal_acknowledged INTEGER DEFAULT 0`)
    }
    // Performance indexes for 10k+ records
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_cust_code ON customers(cust_code)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_insurances_customer_id ON insurances(customer_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_insurances_expiry_date ON insurances(expiry_date)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_insurances_type ON insurances(insurance_type)`)

    return db
  } catch (err) {
    console.error('Failed to initialize database:', err)
    throw err
  }
}

// Helper to generate Customer Code like ASHOK -> A0001
async function generateCustCode(name) {
  const prefix = name.charAt(0).toUpperCase()
  const lastCustomer = db.prepare('SELECT cust_code FROM customers WHERE cust_code LIKE ? ORDER BY cust_code DESC LIMIT 1')
    .get(`${prefix}%`)

  let nextNum = 1
  if (lastCustomer) {
    const currentNum = parseInt(lastCustomer.cust_code.substring(1))
    nextNum = currentNum + 1
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

function getAllCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all()
}

function getCustomerCount() {
  return db.prepare('SELECT COUNT(*) as count FROM customers').get().count
}

function getCustomer(id) {
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
}

async function addCustomer(data) {
  const id = crypto.randomUUID()
  const cust_code = (data.cust_code && data.cust_code.trim())
    ? data.cust_code.trim().toUpperCase()
    : await generateCustCode(data.name)
  db.prepare(`
    INSERT INTO customers (
      id, cust_code, name, name_as_per_it, phone, address, dob, sex, email,
      pan_number, aadhar_number, pob, father_name, mother_name,
      spouse_name, nominee, nominee_dob, nominee_pan, relation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, cust_code, data.name, data.name_as_per_it || null, data.phone || null, data.address || null,
    data.dob || null, data.sex || null, data.email || null, data.pan_number || null,
    data.aadhar_number || null, data.pob || null, data.father_name || null,
    data.mother_name || null, data.spouse_name || null, data.nominee || null,
    data.nominee_dob || null, data.nominee_pan || null, data.relation || null
  )
  return getCustomer(id)
}

function updateCustomer(id, data) {
  db.prepare(`
    UPDATE customers SET
      name = ?, name_as_per_it = ?, phone = ?, address = ?, dob = ?, sex = ?, email = ?,
      pan_number = ?, aadhar_number = ?, pob = ?, father_name = ?,
      mother_name = ?, spouse_name = ?, nominee = ?, nominee_dob = ?,
      nominee_pan = ?, relation = ?
    WHERE id = ?
  `).run(
    data.name, data.name_as_per_it || null, data.phone || null, data.address || null, data.dob || null,
    data.sex || null, data.email || null, data.pan_number || null,
    data.aadhar_number || null, data.pob || null, data.father_name || null,
    data.mother_name || null, data.spouse_name || null, data.nominee || null,
    data.nominee_dob || null, data.nominee_pan || null, data.relation || null, id
  )
  return getCustomer(id)
}

function deleteCustomer(id) {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id)
}

function parseInsuranceRow(row) {
  let details = {}
  if (row.details) {
    try { details = JSON.parse(row.details) } catch { details = {} }
  }
  return { ...row, details }
}

function getInsurances(customerId) {
  if (customerId) {
    return db.prepare('SELECT * FROM insurances WHERE customer_id = ? ORDER BY expiry_date ASC').all(customerId).map(parseInsuranceRow)
  }
  return db.prepare('SELECT * FROM insurances ORDER BY expiry_date ASC').all().map(parseInsuranceRow)
}

function addInsurance(data) {
  const id = crypto.randomUUID()
  const details = data.details ? JSON.stringify(data.details) : null
  db.prepare(
    'INSERT INTO insurances (id, customer_id, policy_no, insurance_type, insurer, premium, agency_code, expiry_date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, data.customer_id, data.policy_no || null, data.insurance_type,
    data.insurer || null, data.premium || 0, data.agency_code || null,
    data.expiry_date || null, details
  )
  return parseInsuranceRow(db.prepare('SELECT * FROM insurances WHERE id = ?').get(id))
}

function updateInsurance(id, data) {
  const details = data.details ? JSON.stringify(data.details) : null
  db.prepare(
    'UPDATE insurances SET policy_no = ?, insurance_type = ?, insurer = ?, premium = ?, agency_code = ?, expiry_date = ?, details = ? WHERE id = ?'
  ).run(
    data.policy_no || null, data.insurance_type, data.insurer || null,
    data.premium || 0, data.agency_code || null, data.expiry_date || null,
    details, id
  )
  return parseInsuranceRow(db.prepare('SELECT * FROM insurances WHERE id = ?').get(id))
}

function acknowledgeRenewal(id) {
  db.prepare('UPDATE insurances SET renewal_acknowledged = 1 WHERE id = ?').run(id)
  return parseInsuranceRow(db.prepare('SELECT * FROM insurances WHERE id = ?').get(id))
}

function deleteInsurance(id) {
  db.prepare('DELETE FROM insurances WHERE id = ?').run(id)
}

async function seedTestData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM customers').get().count
  if (count > 0) return // Already has data

  const crypto = require('crypto')
  const testCustomers = [
    { name: 'Rajesh Kumar', age: 42, email: 'rajesh.k@example.com', pan_number: 'ABCDE1234F', phone: '9876543210', address: '123, MG Road, Bangalore' },
    { name: 'Priya Sharma', age: 29, email: 'priya.s@outlook.com', pan_number: 'FGHIJ5678K', phone: '9123456789', address: 'Apartment 4B, Skyview, Mumbai' },
    { name: 'Amit Patel', age: 35, email: 'amit.p@gmail.com', pan_number: 'LMNOP9012Q', phone: '9822011022', address: 'Plot 45, Sector 12, Gandhinagar' },
    { name: 'Anjali Gupta', age: 51, email: 'anjali.g@yahoo.com', pan_number: 'RSTUV3456W', phone: '9444055566', address: 'House no 12, Civil Lines, Delhi' },
    { name: 'Vikram Singh', age: 38, email: 'v.singh@army.mil', pan_number: 'XYZAB7890C', phone: '9988776655', address: 'Cantt Area, Chandigarh' },
    { name: 'Sunita Reddy', age: 45, email: 'sunita.r@reddy.me', pan_number: 'DEFGH1122I', phone: '8877665544', address: 'Banjara Hills, Hyderabad' },
    { name: 'Mohammed Ali', age: 31, email: 'ali.m@global.com', pan_number: 'JKLMN3344O', phone: '7766554433', address: 'Free School St, Kolkata' },
    { name: 'Deepa Nair', age: 27, email: 'deepa.n@kerala.gov.in', pan_number: 'PQRST5566U', phone: '6655443322', address: 'Near Railway Station, Kochi' },
    { name: 'Sanjay Varma', age: 58, email: 'sanjay.v@biz.com', pan_number: 'VWXYZ7788A', phone: '5544332211', address: 'High Street, Pune' },
    { name: 'Kavita Iyer', age: 33, email: 'k.iyer@fin.in', pan_number: 'BCDEF9900G', phone: '4433221100', address: 'Nungambakkam, Chennai' }
  ]

  for (let i = 0; i < testCustomers.length; i++) {
    const c = testCustomers[i]
    const customerId = crypto.randomUUID()
    const cust_code = await generateCustCode(c.name)

    db.prepare(`
      INSERT INTO customers (id, cust_code, name, phone, address, dob, email, pan_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId, cust_code, c.name, c.phone, c.address, `19${90 - i}-01-01`, c.email, c.pan_number
    )

    const type = ['Motor', 'Mediclaim', 'General'][i % 3]
    const insurer = ['HDFC ERGO', 'ICICI Lombard', 'Star Health'][i % 3]
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30 + (i * 10))

    let details = {}
    if (type === 'Motor') {
      details = { vehicle_type: 'Private Car', regn_no: `KA-0${i}-AB-123${i}`, make: 'Maruti', model: 'Swift', mfg_year: '2022', cc: '1200', idv: '500000', nil_depreciation: 'Yes' }
    } else if (type === 'Mediclaim') {
      details = { proposer_name: c.name, family_size: '2+2', scheme: 'Family Floater', sum_insured: '500000', policy_expiry: expiry.toISOString().split('T')[0] }
    }

    db.prepare(
      'INSERT INTO insurances (id, customer_id, policy_no, insurance_type, insurer, premium, agency_code, expiry_date, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(), customerId, `POL-00${i}`, type, insurer, 15000 + (i * 1000), `AG-00${i}`, expiry.toISOString().split('T')[0], JSON.stringify(details)
    )
  }
}

function seedLargeData(count = 10000) {
  const crypto = require('crypto')

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, cust_code, name, phone, address, dob, email, pan_number, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertInsurance = db.prepare(`
    INSERT INTO insurances (id, customer_id, policy_no, insurance_type, insurer, premium, agency_code, expiry_date, details) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const generateRandomName = () => {
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Myra', 'Riya', 'Kiara', 'Ira', 'Anika']
    const lastNames = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Gupta', 'Reddy', 'Nair', 'Verma', 'Iyer', 'Chatterjee', 'Das', 'Sen', 'Dutta', 'Roy', 'Mishra', 'Jha', 'Yadav', 'Khan', 'Ali', 'Ahmed']
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
  }

  const transaction = db.transaction((records) => {
    const runId = Date.now().toString().slice(-6)
    for (let i = 0; i < records; i++) {
      const id = crypto.randomUUID()
      const name = generateRandomName()
      const code = `TEST-${runId}-${String(i).padStart(5, '0')}`

      insertCustomer.run(
        id, code, name,
        '9876543210', 'Test Address, India',
        `19${Math.floor(Math.random() * 40) + 60}-01-01`,
        `test${runId}_${i}@example.com`, `ABC${String(i).padStart(5, '0').slice(-5)}DE`,
        new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      )

      // Add 1-3 policies per customer
      const policyCount = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < policyCount; j++) {
        const type = ['General', 'Health', 'Life', 'Personal Accident'][Math.floor(Math.random() * 4)]
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + Math.floor(Math.random() * 365))

        insertInsurance.run(
          crypto.randomUUID(), id, `POL-${i}-${j}`, type,
          'Test Insurer', Math.floor(Math.random() * 50000) + 1000,
          'AG-TEST', expiry.toISOString().split('T')[0],
          JSON.stringify({})
        )
      }
    }
  })

  transaction(count)
  return { success: true, count }
}

function deleteInsurance(id) {
  db.prepare('DELETE FROM insurances WHERE id = ?').run(id)
}

function searchCustomers(query) {
  const q = `%${query}%`
  return db.prepare(`
    SELECT * FROM customers 
    WHERE name LIKE ? 
       OR cust_code LIKE ? 
       OR phone LIKE ? 
       OR address LIKE ? 
       OR email LIKE ? 
       OR pan_number LIKE ? 
       OR aadhar_number LIKE ?
    ORDER BY created_at DESC
  `).all(q, q, q, q, q, q, q)
}

function getDBPath() {
  return path.join(app.getPath('userData'), 'insurance.db')
}

function exportDB(destPath) {
  const fs = require('fs')
  // Validate the destination path is absolute and normalized
  const resolved = path.resolve(destPath)
  if (resolved !== path.normalize(destPath)) {
    throw new Error('Invalid export path')
  }
  // Remove existing file if present (VACUUM INTO fails if file exists)
  if (fs.existsSync(resolved)) {
    fs.unlinkSync(resolved)
  }
  // Use SQLite backup API via VACUUM INTO for a safe, consistent copy
  db.exec(`VACUUM INTO '${resolved.replace(/\\/g, '/').replace(/'/g, "''")}'`)
  return { success: true, path: resolved }
}

function importDB(srcPath) {
  const fs = require('fs')
  if (!fs.existsSync(srcPath)) {
    throw new Error('Backup file not found')
  }
  // Validate that the source is a valid SQLite database
  const testDb = new Database(srcPath, { readonly: true })
  const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name)
  testDb.close()
  if (!tables.includes('customers') || !tables.includes('insurances')) {
    throw new Error('Invalid backup: missing customers or insurances tables')
  }
  // Close current DB, copy over, re-init with full schema migrations
  const destPath = getDBPath()
  db.close()
  fs.copyFileSync(srcPath, destPath)
  db = null
  initDB() // Re-runs schema migrations to add any missing columns
  return { success: true }
}

function getBackupDir() {
  const documentsPath = app.getPath('documents')
  return path.join(documentsPath, 'Insurance Tracking')
}

function toCsvRow(values) {
  return values.map(v => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }).join(',')
}

function autoBackup() {
  const fs = require('fs')
  const backupDir = getBackupDir()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const todayDir = path.join(backupDir, today)

  // Check if today's backup already exists
  if (fs.existsSync(todayDir)) {
    return { skipped: true, reason: 'Today\'s backup already exists', path: todayDir }
  }

  // Create today's backup folder
  fs.mkdirSync(todayDir, { recursive: true })

  // 1. SQLite backup
  const dbBackupPath = path.join(todayDir, 'backup.db').replace(/\\/g, '/').replace(/'/g, "''")
  db.exec(`VACUUM INTO '${dbBackupPath}'`)

  // 2. Customers CSV
  const customers = db.prepare('SELECT * FROM customers').all()
  if (customers.length > 0) {
    const custHeaders = Object.keys(customers[0])
    const custCsv = [toCsvRow(custHeaders), ...customers.map(r => toCsvRow(custHeaders.map(h => r[h])))].join('\n')
    fs.writeFileSync(path.join(todayDir, 'customers.csv'), '\uFEFF' + custCsv, 'utf8') // BOM for Excel
  }

  // 3. Policies CSV (insurances joined with customer name/code for readability)
  const policies = db.prepare(`
    SELECT i.*, c.name AS customer_name, c.cust_code
    FROM insurances i
    LEFT JOIN customers c ON i.customer_id = c.id
    ORDER BY c.name, i.expiry_date
  `).all()
  if (policies.length > 0) {
    const polHeaders = Object.keys(policies[0])
    const polCsv = [toCsvRow(polHeaders), ...policies.map(r => toCsvRow(polHeaders.map(h => r[h])))].join('\n')
    fs.writeFileSync(path.join(todayDir, 'policies.csv'), '\uFEFF' + polCsv, 'utf8') // BOM for Excel
  }

  return { success: true, path: todayDir, date: today }
}

function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

module.exports = {
  initDB,
  closeDB,
  getAllCustomers,
  getCustomerCount,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getInsurances,
  addInsurance,
  updateInsurance,
  acknowledgeRenewal,
  deleteInsurance,
  searchCustomers,
  seedTestData,
  seedLargeData,
  exportDB,
  importDB,
  getDBPath,
  getBackupDir,
  autoBackup,
}
