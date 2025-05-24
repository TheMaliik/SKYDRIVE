const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  cin: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  address: { type: String },
  ville: { type: String },
  role: { 
    type: String, 
    enum: ["user", "admin"],  
    required: true,
    default: "user"  
  },
  password: { type: String, required: true, minlength: 6, select: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  photo: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Méthode pour tester le mot de passe
UserSchema.methods.testPassword = async function(inputPassword) {
  console.log('Comparaison pour:', this.email);
  console.log('Entrée:', inputPassword);
  console.log('Stocké:', this.password);
  
  const result = await bcrypt.compare(inputPassword, this.password);
  console.log('Résultat:', result);
  return result;
};

// Hook 'pre-save' pour hacher le mot de passe
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  

  console.log('Hachage du mot de passe pour:', this.email);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Nouveau hash:', this.password);
  next();
});

// Création du modèle User
const User = mongoose.model("User", UserSchema);

module.exports = User;
