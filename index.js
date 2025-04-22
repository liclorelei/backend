import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const app = express();
app.use(express.json());

// Inicializar Mercado Pago (usa tus credenciales de prueba)
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
            unit_price: 1500, // Monto de la consulta en pesos uruguayos
          },
        ],
        payer: {
          name: nombre,
          phone: {
            number: telefono,
          },
        },
        metadata: { fecha, hora },
        back_urls: {
          success: "https://www.google.com", // Página de éxito
          failure: "https://www.google.com",
          pending: "https://www.google.com",
        },
        auto_return: "approved",
      },
    });

    res.json({ url: preference.init_point });
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ error: "Error al crear pago" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
