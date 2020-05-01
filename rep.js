const Discord = require("discord.js");
const ms = require("parse-ms");
const extras = require("../utils/extras.js");
const lang = require("../utils/langs.js").str;

module.exports.run = async (bot, message, args, con) => {
    let userRep = message.mentions.users.first()
    || message.guild.members.cache.get(args[0]);
    console.log(userRep);
    let cooldown = 8.64e+7;

    if (!args[0]) {
        con.query(`SELECT id FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
            // Caso 1: El usuario no existe en la bbdd y no especificó a alguien.
            if (!rows[0]) { 
                con.query(`INSERT INTO userInfo (id) VALUES ('${message.author.id}')`)
                extras.success(message, "puedes dar reps", "menciona a alguien");
            // Caso 2: El usuario existe en la bbdd y no especificó a alguien.
            } else {
                con.query(`SELECT id, lastRep FROM userInfo WHERE id = '${message.author.id}'`, (err, rows) => {
                    if (cooldown - (Date.now() - rows[0].lastRep) > 0) {
                        let msDeconstruction = ms(cooldown - (Date.now() - rows[0].lastRep));
                        extras.info_error(message, "Espera pa dar reps", `${msDeconstruction.hours}h ${msDeconstruction.minutes}m`)    

                    } else { extras.success(message, "puedes dar reps", "menciona a alguien"); }
                });
            }
        });

        } else if (userRep != undefined && userRep && userRep.id != message.author.id) {
            // Caso 3: El usuario que ejecutó el comando no existe en la bbdd.
            con.query(`SELECT id FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
                if (!rows[0]) { 
                    con.query(`INSERT INTO userInfo (id) VALUES ('${message.author.id}')`, () => {                       
                        extras.success(message, "Rep dado", `a ${userRep}`)                                    
                        con.query(`UPDATE userInfo SET lastRep = '${Date.now()}' WHERE id = '${message.author.id}'`)
                        con.query(`SELECT id, reps FROM userInfo WHERE id = '${message.mentions.users.first().id}'`, (err, rows) => {
                            // Caso 3.1: El usuario al que mencionó no existe en la bbdd.
                            if (!rows[0]) { 
                                con.query(`INSERT INTO userInfo (id, reps) VALUES ('${message.mentions.users.first().id}', 1)`)
                            // Caso 3.2: El usuario al que mencionó existe en la bbdd.
                            } else {
                                con.query(`UPDATE userInfo SET reps = ${rows[0].reps + 1} WHERE id = '${message.mentions.users.first().id}'`)
                            }
                        });                                    
                    })
                // Caso 4: El usuario que ejecuta el comando existe en la bbdd.
                } else {
                    con.query(`SELECT lastRep FROM userInfo WHERE id = '${message.author.id}'`, (err, rows) => {
                        if (cooldown - (Date.now() - rows[0].lastRep) > 0) {
                            let msDeconstruction = ms(cooldown - (Date.now() - rows[0].lastRep));
                            extras.info_error(message, "Espera pa dar reps", `${msDeconstruction.hours}h ${msDeconstruction.minutes}m`)
                        
                        } else {
                            extras.success(message, "Rep dado", `a ${userRep}`)
                                    
                            con.query(`UPDATE userInfo SET lastRep = '${Date.now()}' WHERE id = '${message.author.id}'`)
                            con.query(`SELECT id, reps FROM userInfo WHERE id = '${message.mentions.users.first().id}'`, (err, rows) => {
                                // Caso 4.1: El usuario al que mencionó no existe en la bbdd.
                                if (!rows[0]) { 
                                    con.query(`INSERT INTO userInfo (id, reps) VALUES ('${message.mentions.users.first().id}', 1)`)
                                // caso 4.2: El usuario al que mencionó existe en la bbdd.
                                } else {
                                    con.query(`UPDATE userInfo SET reps = ${rows[0].reps + 1} WHERE id = '${message.mentions.users.first().id}'`)
                                }
                            });
                        }
        
                    });
                }
            })
            
    } else {
        message.channel.send("Menciona un usuario válido. Tampoco te puedes dar reps a ti mismo.");
    }
}

module.exports.help = {
  nombre: "rep"
}
