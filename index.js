import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import cors from "cors";
import fs from "fs";
import { guardarConsultaConfirmada, obtenerConsultasPorTelefono } from "./consultas.js";

const app = express();
app.use(express.json());
app.use(cors());

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

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

    // Guardar en archivo local
    guardarConsultaConfirmada({ nombre, telefono, fecha, hora, pago: true, timestamp: new Date().toISOString() });

    res.json({ url: preference.init_point });
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ error: "Error al crear pago" });
  }
});

// Ruta para obtener historial de un paciente o todas las consultas
app.get("/consultas", (req, res) => {
  const telefono = req.query.telefono;
  const archivo = "./consultas_confirmadas.json";

  if (!fs.existsSync(archivo)) {
    return res.json([]);
  }

  const datos = fs.readFileSync(archivo, "utf-8");
  const consultas = JSON.parse(datos);

  if (telefono) {
    const historial = consultas.filter((c) => c.telefono === telefono);
    return res.json(historial);
  }

  res.json(consultas);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});