const logger = (data, title = 'Log') => {
    console.log(`---- ${title} ----`);
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------');
};

export default logger;
