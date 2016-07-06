# Solunch Bot

A bot designed for Solink's Slack team to handle lunch polls.

## Installation & Deployment

Clone this repository then head into the directory and use `npm install` to install all the necessary dependancies.

You will need to get a [bot token for Slack](https://my.slack.com/services/new/bot).

Go into the bot folder and create a new .env file. In the file, insert the following lines:
```
token={YOUR BOT TOKEN}
```

Then to deploy the bot, run:
```
node solunch-bot.js
```

### Deploy Indefinitely

If you would like to leave the bot running indefinitely, install the Forever node package:
```
npm install -g forever
```

When you're ready to run the bot, you can run the command:
```
forever start solunch-bot.js
```

To stop the bot:
```
forever stop solunch-bot.js
```

## First Deployment

When you first deploy the bot, you will need to grant yourself admin priviledges. Open a DM with the bot and send a message using this command:
```
add admin @{YOUR USERNAME}
```

Note that if you want to add yourself as an admin, you won't be able to use autocomplete from Slack's @mentions. **You have to type out your full username.** The very first user that is added as an admin will be given the **super** admin property. The super admin is the only user that will be able to add and remove admins.

A channel also needs to be set for poll announcements. Use this command:
```
set channel #{CHANNEL}
```

This will allow the bot to make announcements when the poll starts and closes in the specified channel.

Lastly, use `add option {OPTION}` and `remove option {OPTION}` to modify the list of options for users to vote from before starting the poll.

## List of Commands

### Administrative Commands

**The following must be direct messaged to the bot:**

`add admin @{USERNAME}`: Adds the user as an admin (**super admin only**).

`remove admin @{USERNAME}`: Removes admin priviledges from the user (**super admin only**).

`list admins`: Gives a list of current admins.

`user status`: Lists the users that have not answered the poll.

`set channel #{CHANNEL}`: Sets the specified channel as the announcment location for the poll starts and closes.

### Poll Commands

**The folowing can be used in the channel that the bot is in by direct mentioning the bot before the command or by direct messaging the bot:**

`start poll`, `begin poll`, `open poll`: Launches the lunch poll which will have the bot direct message all users (**admins only**).

`close poll`, `end poll`, `stop poll`: Closes the poll and announces the winner (**admins only**).

**The following must be direct messaged to the bot.**

`add option {OPTION}`: Adds an option to the list. Capitalize the option as you would want to see it on the list (**admins only**).

`remove option {OPTION}`: Removes an option from the list. Spelling matters but capitalization does not (**admins only**).

`options`: View a list of the poll options and numbers to vote for.

`status`: View the current status of the poll.

`vote {CHOICE}`: Submit a vote using the number or name of corresponding option.

`help`: View a list of available poll commands.
