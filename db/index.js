const { Client } = require('pg')

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const connect = () => {
  client.connect()
}

const fetchStats = async () => {
  const result = await client.query({
    text: 'SELECT page_visits FROM site_data'
  })

  return result.rows
}

const update = (siteName, type) => {
  const query = `UPDATE site_data 
  SET ${type} = ${type} + 1 
  WHERE name = '${siteName}'`


  client.query(query, (err, res) => {
    if (err) throw err
  })
}

module.exports = {
  connect,
  fetchStats,
  update,
}