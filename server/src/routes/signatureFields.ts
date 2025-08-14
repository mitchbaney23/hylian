import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get signature fields for a document
router.get('/document/:documentId', authenticateToken, async (req: any, res) => {
  try {
    const { documentId } = req.params;

    // Verify user has access to this document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { createdBy: true }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const signatureFields = await prisma.signatureField.findMany({
      where: { documentId },
      orderBy: [{ pageNumber: 'asc' }, { positionY: 'asc' }, { positionX: 'asc' }]
    });

    res.json(signatureFields);
  } catch (error) {
    console.error('Error fetching signature fields:', error);
    res.status(500).json({ error: 'Failed to fetch signature fields' });
  }
});

// Create a signature field
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      documentId,
      fieldType,
      signerEmail,
      signerName,
      label,
      isRequired,
      positionX,
      positionY,
      width,
      height,
      pageNumber
    } = req.body;

    // Verify user owns the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || document.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const signatureField = await prisma.signatureField.create({
      data: {
        documentId,
        fieldType,
        signerEmail,
        signerName,
        label: label || '',
        isRequired: isRequired ?? true,
        positionX,
        positionY,
        width,
        height,
        pageNumber
      }
    });

    res.status(201).json(signatureField);
  } catch (error) {
    console.error('Error creating signature field:', error);
    res.status(500).json({ error: 'Failed to create signature field' });
  }
});

// Update a signature field
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify user owns the document
    const signatureField = await prisma.signatureField.findUnique({
      where: { id },
      include: { document: true }
    });

    if (!signatureField || signatureField.document.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedField = await prisma.signatureField.update({
      where: { id },
      data: updateData
    });

    res.json(updatedField);
  } catch (error) {
    console.error('Error updating signature field:', error);
    res.status(500).json({ error: 'Failed to update signature field' });
  }
});

// Delete a signature field
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify user owns the document
    const signatureField = await prisma.signatureField.findUnique({
      where: { id },
      include: { document: true }
    });

    if (!signatureField || signatureField.document.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.signatureField.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting signature field:', error);
    res.status(500).json({ error: 'Failed to delete signature field' });
  }
});

export default router;