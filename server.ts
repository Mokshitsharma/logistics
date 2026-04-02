import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import "dotenv/config";

const prisma = new PrismaClient();
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- USER API ---
  app.post("/api/user/create", async (req, res) => {
    const { name, email } = req.body;
    try {
      const user = await prisma.user.create({ data: { name, email } });
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.get("/api/wallet/user/:userId", async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { transactions: { orderBy: { createdAt: "desc" } } },
    });
    res.json(user);
  });

  app.post("/api/wallet/add", async (req, res) => {
    const { userId, amount, description } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });
      const transaction = await tx.userTransaction.create({
        data: {
          userId,
          type: "CREDIT",
          amount,
          description: description || "Wallet top-up",
          balanceAfter: user.balance,
        },
      });
      return { user, transaction };
    });
    res.json(result);
  });

  app.post("/api/booking/create", async (req, res) => {
    const {
      userId,
      captainId,
      basePrice,
      waitingCharge,
      loadingCharge,
      longDistanceFee,
      lateNightFee,
      totalDiscount,
      paymentMode,
    } = req.body;

    const finalAmount = basePrice + waitingCharge + loadingCharge + longDistanceFee + lateNightFee - totalDiscount;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Booking
        const booking = await tx.booking.create({
          data: {
            userId,
            captainId,
            basePrice,
            waitingCharge,
            loadingCharge,
            longDistanceFee,
            lateNightFee,
            totalDiscount,
            finalAmount,
            paymentMode,
          },
        });

        // 2. User Wallet Deduction (if ONLINE or if there's a discount that needs tracking)
        // Actually, if it's ONLINE, we deduct from wallet. If CASH, user pays captain.
        // But the user requested "Deduct for booking" in User Wallet System.
        // Let's assume ONLINE payment deducts from wallet.
        if (paymentMode === "ONLINE") {
          const user = await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: finalAmount } },
          });
          await tx.userTransaction.create({
            data: {
              userId,
              type: "DEBIT",
              amount: finalAmount,
              description: `Ride payment (Booking: ${booking.id})`,
              balanceAfter: user.balance,
            },
          });
        }

        // 3. Captain Earnings & Commission
        const extras = waitingCharge + loadingCharge + longDistanceFee + lateNightFee;
        const commissionRate = 0.2;
        
        // Captain gets 80% of base price ONLY. Extras go to company.
        const captainEarning = basePrice * (1 - commissionRate);
        // Company takes 20% of base + all extras - any discounts applied
        const totalCommission = (basePrice * commissionRate) + extras - totalDiscount;

        if (paymentMode === "CASH") {
          // Captain received full finalAmount in cash.
          // Company is owed the totalCommission.
          const captain = await tx.captain.update({
            where: { id: captainId },
            data: { balance: { decrement: totalCommission } },
          });
          await tx.captainTransaction.create({
            data: {
              captainId,
              type: "COMMISSION",
              amount: totalCommission,
              description: `Commission + Extras (Booking: ${booking.id})`,
              balanceAfter: captain.balance,
            },
          });
        } else {
          // ONLINE payment. Company has the money.
          // Captain is owed their share (80% of base).
          const captain = await tx.captain.update({
            where: { id: captainId },
            data: { balance: { increment: captainEarning } },
          });
          await tx.captainTransaction.create({
            data: {
              captainId,
              type: "EARNING",
              amount: captainEarning,
              description: `Ride Earning (80% of Base) (Booking: ${booking.id})`,
              balanceAfter: captain.balance,
            },
          });
        }

        return booking;
      });
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Booking failed" });
    }
  });

  // --- CAPTAIN API ---
  app.post("/api/captain/create", async (req, res) => {
    const { name, email } = req.body;
    try {
      const captain = await prisma.captain.create({ data: { name, email } });
      res.json(captain);
    } catch (e) {
      res.status(400).json({ error: "Captain already exists" });
    }
  });

  app.get("/api/captain/dashboard/:id", async (req, res) => {
    const captain = await prisma.captain.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json(captain);
  });

  // --- ADMIN API ---
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          _count: { select: { bookings: true } },
        },
      });
      res.json(users);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/rides", async (req, res) => {
    try {
      const rides = await prisma.booking.findMany({
        include: { user: true, captain: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(rides);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch rides" });
    }
  });

  app.get("/api/admin/captains", async (req, res) => {
    try {
      const captains = await prisma.captain.findMany({
        include: {
          _count: { select: { bookings: true } },
        },
      });
      // Calculate total earnings and commission per captain
      const detailedCaptains = await Promise.all(
        captains.map(async (c) => {
          const earnings = await prisma.captainTransaction.aggregate({
            where: { captainId: c.id, type: "EARNING" },
            _sum: { amount: true },
          });
          const commissions = await prisma.captainTransaction.aggregate({
            where: { captainId: c.id, type: "COMMISSION" },
            _sum: { amount: true },
          });
          return {
            ...c,
            totalEarnings: earnings._sum.amount || 0,
            totalCommission: commissions._sum.amount || 0,
          };
        })
      );
      res.json(detailedCaptains);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch captains" });
    }
  });

  app.get("/api/admin/financials", async (req, res) => {
    try {
      const totalRides = await prisma.booking.count();
      const cashRides = await prisma.booking.aggregate({
        where: { paymentMode: "CASH" },
        _sum: { finalAmount: true, basePrice: true, waitingCharge: true, loadingCharge: true, longDistanceFee: true, lateNightFee: true, totalDiscount: true },
      });
      const onlineRides = await prisma.booking.aggregate({
        where: { paymentMode: "ONLINE" },
        _sum: { finalAmount: true, basePrice: true, waitingCharge: true, loadingCharge: true, longDistanceFee: true, lateNightFee: true, totalDiscount: true },
      });

      const totalBasePrice = (cashRides._sum.basePrice || 0) + (onlineRides._sum.basePrice || 0);
      const totalExtras = 
        ((cashRides._sum.waitingCharge || 0) + (onlineRides._sum.waitingCharge || 0)) +
        ((cashRides._sum.loadingCharge || 0) + (onlineRides._sum.loadingCharge || 0)) +
        ((cashRides._sum.longDistanceFee || 0) + (onlineRides._sum.longDistanceFee || 0)) +
        ((cashRides._sum.lateNightFee || 0) + (onlineRides._sum.lateNightFee || 0));
      
      const totalDiscounts = (cashRides._sum.totalDiscount || 0) + (onlineRides._sum.totalDiscount || 0);

      const totalVolume = (cashRides._sum.finalAmount || 0) + (onlineRides._sum.finalAmount || 0);
      
      // New Revenue Model: 20% of Base + 100% of Extras - Discounts
      const companyExpectedRevenue = (totalBasePrice * 0.2) + totalExtras - totalDiscounts;

      res.json({
        totalRides,
        totalVolume,
        totalBasePrice,
        totalExtras,
        totalDiscounts,
        cashVolume: cashRides._sum.finalAmount || 0,
        onlineVolume: onlineRides._sum.finalAmount || 0,
        companyExpectedRevenue,
        outstandingCaptainDues: await prisma.captain.aggregate({
          where: { balance: { lt: 0 } },
          _sum: { balance: true },
        }),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch financials" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
