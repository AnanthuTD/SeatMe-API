import { models } from '../../sequelize/models.js';
import logger from '../logger.js';

/**
 * Retrieves staff members by department ID.
 *
 * @async
 * @function
 * @param {Object} params - The parameters for the query.
 * @param {number} params.departmentId - The ID of the department to filter staff members.
 * @returns {Promise} A promise that resolves to an object containing staff information.
 * @returns {Array} .staffs - An array of staff members.
 * @returns {boolean} .error - A boolean indicating if an error occurred.
 * @returns {string} .message - A message describing the result.
 * @throws {Error} If an error occurs during the database query.
 */
async function getStaffsByDepartmentCode({ departmentCode }) {
    try {
        const staffs = await models.authUser.findAll({
            where: { departmentCode },
            attributes: ['id', 'name', 'designation'],
        });
        return {
            staffs,
            error: false,
            message: 'Staff members retrieved successfully',
        };
    } catch (error) {
        logger.error(error, 'Error on getStaffsByDepartmentCode');
        throw new Error('Error on fetching staff members');
    }
}

export { getStaffsByDepartmentCode };
