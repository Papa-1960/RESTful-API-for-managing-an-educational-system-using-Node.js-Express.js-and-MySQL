// Import necessary modules
const express = require('express');
const mysql = require('mysql2');

// Create an Express application
const app = express();
const port = 3000; // Choose a port for your application

// MySQL database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'database_dump',
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Middleware to handle JSON data
app.use(express.json());

// Middleware to check if the user has the "College Staff" role
const isCollegeStaff = (req, res, next) => {
  const userId = req.headers['user-id']; // Assuming you have a user ID in the request headers
  pool.query('SELECT RoleID FROM users WHERE UserID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const roleId = results[0] ? results[0].RoleID : null;
    if (roleId === 1) {
      // Assuming RoleID 1 corresponds to the "College Staff" role
      next(); // User is college staff, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Access Forbidden' }); // User does not have the required role
    }
  });
};

// Middleware to check if the user has the "Teacher" role
const isTeacher = (req, res, next) => {
  const userId = req.headers['user-id']; // Assuming you have a user ID in the request headers
  pool.query('SELECT RoleID FROM users WHERE UserID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const roleId = results[0] ? results[0].RoleID : null;
    if (roleId === 2) {
      // Assuming RoleID 2 corresponds to the "Teacher" role
      next(); // User is a teacher, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Access Forbidden' }); // User does not have the required role
    }
  });
};

// Middleware to check if the user has the "Student" role
const isStudent = (req, res, next) => {
  const userId = req.headers['user-id']; // Assuming you have a user ID in the request headers
  pool.query('SELECT RoleID FROM users WHERE UserID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    const roleId = results[0] ? results[0].RoleID : null;
    if (roleId === 3) {
      // Assuming RoleID 3 corresponds to the "Student" role
      next(); // User is a student, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Access Forbidden' }); // User does not have the required role
    }
  });
};

// Route to list all courses (accessible only for college staff)
app.get('/courses', isCollegeStaff, (req, res) => {
  pool.query('SELECT * FROM courses', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

// Route to list all enrolled students in a course with their marks (accessible only for teachers)
app.get('/enrolled-students/:courseId', isTeacher, (req, res) => {
  const courseId = req.params.courseId;
  pool.query(
    'SELECT users.Name AS StudentName, enrolments.Mark FROM enrolments INNER JOIN users ON enrolments.UserID = users.UserID WHERE enrolments.CourseID = ?',
    [courseId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json(results);
    }
  );
});

// Route to list all courses available for enrollment (accessible only for students)
app.get('/available-courses', isStudent, (req, res) => {
  pool.query('SELECT * FROM courses WHERE isAvailable = 1', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

// Route to enroll a student in a course (accessible only for students)
app.post('/enroll-student', isStudent, (req, res) => {
  const { mark, courseId, userId } = req.body;
  pool.query(
    'INSERT INTO enrolments (Mark, CourseID, UserID) VALUES (?, ?, ?)',
    [mark, courseId, userId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ message: 'Student enrolled successfully' });
    }
  );
});

// Route to update a student's mark for a course (accessible only for teachers)
app.put('/update-mark', isTeacher, (req, res) => {
  const { newMark, courseId, userId } = req.body;
  pool.query(
    'UPDATE enrolments SET Mark = ? WHERE CourseID = ? AND UserID = ?',
    [newMark, courseId, userId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ message: 'Mark updated successfully' });
    }
  );
});

// Route to list all roles (accessible only for college staff)
app.get('/roles', isCollegeStaff, (req, res) => {
  pool.query('SELECT * FROM roles', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

// Route to assign a course to a teacher (accessible only for college staff)
app.post('/assign-course', isCollegeStaff, (req, res) => {
  const { courseId, teacherId } = req.body;
  pool.query(
    'UPDATE courses SET TeacherID = ? WHERE CourseID = ?',
    [teacherId, courseId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ message: 'Course assigned to teacher successfully' });
    }
  );
});

// Route to make pass/fail decisions (accessible only for teachers)
app.put('/make-pass-fail-decision', isTeacher, (req, res) => {
  const { enrolmentId, mark } = req.body;
  pool.query(
    'UPDATE enrolments SET Mark = ? WHERE EnrolmentID = ?',
    [mark, enrolmentId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ message: 'Pass/fail decision updated successfully' });
    }
  );
});

// Route to delete a course (accessible only for college staff)
app.delete('/delete-course/:courseId', isCollegeStaff, (req, res) => {
  const courseId = req.params.courseId;
  pool.query('DELETE FROM courses WHERE CourseID = ?', [courseId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json({ message: 'Course deleted successfully' });
  });
});


// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});