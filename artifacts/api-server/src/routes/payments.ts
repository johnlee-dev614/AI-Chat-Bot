import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// ── POST /api/payments/purchase ───────────────────────────────────────────────
// Placeholder — payment provider not yet connected.
// When ready, plug in Stripe/etc via environment secrets and replace this stub.

router.post("/payments/purchase", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(503).json({
    success: false,
    message: "Payment provider not yet configured. Please contact support.",
    code: "payment_not_configured",
  });
});

// ── GET /api/payments/packages ────────────────────────────────────────────────
// Returns the available ember packages. Prices are placeholders.

router.get("/payments/packages", (req: Request, res: Response) => {
  res.json({
    packages: [
      {
        id: "embers_50",
        name: "Spark",
        embers: 50,
        price: 4.99,
        priceDisplay: "$4.99",
        popular: false,
        description: "Great for a quick session",
      },
      {
        id: "embers_150",
        name: "Flame",
        embers: 150,
        price: 9.99,
        priceDisplay: "$9.99",
        popular: true,
        description: "Best value — most popular",
        badge: "Most Popular",
      },
      {
        id: "embers_500",
        name: "Inferno",
        embers: 500,
        price: 24.99,
        priceDisplay: "$24.99",
        popular: false,
        description: "For dedicated explorers",
      },
    ],
  });
});

export default router;
