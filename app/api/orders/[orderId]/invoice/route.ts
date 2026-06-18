/**
 * GET /api/orders/[orderId]/invoice
 *
 * Generates a branded Iyarkai Nala Maruthuvamanai PDF invoice using pdfkit.
 * Returns a real application/pdf binary response for download.
 */
import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { db } from '@/lib/mockDb';
import { toOrderData } from '@/lib/orderDto';

/* ─── colour tokens (mirrored from CSS) ──────────────────────────────────── */
const C = {
  forest:  '#102d1d',
  emerald: '#1b8a58',
  gold:    '#c48a00',
  cream:   '#fdf8ed',
  muted:   '#6b7f74',
  ink:     '#0e1a14',
  border:  '#d0ddd6',
  white:   '#ffffff',
  danger:  '#b33a28',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const { orderId } = await params;
  const order = db.orders.get(orderId);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  const dto   = toOrderData(order);
  const bytes = await generatePdf(dto);
  const body  = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="iyarkai-nala-invoice-${dto.orderId}.pdf"`,
      'Content-Length':       String(bytes.byteLength),
    },
  });
}

/* ─── PDF generation (pdfkit) ────────────────────────────────────────────── */
async function generatePdf(dto: ReturnType<typeof toOrderData>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size:    'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title:  `Iyarkai Nala Invoice ${dto.orderId}`,
        Author: 'Iyarkai Nala Maruthuvamanai',
      },
    });

    doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',   () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on('error', reject);

    const W = doc.page.width;
    const M = 48; // margin
    const CW = W - M * 2; // content width

    /* ── HEADER BAND ─────────────────────────────────────────────────────── */
    doc.rect(0, 0, W, 90).fill(C.forest);

    // Brand name
    doc.fontSize(24).fillColor(C.white).font('Helvetica-Bold')
      .text('Iyarkai Nala', M, 24, { continued: false });

    // Tagline
    doc.fontSize(9).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
      .text('Siddha · Ayurveda · Natural Wellness', M, 52);

    // TAX INVOICE label (right-aligned)
    doc.fontSize(18).fillColor(C.gold).font('Helvetica-Bold')
      .text('TAX INVOICE', M, 30, { width: CW, align: 'right' });

    doc.fontSize(9).fillColor('rgba(255,255,255,0.7)').font('Helvetica')
      .text('GSTIN: 33AAAAA0000A1Z5', M, 55, { width: CW, align: 'right' });

    /* ── CREAM BACKGROUND for body ───────────────────────────────────────── */
    doc.rect(0, 90, W, doc.page.height).fill('#fafaf8');

    doc.fillColor(C.ink);
    let y = 108;

    /* ── ORDER META ──────────────────────────────────────────────────────── */
    const col1 = M;
    const col2 = M + CW * 0.52;

    // Left column
    doc.fontSize(8).fillColor(C.muted).font('Helvetica').text('ORDER NUMBER', col1, y);
    doc.fontSize(10).fillColor(C.ink).font('Helvetica-Bold').text(dto.orderId, col1, y + 11);

    doc.fontSize(8).fillColor(C.muted).font('Helvetica').text('ORDER DATE', col1, y + 30);
    doc.fontSize(10).fillColor(C.ink).font('Helvetica').text(
      new Date(dto.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      col1, y + 41,
    );

    doc.fontSize(8).fillColor(C.muted).font('Helvetica').text('STATUS', col1, y + 60);
    doc.fontSize(10).fillColor(C.emerald).font('Helvetica-Bold').text(dto.status.toUpperCase(), col1, y + 71);

    // Right column — delivery address
    doc.fontSize(8).fillColor(C.muted).font('Helvetica').text('DELIVERY ADDRESS', col2, y);
    doc.fontSize(9).fillColor(C.ink).font('Helvetica-Bold').text(dto.address.name, col2, y + 11);
    doc.fontSize(9).font('Helvetica').fillColor(C.ink)
      .text(dto.address.line1, col2, y + 22)
      .text([dto.address.city, dto.address.state, dto.address.pincode].filter(Boolean).join(', '), col2, y + 33)
      .text(`Ph: ${dto.address.phone}`, col2, y + 44);

    y += 98;

    /* ── SEPARATOR ───────────────────────────────────────────────────────── */
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(0.8).stroke();
    y += 14;

    /* ── ITEMS TABLE ─────────────────────────────────────────────────────── */
    const cols = { name: M, qty: M + CW * 0.50, mrp: M + CW * 0.62, price: M + CW * 0.74, total: M + CW * 0.86 };

    // Table header
    doc.rect(M, y, CW, 22).fill(C.forest);
    const headers = ['Medicine', 'Qty', 'MRP', 'Price', 'Total'];
    const colKeys = Object.values(cols);
    headers.forEach((h, i) => {
      doc.fontSize(8).fillColor(C.white).font('Helvetica-Bold')
        .text(h, colKeys[i], y + 7, { width: i === 0 ? CW * 0.48 : CW * 0.11, align: i === 0 ? 'left' : 'right' });
    });
    y += 26;

    dto.items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f4f9f6';
      doc.rect(M, y, CW, 30).fill(bg);

      // Tamil name — pdfkit doesn't render Tamil unicode so we render English name
      // and put Tamil label as subtitle
      doc.fontSize(9).fillColor(C.ink).font('Helvetica-Bold')
        .text(item.nameEn, cols.name, y + 5, { width: CW * 0.46, lineBreak: false });
      doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
        .text(item.nameTa.length > 30 ? item.nameTa.substring(0, 28) + '…' : item.nameTa, cols.name, y + 17, { width: CW * 0.46 });

      doc.fontSize(9).fillColor(C.ink).font('Helvetica')
        .text(String(item.qty),                                          cols.qty,   y + 10, { width: CW * 0.11, align: 'right' })
        .text(`\u20B9${item.mrp.toFixed(2)}`,                           cols.mrp,   y + 10, { width: CW * 0.11, align: 'right' })
        .text(`\u20B9${item.price.toFixed(2)}`,                         cols.price, y + 10, { width: CW * 0.11, align: 'right' })
        .text(`\u20B9${item.lineTotal.toFixed(2)}`,                     cols.total, y + 10, { width: CW * 0.13, align: 'right' });

      if (item.requiresPrescription) {
        doc.fontSize(6.5).fillColor(C.danger).font('Helvetica-Bold')
          .text('Rx Required', cols.name, y + 22, { width: 60 });
      }
      y += 32;
    });

    /* ── SEPARATOR ───────────────────────────────────────────────────────── */
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(0.5).stroke();
    y += 14;

    /* ── TOTALS ──────────────────────────────────────────────────────────── */
    const totW  = CW * 0.38;
    const totX  = M + CW - totW;
    const labelX = totX;

    function row(label: string, value: string, bold = false, colour = C.ink) {
      doc.fontSize(9).fillColor(C.muted).font('Helvetica').text(label, labelX, y, { width: totW * 0.58 });
      doc.fontSize(9).fillColor(colour).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, labelX + totW * 0.6, y, { width: totW * 0.38, align: 'right' });
      y += 15;
    }

    const mrpTotal = dto.items.reduce((s, i) => s + i.mrp * i.qty, 0);
    row('Subtotal (MRP)',  `\u20B9${mrpTotal.toFixed(2)}`);
    if (dto.discount > 0)
      row('Product discount', `-\u20B9${dto.discount.toFixed(2)}`, false, C.emerald);
    if (dto.couponDiscount > 0)
      row('Coupon discount',  `-\u20B9${dto.couponDiscount.toFixed(2)}`, false, C.emerald);

    const taxable  = dto.subtotal;
    const cgst     = +(taxable * 0.06).toFixed(2);
    const sgst     = +(taxable * 0.06).toFixed(2);
    row('CGST @ 6%',  `\u20B9${cgst.toFixed(2)}`);
    row('SGST @ 6%',  `\u20B9${sgst.toFixed(2)}`);
    row('Delivery fee', dto.deliveryFee === 0 ? 'FREE' : `\u20B9${dto.deliveryFee.toFixed(2)}`);

    y += 4;
    doc.moveTo(totX, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(0.5).stroke();
    y += 8;

    // Grand total
    doc.rect(totX - 8, y - 4, totW + 8, 28).fill(C.forest);
    doc.fontSize(10).fillColor(C.gold).font('Helvetica-Bold')
      .text('GRAND TOTAL', totX, y + 4, { width: totW * 0.58 });
    doc.fontSize(11).fillColor(C.white).font('Helvetica-Bold')
      .text(`\u20B9${dto.total.toFixed(2)}`, totX + totW * 0.6, y + 3, { width: totW * 0.38, align: 'right' });
    y += 36;

    /* ── PAYMENT METHOD ──────────────────────────────────────────────────── */
    doc.fontSize(8).fillColor(C.muted).font('Helvetica').text('Payment method:', M, y);
    doc.fontSize(9).fillColor(C.ink).font('Helvetica-Bold')
      .text(dto.paymentMethod.toUpperCase(), M + 90, y);
    y += 24;

    /* ── FOOTER DISCLAIMER ───────────────────────────────────────────────── */
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(0.5).stroke();
    y += 10;

    doc.rect(M, y, CW, 50).fill('#f0f7f3');
    doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
      .text(
        'This invoice is computer-generated and does not require a signature. ' +
        'Product information on this invoice is for identification purposes only and does not constitute medical advice. ' +
        'Always consult a qualified doctor or pharmacist before using any medicine. ' +
        'Iyarkai Nala Maruthuvamanai is not liable for self-medication decisions made based on this invoice.',
        M + 8, y + 8, { width: CW - 16, lineBreak: true },
      );

    y += 60;

    doc.fontSize(8).fillColor(C.muted).font('Helvetica')
      .text('Iyarkai Nala Maruthuvamanai · GSTIN: 33AAAAA0000A1Z5 · support@iyarkainalam.in · +91 88000 00000', M, y, { width: CW, align: 'center' });

    doc.end();
  });
}
