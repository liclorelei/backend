// backend/consultas.js
import fs from 'fs';
const archivoConsultas = './consultas_confirmadas.json';

// Guardar nueva consulta
export function guardarConsultaConfirmada(consulta) {
  let consultas = [];

  if (fs.existsSync(archivoConsultas)) {
    const datos = fs.readFileSync(archivoConsultas, 'utf-8');
    consultas = JSON.parse(datos);
  }

  consultas.push(consulta);
  fs.writeFileSync(archivoConsultas, JSON.stringify(consultas, null, 2));
}

// Obtener todas las consultas de un paciente por teléfono
export function obtenerConsultasPorTelefono(telefono) {
  if (!fs.existsSync(archivoConsultas)) return [];

  const datos = fs.readFileSync(archivoConsultas, 'utf-8');
  const consultas = JSON.parse(datos);

  return consultas.filter(c => c.telefono === telefono);
}