/** 
    This game is based on a telegram game called DERP: Assassination.
    The rules can be seen here: https://drive.google.com/file/d/1Cf7frrCWlBqoG64SVPrLkcMjCPaYcm0x/view?usp=sharing
*/

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const telegram = require('node-telegram-bot-api');
const cron = require('node-cron');
const assign = require('./assign.js');
const message = require('./message.js');
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const mode = 'production'

const token = process.env.TOKEN;
var bot;

if (mode == 'production') {
    bot = new telegram(token, {polling: true});
    // bot.setWebHook('https://lychee-crisp-83672.herokuapp.com/' + token);
}
else {
    bot = new telegram(token, {polling: true});
}

// Declaring ingame phase times.
const PHASE_1_TIME = 30;
const PHASE_2_TIME = 40;
const DEMO_PHASE_1 = 60;
const DEMO_PHASE_2 = 90;

var games = {};

// Listener event whenever a user enters a message in the channel.
bot.on('message', (msg) => {

    // Sets flag if there's an ongoing game on the channel on time of the message.
    var exists = false;
    if (games[`g-${msg.chat.id}`]) {
        exists = true;
    }

    // "/start" listener
    if (msg.text == '/start') {

        // Game can't be played if not group.
        if (msg.chat.type == 'group') {

            // If no ongoing games, start a new one.
            if (!exists) {
                // Initialize current channel game schematic.
                games[`g-${msg.chat.id}`] = {
                    creator_fn: msg.from.first_name,
                    creator_id: msg.from.id,
                    players: {},
                    join_id: 0,
                    join_btn: 0,
                    join_timer: 20,
                    phase_1: PHASE_1_TIME,
                    phase_2: 5,      // set to five at first
                    res_msg: ''
                };

                // Bot sends a message that the game would start. Players can click the join button provided to participate.
                bot.sendMessage(msg.chat.id, `[${msg.from.first_name}](tg://user?id=${msg.from.id}) has *started* a new game! Click the *join* button to play.`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: 'Join',
                                callback_data: 'join'
                            }
                        ]]
                    }
                }).then((m) => {

                    // Initialize participant list.
                    games[`g-${msg.chat.id}`].join_btn = m.message_id;
                    bot.sendMessage(msg.chat.id, `*Player list: 0*\n`, {parse_mode: 'Markdown'}).then((m) => {
                        games[`g-${msg.chat.id}`].join_id = m.message_id;
                    }).then((m) => {

                        // Call the function below to be called in set amount of intervals (Every 5s).
                        games[`g-${msg.chat.id}`].t_join = cron.schedule('*/5 * * * * *', () => {

                            // Bots sends reminder every 60, 30, and 10 seconds remaining.
                            if (games[`g-${msg.chat.id}`].join_timer == 60 || games[`g-${msg.chat.id}`].join_timer == 30 || games[`g-${msg.chat.id}`].join_timer == 10) {
                                bot.sendMessage(msg.chat.id, `*${games[`g-${msg.chat.id}`].join_timer}* seconds left to join!`, {
                                    parse_mode: 'Markdown',
                                    reply_to_message_id: games[`g-${msg.chat.id}`].join_btn
                                }).then((m) => {

                                    // Decrement timer by 5s every call of this function (has 5 seconds call interval)
                                    games[`g-${msg.chat.id}`].join_timer -= 5;
                                });
                            }

                            // Game officially starts when join imer is 0.
                            else if (games[`g-${msg.chat.id}`].join_timer == 0) {

                                // Delete the scheduler. (See line 85)
                                games[`g-${msg.chat.id}`].t_join.destroy();

                                // Delete the join message. (See line 66)
                                bot.editMessageText(`[${games[`g-${msg.chat.id}`].creator_fn}](tg://user?id=${games[`g-${msg.chat.id}`].creator_id}) has *started* a new game! Click the *join* button to play.`, {
                                    parse_mode: 'Markdown',
                                    message_id: games[`g-${msg.chat.id}`].join_btn,
                                    chat_id: msg.chat.id,
                                    reply_markup: {
                                        inline_keyboard: [[]]
                                    }
                                }).then((m) => {

                                    // Informs everyone that time's up.
                                    bot.sendMessage(msg.chat.id, `*Time's up!*`, {
                                        parse_mode: 'Markdown'
                                    }).then((m) => {
                                        
                                        // Get player list
                                        var n_players = Object.keys(games[`g-${msg.chat.id}`].players);
                                        
                                        // Can't start players if less than 2.
                                        if (n_players.length < 2) {
                                            games[`g-${msg.chat.id}`].t_join.destroy();
                                            
                                            // Delete current game.
                                            delete games[`g-${msg.chat.id}`];

                                            // Sends a message to inform everyone that not enough players we're participating.
                                            bot.sendMessage(msg.chat.id, '*Not enough players to start the game!*', {parse_mode: 'Markdown'});
                                        }
                                        else {
                                            games[`g-${msg.chat.id}`].t_join.destroy();

                                            // Sends a message that the game begins.
                                            bot.sendMessage(msg.chat.id, '*A new game begins!* Now transporting agents. Please wait.', {
                                                parse_mode: 'Markdown'
                                            }).then((m) => {
                                                // console.log(games[`g-${msg.chat.id}`].players);

                                                // Assign the players their roles for the game.
                                                var dummy = assign.assign(games[`g-${msg.chat.id}`].players);

                                                // 
                                                begin(dummy, bot, msg.chat.id);
                                            });
                                        }
                                    });
                                });
                            }
                            else {

                                // Decrease time to join by 5s.
                                games[`g-${msg.chat.id}`].join_timer -= 5;
                            }
                        });

                        // Interval begin. (See line 85)
                        games[`g-${msg.chat.id}`].t_join.start();
                    });
                });
            }
            else {

                // Sends a message to inform that a game is ongoing.
                bot.sendMessage(msg.chat.id, `The game is currently in progress!`, {parse_mode: 'Markdown'});
            }
        }
        else {

            // Sends a message to inform that the game can only be played in a group.
            bot.sendMessage(msg.chat.id, 'This can only be played in a group!');
        }
    }

    // Stops the countdown of the incoming game.
    else if (msg.text == '/stop') {
        if (exists) {
            games[`g-${msg.chat.id}`].t_join.destroy();
            bot.editMessageText(`[${games[`g-${msg.chat.id}`].creator_fn}](tg://user?id=${games[`g-${msg.chat.id}`].creator_id}) has *started* a new game! Click the *join* button to enter the village.`, {
                parse_mode: 'Markdown',
                message_id: games[`g-${msg.chat.id}`].join_btn,
                chat_id: msg.chat.id,
                reply_markup: {
                    inline_keyboard: [[]]
                }
            }).then((m) => {
                delete games[`g-${msg.chat.id}`];
                bot.sendMessage(msg.chat.id, `[${msg.from.first_name}](tg://user?id=${msg.from.id}) has *stopped* the game!`, {
                    parse_mode: 'Markdown'
                })
            })
        }
    }   
    // if (msg.text == '/demo') {
    //     bot.sendMessage(msg.chat.id, `Demo assign`, {
    //         parse_mode: 'Markdown'
    //     }).then((m) => {
    //         games[`g-${msg.chat.id}`] = {
    //             creator_fn: msg.from.first_name,
    //             creator_id: msg.from.id,
    //             players: {},
    //             join_id: 0,
    //             join_btn: 0,
    //             join_timer: 90,
    //             phase_1: DEMO_PHASE_1,
    //             phase_2: 5      // set to five at first
    //         };
    //         // games[`g-${msg.chat.id}`].players = assign.assign();
    //         var dummy = assign.assign();
    //         begin(dummy, bot, msg.chat.id);
    //     });
    // }
    // console.log(games);
});

// Listeners when a player clicks a button.
bot.on('callback_query', (Q) => {
    var G = games[`g-${Q.message.chat.id}`];
    var count = Object.keys(G.players).length;

    // Clicked 'join'.
    if (Q.data == 'join') {
        if (!(G.players[`p-${Q.from.id}`]) && count <= 16) {
            G.players[`p-${Q.from.id}`] = {
                fn: Q.from.first_name,
                vip: false,
                see: '0',
                erp: false,
                agt: {},
                alive: true,
                message: '',
                source_m: 0,
                action_s: '',
                action_m: '',
                result_m: '',
                action_b: [],
                source_a: 0,
                attacker: ''
            }

            // Private message the player who joined.
            bot.sendMessage(Q.from.id, `You have succesfully joined the game on *${Q.message.chat.title}*!`, {
                parse_mode: 'Markdown'
            }).then((m) => {

                // Announce on group.
                bot.sendMessage(Q.message.chat.id, `[${Q.from.first_name}](tg://user?id=${Q.from.id}) has joined the game!`, {
                    parse_mode: 'Markdown'
                }).then((m) => {
                    var key = Object.keys(G.players);
                    var str = `*Player list: ${key.length}*\n`

                    for (let i = 0;i < key.length;i++) {
                        str += `[${G.players[key[i]].fn}](tg://user?id=${key[i].slice(2)})\n`;
                    }

                    // Update participant list.
                    bot.editMessageText(str, {
                        parse_mode: 'Markdown',
                        chat_id: Q.message.chat.id,
                        message_id: G.join_id
                    });
                });
                // console.log(G);
            });
        }
    }
    
    // When player chooses to attack a player.
    else if (Q.data == 'attack') {
        var key = Object.keys(G.players);
        var list = [];
        var m_id = 0;

        // Get player list and assign callback codes.
        for (let i = 0;i < key.length;i++) {
            if (Q.from.id != key[i].slice(2)) {
                list.push([{
                    text: G.players[key[i]].fn,
                    callback_data: `attack-${key[i]}`
                }]);
            }
            else {
                m_id = G.players[key[i]].source_a;
            }
        }

        // Displays names of all players that can be attacked.
        bot.editMessageText(`Who do you want to attack?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: list
            },
            chat_id: Q.from.id,
            message_id: G.players[Q.from.id].source_a
        });
    }

    // When player chooses to heal a player.
    else if (Q.data == 'heal') {
        var key = Object.keys(G.players);
        var list = [];
        var m_id = 0;

        // Get player list and assign callback codes.
        for (let i = 0;i < key.length;i++) {
            if (Q.from.id != key[i].slice(2)) {
                list.push([{
                    text: G.players[key[i]].fn,
                    callback_data: `heal-${key[i]}`
                }]);
            }
            else {
                list.push([{
                    text: G.players[key[i]].fn,
                    callback_data: `heal-${key[i]}`
                }]);
                m_id = G.players[key[i]].source_a;
            }
        }

        // Displays names of all players that can be attacked.
        bot.editMessageText(`Who do you want to heal?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: list
            },
            chat_id: Q.from.id,
            message_id: G.players[Q.from.id].source_a
        });
    }

    // Listener if a player attacks another player.
    else if (Q.data.match(/attack-/)) {

        // Save the action.
        G.players[Q.from.id].action_s = Q.data;
        console.log(G.players[Q.from.id]);

        // Inform the player.
        bot.editMessageText(`You have chosen to attack *${G.players[Q.data.slice(7)].fn}*.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[]]
            },
            chat_id: Q.from.id,
            message_id: G.players[Q.from.id].source_a
        })
    }

    // Listener if a player heals another player.
    else if (Q.data.match(/heal-/)) {

        // Save the action.
        G.players[Q.from.id].action_s = Q.data;
        console.log(G.players[Q.from.id]);

        // Inform the player.
        bot.editMessageText(`You have chosen to heal *${G.players[Q.data.slice(5)].fn}*.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[]]
            },
            chat_id: Q.from.id,
            message_id: G.players[Q.from.id].source_a
        })
    }
});

// Function that runs after the game begins.
function begin(dummy, bot, id) {

    // Get the message string to send to all players.
    dummy = message.intro(dummy, bot, id);

    var key = Object.keys(dummy);
    var chain = Promise.resolve();

    // Send messages to all players.
    for (let i = 0;i < key.length;i++) {
        chain = chain.then(function() {
            return bot.sendMessage(key[i].slice(2), `\`${dummy[key[i]].fn}\` ${dummy[key[i]].message}`, {parse_mode: 'Markdown'}).then((m) => {
                dummy[key[i]].source_m = m.message_id;
            });
        });
    }

    games[`g-${id}`].players = dummy;

    chain.then(function() {
        var r = 1;
        var p1 = false;
        
        // Set an interval for the phases of the game.
        games[`g-${id}`].t_phase = cron.schedule('*/5 * * * * *', () => {

            // Todos on phase 1.
            if (p1) {
                games[`g-${id}`].phase_1 -= 5;

                // Todos when phase 1 ends.
                if (games[`g-${id}`].phase_1 == 0) {

                    // Toggle flags.
                    p1 = false;
                    games[`g-${id}`].phase_1 = DEMO_PHASE_1;

                    // Print out the results of phase 1.
                    var key = Object.keys(games[`g-${id}`].players);
                    games[`g-${id}`].players = message.results_player(games[`g-${id}`].players, bot, id);
                    games[`g-${id}`].message = message.results_game(games[`g-${id}`].players, bot, id);

                    var chain = Promise.resolve();

                    // Send players their current information.
                    for (let i = 0;i < key.length;i++) {
                        var P = games[`g-${id}`].players[key[i]];

                        chain = chain.then(function() {
                            return bot.sendMessage(key[i].slice(2), `${P.result_m}`, {
                                parse_mode: 'Markdown',
                            })
                        });
                    }

                    chain.then(function() {
                        bot.sendMessage(id, `${games[`g-${id}`].message}`, {
                            parse_mode: 'Markdown',
                        }).then((m) => {
                            var key = Object.keys(games[`g-${id}`].players);

                            // Set win flags to false.
                            var erp_win = false;
                            var fir_win = false;
                            var vip_alive = false;
                            var erp_alive = false;
                            
                            // Check win conditions.
                            for (let i = 0;i < key.length;i++) {
                                var P = games[`g-${id}`].players[key[i]];

                                // Checks if atleast 1 VIP is alive.
                                if (P.vip && P.alive) {
                                    vip_alive = true;
                                }

                                // Checks if atleast 1 ERP is alive.
                                if (P.erp && P.alive) {
                                    erp_alive = true;    
                                }

                                // If player is dead, delete player from player list.
                                if (!P.alive) {
                                    delete games[`g-${id}`].players[key[i]];
                                }
                            }

                            // If no VIP alive, ERP wins.
                            if (!vip_alive) {
                                erp_win = true;
                            }

                            // If no ERP alive, FIER wins.
                            if (!erp_alive) {
                                fir_win = true;
                            }

                            var chain = Promise.resolve();

                            // If both sides gets the win condition, Then draw.
                            if (erp_win && fir_win) {
                                chain = chain.then(function() {

                                    // Sends draw message.
                                    return bot.sendMessage(id, `\`All vips of *team Fier* and all agents of *team ERP* has been eliminated!\n*DRAW*\n*GAME OVER!*\n`, {
                                        parse_mode: 'Markdown',
                                    }).then((m) => {

                                        // Delete game and destroy timer.
                                        delete games[`g-${id}`];
                                        games[`g-${id}`].t_phase.destroy();
                                    });
                                });
                            }

                            // If ERP wins.
                            else if (erp_win) {
                                chain = chain.then(function() {

                                    // Sends ERP win message.
                                    return bot.sendMessage(id, `\`All vips of *team Fier* has been eliminated!\`\n*TEAM ERP WINS*\n*GAME OVER!*\n`, {
                                        parse_mode: 'Markdown',
                                    }).then((m) => {

                                        // Delete game and destroy timer.
                                        delete games[`g-${id}`];
                                        games[`g-${id}`].t_phase.destroy();
                                    });
                                });
                            }

                            // If FIER wins.
                            else if (fir_win) {
                                chain = chain.then(function() {

                                    // Sends FIER win message.
                                    return bot.sendMessage(id, `\`All agents of *team ERP* has been eliminated!\`\n*TEAM FIER WINS*\n*GAME OVER!*\n`, {
                                        parse_mode: 'Markdown',
                                    }).then((m) => {

                                        // Delete game and destroy timer.
                                        delete games[`g-${id}`];
                                        games[`g-${id}`].t_phase.destroy();
                                    });
                                });
                            }

                            // If no win conditions reached, proceed with the game.
                            else {

                                // Go to phase 2.
                                chain = chain.then(function() {
                                    phase(2, r, id);
                                });
                            }
                        })
                    });
                }
            }

            // Phase 2 todos.
            else {
                games[`g-${id}`].phase_2 -= 5;

                // If phase 2 ends.
                if (games[`g-${id}`].phase_2 == 0) {

                    // Toggle flags.
                    p1 = true;
                    games[`g-${id}`].phase_2 = PHASE_2_TIME;
                    phase(1, r, id);

                    // Send message to all players their current information.
                    games[`g-${id}`].players = message.action(games[`g-${id}`].players, bot, id);
                    var key = Object.keys(games[`g-${id}`].players);

                    var chain = Promise.resolve();

                    // Send to all players the action buttons.
                    for (let i = 0;i < key.length;i++) {
                        chain = chain.then(function() {
                            return bot.sendMessage(key[i].slice(2), `${games[`g-${id}`].players[key[i]].action_m}`, {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    inline_keyboard: [
                                        games[`g-${id}`].players[key[i]].action_b
                                    ]
                                }
                            }).then((m) => {
                                games[`g-${id}`].players[key[i]].source_a = m.message_id;
                            });
                        });
                    }

                    r++;
                }
            }
        });

        // Toggle phase intervals. (Every 5s).
        games[`g-${id}`].t_phase.start();
    });
}

// Bot message handler for different phases.
function phase(n, r, id) {
    if (n == 1) {
        bot.sendMessage(id, `\`Round ${r}\`\n*Phase 1 begins!* You have *${PHASE_1_TIME}* seconds to attack, heal, or use your ability on other players!`, {parse_mode: 'Markdown'});
    }
    else {
        bot.sendMessage(id, `*Phase 2 begins!* You have *${PHASE_2_TIME}* seconds to discuss the results of phase 1 and use your wits to strategize or plan before phase 1 starts again!`, {parse_mode: 'Markdown'});
    }
}

module.exports = bot;

// [inline URL](tg://user?id=123456789)
// var telegram_url = "https://api.telegram.com/bot887519868:AAGyrXr3TPUpJdq3-ciLMR8bJK384NzQ-oE/sendMessage";
// curl -F "url=https://sleepy-everglades-75208.herokuapp.com/" https://api.telegram.org/bot887519868:AAGyrXr3TPUpJdq3-ciLMR8bJK384NzQ-oE/setWebhook