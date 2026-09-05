// Requires: npm install pdfkit
import PDFDocument from "pdfkit";

/**
 * Renders a payslip as a PDF and resolves with a Buffer.
 * @param {{ payslip: object, lines: object[], employee: object, payrun: object }} params
 * @returns {Promise<Buffer>}
 */
export function generatePayslipPdf({ payslip, lines, employee, payrun }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Employee: ${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim());
    doc.text(`Department: ${employee.department}`);
    doc.text(`Designation: ${employee.designation}`);
    doc.text(`Pay Run: ${payrun.name}`);
    doc.text(`Period: ${payrun.periodStart} to ${payrun.periodEnd}`);
    doc.text(`Status: ${payslip.status}`);
    doc.moveDown();

    doc.fontSize(13).text("Salary Breakdown", { underline: true });
    doc.moveDown(0.5);

    const sortedLines = [...(lines ?? [])].sort(
      (a, b) => a.sequence - b.sequence,
    );

    doc.fontSize(10);
    for (const line of sortedLines) {
      const sign = line.category === "DEDUCTION" ? "-" : "";
      doc.text(
        `${line.name} (${line.code}): ${sign}${Number(line.amount).toFixed(2)}`,
      );
    }

    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Basic Salary: ${Number(payslip.basicSalary).toFixed(2)}`);
    doc.text(`Gross Salary: ${Number(payslip.grossSalary).toFixed(2)}`);
    doc.text(`Net Salary: ${Number(payslip.netSalary).toFixed(2)}`, {
      underline: true,
    });

    if (payslip.warnings) {
      doc.moveDown();
      doc.fillColor("red").text(`Warning: ${payslip.warnings}`);
      doc.fillColor("black");
    }

    doc.end();
  });
}