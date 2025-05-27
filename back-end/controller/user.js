const User = require('../model/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Liste des utilisateurs
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json({ success: true, data: users });
});

// Création d'un nouvel utilisateur
exports.createUser = asyncHandler(async (req, res) => {
  const { cin, nom, prenom, email, phone, address, ville, role } = req.body;

  // Validation des champs requis
  if (!cin || !nom || !prenom || !email) {
    return res.status(400).json({ 
      success: false,
      message: "Les champs CIN, nom, prénom et email sont obligatoires." 
    });
  }

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ $or: [{ email }, { cin }] });
  if (existingUser) {
    return res.status(400).json({ 
      success: false,
      message: "Un utilisateur avec cet email ou CIN existe déjà." 
    });
  }

  // Créer un mot de passe temporaire plus sécurisé
  const tempPassword = crypto.randomBytes(8).toString('hex'); // Génère un mot de passe aléatoire de 16 caractères hexadécimaux
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Créer l'utilisateur
  const newUser = await User.create({
    cin,
    nom,
    prenom,
    email,
    phone: phone || '',
    address: address || '',
    ville: ville || '',
    role: role || 'user',
    password: hashedPassword
  });

  // Envoyer l'email avec le mot de passe temporaire
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Votre compte SkyDrive - mot de passe temporaire",
      text: `Bonjour ${prenom},\n\nVotre compte a été créé.\nVoici votre mot de passe temporaire : ${tempPassword}\n\nMerci de le changer dès votre première connexion.`,
      html: `
        <p>Bonjour ${prenom},</p>
        <p>Votre compte a été créé avec les détails suivants :</p>
        <ul>
          <li>Email: ${email}</li>
          <li>Mot de passe temporaire: <strong>${tempPassword}</strong></li>
        </ul>
        <p>Merci de changer votre mot de passe dès votre première connexion.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (mailError) {
    console.error("Erreur d'envoi d'email:", mailError);
    // On ne renvoie pas d'erreur car l'utilisateur a été créé quand même
  }

  // Retourner la réponse sans le mot de passe
  const userResponse = newUser.toObject();
  delete userResponse.password;

  res.status(201).json({ 
    success: true,
    data: userResponse,
    message: "Utilisateur créé avec succès." 
  });
});

// Modification utilisateur
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cin, nom, prenom, email, phone, address, ville, role } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { cin, nom, prenom, email, phone, address, ville, role },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ 
      success: false,
      message: "Utilisateur non trouvé." 
    });
  }

  res.status(200).json({ 
    success: true,
    data: updatedUser 
  });
});

// Suppression utilisateur
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    return res.status(404).json({ 
      success: false,
      message: "Utilisateur non trouvé." 
    });
  }

  res.status(200).json({ 
    success: true,
    message: "Utilisateur supprimé avec succès." 
  });
});

// Changement de rôle
exports.changeRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ 
      success: false,
      message: "Utilisateur non trouvé." 
    });
  }

  res.status(200).json({ 
    success: true,
    data: updatedUser,
    message: "Rôle mis à jour avec succès." 
  });
});

// Envoi d'email de réinitialisation
exports.sendResetPasswordEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: "Utilisateur non trouvé." 
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
    expiresIn: "15m" 
  });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - SkyDrive",
      html: `
        <p>Bonjour ${user.prenom},</p>
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ce lien est valable 15 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ 
      success: true,
      message: "Email de réinitialisation envoyé." 
    });
  } catch (error) {
    console.error("Erreur d'envoi d'email:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de l'envoi de l'email." 
    });
  }
});
// Changement de mot de passe avec validation de l'ancien mot de passe
exports.changePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur non trouvé."
    });
  }

  // Vérification de l'ancien mot de passe
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid) {
    return res.status(400).json({
      success: false,
      message: "Ancien mot de passe incorrect."
    });
  }

  // Hachage du nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Mise à jour du mot de passe
  user.password = hashedPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Mot de passe mis à jour avec succès."
  });
});


