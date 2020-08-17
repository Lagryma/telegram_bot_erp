// Maximum amount of players.
const MAX_PLAYERS = 16;

module.exports.assign = function(players) {

    // Data for different agents that the player can be assigned.
    var agents = {
        /**     FORMAT  
        [agent name]: {
            class: [agent type (offense/tank/healer/support)],
            ability: [ability description],
            cd: [ability cd],
            hp: [max health],
            damage: [attack value],
            heal: [heal value (0 for non-healer classes)]
        }
    
        '': {
            class: '',
            ability: '',
            cd: ,
            hp: ,
            damage: ,
            heal: 
        }
        **/
        
        'Dracule': {            
            class: 'Offense',
            ability: 'Recover a portion of your health when attacking.',                
            cd: 2,
            hp: 100,
            damage: 25,
            heal: 0
        },
        'Grim': {
            class: 'Offense',
            ability: 'Attack up to 3 agents, dealing 25 damage per target.',
            cd: 3,
            hp: 100,
            damage: 22,
            heal: 0
        },
        'Jordan': {
            class: 'Offense',
            ability: 'Combine your health with your target and split it equally!',
            cd: 5,
            hp: 100,
            damage: 22,
            heal: 0
        },
        'Novah': {
            class: 'Offense',
            ability: 'Sacrifice some hp to deal extra damage.',
            cd: 5,
            hp: 100,
            damage: 22,
            heal: 0
        },
        'Saitami': {
            class: 'Offense',
            ability: 'Leave your target with 1 hp remaining.',
            cd: 4,
            hp: 100,
            damage: 25,
            heal: 0
        },
        'Sonhae': {
            class: 'Offense',
            ability: 'Throw C4 explosives at an opponent to deal great damage.',
            cd: 3,
            hp: 85,
            damage: 30,
            heal: 0
        },
        'Taiji': {
            class: 'Offense',
            ability: 'Deflect all damage targeted at you back to attackers for 1 turn.',
            cd: 3,
            hp: 100,
            damage: 25,
            heal: 0
        },
        'Aspida': {
            class: 'Tank',
            ability: 'Provide a shield to 1 agent for 1 turn.',
            cd: 20,
            hp: 130,
            damage: 20,
            heal: 0
        },
        'Hamia': {
            class: 'Tank',
            ability: 'Increase damage reduction of 1 agent by 50%',
            cd: 2,
            hp: 130,
            damage: 20,
            heal: 0
        },
        'Harambe': {
            class: 'Tank',
            ability: 'Bite the bullet for an agent for 1 turn! All damage meant for the agent will be directedto you instead. Furthermore, you will recover 25% of all damage taken this turn.',
            cd: 3,
            hp: 130,
            damage: 20,
            heal: 0
        },
        'Impilo': {
            class: 'Tank',
            ability: 'Recover 20 hp or 20% of remaining health, whichever is higher. You also have increased damage reduction for 1 turn',
            cd: 4,
            hp: 130,
            damage: 20,
            heal: 0
        },
        'Elias': {
            class: 'Healer',
            ability: 'Reveal which team an agent is from!',
            cd: 2,
            hp: 90,
            damage: 17,
            heal: 10
        },
        'Prim': {
            class: 'Healer',
            ability: 'Cause an ability of the agent to be available for use for him/her next turn.',
            cd: 3,
            hp: 90,
            damage: 17,
            heal: 10
        },
        'Ralpha': {
            class: 'Healer',
            ability: 'Heal an agent to 80% of his/her base health (70% on self, not affected by 50% self-heal reduction)',
            cd: 4,
            hp: 90,
            damage: 17,
            heal: 10
        },
        'Sanar': {
            class: 'Healer',
            ability: 'Heal up to 3 agents.',
            cd: 3,
            hp: 90,
            damage: 17,
            heal: 10
        },
        'Anna': {
            class: 'Support',
            ability: 'Power up an agent for next turn!',
            cd: 2,
            hp: 100,
            damage: 20,
            heal: 0
        },
        'Jigglet': {
            class: 'Support',
            ability: 'Lull an agent to sleep, rendering that agent useless next turn!',
            cd: 3,
            hp: 100,
            damage: 20,
            heal: 0
        },
        'Munie': {
            class: 'Support',
            ability: 'Cause an agent to be invulnerable to taking damage and negative effects for next turn.',
            cd: 3,
            hp: 100,
            damage: 20,
            heal: 0
        },
        'Wanda': {
            class: 'Support',
            ability: 'Prevent an agent from being healed next turn. If the agent is a healer, agent will not be able to heal others',
            cd: 4,
            hp: 100,
            damage: 20,
            heal: 0
        }
    };
    
    // Sets the number of VIPs and ERPs depending on the player count.
    var count = {
        '4': {
            vip: 1,
            erp: 1
        },
        '6': {
            vip: 1,
            erp: 2
        },
        '9': {
            vip: 2,
            erp: 3
        },
        '11': {
            vip: 2,
            erp: 4
        },
        '14': {
            vip: 3,
            erp: 5
        },
        '16': {
            vip: 3,
            erp: 6
        }
    }

    // DUMMY DATA
    // var players = {};
    // for (let i = 1;i <= 10;i++) {
    //     players[`${i.toString()}`] = {
    //         fn: `asd-${i}`,
    //         vip: false,
    //         see: '0',
    //         erp: false,
    //         agt: {},
    //         alive: true,
    //         message: '',
    //         source_m: 0,
    //         action_s: '',
    //         action_m: '',
    //         action_b: [],
    //         source_a: 0
    //     }
    // };
    
    // Initialize necessary variables.
    var keycount = Object.keys(count);
    var key = Object.keys(players);
    var max = key.length - 1;
    var min = 0;
    var cnt = {};

    // Get the number of VIPs and ERPs based on player counts. (See line 182)
    for (let i = 0;i < keycount.length;i++) {
        if (count[keycount[i]]) {
            let x = parseInt(keycount[i]);
            if (max + 1<= x) {
                cnt = count[keycount[i]];
                break;
            }
        }
    }
   
    // Randomly assign ERPs till ERP quota.
    while (cnt.erp > 0) {
        let rand_erp = Math.floor(Math.random() * (max - min +1)) + min;
        if (players[key[rand_erp]].erp == false) {
            players[key[rand_erp]].erp = true;
            cnt.erp--;
        }
    }

    // Initialize seen array.
    var seen = [];
    
    // Randomly assign VIPS till VIP quota.
    while (cnt.vip > 0) {
        let rand_vip = Math.floor(Math.random() * (max - min +1)) + min;

        // Only assign player as VIP if non-ERP and not a VIP yet.
        if (players[key[rand_vip]].erp == false && players[key[rand_vip]].vip == false) {
            players[key[rand_vip]].vip = true;
            cnt.vip--;

            // Assign 'see' (See line 256)
            let see = false;
            while (!see && key.length >= 4) {
                let rand_see = Math.floor(Math.random() * (max - min +1)) + min;
                let done = false;

                // Only assign 'see' if non-ERP and not same id.
                if (players[key[rand_see]].erp == false && rand_see != rand_vip) {

                    // If id already exist on seen (See line 256), retry assignment.
                    for (let j = 0;j < seen.length;j++) {
                        if (seen[j] == rand_see) {
                            done = true;
                            break;
                        }
                    }

                    // If id not yet on seen (See line 256), assign.
                    if (!done) {
                        players[key[rand_see]].see = `${players[key[rand_vip]].fn}`;
                        see = true;
                        seen.push(rand_see);
                    }
                }
            }
        }
    }

    // Assign agents randomly
    var arr = [];
    var keyagent = Object.keys(agents);

    // Assign agents to players. (See line 6)
    for (let i = 0;i <= max;) {
        let done = false;
        let rand_agt = Math.floor(Math.random() * (keyagent.length - min)) + min;

        // Ensure agent uniqueness.
        for (let j = 0;j < arr.length;j++) {
            if (rand_agt == arr[j]) {
                done = true;
                break;
            }
        }

        if (!done) {
            players[key[i]].agt[keyagent[rand_agt]] = agents[keyagent[rand_agt]];
            arr.push(rand_agt);
            i++;
        }
    }
    // Math.floor(Math.random() * (max - min +1)) + min;
    return players;
}