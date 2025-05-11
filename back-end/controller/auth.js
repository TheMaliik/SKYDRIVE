const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require('../model/User');
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const ErrorResponse = require("../utils/ErrorResponse");

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

// Enregistrement de l'utilisateurs
exports.register = asyncHandler(async (req, res) => {
  const { cin, nom, prenom, email, phone, address, ville, password, role } = req.body;

  // Vérifier que tous les champs requis sont fournis
  if (!cin || !nom || !prenom || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "Les champs obligatoires sont manquants." });
  }

  // Vérifier si un utilisateur avec le même email ou cin existe déjà
  const existingUser = await User.findOne({ $or: [{ email }, { cin }] });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "L'utilisateur avec cet email ou CIN existe déjà." });
  }

  // Création de l'utilisateur (le mot de passe sera haché automatiquement)
  const user = await User.create({
    cin,
    nom,
    prenom,
    email,
    phone,
    address,
    ville,
    password,
    role,
  });

  // Supprimer le mot de passe de la réponse
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({ success: true, data: userResponse });
});
;




// Connexion de l'utilisateur
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation des champs requis
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email et mot de passe requis'
    });
  }

  // Récupération de l'utilisateur avec le mot de passe
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Identifiants invalides'
    });
  }

  // Comparaison des mots de passe
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Identifiants invalides'
    });
  }

  // Génération du token JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'votre_secret_key',
    { expiresIn: '8h' }
  );

  // Réponse avec token
  res.status(200).json({
    success: true,
    token,
    role: user.role,
    id: user._id,
    message: 'Connexion réussie'
  });
});

// Déconnexion de l'utilisateur
exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Déconnexion réussie" });
});

// Mot de passe oublié (envoi du lien de réinitialisation)
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse("Utilisateur non trouvé", 404));
  }

  // Génération du token de réinitialisation
  const resetToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token valide pendant 10 minutes
  await user.save({ validateBeforeSave: false });

  // Configuration de l'email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
  const mailOptions = {
    from: `"SkyDrive Support" <${emailUser}>`,
    to: user.email,
    subject: "Réinitialisation de mot de passe",
    html: `<p>Bonjour ${user.nom || ""},</p>
           <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>Ce lien expire dans 10 minutes.</p>`,
  };

  // Envoi de l'email
  await transporter.sendMail(mailOptions);

  res.status(200).json({ success: true, message: "Email envoyé avec succès" });
});

// Réinitialisation du mot de passe
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hacher le token pour le vérifier
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Chercher l'utilisateur avec ce token valide
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Réinitialiser le mot de passe
  user.password = newPassword; // Le hook 'pre-save' s'occupera du hachage
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès'
  });
});

// Récupérer tous les utilisateurs (admin uniquement)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: "admin" } });
  res.status(200).json({ success: true, data: users });
});

// Vérification du token de réinitialisation
exports.verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: "Token invalide ou expiré" });
  }

  res.status(200).json({ success: true, message: "Token valide" });
});
// Changer le mot de passe de l'utilisateur
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Récupère l'ID de l'utilisateur à partir des paramètres
  const { oldPassword, newPassword } = req.body; // Récupère l'ancien et le nouveau mot de passe

  // Vérification de l'utilisateur par son ID
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  // Comparaison de l'ancien mot de passe avec celui en base
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Ancien mot de passe incorrect" });
  }

  // Hachage du nouveau mot de passe
  user.password = await bcrypt.hash(newPassword, 10); // Hachage avec un sel de 10 tours

  // Enregistrement du mot de passe modifié
  await user.save();

  // Réponse de succès
  res.status(200).json({
    success: true,
    message: "Mot de passe modifié avec succès"
  });
});
