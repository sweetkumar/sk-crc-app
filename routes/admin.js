/*const express = require('express');
var {mongoose} = require('./../db/mongoose');
var {Student} = require('./../models/studentModel');
const router = express.Router();


router.get('/dashboard', (req,res) => {
	if(typeof req.session.email === 'undefined'){	//or will be redirected if not in session
		res.redirect('./../login');
	}
	else{
		if(global.utype === 'Student'){
			res.redirect('./../student/profile');
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

router.get('/logout', (req,res) => {
	if(typeof req.session.email === 'undefined'){	
		res.redirect('./../login');
	}
	else{
		req.session.destroy();
		res.redirect('./../');
	}
});
module.exports = router;*/