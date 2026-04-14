import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Admin Key Validation API
  app.post("/api/admin/login", (req, res) => {
    try {
      const { key } = req.body;
      const ADMIN_KEY = process.env.ADMIN_KEY || "Usman101";

      console.log(`[ADMIN LOGIN] Attempt with key: ${key ? "****" : "empty"}`);

      if (key === ADMIN_KEY) {
        console.log("[ADMIN LOGIN] Success");
        res.json({ success: true, token: "demo-admin-token" });
      } else {
        console.log("[ADMIN LOGIN] Failed: Invalid Key");
        res.status(401).json({ success: false, message: "Invalid Admin Key" });
      }
    } catch (error) {
      console.error("[ADMIN LOGIN] Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  // Order Notification API
  app.post("/api/order-notification", (req, res) => {
    const { orderId, customer, products, total, timestamp } = req.body;
    const ADMIN_EMAIL = "infoperfumeenclave@gmail.com";
    
    console.log('--- NEW ORDER NOTIFICATION ---');
    console.log(`Recipient: ${ADMIN_EMAIL}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Customer: ${customer?.name} (${customer?.email})`);
    console.log(`Phone: ${customer?.phone}`);
    console.log(`Address: ${customer?.address}, ${customer?.city}`);
    console.log(`Total: PKR ${total?.toLocaleString()}`);
    console.log(`Items:`);
    products?.forEach((p: any) => {
      console.log(` - ${p.name} x${p.quantity} (PKR ${p.price})`);
    });
    console.log(`Date: ${new Date(timestamp).toLocaleString()}`);
    console.log('------------------------------');
    
    // In a real production environment, we would use a service like SendGrid or Resend here.
    // Example: await resend.emails.send({ from: 'orders@perfumeenclave.com', to: ADMIN_EMAIL, ... });
    
    res.json({ success: true, message: "Detailed alert sent to admin" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
