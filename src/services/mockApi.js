// Mock API service for document tracking
// Simulates REST API endpoints

const STORAGE_KEY = 'nca_file_tracking_data'
const USERS_STORAGE_KEY = 'nca_users_data'
const RECIPIENTS_KEY = 'nca_recipients'
const FORMS_KEY = 'nca_forms'
const LINKS_KEY = 'nca_form_recipient_links'
const TRANSFERS_KEY = 'nca_transfers'

// Sample sign-in accounts (always available)
const SAMPLE_USERS = [
  { id: '1', username: 'admin', password: 'admin', role: 'admin', division: 'Admin', name: 'System Administrator' },
  { id: '2', username: 'secretary', password: 'password', role: 'secretary', division: 'Secretary', name: 'Secretary' },
  { id: '3', username: 'ddg-t0', password: 'password', role: 'user', division: 'DDG-T0', name: 'DDG-T0 User' },
  { id: '4', username: 'dg', password: 'password', role: 'user', division: 'DG', name: 'DG User' },
  { id: '5', username: 'all-units', password: 'password', role: 'user', division: 'ALL UNITS', name: 'All Units User' },
  { id: '6', username: 'finance', password: 'password', role: 'user', division: 'Finance', name: 'Finance User' },
  { id: '7', username: 'hr', password: 'password', role: 'user', division: 'HR', name: 'HR User' },
  { id: '8', username: 'it', password: 'password', role: 'user', division: 'IT', name: 'IT User' },
  { id: '9', username: 'operations', password: 'password', role: 'user', division: 'Operations', name: 'Operations User' },
  { id: '10', username: 'marketing', password: 'password', role: 'user', division: 'Marketing', name: 'Marketing User' }
]

const DEMO_USERNAMES = ['admin', 'secretary', 'finance']

const initializeUsers = () => {
  let users = []
  try {
    const existing = localStorage.getItem(USERS_STORAGE_KEY)
    if (existing) users = JSON.parse(existing)
    if (!Array.isArray(users)) users = []
  } catch (_) {
    users = []
  }

  const byUsername = {}
  users.forEach(u => { if (u && u.username) byUsername[u.username] = u })
  SAMPLE_USERS.forEach(sample => {
    if (!byUsername[sample.username]) {
      users.push(sample)
      byUsername[sample.username] = sample
    } else if (DEMO_USERNAMES.includes(sample.username)) {
      const idx = users.findIndex(u => u && u.username === sample.username)
      if (idx !== -1) users[idx] = { ...sample, id: users[idx].id }
    }
  })

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

// Initialize mock data
const initializeMockData = () => {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    const mockDocuments = [
      {
        id: '1',
        category: 'DDG-T0',
        dateReceived: '2024-01-15',
        registryNumber: 'REG-2024-001',
        receivedFrom: 'Finance',
        dateOfLetter: '2024-01-14',
        numberOfLetters: 1,
        subject: 'Q4 Financial Report',
        signature: 'John Doe',
        status: 'pending',
        rejected: false,
        rejectionNote: '',
        sentTo: 'DDG-T0',
        createdAt: '2024-01-15T10:30:00',
        createdBy: 'admin'
      },
      {
        id: '2',
        category: 'DG',
        dateReceived: '2024-01-16',
        registryNumber: 'REG-2024-002',
        receivedFrom: 'HR',
        dateOfLetter: '2024-01-15',
        numberOfLetters: 2,
        subject: 'HR Policy Update',
        signature: 'Jane Smith',
        status: 'confirmed',
        rejected: false,
        rejectionNote: '',
        sentTo: 'DG',
        createdAt: '2024-01-16T14:20:00',
        createdBy: 'admin'
      }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDocuments))
  }
}

// User management
export const getUsers = () => {
  initializeUsers()
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY)
    return Promise.resolve(JSON.parse(data || '[]'))
  } catch (err) {
    console.warn('Failed to parse users data:', err)
    return Promise.resolve([])
  }
}

/** Users linked to a given division (by division name). */
export const getUsersByDivision = (divisionName) => {
  return getUsers().then(users =>
    users.filter(u => u.division && String(u.division).trim() === String(divisionName).trim())
  )
}

export const createUser = (userData) => {
  try {
    initializeUsers()
    const data = localStorage.getItem(USERS_STORAGE_KEY)
    const users = JSON.parse(data || '[]')

    const username = userData.username != null ? String(userData.username).trim() : ''
    const password = userData.password != null ? String(userData.password).trim() : ''
    const role = userData.role || 'user'
    if (!username) {
      return Promise.reject(new Error('Username is required.'))
    }
    if (users.some(u => u.username && String(u.username).trim().toLowerCase() === username.toLowerCase())) {
      return Promise.reject(new Error('That username is already in use.'))
    }
    if (role !== 'admin') {
      initializeRecipients()
      const divisions = JSON.parse(localStorage.getItem(RECIPIENTS_KEY) || '[]')
      if (!Array.isArray(divisions) || divisions.length === 0) {
        return Promise.reject(new Error('Create at least one division before adding users.'))
      }
      const division = userData.division != null ? String(userData.division).trim() : ''
      if (!division) {
        return Promise.reject(new Error('Division is required for this role.'))
      }
    }

    const newUser = {
      id: Date.now().toString(),
      name: userData.name != null ? String(userData.name).trim() : username,
      username,
      password,
      role,
      division: userData.division != null ? String(userData.division).trim() : '',
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    return Promise.resolve(newUser)
  } catch (err) {
    return Promise.reject(new Error('Failed to create user: ' + err.message))
  }
}

export const updateUser = (id, updates) => {
  initializeUsers()
  const data = localStorage.getItem(USERS_STORAGE_KEY)
  const users = JSON.parse(data || '[]')
  
  const index = users.findIndex(u => u.id === id)
  if (index === -1) {
    return Promise.reject(new Error('User not found'))
  }
  
  // Only update password if provided (store trimmed so login works)
  const updateData = { ...updates }
  if (!updateData.password || String(updateData.password).trim() === '') {
    delete updateData.password
  } else {
    updateData.password = String(updateData.password).trim()
  }

  users[index] = { ...users[index], ...updateData }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  return Promise.resolve(users[index])
}

export const deleteUser = (id) => {
  initializeUsers()
  const data = localStorage.getItem(USERS_STORAGE_KEY)
  const users = JSON.parse(data || '[]')
  
  const filtered = users.filter(u => u.id !== id)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered))
  return Promise.resolve({ success: true })
}

// Document management
export const getDocuments = (category = null) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  let documents = JSON.parse(data || '[]')
  
  if (category) {
    documents = documents.filter(d => d.category === category)
  }
  
  return Promise.resolve(documents)
}

export const getDocumentById = (id) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  const document = documents.find(d => d.id === id)
  return Promise.resolve(document || null)
}

export const getIncomingDocuments = (userDivision) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  const incoming = documents.filter(d => d.sentTo === userDivision && !d.rejected)
  return Promise.resolve(incoming)
}

export const getRejectedDocuments = (userDivision = null) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  let documents = JSON.parse(data || '[]')
  documents = documents.filter(d => d.rejected === true)
  
  if (userDivision) {
    documents = documents.filter(d => d.sentTo === userDivision)
  }
  
  return Promise.resolve(documents)
}

export const getCompletedDocuments = (userDivision = null) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  let documents = JSON.parse(data || '[]')
  documents = documents.filter(d => d.status === 'confirmed')
  
  if (userDivision) {
    documents = documents.filter(d => d.sentTo === userDivision || d.category === userDivision)
  }
  
  return Promise.resolve(documents)
}

export const createDocument = (documentData) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  
  const newDocument = {
    id: Date.now().toString(),
    ...documentData,
    rejected: false,
    rejectionNote: '',
    status: documentData.status || 'pending',
    createdAt: new Date().toISOString()
  }
  
  documents.push(newDocument)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
  return Promise.resolve(newDocument)
}

export const updateDocument = (id, updates) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  
  const index = documents.findIndex(d => d.id === id)
  if (index === -1) {
    return Promise.reject(new Error('Document not found'))
  }
  
  documents[index] = { ...documents[index], ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
  return Promise.resolve(documents[index])
}

export const deleteDocument = (id) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  
  const filtered = documents.filter(d => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return Promise.resolve({ success: true })
}

export const rejectDocument = (id, rejectionNote) => {
  initializeMockData()
  const data = localStorage.getItem(STORAGE_KEY)
  const documents = JSON.parse(data || '[]')
  
  const index = documents.findIndex(d => d.id === id)
  if (index === -1) {
    return Promise.reject(new Error('Document not found'))
  }
  
  documents[index] = {
    ...documents[index],
    rejected: true,
    rejectionNote
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
  return Promise.resolve(documents[index])
}

// Mock login — matches on trimmed username; password must match exactly as stored
export const login = (username, password) => {
  initializeUsers()
  const data = localStorage.getItem(USERS_STORAGE_KEY)
  const users = JSON.parse(data || '[]')
  const trimmedUsername = username != null ? String(username).trim() : ''
  const trimmedPassword = password != null ? String(password).trim() : ''

  const user = users.find(
    u => u.username != null && String(u.username).trim() === trimmedUsername && String(u.password || '').trim() === trimmedPassword
  )
  
  if (user) {
    return Promise.resolve({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        division: user.division,
        name: user.name
      }
    })
  }
  
  return Promise.resolve({
    success: false,
    error: 'Invalid credentials'
  })
}

// --- Recipients ---
/** Default recipient name and id for linking forms used when sending to an internal person. */
const DEFAULT_USER_RECIPIENT_NAME = 'User'
const DEFAULT_USER_RECIPIENT_ID = 'default-user-recipient'

const initializeRecipients = () => {
  let list = []
  try {
    const existing = localStorage.getItem(RECIPIENTS_KEY)
    if (existing) list = JSON.parse(existing)
    if (!Array.isArray(list)) list = []
  } catch (_) {
    list = []
  }
  const hasUser = list.some(r => r.name === DEFAULT_USER_RECIPIENT_NAME || r.id === DEFAULT_USER_RECIPIENT_ID)
  if (!hasUser) {
    list.unshift({
      id: DEFAULT_USER_RECIPIENT_ID,
      name: DEFAULT_USER_RECIPIENT_NAME,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(list))
  }
}

export const getRecipients = () => {
  initializeRecipients()
  const data = localStorage.getItem(RECIPIENTS_KEY)
  return Promise.resolve(JSON.parse(data || '[]'))
}

/** Id of the default "User" recipient (form linked here is shown when sending to an internal person). */
export const getDefaultUserRecipientId = () => DEFAULT_USER_RECIPIENT_ID

export const createRecipient = (name) => {
  initializeRecipients()
  const data = localStorage.getItem(RECIPIENTS_KEY)
  const list = JSON.parse(data || '[]')
  const newRecipient = { id: Date.now().toString(), name, createdAt: new Date().toISOString() }
  list.push(newRecipient)
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(list))
  return Promise.resolve(newRecipient)
}

export const updateRecipient = (id, updates) => {
  initializeRecipients()
  const data = localStorage.getItem(RECIPIENTS_KEY)
  const list = JSON.parse(data || '[]')
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) return Promise.reject(new Error('Recipient not found'))
  list[idx] = { ...list[idx], ...updates }
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(list))
  return Promise.resolve(list[idx])
}

export const deleteRecipient = (id) => {
  initializeRecipients()
  if (id === DEFAULT_USER_RECIPIENT_ID) {
    return Promise.reject(new Error('The default "User" recipient cannot be deleted.'))
  }
  const data = localStorage.getItem(RECIPIENTS_KEY)
  const list = JSON.parse(data || '[]').filter(r => r.id !== id)
  localStorage.setItem(RECIPIENTS_KEY, JSON.stringify(list))
  return Promise.resolve({ success: true })
}

// --- Forms (with question types: date, short, long) ---
const initializeForms = () => {
  const existing = localStorage.getItem(FORMS_KEY)
  if (!existing) {
    localStorage.setItem(FORMS_KEY, JSON.stringify([]))
  }
}

export const getForms = () => {
  initializeForms()
  const data = localStorage.getItem(FORMS_KEY)
  return Promise.resolve(JSON.parse(data || '[]'))
}

export const getFormById = (id) => {
  initializeForms()
  const data = localStorage.getItem(FORMS_KEY)
  const list = JSON.parse(data || '[]')
  const form = list.find(f => f.id === id)
  return Promise.resolve(form || null)
}

export const createForm = (formData) => {
  initializeForms()
  const data = localStorage.getItem(FORMS_KEY)
  const list = JSON.parse(data || '[]')
  const newForm = {
    id: Date.now().toString(),
    name: formData.name || 'Untitled Form',
    questions: formData.questions || [],
    createdAt: new Date().toISOString()
  }
  list.push(newForm)
  localStorage.setItem(FORMS_KEY, JSON.stringify(list))
  return Promise.resolve(newForm)
}

export const updateForm = (id, updates) => {
  initializeForms()
  const data = localStorage.getItem(FORMS_KEY)
  const list = JSON.parse(data || '[]')
  const idx = list.findIndex(f => f.id === id)
  if (idx === -1) return Promise.reject(new Error('Form not found'))
  list[idx] = { ...list[idx], ...updates }
  localStorage.setItem(FORMS_KEY, JSON.stringify(list))
  return Promise.resolve(list[idx])
}

export const deleteForm = (id) => {
  initializeForms()
  const data = localStorage.getItem(FORMS_KEY)
  const list = JSON.parse(data || '[]').filter(f => f.id !== id)
  localStorage.setItem(FORMS_KEY, JSON.stringify(list))
  return Promise.resolve({ success: true })
}

// --- Form-Recipient Links ---
const initializeLinks = () => {
  const existing = localStorage.getItem(LINKS_KEY)
  if (!existing) {
    localStorage.setItem(LINKS_KEY, JSON.stringify([]))
  }
}

export const getLinks = () => {
  initializeLinks()
  const data = localStorage.getItem(LINKS_KEY)
  return Promise.resolve(JSON.parse(data || '[]'))
}

export const getLinksByRecipient = (recipientId) => {
  return getLinks().then(links => links.filter(l => l.recipientId === recipientId))
}

export const getLinkByRecipient = (recipientId) => {
  return getLinks().then(links => links.find(l => l.recipientId === recipientId))
}

export const createLink = (recipientId, formId) => {
  initializeLinks()
  const data = localStorage.getItem(LINKS_KEY)
  const list = JSON.parse(data || '[]')
  const existing = list.find(l => l.recipientId === recipientId)
  if (existing) {
    existing.formId = formId
    localStorage.setItem(LINKS_KEY, JSON.stringify(list))
    return Promise.resolve(existing)
  }
  const newLink = { id: Date.now().toString(), recipientId, formId, createdAt: new Date().toISOString() }
  list.push(newLink)
  localStorage.setItem(LINKS_KEY, JSON.stringify(list))
  return Promise.resolve(newLink)
}

export const deleteLink = (id) => {
  initializeLinks()
  const data = localStorage.getItem(LINKS_KEY)
  const list = JSON.parse(data || '[]').filter(l => l.id !== id)
  localStorage.setItem(LINKS_KEY, JSON.stringify(list))
  return Promise.resolve({ success: true })
}

// --- Transfers (sent records with form data) ---
const initializeTransfers = () => {
  const existing = localStorage.getItem(TRANSFERS_KEY)
  if (!existing) {
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify([]))
  }
}

export const createTransfer = (transferData) => {
  initializeTransfers()
  const data = localStorage.getItem(TRANSFERS_KEY)
  const list = JSON.parse(data || '[]')
  const newTransfer = {
    id: Date.now().toString(),
    recipientId: transferData.recipientId,
    recipientName: transferData.recipientName,
    formId: transferData.formId,
    sentBy: transferData.sentBy,
    sentByName: transferData.sentByName,
    formData: transferData.formData || {},
    status: 'pending',
    correctionNote: '',
    createdAt: new Date().toISOString()
  }
  list.push(newTransfer)
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(list))
  return Promise.resolve(newTransfer)
}

export const getTransfers = () => {
  initializeTransfers()
  const data = localStorage.getItem(TRANSFERS_KEY)
  return Promise.resolve(JSON.parse(data || '[]'))
}

export const getTransfersSentToRecipient = (recipientId) => {
  return getTransfers().then(t => t.filter(x => x.recipientId === recipientId))
}

export const getTransfersSentToUser = (userDivisionOrId) => {
  return getTransfers().then(list =>
    list.filter(t => t.recipientId === userDivisionOrId || t.recipientName === userDivisionOrId)
  )
}

export const getCompletedTransfers = () => {
  return getTransfers().then(list => list.filter(t => t.status === 'accepted'))
}

/** Completed transfers for a given division/recipient (by recipient id or name). */
export const getCompletedTransfersByRecipient = (recipientId) => {
  return getCompletedTransfers().then(list =>
    list.filter(t => t.recipientId === recipientId)
  )
}

/** All transfers for a given division/recipient (pending, accepted, cancelled). */
export const getTransfersByRecipientAll = (recipientId) => {
  return getTransfers().then(list =>
    list.filter(t => t.recipientId === recipientId)
  )
}

/** All internal transfers (sent to user ids). */
export const getTransfersInternalAll = () => {
  return Promise.all([getTransfers(), getUsers()]).then(([list, users]) => {
    const userIds = new Set((users || []).map(u => u.id))
    return list.filter(t => userIds.has(t.recipientId))
  })
}

/** All internal transfers for one user (sent to or sent by). */
export const getTransfersInternalByUserAll = (user) => {
  const id = user?.id
  const username = user?.username
  return getTransfersInternalAll().then(list =>
    list.filter(t =>
      t.recipientId === id || t.sentBy === id || t.sentBy === username
    )
  )
}

/** Completed transfers involving a user: sent by this user or received by their division. */
export const getCompletedTransfersByUser = (user) => {
  const id = user?.id
  const username = user?.username
  const division = user?.division
  return getCompletedTransfers().then(list =>
    list.filter(t =>
      t.sentBy === id || t.sentBy === username || t.recipientName === division
    )
  )
}

/** Completed transfers sent to internal (user) recipients only. */
export const getCompletedTransfersInternal = () => {
  return Promise.all([getCompletedTransfers(), getUsers()]).then(([list, users]) => {
    const userIds = new Set((users || []).map(u => u.id))
    return list.filter(t => userIds.has(t.recipientId))
  })
}

/** Completed internal transfers for one user (sent to or sent by). */
export const getCompletedTransfersInternalByUser = (user) => {
  const id = user?.id
  const username = user?.username
  return getCompletedTransfersInternal().then(list =>
    list.filter(t =>
      t.recipientId === id || t.sentBy === id || t.sentBy === username
    )
  )
}

export const updateTransfer = (id, updates) => {
  initializeTransfers()
  const data = localStorage.getItem(TRANSFERS_KEY)
  const list = JSON.parse(data || '[]')
  const idx = list.findIndex(t => t.id === id)
  if (idx === -1) return Promise.reject(new Error('Transfer not found'))
  list[idx] = { ...list[idx], ...updates }
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(list))
  return Promise.resolve(list[idx])
}

export const acceptTransfer = (id) => {
  return updateTransfer(id, { status: 'accepted' })
}

export const cancelTransfer = (id) => {
  return updateTransfer(id, { status: 'cancelled' })
}
