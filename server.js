const express = require ('express');
const app = express();
const bcrypt = require('bcrypt-nodejs')
const cors = require ('cors')
const knex = require('knex')
const Clarifai = require ('clarifai');

const appi = new Clarifai.App({
 apiKey: 'a3e6e4443413464b85e4a928b9e7f4d8'
});




const dbs = knex({
  client: 'pg',
connection: {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
   /* host : '127.0.0.1',
    user : 'postgres',
    password : 'tomer',
    database : 'face-ai'*/
  }
});
/*
console.log(postgresdb.select('*').from('users'));
*/

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	/*res.send(dbs.users);*/
	res.send('its working i think');
})


app.post('/signin', (req, res) => {
	const {email, password} = req.body;
	if (!email || !password)
  {
  	return res.status(400).json('incorret form submsion');
  }
	console.log(req.body.email);
  dbs.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return dbs.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials 1')
      }
    })
    .catch(err => res.status(400).json('wrong password or name'))
})


app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password)
  {
  	return res.status(400).json('incorret form submsion');
  }
  const hash = bcrypt.hashSync(password);
    dbs.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	dbs.select('*').from('users').where(
		{id:id})
	.then(user => {
		if (user.length)
	{res.json(user[0])}
	else
{
res.status(404).json('not found')
	}
	})
	.catch(err=> res.status(400).json('error getting user'))
})

/*app.put('/image', (req, res) => {
	const {id} = req.body;
	let foundit = false;
	db.users.forEach(user => {
		if (user.id === id)
		{
			console.log("yesss");
			foundit = true;
			user.entries++;
			return res.json(user.entries);
		}
	})
	if (!foundit){
		res.status(404).json('not found!')
	}
})*/

app.post('/imageurl', (req, res) => {
console.log( req.body.input);
appi.models.predict(
        Clarifai.FACE_DETECT_MODEL, req.body.input)
.then(data => {
	res.json(data);
})
.catch(err=> res.status(400).json('unable to work with api'))
})

app.put('/image',(req, res) => {
	const { id } = req.body;

dbs('users').where('id', '=', id)
.increment('entries', 1)
.returning('entries')
.then(entries => {
	res.json(entries[0]);
})
.catch(err => res.status(400).json('unable to get count'))
})

const PORT = process.env.PORT;
/*const PORT = 4000;*/

app.listen(PORT || 5000, () => {
	console.log(`app is running on port ${PORT}`);
})




/*/--> res= this is working
/signin --> post = suc/fa
/register ==> post = user
/profile/:userId --> get = user
/image --> put --> user
*/
