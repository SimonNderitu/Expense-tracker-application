const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
dotenv.config();

// Initialize
const app = express();

// Configure middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
    secret: 'uwebuiwebciuwebcwecubweubweofbweofbowebfouwbfuowerb',
    resave: false,
    saveUninitialized: false,
}));

// Create connection
const connection  = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect((err) => {
    if(err){
        console.error('Error occurred while connecting to the db server: ' + err.stack);
        return;
    }
    console.log('DB Server connected successfully.');
});

// Middleware for authentication
const userAuthenticated = (request, response, next) => {
    if (request.session.user) {
        next();
    } else {
        response.redirect('/login');
    }
};

// Define routes
app.get('/register', (request, response) => {
    response.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (request, response) => {
    response.sendFile(path.join(__dirname, "login.html"));
});

app.get('/dashboard', userAuthenticated, (request, response) => {
    response.sendFile(path.join(__dirname, "dashboard.html"));
});

// Define a User object for registration and authentication
const User = {
    tableName: 'users',
    createUser: function(newUser, callback){
        connection.query('INSERT INTO ' + this.tableName + ' SET ?', newUser, callback);
    },
    getUserByEmail: function(email, callback){
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE email = ?', email, callback);
    },
    getUserByUsername: function(username, callback){
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE username = ?', username, callback);
    },
}

// Registration route and logic
app.post('/api/registration', [
    check('email').isEmail().withMessage('Provide valid email address.'),
    check('username').isAlphanumeric().withMessage('Invalid username. Provide alphanumeric values.'),
    check('email').custom(async (value) => {
        return new Promise((resolve, reject) => {
            User.getUserByEmail(value, (err, results) => {
                if (results.length > 0) {
                    reject(new Error('Email already exists'));
                } else {
                    resolve(true);
                }
            });
        });
    }),
    check('username').custom(async (value) => {
        return new Promise((resolve, reject) => {
            User.getUserByUsername(value, (err, results) => {
                if (results.length > 0) {
                    reject(new Error('Username already in use.'));
                } else {
                    resolve(true);
                }
            });
        });
    })
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);

    const newUser = {
        full_name: request.body.full_name,
        email: request.body.email,
        username: request.body.username,
        password: hashedPassword
    }

    User.createUser(newUser, (error) => {
        if (error) {
            console.error('An error occurred while saving the record: ' + error.message);
            return response.status(500).json({ error: error.message });
        }
        console.log('New user record saved!');
        response.status(201).send('Registration successful!');
    });
});

// Login route and logic
app.post('/api/user/login', (request, response) => {
    const { username, password } = request.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            response.status(401).send('Invalid username or password.');
        } else {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    request.session.user = user;
                    response.status(200).json({ message: 'Login successful' });
                } else {
                    response.status(401).send('Invalid username or password.');
                }
            });
        }
    });
});

// Add a new expense
app.post('/api/expenses', userAuthenticated, (request, response) => {
    const { category, description, amount } = request.body;
    const userId = request.session.user.id;

    const query = 'INSERT INTO expenses (user_id, category, description, amount) VALUES (?, ?, ?, ?)';
    connection.query(query, [userId, category, description, amount], (err, results) => {
        if (err) {
            console.error('Error adding expense:', err);
            return response.status(500).send('Failed to add expense');
        }
        response.status(201).send('Expense added successfully');
    });
});

// Get all expenses for the logged-in user
app.get('/api/expenses', userAuthenticated, (request, response) => {
    const userId = request.session.user.id;

    const query = 'SELECT * FROM expenses WHERE user_id = ? ORDER BY date_created DESC';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching expenses:', err);
            return response.status(500).send('Failed to fetch expenses');
        }
        response.status(200).json(results);
    });
});

// Logout
app.get('/logout', (request, response) => {
    request.session.destroy();
    response.redirect('/login');
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
