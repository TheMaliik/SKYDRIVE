const connectDB = require("./config/db"); // ou le chemin vers ton fichier connectDB
const User = require("./model/User");

const createAdmin = async () => {
  await connectDB();

  const email = "admin@skydrive.com";
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log("⚠️ Un admin avec cet email existe déjà.");
    process.exit();
  }

  const admin = await User.create({
    name: "Admin Principal",
    email,
    password: "admin123", // sera hashé automatiquement
    role: "admin"
  });

  console.log("✅ Admin créé avec succès :", admin.email);
  process.exit();
};

createAdmin();
