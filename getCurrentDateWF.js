const { format } = require('date-fns');

const currentDate = new Date();

const formattedDate = format(currentDate, "yyyy-MM-dd HH:mm:ss");

console.log(formattedDate);
