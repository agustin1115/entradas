import PDFDocument from 'pdfkit';

export function generateTicketPDF(ticket, sale, qrImageBuffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A6', margin: 30 });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ENTRADA', { align: 'center' });

    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666')
      .text('Ticket válido para 1 persona', { align: 'center' });

    doc.moveDown(0.8);

    // QR Code centrado
    const pageWidth = doc.page.width - 60;
    const qrSize = 160;
    const qrX = (doc.page.width - qrSize) / 2;
    doc.image(qrImageBuffer, qrX, doc.y, { width: qrSize, height: qrSize });
    doc.y += qrSize + 10;

    // Info
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text(sale.buyer_name, { align: 'center' });

    doc.moveDown(0.3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#888')
      .text(`Entrada ${ticket.ticket_number} de ${sale.quantity}`, { align: 'center' });

    doc.moveDown(0.3);
    doc
      .fontSize(7)
      .fillColor('#aaa')
      .text(`ID: ${ticket.id.slice(0, 8).toUpperCase()}`, { align: 'center' });

    doc.end();
  });
}
