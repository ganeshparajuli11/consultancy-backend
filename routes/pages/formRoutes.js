const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  // Form management
  createForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
  duplicateForm,
  
  // Language-specific form management
  getLanguages,
  getFormsByLanguage,
  getGeneralForms,
  
  // Application management
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  assignApplication,
  addApplicationNote,
  sendCustomEmail,
  getApplicationStats,
  toggleArchiveApplication,
  bulkApplicationActions
} = require('../../controllers/pages/formController');

// Import middleware
const validateBody = require('../../middleware/validation/validateBody');
const validateParams = require('../../middleware/validation/validateParams');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { checkIsAdmin } = require('../../middleware/auth/role');

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

// Field schema for form creation
const fieldSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum([
    'text', 'email', 'tel', 'number', 'textarea', 'select', 
    'multiselect', 'checkbox', 'radio', 'date', 'file', 
    'url', 'password', 'color', 'range', 'time'
  ]),
  required: z.boolean().optional().default(false),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional()
  }).optional(),
  order: z.number().optional().default(0)
});

// Form creation schema
const createFormSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  fields: z.array(fieldSchema).min(1),
  category: z.enum(['language-course', 'test-preparation', 'consultation', 'general']).optional(),
  language: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid language ID"),
    z.string().length(0),
    z.null()
  ]).optional().transform(val => val === "" ? null : val), // Handle empty string
  isActive: z.boolean().optional(),
  emailNotifications: z.object({
    enabled: z.boolean().optional(),
    adminEmails: z.array(z.string().email()).optional(),
    autoReplyTemplate: z.object({
      subject: z.string().optional(),
      message: z.string().optional()
    }).optional()
  }).optional(),
  settings: z.object({
    allowMultipleSubmissions: z.boolean().optional(),
    maxSubmissions: z.number().optional(),
    maxCapacity: z.number().positive().optional().nullable(),
    submissionDeadline: z.union([
      z.string().datetime(),
      z.string().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid datetime format"),
      z.null()
    ]).optional(),
    requiresApproval: z.boolean().optional()
  }).optional()
});

// Form update schema
const updateFormSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  fields: z.array(fieldSchema).optional(),
  category: z.enum(['language-course', 'test-preparation', 'consultation', 'general']).optional(),
  language: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid language ID"),
    z.string().length(0),
    z.null()
  ]).optional().transform(val => val === "" ? null : val), // Handle empty string
  isActive: z.boolean().optional(),
  emailNotifications: z.object({
    enabled: z.boolean().optional(),
    adminEmails: z.array(z.string().email()).optional(),
    autoReplyTemplate: z.object({
      subject: z.string().optional(),
      message: z.string().optional()
    }).optional()
  }).optional(),
  settings: z.object({
    allowMultipleSubmissions: z.boolean().optional(),
    maxSubmissions: z.number().optional(),
    maxCapacity: z.number().positive().optional().nullable(),
    submissionDeadline: z.union([
      z.string().datetime(),
      z.string().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid datetime format"),
      z.null()
    ]).optional(),
    requiresApproval: z.boolean().optional()
  }).optional()
});

// Application submission schema - Flexible for dynamic forms
const submitApplicationSchema = z.object({
  studentInfo: z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(1).optional(),
    dateOfBirth: z.string().optional(),
    address: z.record(z.any()).optional()
  }).optional(),
  academicInfo: z.record(z.any()).optional(),
  coursePreferences: z.record(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  formData: z.record(z.any()).optional()
}).refine((data) => {
  // At minimum, we need some form data
  return data.formData || data.studentInfo;
}, {
  message: "Form data is required"
});

// Status update schema
const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'under-review', 'approved', 'rejected', 'waitlisted', 'cancelled']),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  sendEmail: z.boolean().optional().default(true)
});

// Assignment schema
const assignmentSchema = z.object({
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  notes: z.string().max(500).optional()
});

// Note schema
const noteSchema = z.object({
  note: z.string().min(1).max(1000),
  isInternal: z.boolean().optional().default(true)
});

// Email schema
const emailSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  copyToAdmin: z.boolean().optional().default(false)
});

// Bulk operations schema
const bulkOperationsSchema = z.object({
  action: z.enum(['updateStatus', 'assign', 'archive', 'setPriority']),
  applicationIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  data: z.object({
    status: z.enum(['pending', 'under-review', 'approved', 'rejected', 'waitlisted', 'cancelled']).optional(),
    reason: z.string().optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    archive: z.boolean().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
  }).optional()
});

// Parameter schemas
const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId')
});

const formIdSchema = z.object({
  formId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid form ID')
});

const identifierSchema = z.object({
  identifier: z.string().min(1)
});

const duplicateFormSchema = z.object({
  name: z.string().min(3).max(100)
});

const archiveSchema = z.object({
  archive: z.boolean().optional().default(true)
});

// ===========================================
// FORM MANAGEMENT ROUTES (Admin only)
// ===========================================

/**
 * Create new application form
 * POST /api/forms/create
 * Access: Admin only
 */
router.post('/create', 
  authenticateJWT,
  checkIsAdmin,
  validateBody(createFormSchema),
  createForm
);

/**
 * Get all forms
 * GET /api/forms
 * Access: Admin, Staff
 */
router.get('/',
  authenticateJWT,
  checkIsAdmin,
  getAllForms
);

// ====================
// LANGUAGE-SPECIFIC ROUTES (Must come before /:identifier)
// ====================

/**
 * Get all languages for form creation
 * GET /api/forms/languages
 * Access: Admin
 */
router.get('/languages', authenticateJWT, checkIsAdmin, getLanguages);

/**
 * Get forms by language
 * GET /api/forms/by-language/:languageId
 * Access: Admin
 */
router.get('/by-language/:languageId', 
  authenticateJWT, 
  checkIsAdmin,
  validateParams(mongoIdSchema),
  getFormsByLanguage
);

/**
 * Get general forms (not language-specific)
 * GET /api/forms/general
 * Access: Admin
 */
router.get('/general', authenticateJWT, checkIsAdmin, getGeneralForms);

// ===========================================
// APPLICATION MANAGEMENT ROUTES (Admin/Staff)
// Must come BEFORE /:identifier route to avoid conflicts
// ===========================================

/**
 * Get all applications
 * GET /api/forms/applications
 * Access: Admin, Staff
 */
router.get('/applications',
  authenticateJWT,
  checkIsAdmin,
  getAllApplications
);

/**
 * Get application statistics
 * GET /api/forms/applications/stats
 * Access: Admin, Staff
 */
router.get('/applications/stats',
  authenticateJWT,
  checkIsAdmin,
  getApplicationStats
);

/**
 * Bulk operations on applications
 * POST /api/forms/applications/bulk
 * Access: Admin, Staff
 */
router.post('/applications/bulk',
  authenticateJWT,
  checkIsAdmin,
  validateBody(bulkOperationsSchema),
  bulkApplicationActions
);

/**
 * Get single application
 * GET /api/forms/applications/:id
 * Access: Admin, Staff
 */
router.get('/applications/:id',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  getApplicationById
);

/**
 * Update application status
 * PUT /api/forms/applications/:id/status
 * Access: Admin, Staff
 */
router.put('/applications/:id/status',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(statusUpdateSchema),
  updateApplicationStatus
);

/**
 * Assign application to staff
 * PUT /api/forms/applications/:id/assign
 * Access: Admin, Staff
 */
router.put('/applications/:id/assign',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(assignmentSchema),
  assignApplication
);

/**
 * Add note to application
 * POST /api/forms/applications/:id/notes
 * Access: Admin, Staff
 */
router.post('/applications/:id/notes',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(noteSchema),
  addApplicationNote
);

/**
 * Send custom email to applicant
 * POST /api/forms/applications/:id/send-email
 * Access: Admin, Staff
 */
router.post('/applications/:id/send-email',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(emailSchema),
  sendCustomEmail
);

/**
 * Archive/Unarchive application
 * PUT /api/forms/applications/:id/archive
 * Access: Admin, Staff
 */
router.put('/applications/:id/archive',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(archiveSchema),
  toggleArchiveApplication
);

/**
 * Get form by ID or slug
 * GET /api/forms/:identifier
 * Access: Admin, Staff
 */
router.get('/:identifier',
  authenticateJWT,
  checkIsAdmin,
  validateParams(identifierSchema),
  getFormById
);

/**
 * Update form
 * PUT /api/forms/:id
 * Access: Admin only
 */
router.put('/:id',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(updateFormSchema),
  updateForm
);

/**
 * Delete/Deactivate form
 * DELETE /api/forms/:id
 * Access: Admin only
 */
router.delete('/:id',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  deleteForm
);

/**
 * Duplicate form
 * POST /api/forms/:id/duplicate
 * Access: Admin only
 */
router.post('/:id/duplicate',
  authenticateJWT,
  checkIsAdmin,
  validateParams(mongoIdSchema),
  validateBody(duplicateFormSchema),
  duplicateForm
);

// ===========================================
// PUBLIC FORM ACCESS ROUTES
// ===========================================

/**
 * Get public form by slug (for frontend form rendering)
 * GET /api/forms/public/:slug
 * Access: Public
 */
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const ApplicationForm = require('../../models/ui/applicationFormModel');
    const form = await ApplicationForm.findOne({ 
      slug: slug, 
      isActive: true 
    }).populate('language', 'name code flag')
      .select('name description fields category language settings.submissionDeadline isActive');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or inactive'
      });
    }
    
    // Check if submission deadline has passed
    if (form.settings.submissionDeadline && 
        new Date() > new Date(form.settings.submissionDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed'
      });
    }
    
    res.json({
      success: true,
      message: 'Form retrieved successfully',
      data: { form }
    });
    
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form'
    });
  }
});

/**
 * Get form submission status (Public - for applicants to check their status)
 * GET /api/public/applications/status/:email/:formId
 * Access: Public
 */
router.get('/public/applications/status/:email/:formId', 
  async (req, res) => {
    try {
      const { email, formId } = req.params;
      
      // Basic validation
      if (!email || !formId) {
        return res.status(400).json({
          success: false,
          message: 'Email and form ID are required'
        });
      }
      
      const StudentApplication = require('../../models/ui/studentApplicationModel');
      const application = await StudentApplication.findOne({
        'studentInfo.email': email.toLowerCase(),
        applicationForm: formId
      }).populate('applicationForm', 'name category')
        .select('status createdAt reviewNotes communication.emailsSent');
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      // Filter out internal notes
      const publicNotes = application.reviewNotes.filter(note => !note.isInternal);
      
      res.json({
        success: true,
        message: 'Application status retrieved successfully',
        data: {
          status: application.status,
          submittedAt: application.createdAt,
          formName: application.applicationForm.name,
          publicNotes: publicNotes,
          lastContact: application.communication.emailsSent.length > 0 
            ? application.communication.emailsSent[application.communication.emailsSent.length - 1].sentAt 
            : null
        }
      });
      
    } catch (error) {
      console.error('Get application status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve application status'
      });
    }
  }
);

// ===========================================
// PUBLIC FORM SUBMISSION ROUTES
// ===========================================

/**
 * Submit application (Public endpoint)
 * POST /api/forms/:formId/submit
 * Access: Public
 */
router.post('/:formId/submit',
  validateParams(formIdSchema),
  validateBody(submitApplicationSchema),
  submitApplication
);

module.exports = router; 