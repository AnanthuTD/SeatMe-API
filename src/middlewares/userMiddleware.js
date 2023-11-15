const checkSameStudent = (req, res, next) => {
    try {
        const { studentId } = req.query;

        const existingStudentId = req.cookies.studentId;
        if (existingStudentId && existingStudentId !== studentId) {
            res.clearCookie('studentId');
            res.clearCookie('programId');
            res.clearCookie('semester');
            res.clearCookie('openCourse');
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' });
        }

        res.cookie('studentId', studentId);

        return next();
    } catch (error) {
        console.error(
            'An error occurred in userMiddleware (checkSameStudent)\n',
            error,
        );
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { checkSameStudent };
