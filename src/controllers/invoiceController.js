'use strict';
const PDFDocument = require('pdfkit');
const Booking = require('@models/Booking');
const response = require('@responses');

const PRIMARY = '#2d5a00';
const WHITE = '#FFFFFF';
const LIGHT_GREEN = '#eaf5d6';
const MUTED = '#888888';
const DARK = '#1a1a1a';
const BORDER = '#d4e0c7';

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(`${d}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const buildPdf = (data) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW = 595.28;
    const margin = 40;
    const cardX = margin;
    const cardW = PW - margin * 2;

    doc.rect(0, 0, PW, 841.89).fill('#f0f4f8');

    const headerH = 175;
    doc.save();
    doc.roundedRect(cardX, 40, cardW, headerH, 16).clip();
    doc.rect(cardX, 40, cardW, headerH).fill(PRIMARY);
    doc.circle(cardX + cardW - 30, 50, 90).fill('#3a7200');
    doc.circle(cardX + cardW - 110, 40 + headerH - 10, 60).fill('#336800');
    doc.restore();

    doc.roundedRect(cardX + cardW - 112, 52, 98, 24, 12)
       .fillAndStroke('#ffffff22', '#ffffff44');
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
       .text('✓  CONFIRMED', cardX + cardW - 108, 59, { width: 90, align: 'center' });

    const bx = cardX + 22;
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8).opacity(0.7)
       .text('BOOKING REFERENCE', bx, 60);
    doc.opacity(1).fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
       .text(data.ref || '—', bx, 74);

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8).opacity(0.7)
       .text('PASSENGER NAME', bx, 114);
    doc.opacity(1).fillColor(WHITE).font('Helvetica-Bold').fontSize(15)
       .text(data.passenger || '—', bx, 128);

    const initials = (data.passenger || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    doc.circle(cardX + cardW - 58, 158, 20).fill('#ffffff22');
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
       .text(initials, cardX + cardW - 78, 150, { width: 44, align: 'center' });

    const notchY = 40 + headerH;
    doc.circle(cardX, notchY, 12).fill('#f0f4f8');
    doc.circle(cardX + cardW, notchY, 12).fill('#f0f4f8');
    doc.save();
    doc.moveTo(cardX + 14, notchY).lineTo(cardX + cardW - 14, notchY)
       .dash(6, { space: 5 }).stroke(BORDER);
    doc.restore();

    const routeY = notchY + 18;
    const routeH = 76;
    doc.rect(cardX, notchY, cardW, routeH + 20).fill(WHITE);

    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('FROM', cardX + 20, routeY);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(20).text(data.from || '—', cardX + 20, routeY + 12);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text((data.from || '') + ' Coach Station', cardX + 20, routeY + 36, { width: 150 });

    const midX = cardX + cardW / 2;
    doc.circle(midX, routeY + 26, 20).fill(LIGHT_GREEN);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(15)
       .text('>', midX - 5, routeY + 18);

    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
       .text('TO', cardX + cardW - 120, routeY, { width: 100, align: 'right' });
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(20)
       .text(data.to || '—', cardX + cardW - 120, routeY + 12, { width: 100, align: 'right' });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text((data.to || '') + ' Terminal', cardX + cardW - 120, routeY + 36, { width: 100, align: 'right' });

    const gridY = notchY + routeH + 20;
    const gridH = 162;
    doc.rect(cardX, gridY, cardW, 1).fill(BORDER);
    doc.rect(cardX, gridY, cardW, gridH).fill(WHITE);

    const cells = [
      { label: 'DEPARTURE DATE', value: formatDate(data.date) },
      { label: 'DEPARTURE TIME', value: data.departure || '—' },
      { label: 'SEAT(S)', value: data.seatDisplay },
      { label: 'OPERATOR', value: data.operator || '—' },
      { label: 'CONTACT EMAIL', value: data.email || '—' },
      { label: 'BOOKING DATE', value: data.bookedOn },
    ];
    const cellW = cardW / 2;
    const cellH = gridH / 3;
    cells.forEach((cell, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = cardX + col * cellW;
      const cy = gridY + row * cellH;
      if (row > 0 && col === 0) doc.rect(cx, cy, cardW, 1).fill(BORDER);
      if (col === 1) doc.rect(cx, cy + 8, 1, cellH - 16).fill(BORDER);
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text(cell.label, cx + 16, cy + 14);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12)
         .text(cell.value, cx + 16, cy + 28, { width: cellW - 32, ellipsis: true });
    });

    const pricingY = gridY + gridH;
    const pricingH = 88;
    doc.rect(cardX, pricingY, cardW, 1).fill(BORDER);
    doc.rect(cardX, pricingY, cardW, pricingH).fill('#fafcf7');
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
       .text('PRICE BREAKDOWN', cardX + 20, pricingY + 12);
    const total = Number(data.amount || 0);
    doc.fillColor('#555').font('Helvetica').fontSize(11)
       .text(`Base Fare (${data.seats || 1}× Adult)`, cardX + 20, pricingY + 28);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text(`€${total.toFixed(2)}`, cardX + cardW - 80, pricingY + 28, { width: 60, align: 'right' });
    doc.rect(cardX + 20, pricingY + 50, cardW - 40, 0.5).fill(BORDER);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13)
       .text('Total Paid', cardX + 20, pricingY + 60);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(18)
       .text(`€${total.toFixed(2)}`, cardX + cardW - 90, pricingY + 56, { width: 70, align: 'right' });

    const noteY = pricingY + pricingH;
    const noteH = 52;
    doc.rect(cardX, noteY, cardW, noteH).fill('#f5faf0');
    doc.rect(cardX, noteY, cardW, 1).fill(BORDER);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text('Please arrive at least 15 minutes before departure. Have a valid government-issued ID ready for inspection by the driver. This document is your official booking invoice.',
         cardX + 16, noteY + 10, { width: cardW - 32, lineGap: 2 });

    const footerY = noteY + noteH;
    const footerH = 42;
    doc.save();
    doc.roundedRect(cardX, footerY, cardW, footerH, [0, 0, 16, 16]).clip();
    doc.rect(cardX, footerY, cardW, footerH).fill(PRIMARY);
    doc.restore();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
       .text('Alagare  —  Official Booking Invoice',
         cardX, footerY + 14, { width: cardW, align: 'center' });

    doc.end();
  });

const generateInvoice = async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const booking = await Booking.findOne({ ref: bookingRef, api_user: req.apiUser._id });

    if (!booking) {
      return response.notFound(res, { message: 'Booking not found' });
    }

    const [from, to] = (booking.route || '→').split('→').map(s => s.trim());

    const pdfBuffer = await buildPdf({
      ref: booking.ref,
      passenger: booking.passenger,
      email: booking.email,
      from,
      to,
      date: booking.date,
      departure: booking.departure || null,
      seats: booking.seats,
      seatDisplay: (booking.seatKeys || []).join(', ') || `${booking.seats || 1} Seat(s)`,
      operator: booking.operator,
      amount: booking.amount,
      bookedOn: booking.createdAt
        ? new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Alagare_Invoice_${booking.ref}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.status(200).end(pdfBuffer);
  } catch (error) {
    console.error('[invoiceController]', error);
    if (!res.headersSent) {
      return response.error(res, error);
    }
  }
};

module.exports = { generateInvoice };
