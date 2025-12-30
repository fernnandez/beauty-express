import 'reflect-metadata';
import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { initializeDatabase, closeDatabase } from './src/database/database';
import { getServices } from './src/services';

let mainWindow: BrowserWindow | null = null;
let dbReady = false;

// Cria a janela principal
function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('📄 Caminho do preload:', preloadPath);
  const fs = require('fs');
  if (fs.existsSync(preloadPath)) {
    console.log('✅ Preload.js encontrado');
  } else {
    console.error('❌ Preload.js NÃO encontrado em:', preloadPath);
  }
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Não mostra a janela até estar pronta
    backgroundColor: '#ff8c69', // Cor de fundo enquanto carrega (cor do splash)
  });

  // Carrega o React app
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    // Aguarda o preload ser carregado antes de carregar a URL
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('✅ Preload carregado e página pronta');
      // Mostra a janela quando estiver pronta
      mainWindow?.show();
    });
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, o renderer-dist está no dist
    const rendererPath = path.join(__dirname, 'renderer-dist', 'index.html');
    console.log('📄 Carregando renderer de:', rendererPath);
    mainWindow.loadFile(rendererPath);
    // Mostra a janela quando estiver pronta e garante que está na rota "/"
    mainWindow.webContents.once('did-finish-load', () => {
      // Garante que a aplicação inicia na rota Dashboard
      mainWindow?.webContents.executeJavaScript(`
        if (window.location.pathname !== '/') {
          window.history.replaceState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      `).catch(console.error);
      mainWindow?.show();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Cria o menu da aplicação
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Colaborador',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-collaborator');
          },
        },
        {
          label: 'Novo Serviço',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-service');
          },
        },
        {
          label: 'Novo Agendamento',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-appointment');
          },
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-dashboard');
          },
        },
        {
          label: 'Colaboradores',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-collaborators');
          },
        },
        {
          label: 'Serviços',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-services');
          },
        },
        {
          label: 'Agendamentos',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-appointments');
          },
        },
        {
          label: 'Comissões',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-commissions');
          },
        },
        {
          label: 'Relatórios',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'view-reports');
          },
        },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Sobre Beauty Express',
              message: 'Beauty Express',
              detail: 'Sistema de gestão para salões de beleza\nVersão 1.0.0',
            });
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handlers IPC para comunicação com o renderer
function setupIpcHandlers() {
  const services = getServices();

  // Verifica se o banco está pronto
  ipcMain.handle('db:isReady', async () => {
    return dbReady;
  });

  // Colaboradores
  ipcMain.handle('db:collaborators:getAll', async (event, searchTerm) => {
    return services.collaborators.findAll(searchTerm);
  });

  ipcMain.handle('db:collaborators:getById', async (event, id) => {
    return services.collaborators.findOne(id);
  });

  ipcMain.handle('db:collaborators:create', async (event, data) => {
    try {
      console.log('📝 Criando colaborador:', data);
      const result = await services.collaborators.create(data);
      console.log('✅ Colaborador criado:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ Erro ao criar colaborador:', error);
      throw error;
    }
  });

  ipcMain.handle('db:collaborators:update', async (event, id, data) => {
    return services.collaborators.update(id, data);
  });

  ipcMain.handle('db:collaborators:delete', async (event, id) => {
    return services.collaborators.remove(id);
  });

  // Serviços
  ipcMain.handle('db:services:getAll', async (event, searchTerm) => {
    return services.services.findAll(searchTerm);
  });

  ipcMain.handle('db:services:getById', async (event, id) => {
    return services.services.findOne(id);
  });

  ipcMain.handle('db:services:create', async (event, data) => {
    return services.services.create(data);
  });

  ipcMain.handle('db:services:update', async (event, id, data) => {
    return services.services.update(id, data);
  });

  ipcMain.handle('db:services:delete', async (event, id) => {
    return services.services.remove(id);
  });

  // Agendamentos
  ipcMain.handle('db:appointments:getAll', async (event, date) => {
    return services.appointments.findAll(date);
  });

  ipcMain.handle('db:appointments:getById', async (event, id) => {
    return services.appointments.findById(id);
  });

  ipcMain.handle('db:appointments:create', async (event, data) => {
    return services.appointments.create(data);
  });

  ipcMain.handle('db:appointments:update', async (event, id, data) => {
    return services.appointments.update(id, data);
  });

  ipcMain.handle('db:appointments:complete', async (event, id) => {
    return services.appointments.complete(id);
  });

  ipcMain.handle('db:appointments:cancel', async (event, id) => {
    return services.appointments.cancel(id);
  });

  // Comissões
  ipcMain.handle('db:commissions:getAll', async (event, filters) => {
    return services.commissions.findAll(filters);
  });

  ipcMain.handle('db:commissions:getById', async (event, id) => {
    return services.commissions.findById(id);
  });

  ipcMain.handle('db:commissions:calculate:scheduled-service', async (event, scheduledServiceId) => {
    return services.commissions.calculateCommission(scheduledServiceId);
  });

  ipcMain.handle('db:commissions:calculate:appointment', async (event, appointmentId) => {
    return services.commissions.calculateCommissionsForAppointment(appointmentId);
  });

  ipcMain.handle('db:commissions:by-collaborator', async (event, collaboratorId) => {
    return services.commissions.findByCollaboratorId(collaboratorId);
  });

  ipcMain.handle('db:commissions:pending', async () => {
    return services.commissions.findPending();
  });

  ipcMain.handle('db:commissions:markAsPaid', async (event, ids) => {
    return services.commissions.markAsPaid(ids);
  });

  ipcMain.handle('db:commissions:markAsUnpaid', async (event, ids) => {
    return services.commissions.markAsUnpaid(ids);
  });

  // Scheduled Services
  ipcMain.handle('db:scheduled-services:getAll', async () => {
    return services.scheduledServices.findAll();
  });

  ipcMain.handle('db:scheduled-services:getById', async (event, id) => {
    return services.scheduledServices.findById(id);
  });

  ipcMain.handle('db:scheduled-services:by-appointment', async (event, appointmentId) => {
    return services.scheduledServices.findByAppointmentId(appointmentId);
  });

  ipcMain.handle('db:scheduled-services:update', async (event, id, data) => {
    return services.scheduledServices.updateScheduledService(id, data);
  });

  ipcMain.handle('db:scheduled-services:complete', async (event, id) => {
    return services.scheduledServices.completeScheduledService(id);
  });

  ipcMain.handle('db:scheduled-services:cancel', async (event, id) => {
    return services.scheduledServices.cancelScheduledService(id);
  });

  // Appointment Total Price
  ipcMain.handle('db:appointments:total-price', async (event, id) => {
    return services.appointments.getAppointmentTotalPrice(id);
  });

  // Relatórios Financeiros
  ipcMain.handle('db:reports:monthly', async (event, year, month) => {
    return services.reports.getMonthlyReport(year, month);
  });
}

// Quando o Electron estiver pronto
app.whenReady().then(async () => {
  try {
    // Inicializa o banco de dados primeiro
    console.log('🚀 Inicializando banco de dados...');
    await initializeDatabase();
    dbReady = true;
    console.log('✅ Banco de dados pronto!');

    // Depois cria a janela
    createWindow();
    createMenu();
    setupIpcHandlers();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    console.error('Stack trace:', error.stack);
    
    const errorMessage = error.message || 'Erro desconhecido';
    const platformInfo = `Plataforma: ${process.platform}\nArquitetura: ${process.arch}`;
    
    dialog.showErrorBox(
      'Erro ao Iniciar - Beauty Express',
      `Não foi possível inicializar o aplicativo.\n\n${errorMessage}\n\n${platformInfo}\n\n` +
      `Se o problema persistir, verifique:\n` +
      `- Permissões de escrita no diretório do usuário\n` +
      `- Antivírus não está bloqueando o aplicativo\n` +
      `- Reinstale o aplicativo se necessário`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('🛑 Encerrando aplicação...');
  await closeDatabase();
});

