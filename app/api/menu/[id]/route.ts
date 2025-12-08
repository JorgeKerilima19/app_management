// app/api/menu/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: Number(params.id) },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to get menu item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, description, price, category } = body;

    const item = await prisma.menuItem.update({
      where: { id: Number(params.id) },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        category,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.menuItem.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json(
      { message: "Menu item deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
