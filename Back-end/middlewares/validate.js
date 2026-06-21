const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: formattedErrors
      });
    }
    next(error);
  }
};

const createJobSchema = z.object({
  job: z.string({ required_error: 'Job title is required' })
    .trim()
    .min(1, 'Job title is required')
    .max(150, 'Job title cannot exceed 150 characters'),
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
  description: z.string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(50000, 'Description cannot exceed 50,000 characters'),
  hrName: z.string().trim().max(100).optional().default(''),
  companyName: z.string().trim().max(150).optional().default(''),
  emailProvider: z.enum(['google', 'microsoft']).optional().default('google'),
  templateId: z.string().optional().default('classic')
});

const updateJobSchema = z.object({
  job: z.string().trim().min(1, 'Job title cannot be empty').max(150).optional(),
  email: z.string().trim().email('Please provide a valid email address').optional(),
  description: z.string().trim().max(50000).optional(),
  hrName: z.string().trim().max(100).optional(),
  companyName: z.string().trim().max(150).optional(),
  isEmailSent: z.boolean().optional(),
  emailProvider: z.enum(['google', 'microsoft']).optional(),
  hasReply: z.boolean().optional(),
  templateId: z.string().optional(),
  followUpDate: z.preprocess((val) => {
    if (val === null || val === 'null' || val === '') return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().nullable().optional()),
  followUpStatus: z.enum(['none', 'pending', 'sent']).optional(),
  followUpText: z.string().trim().optional(),
  isOpened: z.boolean().optional(),
  status: z.enum(['saved', 'applied', 'opened', 'interview', 'offer', 'rejected']).optional()
});

const profileUpdateSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
});

const salaryNegotiationSchema = z.object({
  offeredSalary: z.number().nullable().optional(),
  targetSalary: z.number().nullable().optional(),
  currency: z.string().trim().max(10).optional().default('USD'),
  location: z.string().trim().max(150).optional()
});

module.exports = {
  validate,
  createJobSchema,
  updateJobSchema,
  profileUpdateSchema,
  salaryNegotiationSchema
};

