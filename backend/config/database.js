const mongoose = require('mongoose');

const connactiondatabase = () => {
    mongoose.connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then((data) => {

            console.log(`Connected to MongoDB : ${data.connection.host}`)
        })
        // .catch((err) => {
        //     console.log('Failed to connect to MongoDB:', err);
        //     // Exit the process if the connection fails
        //     // process.exit(1);
        // });

}
module.exports = connactiondatabase;