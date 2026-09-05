// This is a FAKE mailer. It does not send any real email.
// It just prints (logs) what it would have sent, so we can test
// the payslip email flow without setting up a real email service.

export const sendMail = async ({ to, subject, attachments }) => {
  console.log("----- Simulated Email -----");
  console.log("To:", to);
  console.log("Subject:", subject);

  if (attachments && attachments.length > 0) {
    console.log("Attachment:", attachments[0].filename);
  } else {
    console.log("Attachment: none");
  }

  console.log("----------------------------");


  return { success: true };
};