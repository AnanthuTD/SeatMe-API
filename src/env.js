// List of required environment variables
const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'DB_USER_NAME',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_HOST',
    'DB_PORT',
    'ACCESS_TOKEN_PRIVATE_KEY',
    'REFRESH_TOKEN_PRIVATE_KEY',
];

// Function to validate environment variables
function validateEnvVars() {
    requiredEnvVars.forEach((envVar) => {
        if (!process.env[envVar] || process.env[envVar].trim() === '') {
            throw new Error(`Missing or empty environment variable: ${envVar}`);
        }
    });
}

// Export a function to validate and load environment variables
export default function validate() {
    validateEnvVars();

    return {
        ACCESS_TOKEN_PRIVATE_KEY: process.env.ACCESS_TOKEN_PRIVATE_KEY,
        REFRESH_TOKEN_PRIVATE_KEY: process.env.REFRESH_TOKEN_PRIVATE_KEY,
        PORT: process.env.PORT,
        DB_USER_NAME: process.env.DB_USER_NAME,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
    };
}
