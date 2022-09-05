const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const chalk = require('chalk');

const { envConfig } = require('./src/config/env');
const route = require('./src/routes')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cors());

app.use(route);

const port = envConfig.PORT;
app.listen(port, () => console.log(chalk.blueBright(`Server up and run on port ${port}`)));