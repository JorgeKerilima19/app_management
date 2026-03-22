/// lib/printer.ts
import { promises as fs } from "fs";

export function generateEscPosReceipt(
  tableNumber: number,
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    notes?: string | null;
    station: "KITCHEN" | "BAR";
  }>,
  orderTime: Date,
): Buffer {
  let buffer = Buffer.alloc(0);

  const push = (data: Buffer) => {
    buffer = Buffer.concat([buffer, data]);
  };

  // Initialize printer
  push(Buffer.from([0x1b, 0x40])); // ESC @ - Initialize

  // Center align for header
  push(Buffer.from([0x1b, 0x61, 0x01])); // ESC a 1 - Center

  // Restaurant name (bold, double size)
  push(Buffer.from([0x1d, 0x21, 0x11])); // GS ! 0x11 - Double height + width
  push(Buffer.from([0x1b, 0x45, 0x01])); // ESC E 1 - Bold ON
  push(encodeText("Tacuchi Restaurant\n"));
  push(Buffer.from([0x1b, 0x45, 0x00])); // ESC E 0 - Bold OFF
  push(Buffer.from([0x1d, 0x21, 0x00])); // GS ! 0x00 - Normal size

  // Table & time
  push(Buffer.from([0x1b, 0x61, 0x00])); // ESC a 0 - Left align
  push(encodeText(`Mesa: ${tableNumber}\n`));
  push(encodeText(`Hora: ${orderTime.toLocaleTimeString("es-PE")}\n`));
  push(encodeText(`Fecha: ${orderTime.toLocaleDateString("es-PE")}\n\n`));

  // Header separator
  push(encodeText("----------------------------------------\n"));

  // 3-Column Table Header
  push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
  push(encodeText("ITEM                    P.UNIT   SUBTOTAL\n"));
  push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF
  push(encodeText("----------------------------------------\n"));

  let grandTotal = 0;

  // Group items by station for routing (but print all together in table)
  const comidasItems = items.filter((i) => i.station === "KITCHEN");
  const bebidasItems = items.filter((i) => i.station === "BAR");

  // Helper to print a row with 3 columns
  const printRow = (
    name: string,
    unitPrice: number,
    quantity: number,
    notes?: string | null,
  ) => {
    const lineTotal = unitPrice * quantity;
    grandTotal += lineTotal;

    // Truncate name to fit (max ~20 chars for 42-char wide receipt)
    const displayName = name.length > 20 ? name.substring(0, 17) + "..." : name;
    const nameWithQty = `${displayName} x${quantity}`;

    // Format prices
    const unitPriceStr = `S/${unitPrice.toFixed(2)}`.padStart(8);
    const subtotalStr = `S/${lineTotal.toFixed(2)}`.padStart(9);

    // Print main row: Name (left) | Unit Price (center-right) | Subtotal (right)
    push(
      encodeText(`${nameWithQty.padEnd(22)}${unitPriceStr}${subtotalStr}\n`),
    );

    // Print notes on next line if exists
    if (notes) {
      push(encodeText(`  → ${notes}\n`));
    }
  };

  // Print COMIDAS section header (for kitchen routing reference)
  if (comidasItems.length > 0) {
    push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
    push(encodeText("\n[COMIDAS]\n"));
    push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF
    for (const item of comidasItems) {
      printRow(item.name, item.price, item.quantity, item.notes);
    }
  }

  // Print BEBIDAS Y/O POSTRES section header
  if (bebidasItems.length > 0) {
    push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
    push(encodeText("\n[BEBIDAS Y/O POSTRES]\n"));
    push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF
    for (const item of bebidasItems) {
      printRow(item.name, item.price, item.quantity, item.notes);
    }
  }

  // Final separator
  push(encodeText("\n----------------------------------------\n"));

  // Grand Total - BIG and BOLD at the very end
  push(Buffer.from([0x1d, 0x21, 0x11])); // Double height + width
  push(Buffer.from([0x1b, 0x45, 0x01])); // Bold ON
  push(encodeText(`TOTAL: S/${grandTotal.toFixed(2)}\n`));
  push(Buffer.from([0x1b, 0x45, 0x00])); // Bold OFF
  push(Buffer.from([0x1d, 0x21, 0x00])); // Normal size

  // Footer
  push(encodeText("\n----------------------------------------\n"));
  push(Buffer.from([0x1b, 0x61, 0x01])); // Center
  push(encodeText("¡Gracias por su visita!\n\n"));

  // Cut paper
  push(Buffer.from([0x1b, 0x64, 0x04])); // Feed 4 lines
  push(Buffer.from([0x1d, 0x56, 0x00])); // GS V 0 - Full cut

  return buffer;
}

/**
 * Encodes Spanish characters for ESC/POS (CP850/CP437 hybrid).
 */
function encodeText(text: string): Buffer {
  const map: Record<string, number> = {
    á: 0xa0,
    é: 0x82,
    í: 0xa1,
    ó: 0xa2,
    ú: 0xa3,
    ñ: 0xa4,
    Á: 0xb7,
    É: 0x90,
    Í: 0xd6,
    Ó: 0xe0,
    Ú: 0xe9,
    Ñ: 0xa5,
    ü: 0x81,
    Ü: 0x9a,
    "¿": 0xa8,
    "?": 0xbf,
    "¡": 0xad,
    "!": 0xa1,
  };

  let result = "";
  for (const ch of text) {
    result += map[ch] !== undefined ? String.fromCharCode(map[ch]) : ch;
  }
  return Buffer.from(result, "binary");
}

/**
 * Prints ESC/POS buffer directly to shared network printer.
 * Printer name: POS-80-Series (must be shared on Windows)
 */
export async function printReceiptToPOS(content: Buffer): Promise<void> {
  const printerPath = "\\\\localhost\\POS-80-Series";

  try {
    await fs.writeFile(printerPath, content);
    console.log(`✅ Printed to ${printerPath}`);
  } catch (err: any) {
    console.error(`❌ Print failed: ${err.message}`);
    // Don't throw - printing is best-effort, shouldn't block order flow
  }
}
