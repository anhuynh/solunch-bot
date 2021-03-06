const helper = require('./helpers.js');

function admins(controller, bot) {
	const self = this;

	this.add = function(message, data) {
		if (message.match[1].indexOf('<@') === 0){
		   const addUser = message.match[1].replace('<', '').replace('@', '').replace('>', '');
		   if (data.admins.hasOwnProperty(addUser)) {
		      bot.reply(message, message.match[1] + " is already an admin!");
		   } else {
		      bot.api.users.info({user: addUser}, function(err, response) {
		         if (helper.isEmpty(data.admins)) {
		            data.admins[addUser] = {name: response.user.real_name, super: true};
		         } else {
		            data.admins[addUser] = {name: response.user.real_name};
		         }
		         controller.storage.teams.save(data, function(err, id) {
		            bot.reply(message, "Successfully added " + message.match[1] + " as an admin.");
		            self.list(message);
		         });
		      });
		   }
		} else {
		   bot.reply(message, "Sorry, but that is not a valid username. Use Slack's @mention to select a user to add as an admin.");
		}
	}

	this.remove = function(message, data) {
		if (message.match[1].indexOf('<@') === 0){
		   const remUser = message.match[1].replace('<', '').replace('@', '').replace('>', '');
		   if (data.admins.hasOwnProperty(remUser)) {
		      delete data.admins[remUser];
		      controller.storage.teams.save(data, function(err, id) {
		         bot.reply(message, "Successfully removed " + message.match[1] + " from admins.");
		         self.list(message);
		      });
		   } else {
		      bot.reply(message, message.match[1] + " is not an admin.");
		   }
		} else {
		   bot.reply(message, "Sorry, but that is not a valid username. Use Slack's @mention to select a user to remove admin priviledges.");
		}
	}

	this.list = function(message) {
		controller.storage.teams.get('settings', function(err, data) {
			if (helper.isEmpty(data.admins)) {
				bot.reply(message, "There are currently no admins.");
				return;
			} else if (data.admins.hasOwnProperty(message.user)) {
		      let userList = '';
		      for (let id in data.admins) {
		         if (userList === '') {
		            userList = data.admins[id].name;
		         } else {
		            userList = userList.concat(", " + data.admins[id].name);
		         }
		      }
		      bot.reply(message, "*Here is the list of admins:*\n" + userList);
		   } else {
		      bot.reply(message, "Sorry, you are not authorized to view admins.");
		   }
		});
	}

	this.getAttendance = function(message) {
		const date = new Date(),
		month = date.getMonth() + 1;
		day = date.getDate();
		let team = {id: 'users', date: month + "-" + day, num: 0, list:{}};
		controller.storage.teams.get('users', function(err, data) {
			if (data) {
				let month2 = data.date.split("-")[0],
				day2 = data.date.split("-")[1];
				if (month2 == month && day2 == day) {
					bot.startConversation(message, function(err, convo) {
						convo.ask("You've already taken lunch attendance today. Are you sure you want to do it again?", [
							{
								pattern: bot.utterances.yes,
								callback: function(response, convo) {
									convo.say("Messaging users...");
									msgUsers(team);
									convo.next();
								}
							},
							{
								pattern: bot.utterances.no,
								callback: function(response, convo){
									convo.say("Okay.");
									convo.next();
								}
							}
						]);
					});
				} else {
					msgUsers(team);
				}
			} else {
				msgUsers(team);
			}
		});
	}

	msgUsers = function (team) {
		bot.api.users.list({}, function(err, response) {
			for (let i = 0; i < response.members.length; i++) {
				if (response.members[i].deleted == false && response.members[i].is_bot == false && response.members[i].name !== "slackbot") {
					team.list[response.members[i].id] = {name: response.members[i].real_name, answered: false, attending: true};
					bot.startPrivateConversation({'user': response.members[i].id}, function(err, convo) {
						convo.ask("Hey! Will you be joining us for lunch tomorrow?", [
							{
								pattern: bot.utterances.yes,
								callback: function(response, convo) {
									convo.say("Awesome!");
									controller.storage.teams.get('users', function(err, data) {
										data.list[response.user].answered = true;
										data.num++;
										controller.storage.teams.save(data);
									});
									convo.next();
								}
							},
							{
								pattern: bot.utterances.no,
								callback: function(response, convo){
									convo.say("Aw, ok :slightly_frowning_face:\nHave a great day!");
									controller.storage.teams.get('users', function(err, data) {
										data.list[response.user].attending = false;
										data.list[response.user].answered = true;
										controller.storage.teams.save(data);
									});
									convo.next();
								}
							}
						]);
					});
				}
			}
			controller.storage.teams.save(team);
		});
	}

	this.attendanceList = function (message) {
		let notAttend = '', noAnswer = '', attendance = '', answers = '';
		controller.storage.teams.get('users', function(err, data) {
			if (err) {
				bot.reply(message, "There is not attendance.");
				return;
			}
			for (let id in data.list) {
				let name = data.list[id].name.split(" ");
				if (data.list[id].attending == false) {
					if (notAttend === '') {
						notAttend = name[0] + " " + name[1][0] + ".";
					} else {
						notAttend = notAttend.concat(", " + name[0] + " " + name[1][0] + ".");
					}
				} else if (data.list[id].answered == false) {
					if (noAnswer === '') {
						noAnswer = name[0] + " " + name[1][0] + ".";
					} else {
						noAnswer = noAnswer.concat(", " + name[0] + " " + name[1][0] + ".");
					}
				}
			};
			if (notAttend !== '') {
				attendance = "\n*Here are the users that will not be attending:*\n" + notAttend;
			}
			if (noAnswer !== '') {
				answers = "\n*Here are the users that have not answered:*\n" + noAnswer;
			}
			bot.reply(message, "*Date:* " + data.date + attendance + answers + "\n*Total attending:* " + data.num);
		});
	}
}

module.exports = admins;
