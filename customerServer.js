var express = require("express");
var app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );  
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});
var port = process.env.PORT||2450;
app.listen(port, () => console.log(`Listening on port ${port}!`));
let {customerData,courseData,studentData,classData,facultyData} = require("./customerData.js");
app.post("/login", function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
  
    var cust = customerData.find(function(item) {
      return item.email === email && item.password === password;
    });
    console.log(cust);
    var custRec= {
      name: cust.name,
      email:cust.email,
      role: cust.role
    }
    res.send(custRec);
  });
  app.post("/register", function (req, res) {
    const role = req.body.role;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const maxCustomerId = customerData.length > 0 ? Math.max(...customerData.map(customer => customer.id)) : 0;
    const maxStudentId = studentData.length > 0 ? Math.max(...studentData.map(student => student.id)) : 0;
    const maxFacultyId = facultyData.length > 0 ? Math.max(...facultyData.map(faculty => faculty.id)) : 0;

    if (role === "student") {
        const newStudent = {
            id: maxStudentId + 1,
            name: name,
            dob: req.body.dob || "",
            gender: req.body.gender || "",
            about: req.body.about || "",
            courses: req.body.courses || []
        };

        studentData.unshift(newStudent);

        const newCustomer = {
            id: maxCustomerId + 1,
            name: name,
            email: email,
            password: password,
            role: role
        };

        customerData.unshift(newCustomer);

        res.send(newStudent);
    } else if (role === "faculty") {
        const newFaculty = {
            id: maxFacultyId + 1,
            name: name,
            courses: req.body.courses || []
        };

        facultyData.unshift(newFaculty);

        const newCustomer = {
            id: maxCustomerId + 1,
            name: name,
            email: email,
            password: password,
            role: role
        };

        customerData.unshift(newCustomer);

        res.send(newFaculty);
    } else {
        res.status(400).json({ error: "Invalid role specified. Must be 'student' or 'faculty'." });
    }
});

  app.get("/getStudents", function (req, res) {
    let studentList = [];
    studentData.forEach(function (item) {
        let obj2 = {
            id: item.id,
            name: item.name,
            dob: item.dob,
            gender: item.gender,
            about: item.about,
            courses: item.courses
        };
        studentList.push(obj2);
    });

    let page = parseInt(req.query.page) || 1;
    let perPage = 3;
    let start = (page - 1) * perPage;
    let end = start + perPage;
    let courseFilter = req.query.course;
    let filteredStudents = studentList;

    if (courseFilter) {
        let coursesToFilter = courseFilter.split(',').map(course => course.trim());
        filteredStudents = studentList.filter(student =>
            coursesToFilter.some(course => student.courses.includes(course))
        );
    }
    let paginatedList = filteredStudents.slice(start, end);
    res.json({
        page: page,
        items: paginatedList,
        totalItems: paginatedList.length,
        totalNum: filteredStudents.length,
    });
});

app.get("/getFaculties", function (req, res) {
  let facultyList = [];
  facultyData.forEach(function (item) {
      let obj2 = {
          id: item.id,
          name: item.name,
          courses: item.courses
      };
      facultyList.push(obj2);
  });

  let page = parseInt(req.query.page) || 1;
  let perPage = 3;
  let start = (page - 1) * perPage;
  let end = start + perPage;
  let courseFilter = req.query.course;
  let filteredFaculty = facultyList;

  if (courseFilter) {
      let coursesToFilter = courseFilter.split(',').map(course => course.trim());
      filteredFaculty = facultyList.filter(student =>
          coursesToFilter.some(course => student.courses.includes(course))
      );
  }
  let paginatedList = filteredFaculty.slice(start, end);
  res.json({
      page: page,
      items: paginatedList,
      totalItems: paginatedList.length,
      totalNum: filteredFaculty.length,
  });
});

  
  app.get("/getStudentNames", function (req, res) {
    let studentList2=[]
    studentData.forEach(function (item) {
        studentList2.push(item.name);
    });
    res.json(studentList2);
  });

  app.get("/getCourses", function (req, res) {
    res.json(courseData);
  });
  
  app.get("/getCourses/:id", function (req, res) {
    let id = +req.params.id; 
  
    const existingCourseIndex = courseData.findIndex(course => course.courseId === id);
  
    if (existingCourseIndex !== -1) {
      res.json(courseData[existingCourseIndex]);
    } else {
      res.status(404).json({ error: "Course not found." });
    }
  });
  

  app.get("/getFacultyNames", function (req, res) {
    let facultyList2=[]
    facultyData.forEach(function (item) {
        facultyList2.push(item.name);
    });
    res.json(facultyList2);
  });
  

  app.put("/putCourse", function (req, res) {
    const courseId = req.body.courseId;
    const updatedCourse = {
      courseId: courseId,
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      faculty: req.body.faculty,
      students: req.body.students
    };
  
    const existingCourseIndex = courseData.findIndex(course => course.courseId === courseId);
  
    if (existingCourseIndex !== -1) {
      const existingCourse = courseData[existingCourseIndex];
  
      courseData[existingCourseIndex] = updatedCourse;
  
      const studentsToUpdate = updatedCourse.students;
      const students = studentData.filter(student =>
        studentsToUpdate.includes(student.name)
      );
    
      students.forEach(student => {
        const studentIndex = studentData.findIndex(s => s.id === student.id);
        if (studentIndex !== -1) {
          studentData[studentIndex].courses = [...new Set([...studentData[studentIndex].courses, updatedCourse.name])];
        }
      });

      const removedStudents = existingCourse.students.filter(student =>
        !studentsToUpdate.includes(student)
      );

      removedStudents.forEach(studentName => {
        const studentIndex = studentData.findIndex(student => student.name === studentName);
        if (studentIndex !== -1) {
          studentData[studentIndex].courses = studentData[studentIndex].courses.filter(course =>
            course !== updatedCourse.name
          );
        }
      });

      res.json(updatedCourse);
    } else {
      res.status(404).json({ error: "Course not found." });
    }
  });

  app.put("/putCourse2", function (req, res) {
    const courseId = req.body.courseId;
    const updatedCourse = {
      courseId: courseId,
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      faculty: req.body.faculty,
      students: req.body.students
    };
  
    const existingCourseIndex = courseData.findIndex(course => course.courseId === courseId);
  
    if (existingCourseIndex !== -1) {
      const existingCourse = courseData[existingCourseIndex];
  
      // Update the course
      courseData[existingCourseIndex] = updatedCourse;
  
      // Update the faculty associated with the course
      const facultyToUpdate = updatedCourse.faculty;
      const facultyMembers = facultyData.filter(faculty =>
        facultyToUpdate.includes(faculty.name)
      );
  
      facultyMembers.forEach(facultyMember => {
        const facultyIndex = facultyData.findIndex(faculty => faculty.id === facultyMember.id);
        if (facultyIndex !== -1) {
          // Update the courses of the faculty member
          facultyData[facultyIndex].courses = [...new Set([...facultyData[facultyIndex].courses, updatedCourse.name])];
        }
      });
  
      // Remove the course from faculty members who are no longer associated
      const removedFaculty = existingCourse.faculty.filter(facultyMember =>
        !facultyToUpdate.includes(facultyMember)
      );
  
      removedFaculty.forEach(facultyName => {
        const facultyIndex = facultyData.findIndex(faculty => faculty.name === facultyName);
        if (facultyIndex !== -1) {
          // Remove the course from the faculty member's courses array
          facultyData[facultyIndex].courses = facultyData[facultyIndex].courses.filter(course =>
            course !== updatedCourse.name
          );
        }
      });
  
      res.json(updatedCourse);
      console.log(updatedCourse);
    } else {
      res.status(404).json({ error: "Course not found." });
    }
  });
  
  
  
  app.get("/getStudentDetails/:name", function (req, res) {
    const studentName = req.params.name;

    const student = studentData.find(student => student.name === studentName);

    if (student) {
        const studentDetails = {
            id: student.id,
            name: student.name,
            dob: student.dob,
            gender: student.gender,
            about: student.about
        };
        res.json(studentDetails);
    } else {
        res.status(500).json({ error: "Student details not found." });
    }
});


app.get("/getStudentCourses/:name", function (req, res) {
  const studentName = req.params.name;

  const student = studentData.find(student => student.name === studentName);

  if (student) {
      const studentCourses = student.courses.map(courseName => {
          const course = courseData.find(course => course.name === courseName);
          return {
              courseId: course.courseId,
              name: course.name,
              code: course.code,
              description: course.description
          };
      });

      res.json(studentCourses);
  } else {
      res.status(500).json({ error: "Student not found or has no courses." });
  }
});


app.get("/getStudentClasses/:name", function (req, res) {
  const studentName = req.params.name;

  const student = studentData.find(student => student.name === studentName);

  if (student) {
      if (student.courses && student.courses.length > 0) {
          const studentClasses = [];

          classData.forEach(classItem => {
              if (student.courses.includes(classItem.course)) {
                  const faculty = facultyData.find(faculty => faculty.name === classItem.facultyName);

                  const classDetails = {
                      classId: classItem.classId,
                      course: classItem.course,
                      time: classItem.time,
                      endTime: classItem.endTime,
                      topic: classItem.topic,
                      facultyName: classItem.facultyName,
                      facultyId: faculty ? faculty.id : null
                  };

                  studentClasses.push(classDetails);
              }
          });

          res.json(studentClasses);
      } else {
          res.status(500).json({ error: "Student has no courses." });
      }
  } else {
      res.status(500).json({ error: "Student not found." });
  }
});


app.post("/postStudentDetails/:name", function (req, res) {
  let body = req.body;
  let studentName = req.params.name;

  let existingStudent = studentData.find(student => student.name === studentName);

  if (existingStudent) {
    existingStudent.dob = body.dob || "";
    existingStudent.gender = body.gender || "";
    existingStudent.about = body.about || "";

    res.send(existingStudent);
  } else {

    res.status(404).json({ error: "Student not found." });
  }
});




app.get("/getFacultyCourses/:name", function (req, res) {
  const facultyName = req.params.name;

  const faculty = facultyData.find(faculty => faculty.name === facultyName);

  if (faculty) {
      const facultyCourses = courseData.filter(course => faculty.courses.includes(course.name));

      res.json(facultyCourses);
  } else {
      res.status(404).json({ error: "Faculty not found." });
  }
});


app.get("/getFacultyClasses/:name", function (req, res) {
  const facultyName = req.params.name;

  const faculty = facultyData.find(faculty => faculty.name === facultyName);

  if (faculty) {
      const facultyClasses = classData.filter(classItem => classItem.facultyName === facultyName);

      res.json(facultyClasses);
  } else {
      res.status(404).json({ error: "Faculty not found." });
  }
});

app.post("/postClass/:name", function (req, res) {
  const name = req.params.name;
  const newClass = {
    classId: classData.length + 1, 
    course: req.body.course,
    time: req.body.time,
    endTime: req.body.endTime,
    topic: req.body.topic,
    facultyName: name
  };

  classData.push(newClass);

  res.json(newClass);
});


app.put("/putClass/:classId", function (req, res) {
  const classId = +req.params.classId;
  
  const existingClassIndex = classData.findIndex(classItem => classItem.classId === classId);

  if (existingClassIndex !== -1) {
    const updatedClass = {
      classId: classId,
      course: req.body.course,
      time: req.body.time,
      endTime: req.body.endTime,
      topic: req.body.topic,
      facultyName: req.body.facultyName
    };

    classData[existingClassIndex] = updatedClass;

    res.json(updatedClass);
  } else {
    res.status(404).json({ error: "Class not found." });
  }
});


app.get("/getClassDetails/:facultyName/:classId", function (req, res) {
  const facultyName = req.params.facultyName;
  const classId = +req.params.classId;

  const faculty = facultyData.find(faculty => faculty.name === facultyName);
  const classDetails = classData.find(classItem => classItem.classId === classId && classItem.facultyName === facultyName);

  if (faculty && classDetails) {
    res.json(classDetails);
  } else {
    res.status(404).json({ error: "Class details not found." });
  }
});





