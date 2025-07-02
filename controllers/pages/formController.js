const ApplicationForm = require('../../models/ui/applicationFormModel');
const StudentApplication = require('../../models/ui/studentApplicationModel');
const Language = require('../../models/languageModel');
const { sendVerificationEmail, sendAnnouncementEmail } = require('../../services/emailService');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

// ===========================================
// APPLICATION FORM MANAGEMENT (CRUD)
// ===========================================

/**
 * Create a new application form
 * POST /api/forms/create
 */
const createForm = async (req, res) => {
  try {
    console.log('Create form request data:', JSON.stringify(req.body, null, 2));
    console.log('User info:', req.user);

    const {
      name,
      description,
      fields,
      category,
      language,
      isActive,
      emailNotifications,
      settings
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse(res, 'Form name is required', 400);
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return errorResponse(res, 'At least one form field is required', 400);
    }

    // Validate each field has required properties
    const invalidFields = fields.filter((field, index) => {
      return !field.name || !field.label || !field.type;
    });

    if (invalidFields.length > 0) {
      return errorResponse(res, 'All fields must have name, label, and type', 400);
    }

    // Check authentication
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User authentication required', 401);
    }

    // Check if form with similar name exists
    const existingForm = await ApplicationForm.findOne({
      name: { $regex: new RegExp(name, 'i') }
    });

    if (existingForm) {
      return errorResponse(res, 'A form with this name already exists', 409);
    }

    // Generate slug manually as fallback
    const generateSlug = (name) => {
      let baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      return baseSlug || 'form';
    };

    // Clean and validate fields
    const cleanFields = fields.map((field, index) => {
      // Clean validation object - remove null values
      const cleanValidation = {};
      if (field.validation) {
        Object.keys(field.validation).forEach(key => {
          const value = field.validation[key];
          if (value !== null && value !== undefined && value !== '') {
            cleanValidation[key] = value;
          }
        });
      }

      return {
        name: field.name?.trim() || `field_${index + 1}`,
        label: field.label?.trim() || `Field ${index + 1}`,
        type: field.type || 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder?.trim() || '',
        helpText: field.helpText?.trim() || '',
        order: field.order !== undefined ? field.order : index,
        options: Array.isArray(field.options) ? field.options.filter(opt => opt.value && opt.label) : [],
        validation: Object.keys(cleanValidation).length > 0 ? cleanValidation : {}
      };
    }).filter(field => field.name && field.label && field.type);

    // Clean settings object
    const cleanSettings = {
      allowMultipleSubmissions: Boolean(settings?.allowMultipleSubmissions),
      maxSubmissions: settings?.maxSubmissions ? parseInt(settings.maxSubmissions) : 1,
      requiresApproval: settings?.requiresApproval !== false,
      maxCapacity: settings?.maxCapacity ? parseInt(settings.maxCapacity) : null,
      submissionDeadline: settings?.submissionDeadline || null
    };

    // Final validation after cleaning
    if (cleanFields.length === 0) {
      return errorResponse(res, 'No valid fields provided after data cleaning', 400);
    }

    // Prepare form data
    const formData = {
      name: name?.trim(),
      description: description?.trim() || '',
      slug: generateSlug(name), // Generate slug manually
      fields: cleanFields,
      category: category || 'general',
      language: language && language !== '' ? language : null, // Handle empty string
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      emailNotifications: emailNotifications || {
        enabled: true,
        adminEmails: [],
        autoReplyTemplate: {
          subject: `Thank you for your application to ${name}`,
          message: 'We have received your application and will review it shortly.'
        }
      },
      settings: cleanSettings,
      createdBy: req.user.id
    };

    console.log('Form data to save:', JSON.stringify(formData, null, 2));

    // Create the form
    const form = new ApplicationForm(formData);
    
    // Ensure slug uniqueness manually
    let finalSlug = formData.slug;
    let counter = 1;
    while (await ApplicationForm.findOne({ slug: finalSlug })) {
      finalSlug = `${formData.slug}-${counter}`;
      counter++;
    }
    form.slug = finalSlug;
    
    await form.save();

    console.log('Form created successfully:', form._id);

    return successResponse(res, 'Form created successfully', {
      form: form
    }, 201);

  } catch (error) {
    console.error('Create form error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.log('Detailed validation errors:', validationErrors);
      return errorResponse(res, 'Validation error', 400, {
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return errorResponse(res, 'A form with this name already exists', 409);
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return errorResponse(res, `Invalid ${error.path}: ${error.value}`, 400);
    }

    return errorResponse(res, 'Failed to create form', 500);
  }
};

/**
 * Get all forms with filtering and pagination
 * GET /api/forms
 */
const getAllForms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      isActive,
      language,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (language !== undefined) {
      if (language === 'general' || language === 'null') {
        filter.language = null;
      } else if (language) {
        filter.language = language;
      }
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get forms with population
    const forms = await ApplicationForm.find(filter)
      .populate('language', 'name code flag')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationForm.countDocuments(filter);

    return successResponse(res, 'Forms retrieved successfully', {
      forms,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + forms.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get forms error:', error);
    return errorResponse(res, 'Failed to retrieve forms', 500);
  }
};

/**
 * Get single form by ID or slug
 * GET /api/forms/:identifier
 */
const getFormById = async (req, res) => {
  try {
    const { identifier } = req.params;
    let form = null;
    
    // Check if identifier is a valid ObjectId (24 hex characters)
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier) && 
                           identifier.length === 24 && 
                           /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isValidObjectId) {
      // Try to find by ID first
      form = await ApplicationForm.findById(identifier)
        .populate('language', 'name code flag')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
    }
    
    // If not found by ID or identifier is not a valid ObjectId, try by slug
    if (!form) {
      form = await ApplicationForm.findOne({ slug: identifier })
        .populate('language', 'name code flag')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
    }

    if (!form) {
      return errorResponse(res, 'Form not found', 404);
    }

    return successResponse(res, 'Form retrieved successfully', { form });

  } catch (error) {
    console.error('Get form error:', error);
    return errorResponse(res, 'Failed to retrieve form', 500);
  }
};

/**
 * Update form
 * PUT /api/forms/:id
 */
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      fields,
      category,
      language,
      isActive,
      emailNotifications,
      settings
    } = req.body;

    // Validate required fields if provided
    if (name !== undefined && (!name || !name.trim())) {
      return errorResponse(res, 'Form name cannot be empty', 400);
    }

    if (fields !== undefined && (!Array.isArray(fields) || fields.length === 0)) {
      return errorResponse(res, 'At least one form field is required', 400);
    }

    // Clean fields if provided
    let cleanFields;
    if (fields && Array.isArray(fields)) {
      cleanFields = fields.map((field, index) => {
        // Clean validation object - remove null values
        const cleanValidation = {};
        if (field.validation) {
          Object.keys(field.validation).forEach(key => {
            const value = field.validation[key];
            if (value !== null && value !== undefined && value !== '') {
              cleanValidation[key] = value;
            }
          });
        }

        return {
          name: field.name?.trim() || `field_${index + 1}`,
          label: field.label?.trim() || `Field ${index + 1}`,
          type: field.type || 'text',
          required: Boolean(field.required),
          placeholder: field.placeholder?.trim() || '',
          helpText: field.helpText?.trim() || '',
          order: field.order !== undefined ? field.order : index,
          options: Array.isArray(field.options) ? field.options.filter(opt => opt.value && opt.label) : [],
          validation: Object.keys(cleanValidation).length > 0 ? cleanValidation : {}
        };
      }).filter(field => field.name && field.label && field.type);

      if (cleanFields.length === 0) {
        return errorResponse(res, 'No valid fields provided after data cleaning', 400);
      }
    }

    // Clean settings if provided
    let cleanSettings;
    if (settings) {
      cleanSettings = {
        allowMultipleSubmissions: Boolean(settings?.allowMultipleSubmissions),
        maxSubmissions: settings?.maxSubmissions ? parseInt(settings.maxSubmissions) : 1,
        requiresApproval: settings?.requiresApproval !== false,
        maxCapacity: settings?.maxCapacity ? parseInt(settings.maxCapacity) : null,
        submissionDeadline: settings?.submissionDeadline || null
      };
    }

    // Prepare update data
    const updateData = {
      updatedBy: req.user.id
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (cleanFields) updateData.fields = cleanFields;
    if (category !== undefined) updateData.category = category || 'general';
    if (language !== undefined) updateData.language = language && language !== '' ? language : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (cleanSettings) updateData.settings = cleanSettings;

    console.log('Update form data:', JSON.stringify(updateData, null, 2));

    const form = await ApplicationForm.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('language', 'name code flag')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    if (!form) {
      return errorResponse(res, 'Form not found', 404);
    }

    return successResponse(res, 'Form updated successfully', { form });

  } catch (error) {
    console.error('Update form error:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.log('Update validation errors:', validationErrors);
      return errorResponse(res, 'Validation error', 400, {
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    return errorResponse(res, 'Failed to update form', 500);
  }
};

/**
 * Delete form (soft delete by setting isActive to false)
 * DELETE /api/forms/:id
 */
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Check if form has any applications
      const applicationCount = await StudentApplication.countDocuments({
        applicationForm: id
      });

      if (applicationCount > 0) {
        return errorResponse(res, 
          `Cannot permanently delete form. It has ${applicationCount} associated applications.`, 
          400);
      }

      await ApplicationForm.findByIdAndDelete(id);
      return successResponse(res, 'Form permanently deleted');
    } else {
      // Soft delete
      const form = await ApplicationForm.findByIdAndUpdate(
        id,
        { isActive: false, updatedBy: req.user.id },
        { new: true }
      );

      if (!form) {
        return errorResponse(res, 'Form not found', 404);
      }

      return successResponse(res, 'Form deactivated successfully', { form });
    }

  } catch (error) {
    console.error('Delete form error:', error);
    return errorResponse(res, 'Failed to delete form', 500);
  }
};

/**
 * Duplicate form
 * POST /api/forms/:id/duplicate
 */
const duplicateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const originalForm = await ApplicationForm.findById(id);
    if (!originalForm) {
      return errorResponse(res, 'Original form not found', 404);
    }

    // Create duplicate
    const duplicateData = originalForm.toObject();
    delete duplicateData._id;
    delete duplicateData.slug;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.name = name || `${originalForm.name} (Copy)`;
    duplicateData.createdBy = req.user.id;
    duplicateData.submissions = 0;

    const duplicatedForm = new ApplicationForm(duplicateData);
    await duplicatedForm.save();

    return successResponse(res, 'Form duplicated successfully', {
      form: duplicatedForm
    }, 201);

  } catch (error) {
    console.error('Duplicate form error:', error);
    return errorResponse(res, 'Failed to duplicate form', 500);
  }
};

// ===========================================
// STUDENT APPLICATION MANAGEMENT
// ===========================================

/**
 * Submit application (Public endpoint)
 * POST /api/forms/:formId/submit
 */
const submitApplication = async (req, res) => {
  try {
    const { formId } = req.params;
    const applicationData = req.body;

    // Get the form
    const form = await ApplicationForm.findById(formId);
    if (!form || !form.isActive) {
      return errorResponse(res, 'Form not found or inactive', 404);
    }

    // Check submission deadline
    if (form.settings.submissionDeadline && 
        new Date() > new Date(form.settings.submissionDeadline)) {
      return errorResponse(res, 'Submission deadline has passed', 400);
    }

    // Check form capacity limit
    if (form.settings.maxCapacity && form.submissions >= form.settings.maxCapacity) {
      return errorResponse(res, 'Form has reached maximum capacity', 400);
    }

    // Check multiple submissions
    if (!form.settings.allowMultipleSubmissions) {
      const existingApplication = await StudentApplication.findOne({
        applicationForm: formId,
        'studentInfo.email': applicationData.studentInfo.email
      });

      if (existingApplication) {
        return errorResponse(res, 'You have already submitted an application for this form', 400);
      }
    }

    // Create application
    const application = new StudentApplication({
      applicationForm: formId,
      ...applicationData,
      submissionSource: 'website',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await application.save();

    // Update form submission count
    await ApplicationForm.findByIdAndUpdate(formId, {
      $inc: { submissions: 1 }
    });

    // Send auto-reply email if enabled
    if (form.emailNotifications.enabled && 
        form.emailNotifications.autoReplyTemplate.subject) {
      try {
        await sendAnnouncementEmail(
          applicationData.studentInfo.email,
          form.emailNotifications.autoReplyTemplate.subject,
          form.emailNotifications.autoReplyTemplate.message
        );

        // Log email sent
        application.communication.emailsSent.push({
          type: 'welcome',
          subject: form.emailNotifications.autoReplyTemplate.subject,
          sentAt: new Date()
        });
        await application.save();
      } catch (emailError) {
        console.error('Auto-reply email failed:', emailError);
      }
    }

    // Notify admins if configured
    if (form.emailNotifications.enabled && 
        form.emailNotifications.adminEmails.length > 0) {
      try {
        for (const adminEmail of form.emailNotifications.adminEmails) {
          await sendAnnouncementEmail(
            adminEmail,
            `New Application Received: ${form.name}`,
            `A new application has been submitted for ${form.name} by ${applicationData.studentInfo.fullName} (${applicationData.studentInfo.email}).`
          );
        }
      } catch (emailError) {
        console.error('Admin notification email failed:', emailError);
      }
    }

    return successResponse(res, 'Application submitted successfully', {
      applicationId: application._id,
      message: 'Thank you for your application. We will review it and get back to you soon.'
    }, 201);

  } catch (error) {
    console.error('Submit application error:', error);
    return errorResponse(res, 'Failed to submit application', 500);
  }
};

/**
 * Get all applications with filtering
 * GET /api/applications
 */
const getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      formId,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    // Build filter
    const filter = { isArchived: false };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (formId) filter.applicationForm = formId;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    if (search) {
      filter.$or = [
        { 'studentInfo.fullName': { $regex: search, $options: 'i' } },
        { 'studentInfo.email': { $regex: search, $options: 'i' } },
        { 'studentInfo.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const applications = await StudentApplication.find(filter)
      .populate('applicationForm', 'name category')
      .populate('assignedTo', 'name email')
      .populate('reviewNotes.addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudentApplication.countDocuments(filter);

    return successResponse(res, 'Applications retrieved successfully', {
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + applications.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return errorResponse(res, 'Failed to retrieve applications', 500);
  }
};

/**
 * Get single application
 * GET /api/applications/:id
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await StudentApplication.findById(id)
      .populate('applicationForm')
      .populate('assignedTo', 'name email')
      .populate('reviewNotes.addedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email')
      .populate('communication.emailsSent.sentBy', 'name email');

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    return successResponse(res, 'Application retrieved successfully', {
      application
    });

  } catch (error) {
    console.error('Get application error:', error);
    return errorResponse(res, 'Failed to retrieve application', 500);
  }
};

/**
 * Update application status with email notification
 * PUT /api/applications/:id/status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes, sendEmail = true } = req.body;

    const application = await StudentApplication.findById(id)
      .populate('applicationForm', 'name');

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    // Update status using the model method
    await application.updateStatus(status, reason, req.user.id);

    // Add note if provided
    if (notes) {
      await application.addNote(notes, req.user.id, true);
    }

    // Send email notification if requested
    if (sendEmail) {
      let emailSubject, emailMessage;
      
      switch (status) {
        case 'approved':
          emailSubject = `Application Approved - ${application.applicationForm.name}`;
          emailMessage = `Dear ${application.studentInfo.fullName},\n\nCongratulations! Your application for ${application.applicationForm.name} has been approved.\n\n${reason || 'We will contact you soon with next steps.'}\n\nBest regards,\nLangzy Team`;
          break;
          
        case 'rejected':
          emailSubject = `Application Update - ${application.applicationForm.name}`;
          emailMessage = `Dear ${application.studentInfo.fullName},\n\nThank you for your application for ${application.applicationForm.name}. After careful review, we regret to inform you that we cannot proceed with your application at this time.\n\n${reason || 'We encourage you to apply again in the future.'}\n\nBest regards,\nLangzy Team`;
          break;
          
        case 'waitlisted':
          emailSubject = `Application Waitlisted - ${application.applicationForm.name}`;
          emailMessage = `Dear ${application.studentInfo.fullName},\n\nYour application for ${application.applicationForm.name} has been placed on our waitlist.\n\n${reason || 'We will contact you if a spot becomes available.'}\n\nBest regards,\nLangzy Team`;
          break;
          
        case 'under-review':
          emailSubject = `Application Under Review - ${application.applicationForm.name}`;
          emailMessage = `Dear ${application.studentInfo.fullName},\n\nYour application for ${application.applicationForm.name} is currently under review.\n\n${reason || 'We will update you on the status soon.'}\n\nBest regards,\nLangzy Team`;
          break;
          
        default:
          emailSubject = `Application Status Update - ${application.applicationForm.name}`;
          emailMessage = `Dear ${application.studentInfo.fullName},\n\nYour application status has been updated to: ${status.charAt(0).toUpperCase() + status.slice(1)}\n\n${reason || ''}\n\nBest regards,\nLangzy Team`;
      }

      try {
        await sendAnnouncementEmail(
          application.studentInfo.email,
          emailSubject,
          emailMessage
        );

        // Log email sent
        application.communication.emailsSent.push({
          type: 'status-update',
          subject: emailSubject,
          sentBy: req.user.id
        });
        application.communication.lastContactDate = new Date();
        await application.save();

      } catch (emailError) {
        console.error('Status update email failed:', emailError);
        // Continue even if email fails
      }
    }

    // Reload application with populated fields
    const updatedApplication = await StudentApplication.findById(id)
      .populate('applicationForm', 'name category')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    return successResponse(res, 'Application status updated successfully', {
      application: updatedApplication
    });

  } catch (error) {
    console.error('Update application status error:', error);
    return errorResponse(res, 'Failed to update application status', 500);
  }
};

/**
 * Assign application to staff member
 * PUT /api/applications/:id/assign
 */
const assignApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, notes } = req.body;

    const application = await StudentApplication.findByIdAndUpdate(
      id,
      { 
        assignedTo: assignedTo || null,
        $push: assignedTo ? {
          reviewNotes: {
            note: notes || `Application assigned to staff member`,
            addedBy: req.user.id,
            isInternal: true
          }
        } : {}
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    return successResponse(res, 'Application assigned successfully', {
      application
    });

  } catch (error) {
    console.error('Assign application error:', error);
    return errorResponse(res, 'Failed to assign application', 500);
  }
};

/**
 * Add note to application
 * POST /api/applications/:id/notes
 */
const addApplicationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, isInternal = true } = req.body;

    if (!note || note.trim().length === 0) {
      return errorResponse(res, 'Note content is required', 400);
    }

    const application = await StudentApplication.findById(id);
    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    await application.addNote(note.trim(), req.user.id, isInternal);

    // Reload with populated fields
    const updatedApplication = await StudentApplication.findById(id)
      .populate('reviewNotes.addedBy', 'name email');

    return successResponse(res, 'Note added successfully', {
      notes: updatedApplication.reviewNotes
    });

  } catch (error) {
    console.error('Add note error:', error);
    return errorResponse(res, 'Failed to add note', 500);
  }
};

/**
 * Send custom email to applicant
 * POST /api/applications/:id/send-email
 */
const sendCustomEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message, copyToAdmin = false } = req.body;

    if (!subject || !message) {
      return errorResponse(res, 'Subject and message are required', 400);
    }

    const application = await StudentApplication.findById(id)
      .populate('applicationForm', 'name');

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    // Send email to applicant
    await sendAnnouncementEmail(
      application.studentInfo.email,
      subject,
      message
    );

    // Send copy to admin if requested
    if (copyToAdmin && req.user.email) {
      await sendAnnouncementEmail(
        req.user.email,
        `Copy: ${subject}`,
        `This is a copy of the email sent to ${application.studentInfo.fullName} (${application.studentInfo.email}):\n\n${message}`
      );
    }

    // Log email sent
    application.communication.emailsSent.push({
      type: 'custom',
      subject: subject,
      sentBy: req.user.id
    });
    application.communication.lastContactDate = new Date();
    await application.save();

    return successResponse(res, 'Email sent successfully');

  } catch (error) {
    console.error('Send custom email error:', error);
    return errorResponse(res, 'Failed to send email', 500);
  }
};

/**
 * Get application statistics
 * GET /api/applications/stats
 */
const getApplicationStats = async (req, res) => {
  try {
    const { formId, dateFrom, dateTo } = req.query;

    // Build base filter
    const baseFilter = { isArchived: false };
    if (formId) baseFilter.applicationForm = formId;
    
    // Date range filter
    if (dateFrom || dateTo) {
      baseFilter.createdAt = {};
      if (dateFrom) baseFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) baseFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get status counts
    const statusStats = await StudentApplication.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get priority counts
    const priorityStats = await StudentApplication.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get form-wise counts
    const formStats = await StudentApplication.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$applicationForm', count: { $sum: 1 } } },
      { 
        $lookup: {
          from: 'applicationforms',
          localField: '_id',
          foreignField: '_id',
          as: 'formInfo'
        }
      },
      { $unwind: '$formInfo' },
      { 
        $project: {
          formName: '$formInfo.name',
          count: 1
        }
      }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await StudentApplication.aggregate([
      { 
        $match: { 
          ...baseFilter,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const totalApplications = await StudentApplication.countDocuments(baseFilter);

    return successResponse(res, 'Statistics retrieved successfully', {
      totalApplications,
      statusBreakdown: statusStats,
      priorityBreakdown: priorityStats,
      formBreakdown: formStats,
      recentActivity
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse(res, 'Failed to retrieve statistics', 500);
  }
};

/**
 * Archive/Unarchive application
 * PUT /api/applications/:id/archive
 */
const toggleArchiveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;

    const application = await StudentApplication.findByIdAndUpdate(
      id,
      { isArchived: archive },
      { new: true }
    );

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    return successResponse(res, 
      `Application ${archive ? 'archived' : 'unarchived'} successfully`, 
      { application }
    );

  } catch (error) {
    console.error('Archive application error:', error);
    return errorResponse(res, 'Failed to archive application', 500);
  }
};

/**
 * Bulk operations on applications
 * POST /api/applications/bulk
 */
const bulkApplicationActions = async (req, res) => {
  try {
    const { action, applicationIds, data = {} } = req.body;

    if (!action || !applicationIds || !Array.isArray(applicationIds)) {
      return errorResponse(res, 'Action and application IDs are required', 400);
    }

    let result;

    switch (action) {
      case 'updateStatus':
        if (!data.status) {
          return errorResponse(res, 'Status is required for bulk status update', 400);
        }
        
        result = await StudentApplication.updateMany(
          { _id: { $in: applicationIds } },
          { 
            status: data.status,
            $push: {
              statusHistory: {
                previousStatus: '$status',
                newStatus: data.status,
                reason: data.reason || 'Bulk status update',
                changedBy: req.user.id,
                changedAt: new Date()
              }
            }
          }
        );
        break;

      case 'assign':
        result = await StudentApplication.updateMany(
          { _id: { $in: applicationIds } },
          { assignedTo: data.assignedTo || null }
        );
        break;

      case 'archive':
        result = await StudentApplication.updateMany(
          { _id: { $in: applicationIds } },
          { isArchived: data.archive !== false }
        );
        break;

      case 'setPriority':
        if (!data.priority) {
          return errorResponse(res, 'Priority is required for bulk priority update', 400);
        }
        
        result = await StudentApplication.updateMany(
          { _id: { $in: applicationIds } },
          { priority: data.priority }
        );
        break;

      default:
        return errorResponse(res, 'Invalid bulk action', 400);
    }

    return successResponse(res, `Bulk ${action} completed successfully`, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return errorResponse(res, 'Failed to perform bulk action', 500);
  }
};

/**
 * Get all languages for form creation dropdown
 * GET /api/forms/languages
 */
const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find({ isActive: true })
      .select('name code flag')
      .sort({ name: 1 });

    return successResponse(res, 'Languages retrieved successfully', {
      languages
    });

  } catch (error) {
    console.error('Get languages error:', error);
    return errorResponse(res, 'Failed to retrieve languages', 500);
  }
};

/**
 * Get forms by language
 * GET /api/forms/by-language/:languageId
 */
const getFormsByLanguage = async (req, res) => {
  try {
    const { languageId } = req.params;
    const { activeOnly = true } = req.query;

    const forms = await ApplicationForm.getByLanguage(languageId, { activeOnly: activeOnly === 'true' });

    return successResponse(res, 'Language-specific forms retrieved successfully', {
      forms,
      count: forms.length
    });

  } catch (error) {
    console.error('Get forms by language error:', error);
    return errorResponse(res, 'Failed to retrieve forms', 500);
  }
};

/**
 * Get general forms (not language-specific)
 * GET /api/forms/general
 */
const getGeneralForms = async (req, res) => {
  try {
    const { activeOnly = true } = req.query;

    const forms = await ApplicationForm.getGeneralForms({ activeOnly: activeOnly === 'true' });

    return successResponse(res, 'General forms retrieved successfully', {
      forms,
      count: forms.length
    });

  } catch (error) {
    console.error('Get general forms error:', error);
    return errorResponse(res, 'Failed to retrieve forms', 500);
  }
};

module.exports = {
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
};
