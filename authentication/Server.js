require('dotenv').config()
const express = require('express');
const http = require('http');
const app = express();
const passport = require('passport');
const connection = require('./database');
const User = connection.models.Users;
const HostelRequest = connection.models.HostelRequest;
const StudentBooking = connection.models.StudentBooking;
const pass = require("./password");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const redis = require('redis');
const socketIo = require("socket.io");
const { parseJwt } = require('./jwtUtils');


const client = redis.createClient({
    url:'redis://red-cll0ikuaov6s73f0vkn0:6379',
    db:1
});


const client2 = redis.createClient({
    url:'redis://red-cll0ikuaov6s73f0vkn0:6379',
    db:2
});

// const client3 = redis.createClient();
client.on("error", function (err) {
    console.error("Redis Error: " + err);
});

const allowedOrigins = [' https://dean-hostelease.netlify.app', 'https://students-hostelease.netlify.app', 'https://custodian-hostelease.netlify.app'];

const server = http.createServer(app)

app.use(
    cors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
);

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log('A user connected');
})

app.get('/test', (req, res) => {
    // io.emit('newUserData', { names: "savedUser" });
    res.send(`<h1>ISM Group</h1>`)

});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
                    if (pass.validatePassword(req.body.password, User.salt).hash === User.hash) {
                        req.user = User
                    } else {
                        console.log('Incorrect password')
                        return res.status(401).json({ message: 'Incorrect password' });
                    }
                }
                next();
            }).catch((err) => {
                console.log('Encountered an error!' + err)
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
                    if (pass.validatePassword(req.body.password, User.salt).hash === User.hash) {
                        req.user = User
                    } else {
                        console.log('Incorrect password')
                        return res.status(401).json({ message: 'Incorrect password' });
                    }
                }
                next();
            }).catch((err) => {
                console.log('Encountered an error!' + err)
                return res.status(500).json({ error: 'Internal Server Error' });
            })
    }

}


app.get('/token', (req, res) => {
    const incomingrefreshToken = req.headers['x-refresh-token'];
    // console.log(incomingrefreshToken)
    // console.log(`.........................................................`)
    if (incomingrefreshToken == null) return res.sendStatus(401);
    // Verify the refreshToken against the stored refresh tokens in Redis
    client.get('refreshToken', (err, reply) => {
        // console.log(reply)
        if (err || reply === null || reply !== incomingrefreshToken) return res.sendStatus(403);
        // If the refresh token is found in Redis, verify it and generate a new access token
        jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            const accessToken = generateAccessToken({ id: user.id });
            res.json({ accessToken: accessToken, user: user });
        });
    });
});

app.get('/StudentToken', (req, res) => {
    const incomingrefreshToken = req.headers['x-refresh-token'];
    // console.log(incomingrefreshToken)
    // console.log(`.........................................................`)
    if (incomingrefreshToken == null) return res.sendStatus(401);
    // Verify the refreshToken against the stored refresh tokens in Redis
    client2.get('refreshToken', (err, reply) => {
        // console.log(reply)
        if (err || reply === null || reply !== incomingrefreshToken) return res.sendStatus(403);
        // If the refresh token is found in Redis, verify it and generate a new access token
        jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            const accessToken = generateAccessToken({ id: user.id });
            res.json({ accessToken: accessToken, user: user });
        });
    });
});

app.delete('/logout', async (req, res) => {
    try {
      await client.del('refreshToken');
      res.status(200).json({ message: 'Loggedout Successfully' });
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

//Custom middleware to log session and user

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '180s' })
}

app.post('/login', checkdetails, (req, res) => {
    const user = { id: req.user }
    // console.log(req.body);
    // Now req.user is available with the user data
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    client2.set('refreshToken', refreshToken, 'EX', 300, (err, reply) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' +err });
        } else {
            res.json({ accessToken: accessToken, refreshToken: refreshToken});
        }
    });    
    // const decodedToken = parseJwt(accessToken);
    // console.log(decodedToken)
});

app.post('/loginCustodian', checkdetails, (req, res) => {
    const user = { id: req.user }
    // console.log(req.body);
    // Now req.user is available with the user data
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    client.set('refreshToken', refreshToken, 'EX', 300, (err, reply) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' +err });
        } else {
            res.json({ accessToken: accessToken, refreshToken: refreshToken});
        }
    });    
});

app.get('/failed', (req, res) => {
    return res.status(401).json({ message: 'Authentication failed' });
})

app.post('/register', (req, res) => {
    const Obj = pass.getPassword(req.body.password)
    const salt = Obj.salt
    const hash = Obj.hash
    const newUser = new User({
        email: req.body.email,
        name: req.body.names,
        hash: hash,
        salt: salt
    });

    newUser.save()
        .then((user) => {
            console.log(`Saved user ${user}`);
            res.status(201).json({ message: 'User registered successfully' });
        })
        .catch((error) => {
            console.error(`Error saving user: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

app.post('/savestudent', (req, res) => {

    const studentData=req.body
    console.log(studentData)

    const newUser = new StudentBooking(studentData);

    newUser.save()
        .then((user) => {
            console.log(`Saved user ${user.fullName}`);
            io.emit('newBooking', user)
            res.status(201).json({ message: 'User registered successfully' });
        })
        .catch((error) => {
            console.error(`Error saving user: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});


app.post('/hostelrequest', (req, res) => {
    const Obj = pass.getPassword(req.body.password)
    const salt = Obj.salt
    const hash = Obj.hash
    const newUser = new HostelRequest({
        hostelName: req.body.names,
        email: req.body.email,
        contact: req.body.contact,
        license: req.body.license,
        hash: hash,
        salt: salt,
        activated: false
    });

    newUser.save()
        .then((user) => {
            console.log(`Saved user ${user}`);
            io.emit('newUserData', user)
            res.status(201).json({ message: 'Your Hostel Request was sent successfully' });
        })
        .catch((error) => {
            console.error(`Error saving user: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

app.get('/getHostelDetails', (req, res) => {
    HostelRequest.find({ activated: false })
        .then((hostelDetails) => {
            // Send the fetched data as a response
            //   console.log(hostelDetails)
            res.status(200).json(hostelDetails);
        })
        .catch((error) => {
            console.error('Error fetching hostel details:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
})

app.get('/getBookingData', (req, res) => {
    StudentBooking.find({ status: false })
        .then((hostelDetails) => {
            // Send the fetched data as a response
            //   console.log(hostelDetails)
            res.status(200).json(hostelDetails);
        })
        .catch((error) => {
            console.error('Error fetching hostel details:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
})

app.post('/activate', (req, res) => {
    //    console.log(req.body)
    HostelRequest.updateOne(
        { _id: req.body.key },
        { $set: { activated: true } }
    )
        .then(() => {
            res.status(200).json({ message: 'Activation successful' });
        })
        .catch((error) => {
            // Handle any errors that occur during the update
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        });

})

app.post('/decline', (req, res) => {
    HostelRequest.deleteOne({ _id: req.body.key })
        .then((result) => {
            if (result.deletedCount === 1) {
                console.log('Document deleted successfully');
                res.status(200).json({ message: 'Request Declined sucessfully' });
            } else {
                console.log('Document not found');
                res.status(404).json({ message: 'Document not found' });
            }
        })
        .catch((error) => {
            console.error('Error deleting document:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        })
})

const PORT = process.env.PORT || 8090;
server.listen(PORT, (req, res) => {
    console.log(`Server Listening on PORT ${PORT}`);
})

// module.exports = { app, server };