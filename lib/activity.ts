import dbConnect from './db';
import { ActivityLog } from '@/models/ActivityLog';

export async function logActivity({
  projectId,
  userId,
  action,
  type,
  metadata
}: {
  projectId: string | any;
  userId: string | any;
  action: string;
  type: 'requirement' | 'payment' | 'demo' | 'status' | 'credential' | 'link' | 'team' | 'email' | 'general';
  metadata?: any;
}) {
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
    console.error("Failed to log activity:", error);
  }
}
