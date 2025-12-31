// app/dashboard/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function fetchDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get daily summary for today
  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
    include: { openedBy: { select: { name: true } } },
  });

  // Get today's sales data
  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: today } },
    select: { method: true, amount: true, cashAmount: true, yapeAmount: true },
  });

  let cashSales = 0;
  let yapeSales = 0;
  let totalSales = 0;

  payments.forEach((p) => {
    totalSales += Number(p.amount);

    if (p.method === "CASH" || p.method === "MIXED") {
      cashSales += p.cashAmount ? Number(p.cashAmount) : Number(p.amount);
    }
    if (p.method === "MOBILE_PAY" || p.method === "MIXED") {
      yapeSales += p.yapeAmount ? Number(p.yapeAmount) : 0;
    }
  });

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: today } },
    include: {
      items: { include: { menuItem: true } },
      check: { include: { tables: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Recent voids
  const recentVoids = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today } },
    include: { voidedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    dailySummary,
    todayStats: {
      cashSales,
      yapeSales,
      totalSales,
    },
    activity: {
      recentOrders,
      recentVoids,
    },
  };
}

export async function openRestaurant(startingCash: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already opened
  const existing = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  if (existing) {
    throw new Error("El restaurante ya está abierto para hoy");
  }

  await prisma.dailySummary.create({
    data: {
      date: today,
      startingCash: startingCash,
      totalCash: 0,
      totalYape: 0,
      endingCash: startingCash, // Initially same as starting
      openedById: user.id,
      status: "OPEN",
    },
  });

  revalidatePath("/dashboard");
}

export async function closeRestaurant() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await prisma.dailySummary.findUnique({
    where: { date: today, status: "OPEN" },
  });

  if (!summary) {
    throw new Error("No hay resumen diario activo");
  }

  // Get final sales for the day
  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: today } },
    select: { method: true, cashAmount: true, yapeAmount: true, amount: true },
  });

  let totalCash = 0;
  let totalYape = 0;

  payments.forEach((p) => {
    if (p.method === "CASH" || p.method === "MIXED") {
      totalCash += p.cashAmount ? Number(p.cashAmount) : Number(p.amount);
    }
    if (p.method === "MOBILE_PAY" || p.method === "MIXED") {
      totalYape += p.yapeAmount ? Number(p.yapeAmount) : 0;
    }
  });

  const endingCash = totalCash - Number(summary.startingCash);

  await prisma.dailySummary.update({
    where: { id: summary.id },
    data: {
      totalCash,
      totalYape,
      endingCash,
      status: "CLOSED",
      closedById: user.id,
      closedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");

  return {
    startingCash: Number(summary.startingCash),
    totalCash,
    totalYape,
    endingCash,
  };
}
