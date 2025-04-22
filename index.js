// backend/index.js
import express from 'express';
import mercadopago from 'mercadopago';
import cors from 'cors';
import fs from 'fs';
import { guardarConsultaConfirmada, obtenerConsultasPorTelefono } from './consultas.js';

const app = express();
const PORT = 3001;

mercadopago.configure({
  access_token: 'TEST-7997961902567753-042212-a0b59d51ec0ace4e90817eadbeb30cbb-33643805'
});

app.use(cors());
app.use(express.json());

// Ruta para crear link de pago y guardar consulta confirmada
app.post('/crear-pago', async (req, res) => {
  const { nombre, telefono, fecha, hora } = req.body;

  // Verificar si ya existe una consulta en ese día y hora
  const archivo = './consultas_confirmadas.json';
  if (fs.existsSync(archivo)) {
    const datos = JSON.parse(fs.readFileSync(archivo, 'utf-8'));
    const duplicado = datos.find(c => c.fecha === fecha && c.hora === hora);
    if (duplicado) {
      return res.status(400).json({ error: 'Este horario ya fue reservado por otro paciente.' });
    }
  }

  try {
    const preference = {
      items: [
        {
          title: `Consulta psicológica - ${fecha} ${hora}`,
          quantity: 1,
          currency_id: 'UYU',
          unit_price: 500
        }
      ],
      payer: {
        name: nombre,
        phone: { number: telefono }
      },
      back_urls: {
        success: 'https://www.tusitio.com/success',
        failure: 'https://www.tusitio.com/failure',
        pending: 'https://www.tusitio.com/pending'
      },
      auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);

    guardarConsultaConfirmada({
      nombre,
      telefono,
      fecha,
      hora,
      pago: true,
      timestamp: new Date().toISOString()
    });

    res.json({ url: response.body.init_point });
  } catch (error) {
    console.error('Error al generar el link de pago:', error);
    res.status(500).json({ error: 'Error al crear el pago' });
  }
});

// Ruta para ver historial de un paciente
app.get('/historial/:telefono', (req, res) => {
  const { telefono } = req.params;
  const historial = obtenerConsultasPorTelefono(telefono);
  res.json(historial);
});

// NUEVA ruta para ver todas las consultas (panel psicóloga)
app.get('/consultas-todas', (req, res) => {
  const archivo = './consultas_confirmadas.json';
  if (!fs.existsSync(archivo)) {
    return res.json([]);
  }

  const data = fs.readFileSync(archivo, 'utf-8');
  const consultas = JSON.parse(data);
  res.json(consultas);
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://192.168.1.8:${PORT}`);
});