const express = require('express');
const expressValidator = require('express-validator'); 
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
var flash = require('connect-flash');
const PORT = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
var {mongoose} = require('./db/mongoose');
var {Student} = require('./models/studentModel');
var {Admin} = require('./models/adminModel');
var {Notice} = require('./models/noticeModel');
const hbs = require('express-handlebars');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const fileUpload = require('express-fileupload');

const AuthController = require('./controllers/AuthController');

require('dotenv').config();

app.use(express.static(path.join(__dirname,'/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressValidator());
app.use(cookieParser());
app.use(session({
	secret:'A Secret',
	resave: true,
    saveUninitialized: true
	}));
app.use(flash());
app.engine( 'hbs', hbs( { 
  extname: 'hbs', 
  defaultLayout: __dirname + '/views/layouts/layout.hbs', 
  helpers: require('./config/handlebars-helpers'), 
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir:[ __dirname + '/views/partials1/',  __dirname + '/views/partials2/']
} ) );

app.set( 'view engine', 'hbs' );
app.use(fileUpload());


app.use((req, res, next) => {				//Middleware to pass the session object to the front-end
    app.locals.session = req.session;
    next();
  });

  

app.use(function(req, res, next) {
	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});


app.get('/', (req,res) => {
	res.render('index',{
		pageTitle:'Welcome to CRC, Invertis University'
	});
});


app.get('/login', (req,res) => {
	if(typeof req.session.email !== "undefined"){
		if(app.locals.type === 'Student'){
			res.redirect('/profile');
		}
		else{
			res.redirect('/dashboard');
		}
	}
	
	else{
	res.render('login',{
		pageTitle:'Login'
	});
}
});


app.post('/login', (req,res) => {	//POST /login handler to redirect the request to	
	let email = req.body.email;
	let pass = req.body.pass;
	Student.find({email}).then((student) => {
		Student.checkValidPasswords(pass, student[0].password).then(() => {
			let Type = student[0].type;
			req.session.email = email;
			req.session.pass = pass;
			app.locals.session = req.session;
			global.utype = Type;
			app.locals.type = Type;
			req.flash('info', 'Flash is back!')
			res.redirect('/profile');
		}).catch((e) => {
			res.status(401).send();
		});
	}).catch((e) => 
		Admin.find({email}).then((admin) => {
			Admin.checkValidPasswords(pass, admin[0].password).then(() => {
				let Type = admin[0].type;
				req.session.email = email;
				req.session.pass = pass;
				app.locals.session = req.session;
				global.utype = Type;
				app.locals.type = Type;
				res.redirect('/dashboard');
			}).catch((e) => {
				res.status(401).send();
		});
	})
	.catch((e) => console.log('Error', e))
	);
					
});

app.get('/profile', (req,res) => {					//GET /profile will be rendered with profile
	if(typeof req.session.email === 'undefined'){	//or will be redirected if not in session
		res.redirect('/login');
	}
	else{
		if(global.utype === 'Admin'){
			res.redirect('/dashboard');
		}
		else{
			let email = req.session.email;
			Student.find({email:email}).then((student) => {
			res.render('profile',{
			layout:'layout.hbs',
			Uname: email,
			student
			});
		}, () => {
			console.log('Error',e);
		});
		}
	
	}
});

app.get('/dashboard', (req,res) => {
	if(typeof req.session.email === 'undefined'){	//or will be redirected if not in session
		res.redirect('/login');
	}
	else{
		if(global.utype === 'Student'){
			res.redirect('/profile');
		}
		else{
				Student.find().then((students) => {
				res.render('dashboard',{
				students
			});
		}, (e) => {
			console.log('Error',e);
		});
	}
}
	
});

app.post('/dashboard', (req,res,next) => {
	let criteriaVal = req.body.optionV;
	let start = req.body.start;
	let end = req.body.end;
	let branch = req.body.branch;
	
	Student.find({ $and: [ { tenthMarks: { $gte: criteriaVal}}, { twelvthMarks: { $gte: criteriaVal}}, { btechMarks: { $gte: criteriaVal}}, { startyear: { $eq: start}}, { endyear: { $eq: end}}, { course: { $eq: branch}} ]})

		.then((students) => {
			req.students = students;
			next();
		})
		.catch((e) => {
			console.log('Error',e);
		});
}, (req,res,next) => {
	f_students = req.students
	res.send(f_students);
});

app.get('/notices', (req,res) => {
	if(typeof req.session.email === 'undefined'){	
		res.redirect('/login');
	}else{
		Notice.find({}).then((notices) => {
			res.render('notices',{
				title:'Notices',
				notices
			});
		}).catch(
		(e) => console.log(e));
			

	}
});

app.get('/addNotice', (req,res) => {
	if(typeof req.session.email === 'undefined'){	
		res.redirect('/login');
	}
	else{
		res.render('add_notice.hbs');
	}
});

app.post('/addNotice', (req,res,next) => {
	let title = req.body.title;
	let description = req.body.desc;
	let due_date = req.body.due_date;
	let receiver = req.body.target;
	req.title = title;
	req.description = description;

	req.date = due_date;

	var notice = new Notice({
		sender:'CRC',
		receiver:'Students',
		title,
		description,
		due_date
	});

	notice.save().then((notice) =>{
		next();
	}).catch((e) => {
		console.log(e);
	});

}, (req,res,next) => {	
	var studentsEmails = [];
	Student.find({}).then((students) => {
			students.forEach((student) => studentsEmails.push(student.email));
			var transporter = nodemailer.createTransport({
  				service: 'gmail',
  				auth: {
    			user: 'troy0870@gmail.com',
    			pass: process.env.Jello
  				}
			});

			var mailOptions = {
  				from: 'troy@gmail.com',
  				to: studentsEmails,
  				subject: req.title,
  				text: req.description
			};

			transporter.sendMail(mailOptions, function(error, info){
  			if (error) {
    			console.log(error);
  			} 
			});
		}).catch((e) => {
			console.log(e);
		});

		res.redirect('dashboard');
});

app.get('/addStudent',(req,res) => {
	if(typeof req.session.email === 'undefined') {	
		res.redirect('/login');
	}
	else {

		if(req.session.email === 'v@gmail.com') 
				res.render('registration.hbs');
		
		else 
			res.render('profile.hbs');
		
	}
});


app.post('/registration', (req,res,next) => {
	let first_name = req.body.firstname;
	let last_name = req.body.lastname;
	let email = req.body.email;
	let dob = req.body.dob;
	let password = req.body.password;
	let gender = req.body.gender;
	let phone = req.body.mobile_no;
	let tenthMarks = Number(req.body.highschool_marks);
	let twelvthMarks = Number(req.body.Intermediate_marks);
	let btechMarks = Number(req.body.btech_marks);
	let course = req.body.branch;
	let startyear = req.body.startyear;
	let endyear = req.body.endyear;
	let collegeID = req.body.College_id;
	let training_company = req.body.training_company;
	let training_location = req.body.training_location;
	let training_duration = req.body.training_duration;
	let native_place = req.body.native_place;
	req.email = email;
	req.first_name = first_name;

	let resume = req.files.resume;

 
  	resume.mv(__dirname+`/docs/cv_${collegeID}.doc`, function(err) {
    if (err)
      return res.status(500).send(err);

  	 console.log('File uploaded!');
  	});

	dob = dob.split('/');
	dob = dob[1]+'/'+dob[0]+'/'+dob[2];
	console.log(first_name+" "+last_name+" "+training_company+" "+dob+" "+collegeID+" "+course+" ");

	if(tenthMarks<10){
		tenthMarks = tenthMarks*9.5;
	}
	var newStudent = new Student({
		first_name, 
		last_name, 
		email, 
		dob, 
		password, 
		gender, 
		phone, 
		tenthMarks,
		btechMarks,
		twelvthMarks, 
		course, 
		collegeID,
		startyear, 
		endyear,
		training_company, 
		training_duration, 
		training_location,
		native_place
	});

	console.log('Student object created!! ', newStudent);

	newStudent.save().then((student) => {
		console.log('saving!!');
		res.redirect('/dashboard'); 
	}).catch((e) => {
		console.log('Error in saving!!'+e);
	});
}, (req,res,next) => {
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
	  	user: 'troy0870@gmail.com',
	  	pass: process.env.Jello
		}
  	});

  	var mailOptions = {
		from: 'troy0870@gmail.com',
		to: req.email,
		cc: ['troy0870@gmail.com','sweetkumar26.95@gmail.com','nutan110125@gmail.com','17.sarthakagarwal@gmail.com','prerawat005@gmail.com','anil.p@invertis.org','varun.s@invertis.org'],
		subject: 'Thank you for registering with the CRC Department, Invertis University',
		text: `Hey ${req.email}!

			   				Kindly note that your account was successfully created/updated at our end.

			   				PS - This is an auto-generated email. 

			   				Thanks,
			   				Tuhin`
 	 };

  	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
	  		console.log(error);
		}
		res.redirect('/dashboard');		
	});
});  

app.post('/exportFile', (req,res,next) => {
	var students = req.body.fetchedData
	var data='';
	for (var i = 0;i < students.length; i++) {
    	data=data+students[i][0]+'\t'+students[i][1]+'\t'
    		+students[i][2]+'\t'+students[i][3]+'\t'+students[i][4]+'\t'
    		+students[i][5]+'\t'+students[i][6]+'\t'+students[i][7]+'\t'+students[i][8]
    		+'\t'+students[i][9]+'\t'+students[i][10]+'\t'+students[i][11]+'\n';
 	}
	writeFile('studentsRecord.xls',data)
		.then(() => {
			res.send();
		})
		.catch(() => {
			console.log('Error');
		});
	
});

app.get('/exportFile', (req,res) => {
	let file = __dirname+'/studentsRecord.xls';
	res.download(file);
});

app.get('/logout', AuthController.logout);


app.get('/downloadCV/:id', (req,res) => {
	res.download(__dirname+`/docs/cv_${req.params.id}.doc`);
	
}, (req,res) => {
	res.redirect('/dashboard');
});

app.listen(PORT, () => {
	console.log(`Server listening at ${PORT}...`);
});