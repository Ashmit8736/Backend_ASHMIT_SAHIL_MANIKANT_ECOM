require('dotenv').config()
const app = require('./src/app')
const db = require('./src/db/db')


port = process.env.PORT || 3000;
// db()

const IP = require("ip").address();

// app.listen(port,'0.0.0.0',() =>{
//     console.log(`server is running on ${port}://${IP}:3000`);
// })

app.listen(process.env.PORT, () => {
    console.log(`server running on http://localhost:${process.env.PORT}`);
});
