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
    @Res() res: Response
  ) {
    this.logger.log(`Handshake received from SN: ${serialNumber}`);
    res.setHeader('Content-Type', 'text/plain');

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return res.status(200).send(`GET STAMPER\r\nStamp=${now}\r\n`);
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
      // Extraemos el cuerpo crudo (ZKTeco envía texto plano con tabulaciones)
      const rawText = (req as any).rawBody 
        ? (req as any).rawBody.toString('utf8') 
        : (typeof req.body === 'string' ? req.body : '');

      if (!rawText || !serialNumber) {
        return res.status(200).send('OK');
      }

      // IMPORTANTE: Solo procesamos si la tabla es de asistencias (ATTLOG)
      if (tableType === 'ATTLOG') {
        this.logger.log(`Processing ATTLOG for SN: ${serialNumber}`);
        
        // LLAMADA AL SERVICIO: Aquí se crean los Tasks y Clocks
        await this.zktecoService.processAttendanceLogs(serialNumber, rawText);
      }

      // ZKTeco espera un "OK" para saber que recibimos los datos y no re-enviarlos
      return res.status(200).send('OK');
    } catch (error) {
      this.logger.error(`Error processing ZKTeco data: ${error.message}`);
      // Respondemos OK incluso en error para evitar que el dispositivo se bloquee re-intentando
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