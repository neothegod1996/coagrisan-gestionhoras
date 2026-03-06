# ⚙️ Guía de Integración Técnica: Terminales ZKTeco (Coagrisan)

Esta guía detalla la configuración técnica para que los dispositivos biométricos gestionen automáticamente el ciclo de vida de las jornadas laborales (`task_tracker`) mediante el envío de tramas de datos vía ADMS.

### 1. El Formato de Datos (Trama de Asistencia)

El dispositivo no envía archivos; envía líneas de texto plano (`text/plain`) mediante peticiones **POST**. Es vital que el técnico sepa que cada fichaje se traduce en una cadena con este formato:

`PIN` + `TABULACIÓN` + `FECHA/HORA` + `TABULACIÓN` + `ESTADOS...`

* **Ejemplo de trama:** `53453543	2026-03-05 08:00:00	0	0	0	0	0`
* **PIN:** Es el ID del empleado que el sistema buscará en la base de datos.
* **Fecha/Hora:** Formato estándar `AAAA-MM-DD HH:mm:ss`. El servidor usa este dato exacto para el inicio o fin de la tarea.

---

### 2. Sincronización de Identidad (ID de Usuario)

La "llave" para que el servidor procese la trama es el ID enviado:

* **ID Reloj = `card_id` / `device_pin` (Web):** El ID de usuario configurado en el menú del reloj debe ser idéntico al que figura en la plataforma web.
* **Auto-vinculación:** Si el empleado tiene un `card_id` registrado pero su campo `device_pin` está vacío, el servidor detectará el PIN de la trama y lo vinculará automáticamente tras el primer fichaje exitoso.

---

### 3. Configuración del Servidor ADMS (Cloud Server)

El técnico debe configurar el dispositivo para que apunte al "Proxy" del Frontend:

| Parámetro | Valor Requerido | Nota |
| --- | --- | --- |
| **Dirección del Servidor** | `fichajes.coagrisan.com` | Punto de entrada del sistema. |
| **Puerto del Servidor** | `443` | Puerto estándar HTTPS. |
| **Habilitar Servidor Dominio** | **SÍ** | Para resolver la URL. |
| **Habilitar HTTPS** | **SÍ** | Cifra la comunicación de los datos. |
| **Intervalo de Envío** | `1` | Envío en tiempo real (en minutos). |

---

### 4. Ciclo de Vida de la Tarea (`task_tracker`)

El sistema decide qué hacer con la fecha recibida en la trama según el estado del empleado:

1. **Entrada:** Si el empleado no tiene tareas abiertas, se crea un `task_tracker` (estado `running`) usando la fecha de la trama como **start_time**.
2. **Salida:** Si ya tiene una tarea activa, el servidor la cierra usando la fecha de la trama como **end_time** y calcula la duración total.

---

### 5. Resumen de Simulación para Pruebas

Si utilizas el simulador, puedes replicar exactamente lo que hace el reloj físico enviando estas dos peticiones:

```javascript
// Simulación de una jornada completa
const BASE = "https://fichajes.coagrisan.com/api/iclock/cdata";
const SN = "SN_DISPOSITIVO_01"; 
const PIN = "53453543"; 

// 1. Envío de Entrada (8:00 AM)
// Body: "53453543\t2026-03-05 08:00:00\t0\t0\t0\t0\t0\n"

// 2. Envío de Salida (4:00 PM)
// Body: "53453543\t2026-03-05 16:00:00\t0\t0\t0\t0\t0\n"

```

---

### 📝 Notas para el Técnico

* **Sincronización de Hora:** El reloj sincroniza su hora automáticamente con el servidor al encenderse (vía `GET`). Esto garantiza que la fecha enviada en la trama sea siempre la correcta.
* **Estado de Conexión:** Si el icono de la nube en la pantalla principal no está activo, verifique que la red local permita tráfico saliente por el puerto `443`.