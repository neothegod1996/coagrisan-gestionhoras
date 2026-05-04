const BASE = "http://localhost:4000/api/iclock";
const SN = "1231232131"; 
const PIN = "53453543";     

// Función para formatear fecha a: YYYY-MM-DD HH:mm:ss
function formatZkDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function simulate() {
  try {
    console.log(`--- Iniciando Simulación Dinámica ---`);

    // Calcular tiempos
    const ahora = new Date();
    const haceOchoHoras = new Date(ahora.getTime() - (8 * 60 * 60 * 1000));

    const fechaSalida = formatZkDate(ahora);
    const fechaEntrada = formatZkDate(haceOchoHoras);

    console.log(`Simulando Entrada: ${fechaEntrada}`);
    console.log(`Simulando Salida:  ${fechaSalida}`);

    // 1. Handshake
    const resH = await fetch(`${BASE}/cdata?SN=${SN}&options=all`);
    console.log("1. Handshake:", resH.status === 200 ? "OK" : "Error");

    // 2. Simular Entrada (8 horas antes)
    const bodyEntrada = `${PIN}\t${fechaEntrada}\t0\t0\t0\t0\t0\n`;
    const resE = await fetch(`${BASE}/cdata?SN=${SN}&table=ATTLOG&Stamp=999`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: bodyEntrada,
    });
    console.log("2. Registro Entrada:", resE.status, await resE.text());

    // 3. Simular Salida (Hora actual)
    const bodySalida = `${PIN}\t${fechaSalida}\t0\t0\t0\t0\t0\n`;
    const resS = await fetch(`${BASE}/cdata?SN=${SN}&table=ATTLOG&Stamp=1000`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: bodySalida,
    });
    console.log("3. Registro Salida:", resS.status, await resS.text());

  } catch (error) {
    console.error("Error:", error.message);
  }
}

simulate();