const mysql = require('mysql2');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'kwvc'
});
conn.query('SELECT * FROM site_configs WHERE config_key LIKE "stat_%"', (err, rows) => {
    if(err) console.log('Error:', err);
    else console.log('stat fields:', JSON.stringify(rows, null, 2));
    conn.end();
});