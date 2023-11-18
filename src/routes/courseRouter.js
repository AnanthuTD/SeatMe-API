import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/course', (req, res) => {
    console.log('this is called');
    console.log(req.body);
    let body = req.body.courses;
    let courses = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        let semester = item.semester;
        let isOpenCourse = item.isOpenCourse;
        let program = item.program;
        courses.push({
            id,
            name,
            semester,
            isOpenCourse,
            program,
        });
        console.log(courses);
    });

    console.log(courses);

    models.course
        .bulkCreate(courses)
        .then(() => {
            res.send(courses);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);
             res.status(500).send(error);
            res.status(500).json({ error: 'Error inserting values into DB', errorMessage: error.message });

        });
});
router.patch('/courseupdate/', async (req, res) => {
    try {
        let courses = [];
        req.body.forEach((item) => {
            let id = item.id;
            let name = item.name;
            let semester = item.semester;
            let isOpenCourse = item.isOpenCourse;
            let program = item.program;
            courses.push({
                id,
                name,
                semester,
                isOpenCourse,
                program,
            });
          //  console.log(courses,"hai this is patch");
        });
        const updates = courses.map(async (course1) => {
            // Find the course by courseId
            const course = await models.course.findByPk(course1.id);

            if (!course) {
                return { error: `Course with ID ${course1.id} not found` };
            }

            let updatedData = {
                name: course1.name,
                semester: course1.semester,
                isOpenCourse: course1.isOpenCourse,
                program: course1.program,
            };

            // Update the course with the provided data
            await course.update(updatedData);

            return { message: `Course with ID ${course1.id} updated successfully`, updatedCourse: course };
        });

        // Wait for all updates to complete before sending the response
        const results = await Promise.all(updates);

        // Check for errors in the results
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }

        // If no errors, send a success response
        res.status(200).json({ message: 'All courses updated successfully', results });
    } catch (error) {
        console.error('Error updating course in DB:', error);
        res.status(500).json({ error: 'Error updating course in DB', errorMessage: error.message });
    }
});
export default router;
