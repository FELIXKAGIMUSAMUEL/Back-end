const mongoose = require('mongoose');

const conn = 'mongodb+srv://ISM_Group:ismgroup@hostels.1wmoi4e.mongodb.net/?retryWrites=true&w=majority';

const connection = mongoose.createConnection(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});



const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    hash: String,
    salt: String
});

const hostelrequest = new mongoose.Schema({
    hostelName: String,
    email: String,
    contact: String,
    license: String,
    hash: String,
    salt: String,
    activated: Boolean
});

const studentBooking = new mongoose.Schema({
    checkInDate: Date,
    contact: String,
    depositAmount: Number,
    email: String,
    emergencyContact: String,
    emergencyContactName: String,
    emergencyRelationship: String,
    fullName: String,
    gender: String,
    institutionName: String,
    isPaymentConfirmed: Boolean,
    paymentMethod: String,
    programDetails: String,
    roomType: String,
    specialRequests: String,
    totalCost: Number,
    status:Boolean,
    notification:Boolean,
    hostel:String,
    timeStamp:Date
});

const User = connection.model('Users', userSchema);
const HostelRequest = connection.model('HostelRequest', hostelrequest)
const StudentBooking = connection.model('StudentBooking', studentBooking)

module.exports = connection;

