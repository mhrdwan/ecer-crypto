import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true, 
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Users = mongoose.model("Users", userSchema);

export default Users;
