import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.post('/upload', authenticateToken, upload.single('document'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content to store in database as backup
    const fileContent = fs.readFileSync(req.file.path);

    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        createdById: req.user.id,
        fileContent: fileContent, // Store file content in database
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { createdById: req.user.id },
      include: {
        contracts: {
          include: {
            signers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        contracts: {
          include: {
            signers: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.get('/:id/file', authenticateToken, async (req: any, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
      // fileContent is included by default
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const contractSigner = await prisma.contractSigner.findFirst({
      where: {
        contract: { documentId: document.id },
        OR: [
          { userId: req.user.id },
          { email: req.user.email }
        ]
      }
    });

    if (document.createdById !== req.user.id && !contractSigner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(process.cwd(), 'uploads', document.filename);
    
    // Try to serve from filesystem first
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else if (document.fileContent) {
      // Fallback to database content if file doesn't exist on filesystem
      console.log(`File ${document.filename} not found on filesystem, serving from database`);
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', document.fileSize.toString());
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.send(Buffer.from(document.fileContent));
    } else {
      return res.status(404).json({ error: 'Document file not found' });
    }
  } catch (error) {
    console.error('Error serving document file:', error);
    res.status(500).json({ error: 'Failed to serve document' });
  }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        contracts: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if document has any contracts
    if (document.contracts.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete document with existing contracts. Delete contracts first.' 
      });
    }

    // Delete the file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', document.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete signature fields associated with the document
    await prisma.signatureField.deleteMany({
      where: { documentId: document.id }
    });

    // Delete the document record
    await prisma.document.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;