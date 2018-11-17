const express = require('express');
const fs = require('fs');
const router = express.Router();
const{pushUsersArray} = require('./../utils/users');
var {mongoose} = require('./../db/mongoose');
var {Student} = require('./../models/studentModel');



/*router.get('/register/:UID', (req,res) => {
	res.render('register');
});

router.post('/register/:UID', (req,res) => {
	let UID = req.params.UID;
	let collegeID = req.body.cid;
	let rollNO = req.body.roll;
	let tenthMarks = Number(req.body.tenthMarks);
	let twelvthMarks = req.body.twelvthMarks;

	if(tenthMarks<10){
		tenthMarks = tenthMarks*9.5;
	}
	
	Student.findOneAndUpdate(
		{_id: UID}, 
		{$set:{collegeID,rollNO,tenthMarks,twelvthMarks}}, 
		{new: true}, (err, doc) => {
    if(err){
        console.log("Something wrong while updating data!");
    }
    res.redirect('../../');
});

});

router.get('/profile', (req,res) => {					//GET /profile will be rendered with profile
	if(typeof req.session.email === 'undefined'){	//or will be redirected if not in session
		res.redirect('./../login');
	}
	else{
		if(global.utype === 'Admin'){
			res.redirect('./../admin/dashboard');
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

router.get('/logout', (req,res) => {
	if(typeof req.session.email === 'undefined'){	
		res.redirect('./../login');
	}
	else{
		req.session.destroy();
		res.redirect('./../');
	}
});
*/
module.exports = router;