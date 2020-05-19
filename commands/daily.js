const ms = require("parse-ms");
const extras = require("../utils/extras.js");
const cmdCooldown = new Map(), cooldownTime = 30000;

module.exports.run = async (bot, message, args, con) => {
    let user = message.mentions.users.first()
    || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);

    let cooldown = 8.64e+7;
    let amount = Math.floor(Math.random() * 50) + 200;

    if (!cmdCooldown.has(message.author.id)) {

        cmdCooldown.set(message.author.id, Date.now());
        setTimeout(() => {
            cmdCooldown.delete(message.author.id);
        }, cooldownTime);

        if (!user || user.id === message.author.id) {
            con.query(`SELECT * FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
                if (!rows[0]) { 
                    con.query(`INSERT INTO userInfo (id, credits, lastDaily) VALUES ('${message.author.id}', ${amount}, '${Date.now()}')`);
                    return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`);
    
                } else {
                    if (cooldown - (Date.now() - rows[0].lastDaily) > 0) {
                        let msDeconstruction = ms(cooldown - (Date.now() - rows[0].lastDaily));
                        extras.new_error(message, "Ocurrió un error", `Espera **${msDeconstruction.hours} hora(s) y ${msDeconstruction.minutes} minuto(s)** para reclamar tu próximo daily.`);
    
                    } else {
                        let random = Math.floor(Math.random() * 2);
                        if (rows[0].dailyBonus > 0 && rows[0].dailyBonus < 4) {
                            if (cooldown * 2 - (Date.now() - rows[0].lastDaily) > 0) {
                                con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount}, lastDaily = '${Date.now()}', dailyBonus = 0 WHERE id = '${message.author.id}'`);
                                return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`+
                                `\nPerdiste tu racha de \`${rows[0].dailyBonus} día(s)\`. :(`);
                            }
                            con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount}, lastDaily = '${Date.now()}', dailyBonus = ${rows[0].dailyBonus + 1} WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`+
                            `\nRacha actual: ${rows[0].dailyBonus}`);

                        } else if (rows[0].dailyBonus + 1 === 5) {
                            con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount * 2}, lastDaily = '${Date.now()}', dailyBonus = 0 WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`+
                            `\n~~Racha actual:~~ **¡Completaste la racha!** (Bonus x2)`);

                        } else if (random >= 1) {
                            con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount}, lastDaily = '${Date.now()}', dailyBonus = 1 WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`+
                            `\nRacha actual: 1`);

                        } else {
                            con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount}, lastDaily = '${Date.now()}' WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Has recibido :dollar: **${amount} créditos**!`);
                        }
                    }
                }
            });
    
        } else if (user.bot) {
            extras.new_error(message, "Ocurrió un error", "Las cuentas de bots no tienen perfil...");
                
        } else {
            con.query(`SELECT * FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
                if (!rows[0]) {
                    con.query(`INSERT INTO userInfo (id, lastDaily) VALUES ('${message.author.id}', '${Date.now()}')`);                     
                    con.query(`SELECT id, credits FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                        if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount})`);
                        else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount} WHERE id = '${user.id}'`);
                    }); 
                    return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`);                                 
    
                } else {
                    if (cooldown - (Date.now() - rows[0].lastDaily) > 0) {
                        let msDeconstruction = ms(cooldown - (Date.now() - rows[0].lastDaily));
                        extras.new_error(message, "Ocurrió un error", `Espera **${msDeconstruction.hours} hora(s) y ${msDeconstruction.minutes} minuto(s)** para reclamar tu próximo daily.`);
                            
                    } else {
                        let random = Math.floor(Math.random() * 2);
                        if (rows[0].dailyBonus > 0 && rows[0].dailyBonus < 4) {
                            if (cooldown * 2 - (Date.now() - rows[0].lastDaily) > 0) {
                                con.query(`SELECT * FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                                    if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount})`);
                                    else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount} WHERE id = '${user.id}'`);
                                });
                                con.query(`UPDATE userInfo SET lastDaily = '${Date.now()}', dailyBonus = 0 WHERE id = '${message.author.id}'`);
                                return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`+   
                                `\nPerdiste tu racha de \`${rows[0].dailyBonus} día(s)\`. :(`);
                            }
                            con.query(`SELECT * FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount})`);
                                else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount} WHERE id = '${user.id}'`);
                            });
                            con.query(`UPDATE userInfo SET lastDaily = '${Date.now()}', dailyBonus = ${rows[0].dailyBonus + 1} WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`+
                            `\nRacha actual: ${rows[0].dailyBonus}`);
                        
                        } else if (rows[0].dailyBonus + 1 === 5) {
                            con.query(`SELECT * FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount * 2})`);
                                else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount * 2} WHERE id = '${user.id}'`);
                            });
                            con.query(`UPDATE userInfo SET lastDaily = '${Date.now()}', dailyBonus = 0 WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`+
                            `\n~~Racha actual:~~ **¡Completaste la racha!** (Bonus x2)`);
                            
                        } else if (random >= 1) {
                            con.query(`SELECT * FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount})`);
                                else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount} WHERE id = '${user.id}'`);
                            });
                            con.query(`UPDATE userInfo SET lastDaily = '${Date.now()}', dailyBonus = 1 WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`+
                            `\nRacha actual: 1`);

                        } else {
                            con.query(`SELECT * FROM userInfo WHERE id = '${user.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO userInfo (id, credits) VALUES ('${user.id}', ${amount})`);
                                else con.query(`UPDATE userInfo SET credits = ${rows[0].credits + amount} WHERE id = '${user.id}'`);
                            });
                            con.query(`UPDATE userInfo SET lastDaily = '${Date.now()}' WHERE id = '${message.author.id}'`);
                            return extras.new_success(message, "Daily reclamado", `¡Le has dado tu daily (:dollar: **${amount} créditos**) a ${user}!`);
                        }
                    }
                }
            });        
        }
    } else {
        let remaining = cmdCooldown.get(message.author.id);
        return extras.cooldown_error(message, `Debes esperar **${ms(cooldownTime - (Date.now() - remaining)).seconds} segundo(s)** para usar este comando de nuevo.`);
    }
}

module.exports.help = {
  nombre: "daily",
  aliases: ["dailies"]
}
