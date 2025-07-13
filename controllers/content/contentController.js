const { Question, Assessment, Lesson, Module, Content } = require('../../models/courses/ContentModel');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

// Question Controllers
const createQuestion = async (req, res) => {
  try {
    const {
      questionType,
      question,
      options,
      correctAnswer,
      explanation,
      marks,
      difficulty,
      tags,
      audioUrl,
      imageUrl,
      timeLimit,
      customFields
    } = req.body;

    const questionData = {
      questionType,
      question,
      options,
      correctAnswer,
      explanation,
      marks,
      difficulty,
      tags,
      audioUrl,
      imageUrl,
      timeLimit,
      customFields,
      createdBy: req.user._id || req.user.id
    };

    // Validate question type specific requirements
    if (['mcq', 'true_false'].includes(questionType) && (!options || options.length === 0)) {
      return errorResponse(res, 'Options are required for MCQ and True/False questions', 400);
    }

    const newQuestion = new Question(questionData);
    await newQuestion.save();

    return successResponse(res, 'Question created successfully', newQuestion, 201);
  } catch (error) {
    console.error('Error creating question:', error);
    return errorResponse(res, 'Error creating question', 500, error);
  }
};

const getQuestions = async (req, res) => {
  try {
    const {
      questionType,
      difficulty,
      tags,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};
    if (questionType) filter.questionType = questionType;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    const questions = await Question.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(filter);

    return successResponse(res, 'Questions retrieved successfully', {
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error getting questions:', error);
    return errorResponse(res, 'Error retrieving questions', 500, error);
  }
};

// Assessment Controllers
const createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      questions,
      totalMarks,
      passingScore,
      timeLimit,
      instructions,
      customFields
    } = req.body;

    const assessmentData = {
      title,
      description,
      type,
      questions,
      totalMarks,
      passingScore,
      timeLimit,
      instructions,
      customFields,
      createdBy: req.user._id || req.user.id
    };

    const newAssessment = new Assessment(assessmentData);
    await newAssessment.save();

    return successResponse(res, 'Assessment created successfully', newAssessment, 201);
  } catch (error) {
    console.error('Error creating assessment:', error);
    return errorResponse(res, 'Error creating assessment', 500, error);
  }
};

const getAssessments = async (req, res) => {
  try {
    const {
      type,
      isActive,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const assessments = await Assessment.find(filter)
      .populate('questions')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Assessment.countDocuments(filter);

    return successResponse(res, 'Assessments retrieved successfully', {
      assessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error getting assessments:', error);
    return errorResponse(res, 'Error retrieving assessments', 500, error);
  }
};

// Lesson Controllers
const createLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      videoUrl,
      audioUrl,
      attachments,
      duration,
      order,
      customFields
    } = req.body;

    const lessonData = {
      title,
      description,
      content,
      videoUrl,
      audioUrl,
      attachments,
      duration,
      order,
      customFields,
      createdBy: req.user._id || req.user.id
    };

    const newLesson = new Lesson(lessonData);
    await newLesson.save();

    return successResponse(res, 'Lesson created successfully', newLesson, 201);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return errorResponse(res, 'Error creating lesson', 500, error);
  }
};

const getLessons = async (req, res) => {
  try {
    const {
      isActive,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const lessons = await Lesson.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ order: 1, createdAt: -1 });

    const total = await Lesson.countDocuments(filter);

    return successResponse(res, 'Lessons retrieved successfully', {
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error getting lessons:', error);
    return errorResponse(res, 'Error retrieving lessons', 500, error);
  }
};

// Module Controllers
const createModule = async (req, res) => {
  try {
    const {
      title,
      description,
      lessons,
      assessments,
      order,
      customFields
    } = req.body;

    const moduleData = {
      title,
      description,
      lessons,
      assessments,
      order,
      customFields,
      createdBy: req.user._id || req.user.id
    };

    const newModule = new Module(moduleData);
    await newModule.save();

    return successResponse(res, 'Module created successfully', newModule, 201);
  } catch (error) {
    console.error('Error creating module:', error);
    return errorResponse(res, 'Error creating module', 500, error);
  }
};

const getModules = async (req, res) => {
  try {
    const {
      isActive,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const modules = await Module.find(filter)
      .populate('lessons')
      .populate('assessments')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ order: 1, createdAt: -1 });

    const total = await Module.countDocuments(filter);

    return successResponse(res, 'Modules retrieved successfully', {
      modules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error getting modules:', error);
    return errorResponse(res, 'Error retrieving modules', 500, error);
  }
};

// Content Controllers
const createContent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      level,
      language,
      modules,
      assessments,
      thumbnail,
      tags,
      metadata,
      customFields,
      ieltsSchema,
      pteSchema,
      languageSchema
    } = req.body;

    const contentData = {
      title,
      description,
      type,
      category,
      level,
      language,
      modules,
      assessments,
      thumbnail,
      tags,
      metadata,
      customFields,
      createdBy: req.user._id || req.user.id
    };

    // Add type-specific schemas
    if (type === 'ielts' && ieltsSchema) {
      contentData.ieltsSchema = ieltsSchema;
    } else if (type === 'pte' && pteSchema) {
      contentData.pteSchema = pteSchema;
    } else if (['german', 'english', 'spanish', 'french'].includes(type) && languageSchema) {
      contentData.languageSchema = languageSchema;
    }

    const newContent = new Content(contentData);
    await newContent.save();

    return successResponse(res, 'Content created successfully', newContent, 201);
  } catch (error) {
    console.error('Error creating content:', error);
    return errorResponse(res, 'Error creating content', 500, error);
  }
};

const getContents = async (req, res) => {
  try {
    console.log('getContents called with query:', req.query);
    
    const {
      type,
      category,
      level,
      language,
      isActive,
      isPublished,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log('Filter:', filter);

    const skip = (page - 1) * limit;
    const contents = await Content.find(filter)
      .populate('level')
      .populate('language')
      .populate('modules')
      .populate('assessments')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Content.countDocuments(filter);

    console.log(`Found ${contents.length} contents out of ${total} total`);

    return successResponse(res, 'Contents retrieved successfully', {
      contents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error getting contents:', error);
    return errorResponse(res, 'Error retrieving contents', 500, error);
  }
};

const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id)
      .populate('level')
      .populate('language')
      .populate({
        path: 'modules',
        populate: {
          path: 'lessons assessments'
        }
      })
      .populate('assessments')
      .populate('createdBy', 'name email');

    if (!content) {
      return errorResponse(res, 'Content not found', 404);
    }

    return successResponse(res, 'Content retrieved successfully', content, 200);
  } catch (error) {
    console.error('Error getting content:', error);
    return errorResponse(res, 'Error retrieving content', 500, error);
  }
};

const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove createdBy from update data to prevent overwriting
    delete updateData.createdBy;

    const content = await Content.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('level language modules assessments createdBy');

    if (!content) {
      return errorResponse(res, 'Content not found', 404);
    }

    return successResponse(res, 'Content updated successfully', content, 200);
  } catch (error) {
    console.error('Error updating content:', error);
    return errorResponse(res, 'Error updating content', 500, error);
  }
};

const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findByIdAndDelete(id);
    if (!content) {
      return errorResponse(res, 'Content not found', 404);
    }

    return successResponse(res, 'Content deleted successfully', null, 200);
  } catch (error) {
    console.error('Error deleting content:', error);
    return errorResponse(res, 'Error deleting content', 500, error);
  }
};

// Bulk Operations
const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return errorResponse(res, 'Questions array is required', 400);
    }

    const createdQuestions = await Question.insertMany(questions);

    return successResponse(res, `${createdQuestions.length} questions created successfully`, createdQuestions, 201);
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    return errorResponse(res, 'Error creating questions', 500, error);
  }
};

const getContentStats = async (req, res) => {
  try {
    const stats = await Content.aggregate([
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          activeContent: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          publishedContent: {
            $sum: { $cond: ['$isPublished', 1, 0] }
          },
          byType: {
            $push: '$type'
          },
          byCategory: {
            $push: '$category'
          }
        }
      }
    ]);

    const typeStats = await Content.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Content.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse(res, 'Stats retrieved successfully', {
      overall: stats[0] || {},
      byType: typeStats,
      byCategory: categoryStats
    }, 200);
  } catch (error) {
    console.error('Error getting content stats:', error);
    return errorResponse(res, 'Error retrieving stats', 500, error);
  }
};

// Question Update/Delete
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove createdBy from update data to prevent overwriting
    delete updateData.createdBy;

    const question = await Question.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, 'Question updated successfully', question, 200);
  } catch (error) {
    console.error('Error updating question:', error);
    return errorResponse(res, 'Error updating question', 500, error);
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, 'Question deleted successfully', null, 200);
  } catch (error) {
    console.error('Error deleting question:', error);
    return errorResponse(res, 'Error deleting question', 500, error);
  }
};

// Assessment Update/Delete
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove createdBy from update data to prevent overwriting
    delete updateData.createdBy;

    const assessment = await Assessment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('questions');

    if (!assessment) {
      return errorResponse(res, 'Assessment not found', 404);
    }

    return successResponse(res, 'Assessment updated successfully', assessment, 200);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return errorResponse(res, 'Error updating assessment', 500, error);
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findByIdAndDelete(id);
    if (!assessment) {
      return errorResponse(res, 'Assessment not found', 404);
    }

    return successResponse(res, 'Assessment deleted successfully', null, 200);
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return errorResponse(res, 'Error deleting assessment', 500, error);
  }
};

// Lesson Update/Delete
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove createdBy from update data to prevent overwriting
    delete updateData.createdBy;

    const lesson = await Lesson.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!lesson) {
      return errorResponse(res, 'Lesson not found', 404);
    }

    return successResponse(res, 'Lesson updated successfully', lesson, 200);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return errorResponse(res, 'Error updating lesson', 500, error);
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) {
      return errorResponse(res, 'Lesson not found', 404);
    }

    return successResponse(res, 'Lesson deleted successfully', null, 200);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return errorResponse(res, 'Error deleting lesson', 500, error);
  }
};

// Module Update/Delete
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove createdBy from update data to prevent overwriting
    delete updateData.createdBy;

    const module = await Module.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lessons assessments');

    if (!module) {
      return errorResponse(res, 'Module not found', 404);
    }

    return successResponse(res, 'Module updated successfully', module, 200);
  } catch (error) {
    console.error('Error updating module:', error);
    return errorResponse(res, 'Error updating module', 500, error);
  }
};

const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findByIdAndDelete(id);
    if (!module) {
      return errorResponse(res, 'Module not found', 404);
    }

    return successResponse(res, 'Module deleted successfully', null, 200);
  } catch (error) {
    console.error('Error deleting module:', error);
    return errorResponse(res, 'Error deleting module', 500, error);
  }
};

module.exports = {
  // Question controllers
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  
  // Assessment controllers
  createAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment,
  
  // Lesson controllers
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
  
  // Module controllers
  createModule,
  getModules,
  updateModule,
  deleteModule,
  
  // Content controllers
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
  
  // Bulk operations
  bulkCreateQuestions,
  getContentStats
}; 