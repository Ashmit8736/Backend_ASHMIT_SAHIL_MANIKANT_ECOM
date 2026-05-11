require('dotenv').config()
const app = require('./src/app')
const db = require('./src/db/db')


port = process.env.PORT || 3001;
// db()

const IP = require("ip").address();

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});
