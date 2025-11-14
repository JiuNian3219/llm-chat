import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// 数据库连接选项
const options: mongoose.ConnectOptions = {
  autoIndex: true,
  autoCreate: true,
};

/**
 * 连接数据库
 * @returns 数据库连接实例
 */
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      console.error("缺少环境变量 MONGODB_URL");
      process.exit(1);
    }
    const conn = await mongoose.connect(mongoUrl, options);
    console.log(
      `MongoDB 连接成功: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );
    return conn;
  } catch (error: any) {
    console.error(`MongoDB 连接错误: ${error?.message}`);
    process.exit(1);
  }
};

export default connectDB;
