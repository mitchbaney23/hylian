import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { sendSigningInvitation } from '../utils/email';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { title, description, documentId, signers } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || document.createdById !== req.user.id) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        description,
        documentId,
        signers: {
          create: signers.map((signer: any) => ({
            email: signer.email,
            name: signer.name,
            userId: signer.userId || null
          }))
        }
      },
      include: {
        signers: true,
        document: true
      }
    });

    // Send email invitations (optional - won't fail if email not configured)
    for (const signer of contract.signers) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'https://your-app.up.railway.app'
        : 'http://localhost:5174';
      const signingLink = `${baseUrl}/sign/${contract.id}?signer=${signer.id}`;
      
      try {
        await sendSigningInvitation(signer.email, signer.name, contract.title, signingLink);
        console.log(`✅ Email invitation sent to ${signer.email}`);
      } catch (emailError: any) {
        console.log(`⚠️ Email not sent to ${signer.email} (email service not configured):`, emailError.message);
        // Continue without failing - email is optional for development/testing
      }
    }

    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { document: { createdById: req.user.id } },
          { signers: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        document: true,
        signers: {
          include: {
            signatures: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        document: {
          include: {
            createdBy: {
              select: { name: true, email: true }
            }
          }
        },
        signers: {
          include: {
            signatures: true,
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

router.patch('/:id/status', authenticateToken, async (req: any, res) => {
  try {
    const { status } = req.body;
    const contractId = req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { document: true }
    });

    if (!contract || contract.document.createdById !== req.user.id) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { 
        status,
        completedAt: status === 'completed' ? new Date() : null
      },
      include: {
        signers: true,
        document: true
      }
    });

    res.json(updatedContract);
  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

export default router;