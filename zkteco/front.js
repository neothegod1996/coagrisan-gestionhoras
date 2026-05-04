// index.js
// Cambiamos el puerto al 3000 (Next.js) para probar el nuevo Route Handler
const BASE = "http://localhost:3000/api/iclock/cdata"; 
const SN = "1231232131"; 
const PIN = "53453543";     

function formatZkDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function simulate() {
  try {
    console.log(`--- Iniciando Simulación vía Frontend Proxy ---`);

    const ahora = new Date();
    const haceOchoHoras = new Date(ahora.getTime() - (8 * 60 * 60 * 1000));

    const fechaSalida = formatZkDate(ahora);
    const fechaEntrada = formatZkDate(haceOchoHoras);

    console.log(`Destino: ${BASE}`);
    console.log(`Simulando Entrada: ${fechaEntrada}`);
    console.log(`Simulando Salida:  ${fechaSalida}`);

    // 1. Handshake (GET)
    // El proxy en Next.js recibirá esto y lo enviará al Backend
    const resH = await fetch(`${BASE}?SN=${SN}&options=all`);
    console.log("1. Handshake:", resH.status === 200 ? "OK" : `Error ${resH.status}`);
    console.log("   Respuesta:", await resH.text());

    // 2. Simular Entrada (POST)
    const bodyEntrada = `${PIN}\t${fechaEntrada}\t0\t0\t0\t0\t0\n`;
    const resE = await fetch(`${BASE}?SN=${SN}&table=ATTLOG&Stamp=999`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: bodyEntrada,
    });
    console.log("2. Registro Entrada:", resE.status, await resE.text());

    // 3. Simular Salida (POST)
    const bodySalida = `${PIN}\t${fechaSalida}\t0\t0\t0\t0\t0\n`;
    const resS = await fetch(`${BASE}?SN=${SN}&table=ATTLOG&Stamp=1000`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: bodySalida,
    });
    console.log("3. Registro Salida:", resS.status, await resS.text());

  } catch (error) {
    console.error("Error en la simulación:", error.message);
  }
}

simulate();