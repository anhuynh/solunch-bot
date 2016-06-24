var helper = require('./helpers.js');

function poll(controller, bot) {
   var self = this;

   this.start = function () {
      var date = new Date(),
      team = {id: 'users', list:{}};
      controller.storage.teams.get('settings', function(err, data) {
         if (helper.isEmpty(data.options)) {
            bot.sendWebhook({text: "You should probably add options to vote for before you start the poll!"});
            return;
         }
         var optionsList = {},
         num = 1;
         for (var option in data.options) {
            optionsList[num] = {name: data.options[option].name, count: 0};
            num++;
         }
         controller.storage.teams.save(
         {
            id: 'pollSave',
            date: date.getMonth() + "-" + date.getDate(),
            status: 'open',
            options: optionsList
         });

         bot.sendWebhook({text: "The lunch poll is now open!\nSolunch_bot should have sent you a message. If not, open a direct message with the bot to submit a vote.\nThe poll will automatically close in 2 hours. :timer_clock:"});

         bot.api.users.list({}, function(err, response) {
            controller.storage.teams.get('settings', function(err, data) {
               var options = '',
               num = 1;
               for (var option in data.options) {
                  options = options.concat("\n" + num + ") " + data.options[option].name);
                  num++;
               }
               msgUsers(response, options);
            });
            controller.storage.teams.save(team);
         });

         setTimeout(function() {
            controller.storage.teams.get('pollSave', function(err, data) {
               if (data['status'] === 'open') {
                  self.close();
               }
            });
         }, 2 * 3600000);
      });

      msgUsers = function(res, options) {
         for (var i = 0; i < res.members.length; i++) {
            if (res.members[i].deleted == false && res.members[i].is_bot == false && res.members[i].name !== "slackbot") {
               team.list[res.members[i].id] = {name: res.members[i].real_name, vote: ''};
               bot.startPrivateConversation({'user': res.members[i].id}, function(err, convo) {
                  convo.say("Hey! It's time to submit your vote for Friday's lunch!\n*Here are the poll options:*" + options + "\nWhenever you're ready, submit a vote by typing `vote` and then the name or number of an option. Ask for help if you need more assistance!");
                  convo.next();
               });
            }
         }
      }
   }

   this.close = function (data) {
      controller.storage.teams.get('pollSave', function(err, data) {
         if (err || data.status === 'closed') {
            bot.reply(message, "There is no open poll!");
            return;
         }
         data['status'] = 'closed';
         var winner = winningOption(data);
         data['winner'] = winner['name'][0];
         bot.sendWebhook({text: "The lunch poll is now closed.\n:tada: The winner is *" + winner['name'][0] + "* with " + winner['votes'] + " votes! :tada:"});
         controller.storage.teams.save(data);
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
      controller.storage.teams.get('users', function(err, user_data) {
         var name = user_data.list[message.user].name;
         if (user_data.list[message.user].vote !== '') {
            var previousVote = user_data.list[message.user].vote;
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
         user_data.list[message.user].vote = vote;
         controller.storage.teams.save(data);
         controller.storage.teams.save(user_data);
      });
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

   this.userStatus = function(message) {
      var notAttend = '', noAnswer = '';
      controller.storage.teams.get('users', function(err, data) {
         if (err) {
            bot.reply(message, "There is no poll open to view the user status of.");
            return;
         }
         for (var id in data.list) {
            var name = data.list[id].name.split(" ");
            if (data.list[id].vote === '' && noAnswer === '') {
               noAnswer = name[0] + " " + name[1][0] + ".";
            } else if(data.list[id].vote === '') {
               noAnswer = noAnswer.concat(", " + name[0] + " " + name[1][0] + ".");
            }
         }
         bot.reply(message, "*Here are the users that have not voted:*\n" + noAnswer);
      });
   }

   this.addOption = function (message, data) {
         if (helper.isEmpty(data.options)) {
            data.options['1'] = {name: message.match[1]};
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
            }
         }
         controller.storage.teams.save(data, function(err, id) {
            bot.reply(message, "Successfully saved *" + message.match[1] + "* as a poll option.");
            self.list(message);
         });
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
            controller.storage.teams.save(data, function(err, id) {
               bot.reply(message, "Successfully deleted *" + message.match[1] + "* from poll options.");
               self.list(message);
            });
         } else {
            bot.reply(message, "Sorry, but I couldn't find *" + message.match[1] + "* in the list of poll options.");
         }
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
