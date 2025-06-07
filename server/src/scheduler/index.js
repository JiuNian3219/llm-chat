import cron from 'node-cron';
import { deleteExpiredFiles } from '../services/database/file.js';

/**
 * 初始化定时任务
 */
export const initScheduler = () => {
  // 每天凌晨 2:00 执行一次清理过期文件
  cron.schedule('0 2 * * *', async () => {
    console.log('开始执行定时清理过期文件任务...');
    try {
      await deleteExpiredFiles();
      console.log('定时清理过期文件任务执行完成');
    } catch (error) {
      console.error('定时清理过期文件任务执行失败:', error);
    }
  });

  console.log('定时任务调度器已启动');
};