const mysql = require('mysql2/promise');

const pool = mysql.createPool("mysql://root:WtPkKqr3MCuSI0h3Kyh0XgfRbZSNvDS5@localhost:3307/coa_fichajes");

module.exports = pool;