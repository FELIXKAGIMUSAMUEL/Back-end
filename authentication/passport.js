const Password = require('./password');
const connection = require('./database');
const User = connection.models.Users;
const HostelRequest = connection.models.HostelRequest;

function checkdetails(req, res, next) {

    if (req.body.custodian) {
        custodian = req.body.custodian
        HostelRequest.findOne({ email: req.body.email })
            .then((User) => {
                if (!User) {
                    console.log("No Hostel Found");
                    return res.status(401).json({ message: 'No Hostel Found' })
                }
                if (User) {
                    console.log("Hostel Exists")
                    if (Password.validatePassword(req.body.password, User.salt).hash === User.hash) {
                        req.user = User
                    } else {
                        console.log('Incorrect password')
                        return res.status(401).json({ message: 'Incorrect password' });
                    }
                }
                next();
            }).catch((err) => {
                console.log('Encountered an error!')
                return res.status(500).json({ error: 'Internal Server Error' });
            })
    } else {
        // Check if user exists in database 
        User.findOne({ name: req.body.email })
            .then((User) => {
                if (!User) {
                    console.log("No user");
                    return res.status(401).json({ message: 'No user found' });
                }
                if (User) {
                    console.log("User exists")
                    if (Password.validatePassword(req.body.password, User.salt).hash === User.hash) {
                        req.user = User
                    } else {
                        console.log('Incorrect password')
                        return res.status(401).json({ message: 'Incorrect password' });
                    }
                }
                next();
            }).catch((err) => {
                console.log('Encountered an error!')
                return res.status(500).json({ error: 'Internal Server Error' });
            })
    }

}
 