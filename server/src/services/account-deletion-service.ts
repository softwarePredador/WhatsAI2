import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

export interface DeleteAccountRequest {
  password: string;
  confirmEmail: string;
}

export interface DeleteAccountResult {
  success: boolean;
  deletedData: {
    userId: string;
    email: string;
    instancesDeleted: number;
    messagesDeleted: number;
    settingsDeleted: boolean;
  };
}

export class AccountDeletionService {
  constructor(private prisma: PrismaClient) {}

  async deleteUserAccount(userId: string, request: DeleteAccountRequest): Promise<DeleteAccountResult> {
    // 1. Get user data with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        instances: {
          include: {
            messages: true
          }
        },
        settings: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Verify email confirmation
    if (user.email !== request.confirmEmail) {
      throw new Error('Email confirmation does not match your account email');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(request.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password. Account deletion cancelled for security.');
    }

    // 4. Count data to be deleted (for confirmation)
    const instancesCount = user.instances.length;
    const messagesCount = user.instances.reduce((total, instance) => total + instance.messages.length, 0);
    const hasSettings = user.settings !== null;

    // 5. Perform the deletion (Prisma will handle cascading)
    await this.prisma.user.delete({
      where: { id: userId }
    });

    return {
      success: true,
      deletedData: {
        userId: user.id,
        email: user.email,
        instancesDeleted: instancesCount,
        messagesDeleted: messagesCount,
        settingsDeleted: hasSettings
      }
    };
  }

  async getAccountDeletionPreview(userId: string): Promise<{
    user: {
      email: string;
      name: string;
      createdAt: Date;
    };
    dataToDelete: {
      instances: number;
      messages: number;
      settings: boolean;
    };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        instances: {
          include: {
            _count: {
              select: { messages: true }
            }
          }
        },
        settings: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalMessages = user.instances.reduce((total, instance) => total + instance._count.messages, 0);

    return {
      user: {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      dataToDelete: {
        instances: user.instances.length,
        messages: totalMessages,
        settings: user.settings !== null
      }
    };
  }
}