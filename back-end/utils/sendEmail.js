const nodemailer = require("nodemailer");

const sendResetEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"SkyDrive Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Réinitialisation de mot de passe",
    html: `
      <p>Bonjour,</p>
      <p>Voici votre lien pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ce lien expire dans 10 minutes.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email envoyé !");
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    throw new Error("Impossible d'envoyer l'email");
  }
};

module.exports = sendResetEmail;
