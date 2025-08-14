import express from 'express';
import multer from 'multer';
import path from 'path';
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

    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        createdById: req.user.id,
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
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving document file:', error);
    res.status(500).json({ error: 'Failed to serve document' });
  }
});

export default router;