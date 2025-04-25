import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const archivoConsultas = "./consultas_confirmadas.json";
const archivoHorarios = "./horarios_disponibles.json";

// Crear pago y guardar consulta confirmada
app.post("/crear-pago", async (req, res) => {
  const { nombre, telefono, fecha, hora } = req.body;

  try {
    const preference = await new Preference(mercadopago).create({
      body: {
        items: [
          {
            title: `Consulta ${fecha} ${hora}`,
            quantity: 1,
            unit_price: 1500,
          },
        ],
        payer: {
          name: nombre,
          phone: { number: telefono },
        },
        metadata: { fecha, hora },
        back_urls: {
          success: "https://www.google.com",
          failure: "https://www.google.com",
          pending: "https://www.google.com",
        },
        auto_return: "approved",
      },
    });

    guardarConsulta({ nombre, telefono, fecha, hora });
    res.json({ url: preference.init_point });
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ error: "Error al crear pago" });
  }
});

// Función para guardar consultas confirmadas
function guardarConsulta(consulta) {
  let consultas = [];

  if (fs.existsSync(archivoConsultas)) {
    const datos = fs.readFileSync(archivoConsultas, "utf-8");
    consultas = JSON.parse(datos);
  }

  consultas.push({ ...consulta, pago: true, timestamp: new Date().toISOString() });

  fs.writeFileSync(archivoConsultas, JSON.stringify(consultas, null, 2));
}

// Obtener todas las consultas o historial por teléfono
app.get("/consultas", (req, res) => {
  const telefono = req.query.telefono;

  if (!fs.existsSync(archivoConsultas)) {
    return res.json([]);
  }

  const datos = fs.readFileSync(archivoConsultas, "utf-8");
  const consultas = JSON.parse(datos);

  if (telefono) {
    const historial = consultas.filter(c => c.telefono === telefono);
    return res.json(historial);
  }

  res.json(consultas);
});

// Agenda: agregar, ver y eliminar horarios
app.get("/agenda", (req, res) => {
  if (!fs.existsSync(archivoHorarios)) {
    return res.json([]);
  }

  const datos = fs.readFileSync(archivoHorarios, "utf-8");
  const horarios = JSON.parse(datos);
  res.json(horarios);
});

app.post("/agenda", (req, res) => {
  const { fecha, hora } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  let horarios = [];
  if (fs.existsSync(archivoHorarios)) {
    const datos = fs.readFileSync(archivoHorarios, "utf-8");
    horarios = JSON.parse(datos);
  }

  const nuevoHorario = {
    id: Date.now(),
    fecha,
    hora
  };

  horarios.push(nuevoHorario);

  fs.writeFileSync(archivoHorarios, JSON.stringify(horarios, null, 2));
  res.status(201).json(nuevoHorario);
});

app.delete("/agenda/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (!fs.existsSync(archivoHorarios)) {
    return res.status(404).json({ error: "No hay horarios guardados" });
  }

  const datos = fs.readFileSync(archivoHorarios, "utf-8");
  let horarios = JSON.parse(datos);

  horarios = horarios.filter(h => h.id !== id);

  fs.writeFileSync(archivoHorarios, JSON.stringify(horarios, null, 2));
  res.status(200).json({ mensaje: "Horario eliminado exitosamente" });
});

// Inicio del servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});