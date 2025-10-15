import Student from "../../models/students/student.model.js";

// Get Current Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ student });
  } catch (err) {
    console.error("Fetch student profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const updatable = [
      "bio",
      "skills",
      "age",
      "location",
      "contactNumber",
      "gender",
      "race",
      "profilePicture",
      "experience",
      "education",
      "certification",
    ];

    for (const key of updatable) {
      if (req.body[key] !== undefined) student[key] = req.body[key];
    }

    await student.save();
    res.json({ message: "Profile updated successfully", student });
  } catch (err) {
    console.error("Update student profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add Reminder (accepts flat or nested payloads)
export const addReminder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accept both shapes:
    //    - flat: { title, description, date, time, type, datetime }
    //    - nested: { reminder: { ...same fields... } }
    const src = req.body?.reminder ? req.body.reminder : req.body;

    const title = (src?.title || "").trim();
    const description = (src?.description || "").trim();
    const date = src?.date || "";
    const time = src?.time || "";
    const type = src?.type || "Other";
    let datetime = src?.datetime;

    if (!title || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!datetime && date) {
      const dt = new Date(`${date}T${time || "00:00"}`);
      if (!isNaN(dt.getTime())) datetime = dt;
    }

    const student = await Student.findOne({ user: userId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const reminder = {
      title,
      description,
      date,
      time,
      type,
      // these two are additive — your schema is flexible and will store them
      datetime: datetime || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    student.reminders = Array.isArray(student.reminders) ? student.reminders : [];
    student.reminders.push(reminder);
    await student.save();

    res
      .status(201)
      .json({ message: "Reminder added successfully", reminder, reminders: student.reminders });
  } catch (err) {
    console.error("Add reminder error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//Fetch Reminders (sorted soonest first for Upcoming Events)
export const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const list = Array.isArray(student.reminders) ? [...student.reminders] : [];
    list.sort((a, b) => {
      const ad = a.datetime ? new Date(a.datetime).getTime() : new Date(`${a.date}T${a.time || "00:00"}`).getTime();
      const bd = b.datetime ? new Date(b.datetime).getTime() : new Date(`${b.date}T${b.time || "00:00"}`).getTime();
      return ad - bd;
    });

    res.json(list);
  } catch (err) {
    console.error("Fetch reminders error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
