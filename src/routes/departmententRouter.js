import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/department', (req, res) => {
    console.log('this is called');
    console.log(req.body);
    let body = req.body.departments;
    let deps = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        deps.push({
            id,
            name,
        });
        console.log(deps);
        console.log(`ID: ${item.id}, Name: ${item.name}`);
    });
    let name = req.body.name;

    console.log(deps);

    models.department
        .bulkCreate(deps, { validate: true })
        .then(() => {
            res.send(deps);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);

            // Sending SQL error message to frontend
            res.status(500).json({ error: 'Error inserting values into DB', sqlError: error.message });
        });
});
router.patch('/departmentupdate/', async (req, res) => {
    try {
        let departments = [];
        req.body.forEach((item) => {
            let id = item.id;
            let name = item.name;
            departments.push({
                id,
                name,
            });
          //  console.log(departments,"hai this is patch");
        });
        departments.forEach((department) => {
            const departmentId = department.id;
            const departmentName = department.name;
        
            // Use the values as needed
            console.log('department ID:', departmentId);
            console.log('department Name:', departmentName);
            console.log('----------------------');
        });
        const updates = departments.map(async (department1) => {
            // Find the department by departmentId
            const department = await models.department.findByPk(department1.id);

            if (!department) {
                return { error: `department with ID ${department1.id} not found` };
            }

            let updatedData = {
                name: department1.name,
            };

            // Update the department with the provided data
            await department.update(updatedData);

            return { message: `department with ID ${department1.id} updated successfully`, updateddepartment: department };
        });

        // Wait for all updates to complete before sending the response
        const results = await Promise.all(updates);

        // Check for errors in the results
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }

        // If no errors, send a success response
        res.status(200).json({ message: 'All departments updated successfully', results });
    } catch (error) {
        console.error('Error updating department in DB:', error);
        res.status(500).json({ error: 'Error updating department in DB', errorMessage: error.message });
    }
});

export default router;
