var Botkit = require('botkit');
var schedule = require('node-schedule');
require('dotenv').config();
var pollFunctions = require('./poll.js');
var adminFunctions = require('./admin.js');
var helper = require('./helpers.js');

if (!process.env.token) {
   console.log('Error: Specify token in environment');
   process.exit(1);
}

var controller = Botkit.slackbot({
   debug: false,
   json_file_store: 'solunch-bot-storage'
});

var bot = controller.spawn({
   token: process.env.token,
   incoming_webhook: {url: process.env['webhook']}
}).startRTM(function(err) {
   if (err) {
      throw new Error(err);
   }
});

var poll = new pollFunctions(controller, bot),
admin = new adminFunctions(controller, bot);

controller.storage.teams.get('admins', function(err, data){
   if (data == null) {
      controller.storage.teams.save({id: 'admins', users: {}});
      console.log("Created admin file");
   }
});

controller.storage.teams.get('options', function(err, data) {
   if (data == null) {
      controller.storage.teams.save({id: 'options', list: {}});
      console.log("Created options file");
   }
});

controller.hears(['are you there'], ['direct_message','direct_mention','mention'], function(bot, message) {
   bot.reply(message,"I'm here!");
});

//*****************************************************************************************************************************//
//                                                          ADMINISTRATION                                                     //
//*****************************************************************************************************************************//
controller.hears('add admin (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (helper.isEmpty(data.users) || data.users[message.user].hasOwnProperty('super')) {
         admin.add(message, data);
      } else {
         bot.reply(message, "Sorry, you are not authorized to add admins.");
      }
   });
});

controller.hears('remove admin (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users[message.user].hasOwnProperty('super')) {
         admin.remove(message, data);
      } else {
         bot.reply(message, "Sorry, you are not authorized to remove admins.");
      }
   });
});

controller.hears('list admins', 'direct_message', function(bot, message) {
   admin.list(message);
});

controller.hears('user status', 'direct_message', function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users.hasOwnProperty(message.user)) {
         poll.userStatus(message);
      } else {
         bot.reply(message, "Sorry, you are not authorized to view this information.");
      }
   });
});

controller.hears('add option (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users.hasOwnProperty(message.user)) {
         poll.addOption(message);
      } else {
         bot.reply(message, "Sorry, you are not authorized to add a poll option.");
      }
   });
});

controller.hears('remove option (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users.hasOwnProperty(message.user)) {
         poll.removeOption(message);
      } else {
         bot.reply(message, "Sorry, you are not authorized to remove a poll option.");
      }
   });
});

//*****************************************************************************************************************************//
//                                                          POLL STUFFS                                                        //
//*****************************************************************************************************************************//
schedule.scheduleJob({hour: 10, minute: 0, dayOfWeek: 4}, function() {
   poll.start();
});

controller.hears('options', 'direct_message', function(bot, message) {
   poll.list(message);
});

controller.hears('start poll', ['direct_mention', 'mention'], function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users.hasOwnProperty(message.user)) {
         poll.start();
      } else {
         bot.reply(message, "Sorry, you are not authorized to launch a poll.");
      }
   });
});

controller.hears('vote (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('pollSave', function(err, data) {
      if (data['status'] === 'open') {
         poll.processVote(message, data);
      } else {
         bot.reply(message, "Sorry, but the poll is now closed. :sleeping:");
      }
   });
});

controller.hears(['close poll', 'end poll', 'stop poll'], ['direct_mention', 'mention'], function(bot, message) {
   controller.storage.teams.get('admins', function(err, data) {
      if (data.users.hasOwnProperty(message.user)) {
         poll.close();
      } else {
         bot.reply(message, "Sorry, you are not authorized to close a poll.");
      }
   });
});

controller.hears('status', 'direct_message', function(bot, message) {
   controller.storage.teams.get('pollSave', function(err, data) {
      poll.status(message, data);
   });
});

//*****************************************************************************************************************************//
//                                                          CHAT STUFFS                                                        //
//*****************************************************************************************************************************//
var commands = "Here is a list of my commands:\n`status`: view the current status of the poll\n`options`: view valid options for voting\n`vote `: submit a vote using the name or number for an option\n";

controller.hears(['hello','hi','hey', 'good day sir'], 'direct_message', function(bot, message) {
   controller.storage.teams.get('users', function(err, user_data) {
      bot.reply(message, "Hey there " + user_data.list[message.user].name.split(" ")[0] + "! " + commands);
   });
});

controller.hears(['help', 'assist', 'assistance'], 'direct_message', function(bot, message) {
   bot.reply(message, commands + "If you need anymore assistance, please contact my creator.");
});

controller.hears('who is your creator', ['direct_message', 'direct_mention'], function(bot, message) {
   bot.reply(message, 'An is my creator!');
});

controller.hears('(.*)', 'direct_message', function(bot, message) {
   bot.reply(message, "Sorry, I don't understand. " + commands);
});
