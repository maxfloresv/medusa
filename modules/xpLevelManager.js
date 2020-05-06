const Discord = require("discord.js");
const mysql = require("mysql");
const path = require("path");
const cooldown = new Set();
const cooldownMd = new Set();
const extras = require("../utils/extras.js");

const Canvas = require('canvas'),
      canvas = Canvas.createCanvas(150, 185),
      ctx = canvas.getContext('2d');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "testdb"
});
con.connect(err => {
    if (err) throw err;
    console.log("[i] Connected succesfully to database.")
});

module.exports.run = async (bot) => {
    bot.on("message", async (message) => {
        if (message.author.bot) return;
        if (message.channel.type === "dm") {
            if (!["m!notifications off", "m!notifications on"].includes(message.content)) return;
            else {
                if (!cooldownMd.has(message.author.id)) {
                    con.query(`SELECT id, notifications FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                        if (message.content.toLowerCase() == "m!notifications off") {
                            if (!rows[0]) {
                                con.query(`INSERT INTO badges (id, notifications) VALUES ('${message.author.id}', 0)`)
                                return extras.success(message, "Notificaciones de insignias desactivadas.", "¡Has desactivado las notificaciones exitosamente!"+
                                " Si quieres volver a activarlas, puedes escribir por acá (y solo por acá): `m!notifications on`.")
                            } else if (rows[0].notifications != 0) {
                                con.query(`UPDATE badges SET notifications = 0 WHERE id = '${message.author.id}'`)
                                return extras.success(message, "Notificaciones de insignias desactivadas.", "¡Has desactivado las notificaciones exitosamente!"+
                                " Si quieres volver a activarlas, puedes escribir por acá (y solo por acá): `m!notifications on`.")
                            } else { 
                                return extras.info_error(message, "Ha ocurrido un error.", "¡Ya tienes las notificaciones de insignias desactivadas!"+
                                " Puedes activarlas escribiendo en este chat: `m!notifications on`.")  
                            }
                        } else {
                            if (!rows[0]) {
                                con.query(`INSERT INTO badges (id) VALUES ('${message.author.id}')`)
                                return extras.success(message, "Notificaciones de insignias activadas.", "¡Has activado las notificaciones exitosamente!"+
                                " Si quieres desactivarlas, puedes escribir por acá (y solo por acá): `m!notifications off`.")
                            } else if (rows[0].notifications != 1) {
                                con.query(`UPDATE badges SET notifications = 1 WHERE id = '${message.author.id}'`)
                                return extras.success(message, "Notificaciones de insignias activadas.", "¡Has activado las notificaciones exitosamente!"+
                                " Si quieres desactivarlas, puedes escribir por acá (y solo por acá): `m!notifications off`.")
                            } else { 
                                return extras.info_error(message, "Ha ocurrido un error.", "¡Ya tienes las notificaciones de insignias activadas!"+
                                " Puedes desactivarlas escribiendo en este chat: `m!notifications off`.")  
                            }
                        }
                    });
                } else {
                    return extras.info_error(message, "Ha ocurrido un error.", "Solo puedes escribir comandos por acá cada `15 minutos`. Inténtalo de nuevo más tarde.");
                }
                cooldownMd.add(message.author.id);
                setTimeout(() => {
                    cooldownMd.delete(message.author.id);
                }, 900000);
            } 
        }

        if (message.mentions.has(bot.user, { ignoreEveryone: true, ignoreRoles: true }) && message.channel.type !== "dm") {
            con.query(`SELECT id, prefix FROM guildCfg WHERE id = '${message.guild.id}'`, (err, rows) => {
                let prefix;
                if (!rows[0]) prefix = "m!";
                else prefix = rows[0].prefix;

                let embed = new Discord.MessageEmbed()
                .setTitle("Menú de ayuda")
                .setDescription("Solo puedes acceder aquí si me mencionas. A continuación está la información para el servidor actual:")
                .setThumbnail(bot.user.avatarURL())
                .addField(":question: **Prefijo:**", prefix, true)
                .addField(":tickets: **Servidor de soporte:**", "[Haz clic acá](https://discord.gg/anYanmX)", true)
                .addField(":robot: **Invitación del bot:**", "[Haz clic acá](https://discord.gg/anYanmX)")
          
              return message.channel.send(embed);
            });
        }

        con.query(`SELECT id, prefix FROM guildCfg WHERE id = '${message.guild.id}'`, (err, rows) => {
            let prefix;
            if (!rows[0]) prefix = "m!";
            else prefix = rows[0].prefix;
        
            if (!message.content.startsWith(prefix)) return;
          
            let arrayMensaje = message.content.split(" ");
            let comando = arrayMensaje[0];
            let args = arrayMensaje.slice(1);
            let archivoComandos = bot.commands.get(comando.slice(prefix.length));
            if (archivoComandos) {
                archivoComandos.run(bot, message, args, con);
            }
          })

        con.query(`SELECT * FROM userInfo WHERE id = '${message.author.id}'`, async (err, rows) => {
            if (err) throw err;
            let xpGenerated = Math.floor(Math.random() * 8) + 5;

            if (!cooldown.has(message.author.id)) {
                if (!rows[0]) return con.query(`INSERT INTO userInfo (id, xp, totalXp) VALUES ('${message.author.id}', ${xpGenerated}, ${xpGenerated})`);

                if (this.calculateLevelXp(rows[0].level + 1) <= rows[0].totalXp + xpGenerated) {
                    con.query(`UPDATE userInfo SET xp = ${rows[0].totalXp + xpGenerated - this.calculateLevelXp(rows[0].level + 1)}, 
                    totalXp = ${rows[0].totalXp + xpGenerated}, level = ${rows[0].level + 1} WHERE id = '${message.author.id}'`);

                    const fondo = await Canvas.loadImage(path.join(__dirname, "..", "images", "bg-levelUp.png"))
                    const avatar = await Canvas.loadImage(message.author.avatarURL())

                    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height)
                    ctx.drawImage(avatar, 39, 30, 70, 70)
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '32px Torus'
                    ctx.fillText(`${rows[0].level + 1}`, 63, 158)
                    ctx.font = '20px Torus'
                    ctx.fillText('Level Up!', 35, 118)

                    let attachment = new Discord.MessageAttachment(canvas.toBuffer());
                    let embed = new Discord.MessageEmbed()
                        .setDescription(`:arrow_double_up: ${message.author}, ¡has subido de nivel!
                        EXP requerida para el siguiente nivel: **${this.calculateLevelXp(rows[0].level + 2) - this.calculateLevelXp(rows[0].level + 1)}**`)
                    message.channel.send(embed);
                    message.channel.send(attachment);

                } else {
                    con.query(`UPDATE userInfo SET xp = ${rows[0].xp + xpGenerated}, totalXp = ${rows[0].totalXp + xpGenerated} WHERE id = '${message.author.id}'`);
                }

                /* User badge criteria check:
                || Pending: Discuss a way to handle this to avoid performance issues. I temporarily put it into the 5 minute
                cooldown to reduce significantly the number of queries per second. - !!Máximo */
                switch (rows[0].level) {
                    case 10:
                        con.query(`SELECT id, lvl10 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, lvl10) VALUES ('${message.author.id}', 1)`);
                            else if (rows[0].lvl10 == "1" || rows[0].lvl10 == "2") return;
                            else return con.query(`UPDATE badges SET lvl10 = 1 WHERE id = '${message.author.id}'`);
                        });
                        break;
                    // From here, the user WILL BE already registered in the database, at least if he/she doesn't skips level 10, so...
                    case 25:
                        con.query(`SELECT id, lvl25 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (rows[0].lvl25 == "1" || rows[0].lvl25 == "2") return;
                            else return con.query(`UPDATE badges SET lvl25 = 1 WHERE id = '${message.author.id}'`); 
                        });
                        break;
                    case 50:
                        con.query(`SELECT id, lvl50 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (rows[0].lvl50 == "1" || rows[0].lvl50 == "2") return;
                            else con.query(`UPDATE badges SET lvl50 = 1 WHERE id = '${message.author.id}'`);
                        });
                        break;
                    case 75:
                        con.query(`SELECT id, lvl75 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (rows[0].lvl75 == "1" || rows[0].lvl75 == "2") return;
                            else con.query(`UPDATE badges SET lvl75 = 1 WHERE id = '${message.author.id}'`);
                        });
                        break;
                    case 100:
                        con.query(`SELECT id, lvl100 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (rows[0].lvl100 == "1" || rows[0].lvl100 == "2") return;
                            else con.query(`UPDATE badges SET lvl100 = 1 WHERE id = '${message.author.id}'`);
                        });
                        break;
                }

                if (rows[0].credits < 10000) return; // It avoids to check the next block...
                else {
                    if (rows[0].credits >= 50000000) {
                        con.query(`SELECT id, c50m FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, c10k, c100k, c1m, c10m, c50m) VALUES ('${message.author.id}', 1, 1, 1, 1, 1)`)
                            else if (rows[0].c50m == 1 || rows[0].c50m == 2) return;
                            else return con.query(`UPDATE badges SET c50m = 1 WHERE id = '${message.author.id}'`);
                        });
                    } else if (rows[0].credits >= 10000000) {
                        con.query(`SELECT id, c10m FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, c10k, c100k, c1m, c10m) VALUES ('${message.author.id}', 1, 1, 1, 1)`)
                            else if (rows[0].c10m == 1 || rows[0].c10m == 2) return;
                            else return con.query(`UPDATE badges SET c10m = 1 WHERE id = '${message.author.id}'`);
                        });
                    } else if (rows[0].credits >= 1000000) {
                        con.query(`SELECT id, c1m FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, c10k, c100k, c1m) VALUES ('${message.author.id}', 1, 1, 1)`)
                            else if (rows[0].c50m == 1 || rows[0].c50m == 2) return;
                            else return con.query(`UPDATE badges SET c50m = 1 WHERE id = '${message.author.id}'`);
                        });                    
                    } else if (rows[0].credits >= 100000) {
                        con.query(`SELECT id, c100k FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, c10k, c100k) VALUES ('${message.author.id}', 1, 1)`)
                            else if (rows[0].c100k == 1 || rows[0].c100k == 2) return;
                            else return con.query(`UPDATE badges SET c100k = 1 WHERE id = '${message.author.id}'`);
                        });                    
                    } else if (rows[0].credits >= 10000) {
                        con.query(`SELECT id, c10k FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                            if (!rows[0]) return con.query(`INSERT INTO badges (id, c10k) VALUES ('${message.author.id}', 1)`)
                            else if (rows[0].c10k == 1 || rows[0].c10k == 2) return;
                            else return con.query(`UPDATE badges SET c10k = 1 WHERE id = '${message.author.id}'`);
                        });
                    }
                }
                // At this point, it isn't necessary to check if the rows does exist, because it's checked at the beggining.
                con.query(`SELECT id, totalXp, pos FROM ( SELECT id, totalXp, ROW_NUMBER() OVER (ORDER BY totalXp DESC) AS pos FROM xp ) AS t WHERE t.id = '${message.author.id}'`, (err, rows) => {
                    if (rows[0].pos > 5000) return; // Same as credits' first condition :)
                    else {
                        if (rows[0].pos == 1) {
                            con.query(`SELECT id, top1 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                                if (rows[0].top1 == "1" || rows[0].top1 == "2") return;
                                else con.query(`UPDATE badges SET top1 = 1 WHERE id = '${message.author.id}'`);
                            });
                        } else if (rows[0].pos <= 100) {
                            con.query(`SELECT id, top100 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO badges (id, top100) VALUES ('${message.author.id}', 1)`);
                                else if (rows[0].top100 == "1" || rows[0].top100 == "2") return;
                                else con.query(`UPDATE badges SET top100 = 1 WHERE id = '${message.author.id}'`);
                            });
                        } else if (rows[0].pos <= 500) {
                            con.query(`SELECT id, top500 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO badges (id, top500) VALUES ('${message.author.id}', 1)`);
                                else if (rows[0].top500 == "1" || rows[0].top500 == "2") return;
                                else con.query(`UPDATE badges SET top500 = 1 WHERE id = '${message.author.id}'`);
                            });
                        } else if (rows[0].pos <= 1000) {
                            con.query(`SELECT id, top1000 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO badges (id, top1000) VALUES ('${message.author.id}', 1)`);
                                else if (rows[0].top1000 == "1" || rows[0].top1000 == "2") return;
                                else con.query(`UPDATE badges SET top1000 = 1 WHERE id = '${message.author.id}'`);
                            });
                        } else if (rows[0].pos <= 5000) {
                            con.query(`SELECT id, top5000 FROM badges WHERE id = '${message.author.id}'`, (err, rows) => {
                                if (!rows[0]) con.query(`INSERT INTO badges (id, top5000) VALUES ('${message.author.id}', 1)`);
                                else if (rows[0].top5000 == "1" || rows[0].top5000 == "2") return;
                                else con.query(`UPDATE badges SET top5000 = 1 WHERE id = '${message.author.id}'`);
                            });
                        }
                    }
                });
            }
            
            cooldown.add(message.author.id);
            setTimeout(() => {
                cooldown.delete(message.author.id);
            }, 300000);
        });
    });
}

module.exports.calculateLevelXp = level => {
    return Math.floor(434 * level ** 2 / 6); 
}
