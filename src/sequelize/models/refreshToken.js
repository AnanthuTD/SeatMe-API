import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const refreshToken = sequelize.define(
        'refreshToken',
        {
            authUserId: {
                type: DataTypes.STRING(7),
                primaryKey: true,
            },
            token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            expirationTime: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            underscored: true,
            timestamps: false,
        },
    );

    refreshToken.getNonExpiredTokens = async (authUserId = null) => {
        // Find and delete expired tokens
        await refreshToken.destroy({
            where: {
                expirationTime: {
                    [Sequelize.Op.lt]: new Date(),
                },
            },
        });

        // Define the condition based on whether authUserId is provided
        const condition = authUserId
            ? { authUserId, expirationTime: { [Sequelize.Op.gte]: new Date() } }
            : { expirationTime: { [Sequelize.Op.gte]: new Date() } };

        // Retrieve and return non-expired tokens
        const nonExpiredTokens = await refreshToken.findAll({
            where: condition,
        });

        return nonExpiredTokens;
    };

    return refreshToken;
};
