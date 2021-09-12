const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const connect = () => {
  client.connect();
}

const update = (siteName, type) => {
  const query = `UPDATE site_data 
  SET ${type} = ${type} + 1 
  WHERE name = '${siteName}'`


  client.query(query, (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
  });
}

module.exports = {
  connect,
  update,
}