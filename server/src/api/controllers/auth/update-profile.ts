import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../../database/prisma';
import { AuthenticatedRequest } from '../../../types';

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);
    const { name, email } = validatedData;
    
    // Get user ID from JWT middleware
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação inválido'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está sendo usado por outro usuário'
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name,
        email,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log profile update (without sensitive data)

    // Return success response with updated user data
    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Este email já está sendo usado'
        });
      }
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};