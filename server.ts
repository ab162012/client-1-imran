import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Admin Key Validation API
  app.post("/api/admin/login", (req, res) => {
    const { key } = req.body;
    const ADMIN_KEY = process.env.ADMIN_KEY || "Usman101";

    if (key === ADMIN_KEY) {
      // In a real app, we'd use a JWT or session. 
      // For this demo, we'll return a simple success.
      res.json({ success: true, token: "demo-admin-token" });
    } else {
      res.status(401).json({ success: false, message: "Invalid Admin Key" });
    }
  });

  // Order Notification API
  app.post("/api/order-notification", (req, res) => {
    const { orderId, customerEmail, total } = req.body;
    const ADMIN_EMAIL = "infoperfumeenclave@gmail.com";
    
    console.log(`[ORDER ALERT] New order ${orderId} from ${customerEmail}. Total: PKR ${total}`);
    console.log(`[EMAIL SERVICE] Sending detailed alert to: ${ADMIN_EMAIL}`);
    
    // In a real production environment, we would use a service like SendGrid or Resend here.
    // Example: await resend.emails.send({ from: 'orders@perfumeenclave.com', to: ADMIN_EMAIL, ... });
    
    res.json({ success: true, message: "Alert sent to admin" });
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
