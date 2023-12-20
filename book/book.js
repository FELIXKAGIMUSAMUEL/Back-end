const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());



const PORT = process.env.PORT || 8090;
app.listen(PORT, (req, res) => {
    console.log(`App Listening on PORT ${PORT}`);
})  
