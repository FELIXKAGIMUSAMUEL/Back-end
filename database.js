const mongoose=require('mongoose');

const conn = 'mongodb://localhost:27017/Hostel';

const connection = mongoose.createConnection(conn,{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    name:String,
    hash:String,
    salt:String
});

const User = connection.model('Users',userSchema);

module.exports=connection;
