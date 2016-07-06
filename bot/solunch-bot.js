var Botkit = require('botkit');
var schedule = require('node-schedule');
require('dotenv').config();
var pollFunctions = require('./poll.js');
var adminFunctions = require('./admin.js');
var helper = require('./helpers.js');
var scheduler = true,
scheduleTime = {day: 4, hour: 10, minute: 30};

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

controller.storage.teams.get('settings', function(err, data){
   if (data == null) {
      controller.storage.teams.save({id: 'settings', admins: {}, options: {}});
      console.log("Created settings file");
   }
});

controller.hears(['are you there'], ['direct_message','direct_mention','mention'], function(bot, message) {
   bot.reply(message,"I'm here!");
});

//*****************************************************************************************************************************//
//                                                          ADMINISTRATION                                                     //
//*****************************************************************************************************************************//
controller.hears('add admin (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (helper.isEmpty(data.admins) || data.admins[message.user].hasOwnProperty('super')) {
         admin.add(message, data);
      } else {
         bot.reply(message, "Sorry, you are not authorized to add admins.");
      }
   });
});

controller.hears('remove admin (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins[message.user].hasOwnProperty('super')) {
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
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         poll.userStatus(message);
      } else {
         bot.reply(message, "Sorry, you are not authorized to view this information.");
      }
   });
});

controller.hears('add option (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         poll.addOption(message, data);
      } else {
         bot.reply(message, "Sorry, you are not authorized to add a poll option.");
      }
   });
});

controller.hears('remove option (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         poll.removeOption(message, data);
      } else {
         bot.reply(message, "Sorry, you are not authorized to remove a poll option.");
      }
   });
});

controller.hears('cancel poll', 'direct_message', function(bot, message) {
   var date = new Date();
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         if (date.getDay() == scheduleTime.day && date.getHours() <= scheduleTime.hour && date.getMinutes() < scheduleTime.minute) {
            scheduler = false;
            bot.reply(message, "The poll scheduled today is now cancelled. The poll will run as normal next week.");
            setTimeout(function() {
               scheduler = true;
            }, 24 * 3600000);
         } else {
            bot.reply(message, "The poll is not scheduled for today.");
         }
      } else {
         bot.reply(message, "Sorry, you are not authorized to cancel the poll.");
      }
   });
});

//*****************************************************************************************************************************//
//                                                          POLL STUFFS                                                        //
//*****************************************************************************************************************************//
schedule.scheduleJob({hour: scheduleTime.hour, minute: scheduleTime.minute, dayOfWeek: scheduleTime.day}, function() {
   if (scheduler) {
      poll.start();
   }
});

controller.hears('options', 'direct_message', function(bot, message) {
   poll.list(message);
});

controller.hears('start poll', ['direct_mention', 'mention', 'direct_message'], function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         controller.storage.teams.get('pollSave', function(err, pollData) {
            if (pollData == null || pollData.status === 'closed') {
               poll.start(message);
            } else {
               bot.startConversation(message, function(err, convo) {
                  convo.ask("The poll is already open. If you start a new one, the data from the previous poll will be reset! Are you sure you want to start a new poll?", [
                     {
                        pattern: bot.utterances.yes,
                        callback: function(response, convo) {
                           poll.start();
                           convo.next();
                        }
                     },
                     {
                        pattern: bot.utterances.no,
                        callback: function(response, convo){
                           convo.say("Ok, the current poll is still running.");
                           convo.next();
                        }
                     }
                  ]);
               });
            }
         });
      } else {
         bot.reply(message, "Sorry, you are not authorized to launch a poll.");
      }
   });
});

controller.hears('vote (.*)', 'direct_message', function(bot, message) {
   controller.storage.teams.get('pollSave', function(err, data) {
      if (err || data.status === 'closed') {
         bot.reply(message, "Sorry, but the poll is closed. :sleeping:");
      } else {
         poll.processVote(message, data);
      }
   });
});

controller.hears(['close poll', 'end poll', 'stop poll'], 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         poll.close(message, true);
      } else {
         bot.reply(message, "Sorry, you are not authorized to close a poll.");
      }
   });
});

controller.hears(['close poll', 'end poll', 'stop poll'], ['direct_mention', 'mention'], function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      if (data.admins.hasOwnProperty(message.user)) {
         poll.close(message);
      } else {
         bot.reply(message, "Sorry, you are not authorized to close a poll.");
      }
   });
});

controller.hears('status', 'direct_message', function(bot, message) {
   controller.storage.teams.get('pollSave', function(err, data) {
      if (err) {
         bot.reply(message, "Sorry, there is no poll to view the status of.");
      } else {
         poll.status(message, data);
      }
   });
});

//*****************************************************************************************************************************//
//                                                          CHAT STUFFS                                                        //
//*****************************************************************************************************************************//
controller.hears(['hello','hi','hey', 'good day sir'], 'direct_message', function(bot, message) {
   bot.api.users.info({user: message.user}, function(err, response) {
      bot.reply(message, helper.random('greetings') + response.user.profile.first_name + "!");
   });
});

controller.hears(['help', 'assist', 'assistance'], 'direct_message', function(bot, message) {
   controller.storage.teams.get('settings', function(err, data) {
      var commands = "Here is a list of my commands:\n`status`: view the current status of the poll\n`options`: view valid options for voting\n`vote `: submit a vote using the name or number for an option\n";
      if (data.admins.hasOwnProperty(message.user)) {
         commands = commands.concat("\n*Admin Commands*:\n");
         if (data.admins[message.user].hasOwnProperty('super')) {
            commands = commands.concat("`add admin @user`: grant admin priviledges to the user\n`remove admin @user`: revoke admin priviledges from user\n");
         }
         commands = commands.concat("`list admins`: gives list of current admins\n`user status`: lists users that have not voted yet in the poll\n`start poll`: starts a new poll\n`close poll, end poll or stop poll`: closes current poll\n`add option <option>`: adds option to the list of options (uses capitalization from the typed option)\n`remove option <option>`: removes option from list of options (capitalization doesn't matter)\n");
      }
      bot.reply(message, commands + "If you need anymore assistance, please contact my creator.");
   });
});

controller.hears('who is your creator', ['direct_message', 'direct_mention'], function(bot, message) {
   bot.reply(message, 'An is my creator!');
});

controller.hears('joke', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
   bot.reply(message, helper.random('jokes'));
});

controller.hears('(.*)', 'direct_message', function(bot, message) {
   bot.reply(message, "Sorry, but I'm not much of a conversationalist. Ask for help if you want a list of my commands!");
});
