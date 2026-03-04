const PDFDocument = require('pdfkit');

class InvoiceService {

    static generateInvoice(order, items) {
        return new Promise((resolve, reject) => {
            const doc    = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data',  chunk => chunks.push(chunk));
            doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
            doc.on('error', err   => reject(err));

            // ── Header ──
            doc.fontSize(22).font('Helvetica-Bold').text('ZOVO', { align: 'center' });
            doc.fontSize(10).font('Helvetica').fillColor('#888')
               .text('Order Invoice', { align: 'center' });
            doc.moveDown();

            // ── Divider ──
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#5a97f9').stroke();
            doc.moveDown(0.5);

            // ── Order Info ──
            doc.fillColor('#000').fontSize(11).font('Helvetica-Bold')
               .text(`Invoice #${order.id}`, 50, doc.y);
            doc.font('Helvetica').fontSize(10)
               .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`)
               .text(`Status: ${order.order_status.toUpperCase()}`)
               .text(`Payment: ${order.payment_method.toUpperCase()} — ${order.payment_status.toUpperCase()}`);
            doc.moveDown();

            // ── Customer Info ──
            doc.font('Helvetica-Bold').text('Bill To:');
            doc.font('Helvetica')
               .text(order.user_name || order.shipping_name)
               .text(order.user_email || '')
               .text(`${order.shipping_address}, ${order.shipping_city}`)
               .text(`Phone: ${order.shipping_phone}`);
            doc.moveDown();

            // ── Table Header ──
            const col = [50, 230, 350, 430, 510];
            doc.font('Helvetica-Bold').fontSize(10);
            doc.rect(45, doc.y, 510, 20).fill('#5a97f9');
            const headerY = doc.y - 15;
            doc.fillColor('#fff')
               .text('Product',  col[0], headerY)
               .text('Price',    col[1], headerY)
               .text('Qty',      col[2], headerY)
               .text('Subtotal', col[3], headerY);
            doc.moveDown(1.2);

            // ── Table Rows ──
            doc.font('Helvetica').fontSize(10).fillColor('#000');
            items.forEach((item, idx) => {
                const y = doc.y;
                if (idx % 2 === 0) doc.rect(45, y - 3, 510, 18).fill('#f4f7ff').fillColor('#000');
                doc.text(item.product_name, col[0], y, { width: 175 })
                   .text(`$${Number(item.price).toFixed(2)}`, col[1], y)
                   .text(String(item.quantity),                col[2], y)
                   .text(`$${Number(item.subtotal).toFixed(2)}`, col[3], y);
                doc.moveDown(0.2);
            });

            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ddd').stroke();
            doc.moveDown(0.5);

            // ── Totals ──
            const right = 400;
            const valX  = 500;
            doc.font('Helvetica').fontSize(10);
            doc.text(`Subtotal:`,         right, doc.y)
               .text(`$${Number(order.total_amount).toFixed(2)}`,    valX, doc.y - 10, { align: 'right' });
            if (Number(order.discount_amount) > 0) {
                doc.text(`Coupon (${order.coupon_code}):`, right, doc.y)
                   .text(`-$${Number(order.discount_amount).toFixed(2)}`, valX, doc.y - 10, { align: 'right' });
            }
            if (Number(order.wallet_used) > 0) {
                doc.text(`Wallet used:`, right, doc.y)
                   .text(`-$${Number(order.wallet_used).toFixed(2)}`, valX, doc.y - 10, { align: 'right' });
            }
            doc.font('Helvetica-Bold').fontSize(12)
               .text(`Total:`, right, doc.y)
               .text(`$${Number(order.final_amount).toFixed(2)}`, valX, doc.y - 13, { align: 'right' });

            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).fillColor('#888')
               .text('Thank you for shopping with Zovo!', { align: 'center' });

            doc.end();
        });
    }
}

module.exports = InvoiceService;
