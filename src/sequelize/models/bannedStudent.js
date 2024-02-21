import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    if (!(sequelize instanceof Sequelize)) return null;

    const BannedStudent = sequelize.define('bannedStudent', {
        studentId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
    });

    return BannedStudent;
};
