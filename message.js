const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const telegram = require('node-telegram-bot-api');
const cron = require('node-cron');
const assign = require('./assign.js');
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

module.exports.intro = function(players, bot, id) {
  // console.log(players);
  
  // Initialize strings.

  var erp_message = `you are an *ERP Agent*!\n*Mission objective:* \`Eliminate all VIP Fier Agents.\`\n*Alive ERP Agents:* `;

  var vip_message = `you are a *VIP FIER Agent*!\n*Mission objective*: \`Keep yourself alive and eliminate all ERP Agents.\`\n`;

  var fir_message = `you are a *FIER Agent*!\n*Mission objective*: \`Keep FIER VIP alive and eliminate all ERP Agents.\`\n`;
  
  var key = Object.keys(players);
  var vip_count = 0;

  // Send messages to players depending on their roles.

  // If ERP, add this message format.
  for (let i = 0;i < key.length;i++) {
    if (players[key[i]].erp) {
      erp_message += `*${players[key[i]].fn}*, `;
    }
  }

  // If ERP, add this message format.
  erp_message = erp_message.slice(0, erp_message.length - 2);
  erp_message += '\n';

  for (let i = 0;i < key.length;i++) {
    
    // Assign ERP message for ERPs.
    if (players[key[i]].erp) {
      players[key[i]].message = erp_message;
    }

    // Assign VIP message for VIPs.
    else if (players[key[i]].vip) {
      players[key[i]].message = vip_message;

      // If player has 'see', inform them. (See assign.js line 268)
      if (players[key[i]].see != '0') {
        players[key[i]].message += `You know that *${players[key[i]].see}* is a *FIER VIP*\n`;
      }
    }

    // Assign FIER message for FIERs.
    else {
      players[key[i]].message = fir_message;

      // If player has 'see', inform them. (See assign.js line 268)
      if (players[key[i]].see != '0') {
        players[key[i]].message += `You know that *${players[key[i]].see}* is a *FIER VIP*\n`;
      }
    }

    // Display their corresponding agent information.

    players[key[i]].message += `*----------------------------------------*\n`;

    let agt_name = Object.keys(players[key[i]].agt);
    let agent = players[key[i]].agt[agt_name];
    players[key[i]].message += `*Agent*: \`${agt_name}\`\n*Class*: \`${agent.class}\`\n`;
    players[key[i]].message += `*Ability*: \`${agent.ability}\`\n*Ability cooldown*: \`${agent.cd} turns\`\n`;
    players[key[i]].message += `*Health*: \`${agent.hp}/${agent.hp}\`\n`;
    players[key[i]].message += `*Damage*: \`${agent.damage}\`\t`;
    if (agent.heal != 0) {
      players[key[i]].message += `*Heal*: \`${agent.heal}\`\n`;
    }

    players[key[i]].abl = agent.cd;
    players[key[i]].hpt = agent.hp;
  }



  // console.log(players);
  return players;
}

// Handles the action messages to be sent out to each players.
module.exports.action = function(players, bot, id) {
  var key = Object.keys(players);

  for (let i = 0;i < key.length;i++) {
    let P = players[key[i]];
    P.result_m = '';
    P.action_b = [];
    let agent = Object.keys(P.agt);

    P.action_m = `\`${P.fn}\` Choose an action: `;

    // Place an attack button.
    P.action_b.push({
      text: 'Attack',
      callback_data: 'attack'
    });

    // If the agent is an healer, place a heal button.
    if (P.agt[agent].class == 'Healer') {
      P.action_b.push({
        text: 'Heal',
        callback_data: 'heal'
      });
    }

    // If agent ability is ready to be used, send ability button.
    if (P.abl == 0) {
      P.action_b.push({
        text: 'Ability',
        callback_data: 'ability'
      });
    }
  }

  return players;
}

// Handles the result of the players actions.
module.exports.results_player = function(players, bot, id) {
  var key = Object.keys(players);

  for (let i = 0;i < key.length;i++) {
    let P = players[key[i]];
    let agent = Object.keys(P.agt);

    // Decrement player ability cooldown.
    if (P.abl > 0) {
      P.abl--;
    }

    // If player chooses to attack another player.
    if (P.action_s.match(/attack-/)) {

      // Get the id of the attacked player.
      let target = P.action_s.slice(7);

      // Decrement attacked player's HP based on the damage.
      players[target].hp -= P.agt[agent].damage;

      // Send information to the attacked player.
      players[target].result_m += `\`+\` You have been attacked! *(-${P.agt[agent].damage} HP)*\n`;
      players[target].attacker += `*${P.fn}*, `;
    }

    // If player chooses to heal another player.
    else if (P.action_s.match(/heal-/)) {

      // Get the id of the healed player.
      let target = P.action_s.slice(5);

      // Increment healed player's HP based on the healing power.
      players[target].hp += P.agt[agent].heal;

      // Don't allow HP to surpass agent's maximum HP.
      if (players[target].hp > players[target].agt[Object.keys(players[target].agt)].hp) {
        players[target].hp = players[target].agt[Object.keys(players[target].agt)].hp
      }

      // Send information to the healed player.
      players[target].result_m += `\`+\` You have been healed! *(+${P.agt[agent].damage} HP)*\n`;
    }

    // If didn't choose any button, would attack a random player.
    else {
      let done = false;
      var rand_target;

      // Repeat till have a valid target.
      while (!done) {
        rand_target = Math.floor(Math.random() * (key.length));

        // Can't attack same ID.
        if (players[key[rand_target]] != key[i]) {
          done = true;
        }
      }

      // Decrement attacked player's HP based on the damage.
      players[key[rand_target]].hp -= P.agt[agent].damage;

      // Inform the attacked player.
      players[key[rand_target]].result_m += `\`+\` You have been attacked! *(-${P.agt[agent].damage} HP)*\n`;
      players[key[rand_target]].attacker += `*${P.fn}*, `;
      // Math.floor(Math.random() * (max - min +1)) + min;
    }
  }


  // Inform the player their current status.
  for (let i = 0;i < key.length;i++) {
    let P = players[keys[i]];
    let agent = Object.keys(P.agt);

    // If still alive. (Greater than 0 HP)
    if (P.hp > 0) {

      // Send current HP.
      P.result_m += `\`+\` You have \`${P.hp}/${P.agt[agent].hp}\` remaining!\n`;
    
      // Send ability CD time when not yet available.
      if (P.abl > 0) {
        P.result_m += `\`+\` Your ability will be available after *${P.abl}* turns!\n`;
      }

      // Inform when ability is ready.
      else {
        P.result_m += `\`+\` Your ability *is ready*!\n`;
      }
    }

    // If less than or equal 0 HP, player is dead.
    else {
      P.result_m += `*YOUR HP DROPPED TO* \`0\`*. YOU HAVE DIED!*\n`;
    }
  }

  return players;
}

// Handles the announcements when a player died.
module.exports.results_game = function(players, bot, id) {
  var str = '';

  var key = Object.keys(players);

  for (let i = 0;i < key.length;i++) {
    let P = players[key[i]];
    let agent = Object.keys(P.agt);

    // Get dead players.
    if (P.hp <= 0) {
      P.alive = false;

      // Initialize announcement string.
      str += `\`++++++++++++++++++++++++++++++++++++++++\`\n`;
      str += `*${P.fn}* \`(Agent ${agent})\` is eliminated!\n`;

      // Announce the dead player's role.

      if (P.vip) {
        str += `Findings indicate that ${P.fn} is a *VIP* from team *Pyro*!\n`;
      }
      else {
        str += `Findings indicate that ${P.fn} is an agent from team *Pyro*!\n`;
      }
      if (P.erp) {
        str += `Findings indicate that ${P.fn} is an agent from team *ERP*!\n`;
      }

      // Announce the players who contributed to the killing blow.
      str += `Surveillance shows that the attackers were:\n`;
      str += `${P.attacker.slice(0, P.attacker.length - 2)}\n`;
    }
  }

  return str;
}