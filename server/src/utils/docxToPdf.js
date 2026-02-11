import mammoth from 'mammoth';
import htmlPdf from 'html-pdf-node';
export async function convertDocxToPdf(docxBuffer) {
    try {
        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ buffer: docxBuffer });
        const html = result.value;
        // Create a styled HTML document
        const styledHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 40px;
            color: #000;
        }
        p {
            margin: 0 0 10px 0;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        h1 { font-size: 24pt; }
        h2 { font-size: 18pt; }
        h3 { font-size: 14pt; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
        }
        table td, table th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>
        `;
        // Convert HTML to PDF
        const file = { content: styledHtml };
        const options = {
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true,
        };
        const pdfBuffer = await new Promise((resolve, reject) => {
            htmlPdf.generatePdf(file, options, (err, buffer) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(buffer);
                }
            });
        });
        return pdfBuffer;
    }
    catch (error) {
        console.error('Error converting DOCX to PDF:', error);
        throw new Error('Failed to convert document to PDF');
    }
}
//# sourceMappingURL=docxToPdf.js.map