import prisma from "./prisma";

export async function deductInventoryForOrderItem(orderItemId: string) {
  return await prisma.$transaction(async (tx) => {
    const orderItem = await tx.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        menuItem: {
          include: {
            recipeItems: {
              include: { inventoryItem: true },
            },
          },
        },
      },
    });

    if (!orderItem) {
      throw new Error(`OrderItem ${orderItemId} not found`);
    }

    const alreadyDeducted = await tx.inventoryTransaction.findFirst({
      where: {
        referenceModel: "OrderItem",
        referenceId: orderItem.id,
        type: "SALE_DEDUCTION",
      },
    });

    if (alreadyDeducted) {
      console.log(`Inventory already deducted for OrderItem ${orderItemId}`);
      return { success: true, skipped: true, reason: "already_deducted" };
    }

    if (orderItem.status === "VOIDED") {
      return { success: true, skipped: true, reason: "voided" };
    }

    const deductions: Array<{
      inventoryItemId: string;
      itemName: string;
      deducted: number;
      remaining: number;
      unit: string;
    }> = [];

    for (const recipe of orderItem.menuItem.recipeItems) {
      if (recipe.isOptional) continue;

      const totalDeduction = recipe.quantityRequired * orderItem.quantity;

      const updatedInventory = await tx.inventoryItem.update({
        where: { id: recipe.inventoryItemId },
        data: { currentQuantity: { decrement: totalDeduction } },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: recipe.inventoryItemId,
          type: "SALE_DEDUCTION",
          quantityChange: -totalDeduction,
          referenceModel: "OrderItem",
          referenceId: orderItem.id,
          reason: `Auto-deducted when marked READY: ${orderItem.menuItem.name} x${orderItem.quantity}`,
          performedById: null,
        },
      });

      deductions.push({
        inventoryItemId: recipe.inventoryItemId,
        itemName: updatedInventory.name,
        deducted: totalDeduction,
        remaining: updatedInventory.currentQuantity,
        unit: updatedInventory.unit,
      });
    }

    return {
      success: true,
      skipped: false,
      orderItemId,
      menuItemName: orderItem.menuItem.name,
      deductions,
    };
  });
}

export async function deductInventoryForOrder(orderId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      orderId,
      status: { in: ["PENDING", "PREPARING", "READY"] },
      menuItem: {
        recipeItems: { some: {} },
      },
    },
    select: { id: true },
  });

  const results = [];
  for (const item of orderItems) {
    try {
      const result = await deductInventoryForOrderItem(item.id);
      results.push(result);
    } catch (error) {
      console.error(`Failed to deduct for OrderItem ${item.id}:`, error);
      results.push({
        success: false,
        orderItemId: item.id,
        error: (error as Error).message,
      });
    }
  }

  return results;
}
