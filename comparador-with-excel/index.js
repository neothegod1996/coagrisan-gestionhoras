const XLSX = require('xlsx');
const stringSimilarity = require('string-similarity');
const db = require('./db');

const MIN_SIMILARITY = 0.85; 

function normalize(text) {
    if (!text) return "";
    return text.toString().toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^A-Z0-9 ]/g, " ")
        .trim();
}

function extraerCodigoDeFila(row) {
    const codigo = row.find(cell => cell && !isNaN(cell) && cell.toString().length >= 2);
    return codigo ? codigo.toString() : null;
}

function extraerNombreDeFila(row) {
    return row.find(cell => {
        if (!cell || typeof cell !== 'string') return false;
        const limpio = cell.trim();
        return limpio !== "NOMBRE" && limpio.length > 5 && /[a-zA-Z]/.test(limpio);
    });
}

async function procesarYActualizar(archivos) {
    let filasProcesadas = 0;
    let registrosActualizados = 0;
    let errores = 0;

    try {
        console.log("--- Cargando empleados de la DB ---");
        const [usersDB] = await db.query("SELECT id, first_name, last_name FROM employee");
        
        const listaComparacion = usersDB.map(u => ({
            original: u,
            fullNormalized: normalize(`${u.first_name} ${u.last_name || ''}`)
        }));
        
        const nombresLimpioDB = listaComparacion.map(item => item.fullNormalized);

        for (const ruta of archivos) {
            console.log(`\n[INFO] PROCESANDO: ${ruta}`);
            const workbook = XLSX.readFile(ruta);
            
            for (const sheetName of workbook.SheetNames) {
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

                for (const [index, row] of rows.entries()) {
                    const nombreExcel = extraerNombreDeFila(row);
                    const codigoExcel = extraerCodigoDeFila(row);

                    if (nombreExcel && codigoExcel) {
                        const excelLimpio = normalize(nombreExcel);
                        const matches = stringSimilarity.findBestMatch(excelLimpio, nombresLimpioDB);
                        const mejorRating = matches.bestMatch.rating;

                        if (mejorRating >= MIN_SIMILARITY) {
                            const indicesMatches = matches.ratings
                                .map((r, i) => r.rating === mejorRating ? i : -1)
                                .filter(i => i !== -1);

                            console.log(`[Fila ${index + 1}] 🔍 "${nombreExcel}" -> Encontrados ${indicesMatches.length} registros.`);

                            for (const idx of indicesMatches) {
                                const matchDB = listaComparacion[idx].original;
                                try {
                                    await db.query(
                                        "UPDATE employee SET employee_code = ? WHERE id = ?",
                                        [codigoExcel, matchDB.id]
                                    );
                                    registrosActualizados++;
                                } catch (sqlErr) {
                                    console.error(`   [ERROR] Error SQL en ID ${matchDB.id}:`, sqlErr.message);
                                    errores++;
                                }
                            }
                            filasProcesadas++;
                        }
                    }
                }
            }
        }
        
        console.log(`\n--- RESUMEN FINAL ---`);
        console.log(`[SUCCESS] Filas del Excel procesadas: ${filasProcesadas}`);
        console.log(`[SUCCESS] Total de registros actualizados en DB: ${registrosActualizados}`);
        console.log(`[ERROR] Errores: ${errores}`);
        
        await db.end();
        process.exit(0);
    } catch (err) {
        console.error("Error crítico:", err);
        process.exit(1);
    }
}

procesarYActualizar(['empleado_todos.xlsx', 'EMPLEADOS_bbdd.xlsx']);