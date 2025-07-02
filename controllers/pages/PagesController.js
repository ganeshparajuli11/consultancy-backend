const { successResponse, errorResponse } = require('../../utils/responseHelper');
const ContactInfo = require('../../models/ui/contactInfoModel');
const ContactForm = require('../../models/ui/contactFormModel');

// Get contact information (Public endpoint)
const getContactInfo = async (req, res) => {
  try {
    let contactInfo = await ContactInfo.findOne({ isActive: true });
    
    // If no contact info exists, create default one
    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        email: 'info@langzy.co',
        phone: '+977-98XXXXXXXX',
        address: 'Kathmandu, Nepal',
        workingHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
        supportEmail: 'support@langzy.co',
        emergencyContact: '+977-98XXXXXXXX',
        socialMedia: {
          facebook: 'https://facebook.com/langzy',
          instagram: 'https://instagram.com/langzy',
          linkedin: 'https://linkedin.com/company/langzy',
          twitter: 'https://twitter.com/langzy'
        }
      });
    }

    return successResponse(res, 'Contact information retrieved successfully', contactInfo);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return errorResponse(res, 'Failed to fetch contact information', 500);
  }
};

// Submit contact form (Public endpoint)
const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, contactNumber, subject, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !contactNumber || !subject || !message) {
      return errorResponse(res, 'All fields are required', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Please provide a valid email address', 400);
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[0-9\-\s]+$/;
    if (!phoneRegex.test(contactNumber)) {
      return errorResponse(res, 'Please provide a valid contact number', 400);
    }

    // Save to database
    const contactFormSubmission = await ContactForm.create({
      fullName,
      email,
      contactNumber,
      subject,
      message
    });

    // TODO: Implement email service
    // await emailService.sendContactFormNotification(contactFormSubmission);
    // await emailService.sendAutoReply(email, fullName);

    return successResponse(res, 'Your message has been sent successfully! We will get back to you soon.', {
      submissionId: contactFormSubmission._id,
      estimatedResponseTime: '24-48 hours'
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    return errorResponse(res, 'Failed to submit your message. Please try again.', 500);
  }
};

// Get company information (Public endpoint)
const getCompanyInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findOne({ isActive: true });
    
    const companyInfo = {
      founded: contactInfo?.companyInfo?.founded || '2024',
      mission: contactInfo?.companyInfo?.mission || 'To make language learning accessible, engaging, and effective for everyone, everywhere.',
      vision: contactInfo?.companyInfo?.vision || 'To be the leading platform connecting language learners with expert tutors worldwide.',
      values: [
        { title: 'Diversity & Inclusion', description: 'Embracing learners from all backgrounds' },
        { title: 'Innovation in Learning', description: 'Using cutting-edge technology for education' },
        { title: 'Community First', description: 'Building strong connections between learners and tutors' },
        { title: 'Growth Mindset', description: 'Continuous improvement and learning' }
      ],
      stats: {
        totalStudents: 1500,
        totalTutors: 200,
        languagesOffered: 15,
        countriesServed: 25
      }
    };

    return successResponse(res, 'Company information retrieved successfully', companyInfo);
  } catch (error) {
    console.error('Error fetching company info:', error);
    return errorResponse(res, 'Failed to fetch company information', 500);
  }
};


// ===== ADMIN ENDPOINTS =====

// Create or Update contact information (Admin only)
const createOrUpdateContactInfo = async (req, res) => {
  try {
    const {
      email,
      phone,
      address,
      workingHours,
      supportEmail,
      emergencyContact,
      socialMedia,
      companyInfo
    } = req.body;

    // Basic validation
    if (!email || !phone || !address) {
      return errorResponse(res, 'Email, phone, and address are required', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Please provide a valid email address', 400);
    }

    // First, deactivate any existing active contact info
    await ContactInfo.updateMany({ isActive: true }, { isActive: false });

    // Create new contact info
    const contactInfo = await ContactInfo.create({
      email,
      phone,
      address,
      workingHours,
      supportEmail,
      emergencyContact,
      socialMedia,
      companyInfo,
      updatedBy: req.user?.id,
      isActive: true
    });

    return successResponse(res, 'Contact information updated successfully', contactInfo, 201);
  } catch (error) {
    console.error('Error creating/updating contact info:', error);
    return errorResponse(res, 'Failed to update contact information', 500);
  }
};

// Get all contact form submissions (Admin only)
const getContactFormSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const submissions = await ContactForm.find(filter)
      .populate('assignedTo', 'name email')
      .populate('adminNotes.addedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContactForm.countDocuments(filter);

    return successResponse(res, 'Contact form submissions retrieved successfully', {
      submissions,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: submissions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return errorResponse(res, 'Failed to fetch contact submissions', 500);
  }
};

// Update contact form submission status (Admin only)
const updateContactFormStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, adminNote } = req.body;

    const submission = await ContactForm.findById(id);
    if (!submission) {
      return errorResponse(res, 'Contact form submission not found', 404);
    }

    // Update fields
    if (status) submission.status = status;
    if (priority) submission.priority = priority;
    if (assignedTo) submission.assignedTo = assignedTo;

    // Add admin note if provided
    if (adminNote) {
      submission.adminNotes.push({
        note: adminNote,
        addedBy: req.user?.id
      });
    }

    // Set response/resolved dates
    if (status === 'in-progress' && !submission.responseDate) {
      submission.responseDate = new Date();
    }
    if (status === 'resolved' || status === 'closed') {
      submission.resolvedDate = new Date();
    }

    await submission.save();

    const updatedSubmission = await ContactForm.findById(id)
      .populate('assignedTo', 'name email')
      .populate('adminNotes.addedBy', 'name');

    return successResponse(res, 'Contact form submission updated successfully', updatedSubmission);
  } catch (error) {
    console.error('Error updating contact submission:', error);
    return errorResponse(res, 'Failed to update contact submission', 500);
  }
};

// Get contact form submission by ID (Admin only)
const getContactFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ContactForm.findById(id)
      .populate('assignedTo', 'name email')
      .populate('adminNotes.addedBy', 'name email');

    if (!submission) {
      return errorResponse(res, 'Contact form submission not found', 404);
    }

    return successResponse(res, 'Contact form submission retrieved successfully', submission);
  } catch (error) {
    console.error('Error fetching contact submission:', error);
    return errorResponse(res, 'Failed to fetch contact submission', 500);
  }
};

// Delete contact form submission (Admin only)
const deleteContactFormSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ContactForm.findByIdAndDelete(id);
    if (!submission) {
      return errorResponse(res, 'Contact form submission not found', 404);
    }

    return successResponse(res, 'Contact form submission deleted successfully');
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return errorResponse(res, 'Failed to delete contact submission', 500);
  }
};

module.exports = {
  // Public endpoints
  getContactInfo,
  submitContactForm,
  getCompanyInfo,
  
  // Admin endpoints
  createOrUpdateContactInfo,
  getContactFormSubmissions,
  updateContactFormStatus,
  getContactFormById,
  deleteContactFormSubmission
};
