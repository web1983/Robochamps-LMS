import SchoolCode from "../models/schoolCode.model.js";

const generateCode = (length = 8) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
};

export const createSchoolCode = async (req, res) => {
  try {
    const { schoolName, limit, customCode } = req.body;

    if (!schoolName || !limit) {
      return res.status(400).json({
        success: false,
        message: "School name and limit are required.",
      });
    }

    if (Number.isNaN(Number(limit)) || Number(limit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive number.",
      });
    }

    let code;

    if (customCode && customCode.trim() !== "") {
      const formattedCustomCode = customCode.trim().toUpperCase();

      const isValidFormat = /^[A-Z0-9\-]{4,16}$/.test(formattedCustomCode);
      if (!isValidFormat) {
        return res.status(400).json({
          success: false,
          message:
            "Custom code must be 4-16 characters and include only letters, numbers, or hyphen.",
        });
      }

      const existingCustom = await SchoolCode.findOne({
        code: formattedCustomCode,
      });
      if (existingCustom) {
        return res.status(400).json({
          success: false,
          message: "This custom code already exists. Please choose another.",
        });
      }

      code = formattedCustomCode;
    } else {
      code = generateCode();
      let existingCode = await SchoolCode.findOne({ code });
      while (existingCode) {
        code = generateCode();
        existingCode = await SchoolCode.findOne({ code });
      }
    }

    const schoolCode = await SchoolCode.create({
      schoolName,
      limit: Number(limit),
      code,
      createdBy: req.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "School code created successfully.",
      schoolCode,
    });
  } catch (error) {
    console.error("Create school code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create school code.",
    });
  }
};

export const getSchoolCodes = async (_req, res) => {
  try {
    const schoolCodes = await SchoolCode.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      schoolCodes,
    });
  } catch (error) {
    console.error("Get school codes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch school codes.",
    });
  }
};

export const updateSchoolCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolName, limit, isActive } = req.body;

    const updateFields = {};

    if (schoolName !== undefined) {
      updateFields.schoolName = schoolName;
    }

    if (limit !== undefined) {
      if (Number.isNaN(Number(limit)) || Number(limit) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number.",
        });
      }
      updateFields.limit = Number(limit);
    }

    if (isActive !== undefined) {
      updateFields.isActive = Boolean(isActive);
    }

    const updatedSchoolCode = await SchoolCode.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedSchoolCode) {
      return res.status(404).json({
        success: false,
        message: "School code not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "School code updated successfully.",
      schoolCode: updatedSchoolCode,
    });
  } catch (error) {
    console.error("Update school code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update school code.",
    });
  }
};

export const deleteSchoolCode = async (req, res) => {
  try {
    const { id } = req.params;

    const schoolCode = await SchoolCode.findById(id);
    if (!schoolCode) {
      return res.status(404).json({
        success: false,
        message: "School code not found.",
      });
    }

    await SchoolCode.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "School code deleted successfully.",
    });
  } catch (error) {
    console.error("Delete school code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete school code.",
    });
  }
};

