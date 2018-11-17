var get_login = (req,res) => {
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
}

var post_login = (req,res) => {		
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
					
}

var logout = (req,res) => {
	if(typeof req.session.email === 'undefined'){	
		res.redirect('/login');
	}
	else{  
		req.session.destroy();
		res.redirect('/');
	}
}

module.exports = {
	get_login,
	post_login,
	logout
}