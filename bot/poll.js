var helper = require('./helpers.js');

function poll(controller, bot) {
   var self = this;

   this.start = function (message) {
      var date = new Date(),
      team = {id: 'users', list:{}};
      controller.storage.teams.get('settings', function(err, data) {
         if (helper.isEmpty(data.options)) {
            bot.reply(message, "You should probably add options to vote for before you start the poll!");
            return;
         }
         var optionsSave = {},
         optionsList = '',
         num = 1;
         for (var option in data.options) {
            optionsSave[num] = {name: data.options[option].name, count: 0};
            optionsList = optionsList.concat("\n" + num + ") " + data.options[option].name);
            num++;
         }
         controller.storage.teams.save(
         {
            id: 'pollSave',
            date: date.getMonth() + "-" + date.getDate(),
            status: 'open',
            options: optionsSave,
            users: {}
         });

         bot.say(
            {
               text: "The lunch poll is now open!\nSolunch_bot should have sent you a message. If not, open a direct message with the bot to submit a vote.\nThe poll will automatically close in 2 hours. :timer_clock:",
               channel: data.channel
            }
         );

         bot.api.users.list({}, function(err, response) {
            controller.storage.teams.get('pollSave', function(err, data) {
               msgUsers(response, data, optionsList);
               controller.storage.teams.save(data);
            });
         });

         setTimeout(function() {
            controller.storage.teams.get('pollSave', function(err, data) {
               if (data['status'] === 'open') {
                  self.close();
               }
            });
         }, 2 * 3600000);
      });

      msgUsers = function(res, data, options) {
         for (var i = 0; i < res.members.length; i++) {
            if (res.members[i].deleted == false && res.members[i].is_bot == false && res.members[i].name !== "slackbot") {
               data.users[res.members[i].id] = {name: res.members[i].real_name, vote: ''};
               bot.startPrivateConversation({'user': res.members[i].id}, function(err, convo) {
                  convo.say("Hey! It's time to submit your vote for Friday's lunch!\n*Here are the poll options:*" + options + "\nWhenever you're ready, submit a vote by typing `vote` and then the name or number of an option. Ask for help if you need more assistance!");
                  convo.next();
               });
            }
         }
      }
   }

   this.close = function (message, dm) {
      controller.storage.teams.get('pollSave', function(err, pollData) {
         if (err || pollData.status === 'closed') {
            bot.reply(message, "There is no open poll!");
            return;
         } else if(dm) {
            bot.reply(message, "Closing poll...");
         }
         controller.storage.teams.get('settings', function(err, data) {
            pollData['status'] = 'closed';
            var winner = winningOption(pollData);
            pollData['winner'] = winner['name'][0];
            bot.say(
               {
                  text: "The lunch poll is now closed.\n:tada: The winner is *" + winner['name'][0] + "* with " + winner['votes'] + " votes! :tada:",
                  channel: data.channel
               }
            );
            controller.storage.teams.save(pollData);
         });
      });
   }

   this.processVote = function(message, data) {
      var vote = message.match[1];
      if (isNaN(parseInt(vote)) == false) {
         if (data.options.hasOwnProperty(vote)) {
            submit(message, data, vote);
         } else {
            bot.reply(message, "Sorry, that is not an option. Type `options` to see valid numbers for voting.");
         }
      } else {
         var valid = false;
         for (var option in data.options) {
            if (vote === data.options[option].name.toLowerCase()) {
               submit(message, data, option);
               valid = true;
            }
         }
         if (valid == false) {
            bot.reply(message, "Sorry, that is not an option. Type `options` to see valid options or make sure that your spelling is correct.");
         }
      }
   }

   submit = function (message, data, vote) {
         var name = data.users[message.user].name;
         if (data.users[message.user].vote !== '') {
            var previousVote = data.users[message.user].vote;
            data.options[previousVote].count--;
            data.options[vote].count++;
            bot.reply(message, "Thanks for revoting, " + name.split(" ")[0] +". You previously voted for: *" + data.options[previousVote].name +
               "*\nYour current vote is: *" + data.options[vote].name +
               "*\nVote again if you wish, I won't judge your indecisiveness! :wizard:");
         } else {
            data.options[vote].count++;
            bot.reply(message, "Thanks for voting, " + name.split(" ")[0] + ". You voted for: *" + data.options[vote].name +
               "*\nFeel free to vote again to change your vote. To see more commands, ask for help!");
         }
         data.users[message.user].vote = vote;
         controller.storage.teams.save(data);
   }

   this.list = function (message) {
      controller.storage.teams.get('settings', function(err, data) {
         if (helper.isEmpty(data.options)) {
            bot.reply(message, "There are currently no options.");
            return;
         }
         var options = '',
         num = 1;
         for (var option in data.options) {
            options = options.concat("\n" + num + ") " + data.options[option].name);
            num++;
         }
         bot.reply(message, "*Here are the poll options:*" + options);
      });
   }

   this.status = function(message, data) {
      var results = '',
      sortedOptions = [],
      status = 'Poll status: *' + data['status'] + '*',
      winning = winningOption(data);

      for (var option in data.options) {
         data.options[option].number = option;
         sortedOptions.push(data.options[option]);
      }
      sortedOptions.sort(function(a, b) {
         return b.count - a.count;
      });
      for (var i = 0; i < sortedOptions.length; i++) {
         results = results.concat("\n" + sortedOptions[i].number + ") " + sortedOptions[i].name + ": " + sortedOptions[i].count);
      }

      if (data.status === 'closed') {
         status = status.concat("\nWinner: *" + data['winner'] + "*");
      } else {
         status = status.concat("\nCurrently in the lead: *" + winning['name'] + "*");
      }
      bot.reply(message, {text: status + '\n*Here are the current results:* ' + results});
   }

   this.setChannel = function(message, data) {
      if (message.match[1][0] == "<" && message.match[1][1] == "#"){
         var channel = message.match[1].split('<')[1].split('#')[1].split('>')[0];
         if (data.channel === channel) {
            bot.reply(message, "That channel has already been set as the poll announcement channel!");
         } else {
            data.channel = channel;
            controller.storage.teams.save(data, function(err, id) {
               bot.reply(message, "Successfully saved poll announcement channel.");
            });
         }
      } else {
         bot.reply(message, "Sorry, but that is not a valid channel. Use Slack's #channel to select a channel to use for poll announcements.");
      }
   }

   this.userStatus = function(message) {
      var notAttend = '', noAnswer = '';
      controller.storage.teams.get('pollSave', function(err, data) {
         if (err) {
            bot.reply(message, "There is no poll open to view the user status of.");
            return;
         }
         for (var id in data.users) {
            var name = data.users[id].name.split(" ");
            if (data.users[id].vote === '' && noAnswer === '') {
               noAnswer = name[0] + " " + name[1][0] + ".";
            } else if(data.users[id].vote === '') {
               noAnswer = noAnswer.concat(", " + name[0] + " " + name[1][0] + ".");
            }
         }
         bot.reply(message, "*Here are the users that have not voted:*\n" + noAnswer);
      });
   }

   this.addOption = function (message, data) {
         if (helper.isEmpty(data.options)) {
            data.options['1'] = {name: message.match[1]};
            saveOption(message, data, 'added');
         } else {
            var addOption = message.match[1].toLowerCase(),
            dup = false;
            for (var option in data.options) {
               if (addOption === data.options[option].name.toLowerCase()) {
                  dup = true;
                  bot.reply(message, "*" + message.match[1] + "* has already been added!");
                  break;
               }
            }
            if (!dup) {
               var highest = Object.keys(data.options).pop();
               highest = parseInt(highest) + 1;
               data.options[highest.toString()] = {name: message.match[1]};
               saveOption(message, data, 'added');
            }
         }
   }

   this.removeOption = function (message, data) {
         var remOption = message.match[1].toLowerCase(),
         deleted = false;
         for (var option in data.options) {
            if (remOption === data.options[option].name.toLowerCase()) {
               delete data.options[option];
               deleted = true;
            }
         }
         if (deleted) {
            saveOption(message, data, 'removed');
         } else {
            bot.reply(message, "Sorry, but I couldn't find *" + message.match[1] + "* in the list of poll options.");
         }
   }

   saveOption = function(message, data, action) {
      controller.storage.teams.save(data, function(err, id) {
         bot.reply(message, "Successfully " + action + " *" + message.match[1] + "*.");
         self.list(message);
      });
   }
}

winningOption = function(data) {
   var winner = {name: [''], votes: 0};
   for (var option in data.options) {
      if (data.options[option].count > winner.votes) {
         winner = {name: [data.options[option].name], votes: data.options[option].count};
      } else if(data.options[option].count == winner.votes) {
         winner['name'].push(data.options[option].name);
      }
   }
   helper.shuffleArray(winner['name']);
   return winner;
}

module.exports = poll;
