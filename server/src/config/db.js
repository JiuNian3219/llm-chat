import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// 数据库连接选项
const options = {
  // 保持连接
  autoIndex: true,
  // 自动创建索引
  autoCreate: true
};

/**
 * 连接数据库
 * @returns {Promise<typeof mongoose>} 数据库连接实例
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, options);
    console.log(`MongoDB 连接成功: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接错误: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;