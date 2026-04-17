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
// Returns the available Ember packages.

router.get("/payments/packages", (req: Request, res: Response) => {
  res.json({
    packages: [
      {
        id: "embers_500",
        name: "Spark",
        embers: 500,
        price: 14.99,
        priceDisplay: "$14.99",
        popular: false,
        description: "Great for a quick session",
      },
      {
        id: "embers_1500",
        name: "Flame",
        embers: 1500,
        price: 19.99,
        priceDisplay: "$19.99",
        popular: true,
        description: "Best value — most popular",
        badge: "Most Popular",
      },
      {
        id: "embers_4000",
        name: "Inferno",
        embers: 4000,
        price: 39.99,
        priceDisplay: "$39.99",
        popular: false,
        description: "For dedicated explorers",
      },
      {
        id: "embers_2500_crypto",
        name: "Crypto Pack",
        embers: 2500,
        price: 19.99,
        priceDisplay: "$19.99",
        popular: false,
        description: "Pay with crypto — exclusive bonus",
        badge: "Crypto",
      },
    ],
  });
});

export default router;
