import ActivityLog from '@/models/ActivityLog';
import dbConnect from './db';

export const logActivity = async (
  projectId: string,
  userId: string,
  action: string,
  type: string,
  metadata?: any
) => {
  try {
    await dbConnect();
    await ActivityLog.create({
      projectId,
      userId,
      action,
      type,
      metadata
    });
  } catch (error) {
    console.error("Failed to log activity", error);
  }
};
