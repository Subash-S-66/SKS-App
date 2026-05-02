import dbConnect from "./db";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  await dbConnect();

  const adminExists = await User.findOne({ role: "admin" });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);
    await User.create({
      name: "SKS Admin",
      username: "admin",
      email: "admin@sksagency.com",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Default admin created successfully.");
  }
}
