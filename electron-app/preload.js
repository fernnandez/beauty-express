const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Verifica se o banco está pronto
  isReady: () => ipcRenderer.invoke('db:isReady'),
  
  // Database
  db: {
    isReady: () => ipcRenderer.invoke('db:isReady'),
  },
  
  // Colaboradores
  collaborators: {
    getAll: (searchTerm) => ipcRenderer.invoke('db:collaborators:getAll', searchTerm),
    getById: (id) => ipcRenderer.invoke('db:collaborators:getById', id),
    create: (data) => ipcRenderer.invoke('db:collaborators:create', data),
    update: (id, data) => ipcRenderer.invoke('db:collaborators:update', id, data),
    delete: (id) => ipcRenderer.invoke('db:collaborators:delete', id),
  },

  // Serviços
  services: {
    getAll: (searchTerm) => ipcRenderer.invoke('db:services:getAll', searchTerm),
    getById: (id) => ipcRenderer.invoke('db:services:getById', id),
    create: (data) => ipcRenderer.invoke('db:services:create', data),
    update: (id, data) => ipcRenderer.invoke('db:services:update', id, data),
    delete: (id) => ipcRenderer.invoke('db:services:delete', id),
  },

  // Agendamentos
  appointments: {
    getAll: (date) => ipcRenderer.invoke('db:appointments:getAll', date),
    getById: (id) => ipcRenderer.invoke('db:appointments:getById', id),
    create: (data) => ipcRenderer.invoke('db:appointments:create', data),
    update: (id, data) => ipcRenderer.invoke('db:appointments:update', id, data),
    complete: (id) => ipcRenderer.invoke('db:appointments:complete', id),
    cancel: (id) => ipcRenderer.invoke('db:appointments:cancel', id),
  },

  // Comissões
  commissions: {
    getAll: (filters) => ipcRenderer.invoke('db:commissions:getAll', filters),
    getById: (id) => ipcRenderer.invoke('db:commissions:getById', id),
    calculateForScheduledService: (scheduledServiceId) => ipcRenderer.invoke('db:commissions:calculate:scheduled-service', scheduledServiceId),
    calculateForAppointment: (appointmentId) => ipcRenderer.invoke('db:commissions:calculate:appointment', appointmentId),
    findByCollaborator: (collaboratorId) => ipcRenderer.invoke('db:commissions:by-collaborator', collaboratorId),
    findPending: () => ipcRenderer.invoke('db:commissions:pending'),
    markAsPaid: (ids) => ipcRenderer.invoke('db:commissions:markAsPaid', ids),
    markAsUnpaid: (ids) => ipcRenderer.invoke('db:commissions:markAsUnpaid', ids),
  },

  // Scheduled Services
  scheduledServices: {
    getAll: () => ipcRenderer.invoke('db:scheduled-services:getAll'),
    getById: (id) => ipcRenderer.invoke('db:scheduled-services:getById', id),
    findByAppointmentId: (appointmentId) => ipcRenderer.invoke('db:scheduled-services:by-appointment', appointmentId),
    update: (id, data) => ipcRenderer.invoke('db:scheduled-services:update', id, data),
    complete: (id) => ipcRenderer.invoke('db:scheduled-services:complete', id),
    cancel: (id) => ipcRenderer.invoke('db:scheduled-services:cancel', id),
  },

  // Relatórios
  reports: {
    monthly: (year, month) => ipcRenderer.invoke('db:reports:monthly', year, month),
  },

  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
});

