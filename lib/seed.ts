import connectDB from "./db";
import { User } from "../models/User";
import bcrypt from "bcrypt";

async function seed() {
  await connectDB();
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);
    await User.create({
      name: "Super Admin",
      username: "admin",
      email: "admin@sksagency.com",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Default admin created");
  } else {
    console.log("Admin already exists");
  }
}

seed().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
