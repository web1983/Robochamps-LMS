export const CATEGORY_MAP = {
  "3-5_basic": "grade_3_5_basic",
  "3-5_advance": "grade_3_5_advance",
  "6-8_basic": "grade_6_8_basic",
  "6-8_advance": "grade_6_8_advance",
  "9-12_basic": "grade_9_12_basic",
  "9-12_advance": "grade_9_12_advance",
};

export const CATEGORY_LABELS = {
  grade_3_5_basic: "Grade 3 to 5 (Basic)",
  grade_6_8_basic: "Grade 6 to 8 (Basic)",
  grade_9_12_basic: "Grade 9 to 10 (Basic)",
  grade_3_5_advance: "Grade 3 to 5 (Advance)",
  grade_6_8_advance: "Grade 6 to 8 (Advance)",
  grade_9_12_advance: "Grade 9 to 10 (Advance)",
};

/** Display-only labels for signup grade band (value keys unchanged). */
export const STUDENT_GRADE_BAND_LABELS = {
  "3-5": "Grade 3 to 5",
  "6-8": "Grade 6 to 8",
  "9-12": "Grade 9 to 10",
};

export const getCategoryLabel = (category) =>
  CATEGORY_LABELS[category] || category || "Not selected";

export const buildCategory = (studentClass, level) => {
  const key = `${studentClass}_${level.toLowerCase()}`;
  return CATEGORY_MAP[key];
};
