import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const {
      signerId,
      signatureData,
      positionX,
      positionY,
      width,
      height,
      pageNumber
    } = req.body;

    const signer = await prisma.contractSigner.findUnique({
      where: { id: signerId },
      include: { contract: true }
    });

    if (!signer) {
      return res.status(404).json({ error: 'Signer not found' });
    }

    if (signer.status === 'signed') {
      return res.status(400).json({ error: 'Document already signed by this signer' });
    }

    const signature = await prisma.signature.create({
      data: {
        signerId,
        signatureData,
        positionX,
        positionY,
        width,
        height,
        pageNumber
      }
    });

    await prisma.contractSigner.update({
      where: { id: signerId },
      data: {
        status: 'signed',
        signedAt: new Date()
      }
    });

    const allSigners = await prisma.contractSigner.findMany({
      where: { contractId: signer.contractId }
    });

    const allSigned = allSigners.every(s => s.status === 'signed');

    if (allSigned) {
      await prisma.contract.update({
        where: { id: signer.contractId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    }

    res.status(201).json(signature);
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({ error: 'Failed to create signature' });
  }
});

router.get('/contract/:contractId', async (req, res) => {
  try {
    const signatures = await prisma.signature.findMany({
      where: {
        signer: {
          contractId: req.params.contractId
        }
      },
      include: {
        signer: {
          select: {
            name: true,
            email: true,
            signedAt: true
          }
        }
      }
    });

    res.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: 'Failed to fetch signatures' });
  }
});

export default router;