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
}

module.exports = admins;
