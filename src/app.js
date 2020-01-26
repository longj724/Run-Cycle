const path = require('path');
const hbs = require('hbs');
const express = require('express');

const app = express();

// Get the Heroku Port
var port  = process.env.Port || 3000

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

app.set('views', viewsPath);
app.set('view engine', 'hbs');
hbs.registerPartials(partialsPath);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

app.get('', (req, res) => {
    res.render('index');
})

app.listen(port, () => {
    console.log("started");
})