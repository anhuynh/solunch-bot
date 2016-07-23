var helper = require('./helpers.js');

function admins(controller, bot) {
	var self = this;

	this.add = function(message, data) {
		if (message.match[1][0] == "<" && message.match[1][1] == "@"){
		   var addUser = message.match[1].split('<')[1].split('@')[1].split('>')[0];
		   if (data.admins.hasOwnProperty(addUser)) {
		      bot.reply(message, "That user is already an admin!");
		   } else {
		      bot.api.users.info({user: addUser}, function(err, response) {
		         if (helper.isEmpty(data.admins)) {
		            data.admins[addUser] = {name: response.user.real_name, super: true};
		         } else {
		            data.admins[addUser] = {name: response.user.real_name};
		         }
		         controller.storage.teams.save(data, function(err, id) {
		            bot.reply(message, "Successfully added new admin.");
		            self.list(message);
		         });
		      });
		   }
		} else {
		   bot.reply(message, "Sorry, but that is not a valid username. Use Slack's @mention to select a user to add as an admin.");
		}
	}

	this.remove = function(message, data) {
		if (message.match[1][0] == "<" && message.match[1][1] == "@"){
		   var remUser = message.match[1].split('<')[1].split('@')[1].split('>')[0];
		   if (data.admins.hasOwnProperty(message.user)) {
		      delete data.admins[remUser];
		      controller.storage.teams.save(data, function(err, id) {
		         bot.reply(message, "Successfully removed admin.");
		         self.list(message);
		      });
		   } else {
		      bot.reply(message, "That user is not an admin.");
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
		      var userList = '';
		      for (var id in data.admins) {
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

	this.userAttendance = function() {
		var date = new Date(),
		month = date.getMonth() + 1;
		date = month + "-" + date.getDate();
		var team = {id: 'users', date: date, num: 0, list:{}};
		bot.api.users.list({}, function(err, response) {
			for (var i = 0; i < response.members.length; i++) {
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
		var notAttend = '', noAnswer = '', attendance = '', answers = '';
		controller.storage.teams.get('users', function(err, data) {
			if (err) {
				bot.reply(message, "There is not attendance.");
				return;
			}
			for (var id in data.list) {
				var name = data.list[id].name.split(" ");
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
