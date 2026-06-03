import { Controller, Get, Post, Req, Res, Query, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZktecoService } from './zkteco.service';
import * as dayjs from 'dayjs';
import * as path from 'path';
import * as fs from 'fs';

const LOG_FILE_PATH = path.join(process.cwd(), 'zkteco_incoming.log');

@Controller('iclock')
export class ZktecoController {
  private readonly logger = new Logger(ZktecoController.name);

  constructor(private readonly zktecoService: ZktecoService) { }

  private async writeLog(req: Request, type: string, extra: string = '') {
    try {
      const rawText = (req as any).rawBody 
        ? (req as any).rawBody.toString('utf8') 
        : (typeof req.body === 'string' ? req.body : '');

      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress,
        headers: {
          host: req.headers['host'],
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'content-length': req.headers['content-length'],
        },
        query: req.query,
        body: rawText,
        type,
        extra,
      };

      await fs.promises.appendFile(LOG_FILE_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (err) {
      this.logger.error(`Failed to write to zkteco_incoming.log: ${err.message}`);
    }
  }

  // Debug Viewer Page: view all incoming requests and parsed tram data
  @Get('logs')
  async getLogs(@Query('SN') filterSN: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    let logEntries: any[] = [];
    try {
      if (fs.existsSync(LOG_FILE_PATH)) {
        const data = await fs.promises.readFile(LOG_FILE_PATH, 'utf8');
        const lines = data.split('\n').filter(l => l.trim().length > 0);
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (filterSN && entry.query?.SN !== filterSN) {
              continue;
            }
            logEntries.push(entry);
          } catch (e) {
            // ignore malformed lines
          }
        }
        
        // Show newest first
        logEntries.reverse();
        
        // Limit to 500 logs displayed on page to avoid DOM overload
        if (logEntries.length > 500) {
          logEntries = logEntries.slice(0, 500);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to read zkteco_incoming.log: ${err.message}`);
    }

    const html = this.renderLogsHtml(logEntries, filterSN);
    return res.status(200).send(html);
  }

  // Clear Logs Action
  @Post('logs/clear')
  async clearLogs(@Res() res: Response) {
    try {
      await fs.promises.writeFile(LOG_FILE_PATH, '', 'utf8');
    } catch (err) {
      this.logger.error(`Failed to clear logs file: ${err.message}`);
    }
    return res.redirect('/iclock/logs');
  }

  // 1. Handshake: El dispositivo sincroniza hora y estado
  @Get('cdata')
  async getRequest(
    @Query('SN') serialNumber: string,
    @Query('options') options: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log(`Handshake received from SN: ${serialNumber}, options: ${options}`);
    await this.writeLog(req, 'HANDSHAKE', `SN: ${serialNumber}`);
    
    res.setHeader('Content-Type', 'text/plain');

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    // Configuración ADMS más completa para asegurar sincronización
    const response = [
      'GET STAMPER',
      `Stamp=${now}`,
      'TransInterval=1',
      'TransTimes=00:00;23:59',
      'ErrorDelay=60',
      'Delay=30',
      'TransFlag=1111000000',
      'TimeZone=1',
      'Realtime=1',
      ''
    ].join('\r\n');

    return res.status(200).send(response);
  }

  // 2. Recepción de Datos: Aquí ocurre la magia del Service
  @Post('cdata')
  async receiveData(
    @Query('SN') serialNumber: string,
    @Query('table') tableType: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain');

    try {
      const rawText = (req as any).rawBody 
        ? (req as any).rawBody.toString('utf8') 
        : (typeof req.body === 'string' ? req.body : '');

      if (!serialNumber) {
        await this.writeLog(req, 'ERROR_NO_SN', 'Missing SN query parameter');
        return res.status(200).send('OK');
      }

      this.logger.log(`Received data from SN: ${serialNumber}, table: ${tableType}`);
      await this.writeLog(req, `DATA_RECEIVE:${tableType}`, `SN: ${serialNumber}`);

      if (tableType === 'ATTLOG' && rawText) {
        await this.zktecoService.processAttendanceLogs(serialNumber, rawText, req.ip);
      } else {
        this.logger.debug(`Ignored table ${tableType} from SN: ${serialNumber}`);
      }

      return res.status(200).send('OK');
    } catch (error) {
      this.logger.error(`Error processing ZKTeco data from SN ${serialNumber}: ${error.message}`);
      await this.writeLog(req, 'ERROR_PROCESSING', `SN: ${serialNumber}, error: ${error.message}`);
      return res.status(200).send('OK');
    }
  }

  // 3. Comandos: El dispositivo pregunta si hay órdenes (ej: borrar un usuario)
  @Get('getrequest')
  async handleGetRequest(@Req() req: Request, @Res() res: Response) {
    await this.writeLog(req, 'COMMAND_POLL');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  }

  // 4. Confirmación: El dispositivo avisa que ejecutó un comando
  @Post('devicecmd')
  async handleDeviceCmd(@Req() req: Request, @Res() res: Response) {
    await this.writeLog(req, 'COMMAND_CONFIRM');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  }

  private renderLogsHtml(entries: any[], filterSN: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📡 Depuración ADMS ZKTeco - Coagrisan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0b0f19;
      --card-bg: #141b2d;
      --card-border: #1f293d;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --accent-purple: #8b5cf6;
      --accent-sky: #0ea5e9;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      padding: 2rem;
      min-height: 100vh;
      line-height: 1.5;
    }

    header {
      max-width: 1200px;
      margin: 0 auto 2rem auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      font-size: 2rem;
    }

    .brand-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #6366f1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-title p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn {
      padding: 0.6rem 1.2rem;
      font-family: inherit;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--accent-purple));
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
    }

    .btn-danger {
      background-color: transparent;
      color: var(--error);
      border: 1px solid var(--error);
    }

    .btn-danger:hover {
      background-color: rgba(239, 68, 68, 0.1);
      transform: translateY(-1px);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    /* Diagnostics Card */
    .diag-card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }

    .diag-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .diag-item h3 {
      font-size: 0.875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .diag-item p {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .diag-item code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      background-color: rgba(0, 0, 0, 0.3);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: var(--accent-sky);
    }

    /* Form Filter */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 1rem 1.5rem;
      border-radius: 12px;
    }

    .filter-bar label {
      font-weight: 500;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .filter-bar input[type="text"] {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .filter-bar input[type="text"]:focus {
      border-color: var(--primary);
    }

    /* Logs List */
    .logs-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-logs {
      text-align: center;
      padding: 4rem;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      color: var(--text-muted);
    }

    .log-item {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }

    .log-item:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }

    .log-header {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background-color: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .log-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-get {
      background-color: rgba(14, 165, 233, 0.15);
      color: var(--accent-sky);
      border: 1px solid rgba(14, 165, 233, 0.3);
    }

    .badge-post {
      background-color: rgba(139, 92, 246, 0.15);
      color: var(--accent-purple);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .badge-type {
      background-color: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .badge-success {
      background-color: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .log-time {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .log-ip {
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      background-color: rgba(0,0,0,0.2);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .log-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .log-content {
      padding: 1.25rem 1.5rem;
    }

    .params-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .param-tag {
      background-color: rgba(0,0,0,0.15);
      border: 1px solid var(--card-border);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }

    .param-tag span {
      color: var(--text-muted);
    }

    .param-tag strong {
      color: var(--accent-sky);
    }

    .details-box {
      margin-top: 0.75rem;
    }

    .details-box summary {
      font-size: 0.85rem;
      color: var(--primary);
      cursor: pointer;
      user-select: none;
      outline: none;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .details-box summary:hover {
      color: var(--accent-purple);
    }

    .headers-pre {
      background-color: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--card-border);
      padding: 0.75rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
      overflow-x: auto;
      margin-top: 0.5rem;
    }

    .body-pre {
      background-color: #080c14;
      border: 1px solid var(--card-border);
      padding: 1rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #e2e8f0;
      max-height: 300px;
      overflow-y: auto;
    }

    .trama-line {
      display: block;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .trama-line:last-child {
      border-bottom: none;
    }

    .trama-part {
      display: inline-block;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      background-color: rgba(255, 255, 255, 0.05);
      margin-right: 0.3rem;
    }

    .trama-arrow {
      color: var(--accent-purple);
      font-weight: bold;
      margin: 0 0.3rem;
    }

    .trama-pin {
      color: #38bdf8;
      font-weight: 600;
    }

    .trama-date {
      color: #fbbf24;
    }

    .trama-status {
      color: #34d399;
      font-weight: bold;
    }

    .trama-other {
      color: #a78bfa;
    }

    /* Warning banner */
    .warning-banner {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .warning-icon {
      font-size: 1.5rem;
      margin-top: -0.15rem;
    }

    .warning-text h4 {
      font-weight: 600;
      color: #f59e0b;
      margin-bottom: 0.25rem;
    }

    .warning-text p {
      font-size: 0.9rem;
      color: var(--text-main);
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      header {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="brand-logo">📡</span>
      <div class="brand-title">
        <h1>Depuración ADMS ZKTeco</h1>
        <p>Historial de tramas recibidas - Coagrisan</p>
      </div>
    </div>
    <div class="header-actions">
      <a href="/iclock/logs" class="btn btn-primary">
        🔄 Refrescar
      </a>
      <form action="/iclock/logs/clear" method="POST" style="margin: 0;" onsubmit="return confirm('¿Estás seguro de que deseas vaciar todos los registros?');">
        <button type="submit" class="btn btn-danger">
          🗑️ Limpiar Logs
        </button>
      </form>
    </div>
  </header>

  <main class="container">
    
    <!-- Diagnóstico y Advertencias de Red -->
    <div class="warning-banner">
      <span class="warning-icon">⚠️</span>
      <div class="warning-text">
        <h4>Nota de Enrutamiento IP Directo</h4>
        <p>Si la terminal ZKTeco tiene desactivada la opción "Habilitar Servidor de Dominio" y usa la IP <strong>2.136.68.41</strong> directamente, el dispositivo enviará el encabezado <code>Host: 2.136.68.41</code>. Asegúrese de que su servidor Nginx / Proxy Reverso acepte este <code>Host</code> o configure el bloque por defecto para redirigir el tráfico del puerto 443 a esta aplicación NestJS.</p>
      </div>
    </div>

    <div class="diag-card">
      <div class="diag-grid">
        <div class="diag-item">
          <h3>Ruta del Archivo</h3>
          <code>zkteco_incoming.log</code>
        </div>
        <div class="diag-item">
          <h3>Total Registros</h3>
          <p>${entries.length} ${filterSN ? '(filtrados)' : ''}</p>
        </div>
        <div class="diag-item">
          <h3>Hora del Servidor</h3>
          <p>${new Date().toLocaleTimeString('es-ES')} (${new Date().toLocaleDateString('es-ES')})</p>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda/Filtro -->
    <form class="filter-bar" method="GET" action="/iclock/logs">
      <label for="SN">Filtrar por Número de Serie (SN):</label>
      <input type="text" id="SN" name="SN" placeholder="Ej: SN_DISPOSITIVO_01" value="${filterSN || ''}">
      <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Filtrar</button>
      ${filterSN ? '<a href="/iclock/logs" class="btn" style="color: var(--text-muted); border: 1px solid var(--card-border);">Quitar Filtro</a>' : ''}
    </form>

    <!-- Lista de Logs -->
    <div class="logs-container">
      ${entries.length === 0 ? `
        <div class="no-logs">
          <p>No se encontraron registros de peticiones de ZKTeco en el archivo.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Las peticiones a <code>/iclock/cdata</code> se registrarán aquí automáticamente.</p>
        </div>
      ` : entries.map(entry => {
        const isPost = entry.method === 'POST';
        const badgeClass = isPost ? 'badge-post' : 'badge-get';
        const formattedDate = new Date(entry.timestamp).toLocaleString('es-ES');
        
        // Parse raw body for nice viewing if it contains tabs
        let formattedBody = '';
        if (entry.body) {
          const lines = entry.body.split('\n').filter(l => l.trim().length > 0);
          formattedBody = lines.map(line => {
            const parts = line.split('\t');
            if (parts.length >= 2) {
              const pin = parts[0] || '';
              const time = parts[1] || '';
              const status = parts[2] || '';
              const rest = parts.slice(3).join('\t');
              
              let statusDesc = status;
              if (status === '0') statusDesc = '0 (Entrada)';
              else if (status === '1') statusDesc = '1 (Salida)';
              
              return `<span class="trama-line">` +
                `<span class="trama-part trama-pin" title="PIN de Empleado">${pin}</span>` +
                `<span class="trama-arrow">➔</span>` +
                `<span class="trama-part trama-date" title="Fecha/Hora">${time}</span>` +
                `<span class="trama-arrow">➔</span>` +
                `<span class="trama-part trama-status" title="Estado">${statusDesc}</span>` +
                (rest ? `<span class="trama-arrow">➔</span><span class="trama-part trama-other" title="Otros parámetros">${rest}</span>` : '') +
                `</span>`;
            }
            return `<span class="trama-line">${line}</span>`;
          }).join('');
        }

        return `
          <div class="log-item">
            <div class="log-header">
              <div class="log-header-left">
                <span class="badge ${badgeClass}">${entry.method}</span>
                <span class="badge badge-type">${entry.type || 'RAW'}</span>
                <span class="log-time">${formattedDate}</span>
                <span class="log-ip" title="IP de origen">${entry.ip}</span>
              </div>
              <span class="log-url">${entry.url}</span>
            </div>
            <div class="log-content">
              <!-- Query Params -->
              <div class="params-group">
                ${Object.entries(entry.query || {}).map(([key, val]) => `
                  <div class="param-tag">
                    <span>${key}:</span> <strong>${val}</strong>
                  </div>
                `).join('')}
                ${Object.keys(entry.query || {}).length === 0 ? '<span style="font-size: 0.8rem; color: var(--text-muted);">Sin Query Params</span>' : ''}
              </div>

              <!-- Headers details -->
              <div class="details-box">
                <details>
                  <summary>Ver Headers de la Petición</summary>
                  <pre class="headers-pre">${JSON.stringify(entry.headers, null, 2)}</pre>
                </details>
              </div>

              <!-- Body data -->
              ${entry.body ? `
                <div style="margin-top: 1rem;">
                  <h4 style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Cuerpo de la Petición (Trama ADMS):</h4>
                  <div class="body-pre">
                    ${formattedBody}
                  </div>
                </div>
              ` : ''}
              
              ${entry.extra ? `
                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
                  Info adicional: ${entry.extra}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </main>
</body>
</html>`;
  }
}