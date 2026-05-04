import { Controller, Get, Post, Req, Res, Query, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZktecoService } from './zkteco.service';
import * as dayjs from 'dayjs';

@Controller('iclock')
export class ZktecoController {
  private readonly logger = new Logger(ZktecoController.name);

  constructor(private readonly zktecoService: ZktecoService) { }

  // 1. Handshake: El dispositivo sincroniza hora y estado
  @Get('cdata')
  async getRequest(
    @Query('SN') serialNumber: string,
    @Query('options') options: string,
    @Res() res: Response
  ) {
    this.logger.log(`Handshake received from SN: ${serialNumber}, options: ${options}`);
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
        return res.status(200).send('OK');
      }

      this.logger.log(`Received data from SN: ${serialNumber}, table: ${tableType}`);

      if (tableType === 'ATTLOG' && rawText) {
        await this.zktecoService.processAttendanceLogs(serialNumber, rawText, req.ip);
      } else {
        this.logger.debug(`Ignored table ${tableType} from SN: ${serialNumber}`);
      }

      return res.status(200).send('OK');
    } catch (error) {
      this.logger.error(`Error processing ZKTeco data from SN ${serialNumber}: ${error.message}`);
      return res.status(200).send('OK');
    }
  }

  // 3. Comandos: El dispositivo pregunta si hay órdenes (ej: borrar un usuario)
  @Get('getrequest')
  async handleGetRequest(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  }

  // 4. Confirmación: El dispositivo avisa que ejecutó un comando
  @Post('devicecmd')
  async handleDeviceCmd(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  }
}