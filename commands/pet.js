const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
const pets = require("../utils/pets").pet;
const path = require("path");
const ms = require("parse-ms");

module.exports.run = async (bot, message, args, settings, userdata) => {
    if ((userdata.pet.length === 0 && !args[0]) || (userdata.pet.length === 0 && args[0].toLowerCase() !== "buy"))
        return extras.new_error(message, "Ocurrió un error", `No tienes un pet todavía. ¡Compra uno con **${settings.prefix}pet buy**!`);
    else if (!args[0]) {
        let feedInfo = ms(Date.now() - userdata.lastPetFeed);
        const embed = new MessageEmbed()
            .attachFiles(path.join(__dirname, "..", "images", "pets", `${pets(userdata.pet, "id")}.png`))
            .setAuthor(`Menú informativo | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTitle("Estadísticas de tu mascota:")
            .setThumbnail(`attachment://${pets(userdata.pet, "id")}.png`)
            .addField("Nombre:", userdata.petName)
            .addField("Puntos de experiencia:", `${userdata.petXp}/${calculatePetLevel(userdata.petLevel + 1)} **EXP**`, true)
            .addField("Nivel:", userdata.petLevel, true)
            .addField("Última vez alimentado:", userdata.lastPetFeed !== 0 ? `Hace ${feedInfo.days} día(s), ${feedInfo.hours} hora(s), ${feedInfo.minutes} minuto(s)` : "Nunca")
            .addField("Resistencia sin comer:", `${ms(pets(userdata.pet, "food_resistence")).days} día(s)`, true)
            .addField("Veces totales alimentado:", userdata.timesFed, true)
            .addField("Habilidades:", pets(userdata.pet, "habilities").length > 0 ? pets(userdata.pet, "habilities").map(h => `**•** ${h}`).join("\n") : "Ninguna")
            .setColor(extras.color_general)

        return message.channel.send(embed);
    }

    switch (args[0].toLowerCase()) {
        case "buy": {
            if (userdata.pet.length !== 0) return extras.new_error(message, "Ocurrió un error", `Ya tienes un pet activo (**${pets(userdata.pet, "name")}**).`+
            ` Si quieres cambiarlo, a costa de perder todo el progreso que llevas actualmente con él y recibir un 10 % de reembolso de su precio original, usa **${settings.prefix}pet change**.`)

            const embed = new MessageEmbed()
                .setAuthor(`Menú de mascotas | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription("Responde al mensaje con los números de abajo según lo que quieras hacer!"+
                "\n**1 ::** Comprar una nueva mascota")
                .setColor(extras.color_general)
            
            await message.channel.send(embed).then(async m => {
                await m.react(extras.red_x_id).catch(() => { return; });

                let emojiFilter = (reaction, user) => { return reaction.emoji.id === extras.red_x_id && user.id === message.author.id; }; 
                let messageFilter = (msg) => { return ["1"].includes(msg.content) && msg.author.id === message.author.id; };

                const collectorEmoji = m.createReactionCollector(emojiFilter);
                const collectorMsg = m.channel.createMessageCollector(messageFilter, { max: 1, time: 15000, errors: ["time"] });

                collectorEmoji.on("collect", () => { 
                    collectorEmoji.stop(); collectorMsg.stop();
                    return m.delete();
                });

                collectorMsg.on("collect", async (msg) => { 
                    collectorEmoji.stop(); collectorMsg.stop();
                    m.delete();

                    if (msg.content === "1") {
                        let claimablePets = ["cat_1", "cat_2"];

                        let currentPage = 0;
                        const embeds = pageGenerator(claimablePets, message);
                        await message.channel.send(`🔸 ** |  Página actual: (${currentPage + 1}/${embeds.length})**`, embeds[currentPage]).then(async m => {
                            await m.react("⬅"); await m.react("➡"); await m.react("🗑");

                            const emojiFilter = (reaction, user) => { return ["⬅", "➡", "🗑"].includes(reaction.emoji.name) && user.id === message.author.id; };
                            let messageFilter = msg => { return msg.author.id === message.author.id && msg.content.toLowerCase() === "claim" };

                            const emojiCollector = m.createReactionCollector(emojiFilter);
                            const messageCollector = m.channel.createMessageCollector(messageFilter, { max: 1, time: 150000 });
                      
                            emojiCollector.on('collect', async (reaction, user) => {
                              if (reaction.emoji.name === "➡") {
                                await m.reactions.cache.find(r => r.emoji.name == "➡").users.remove(message.author.id);
                                if (currentPage < embeds.length - 1) {
                                  currentPage++;
                                  m.edit(`🔸 ** |  Página actual: (${currentPage + 1}/${embeds.length})**`, embeds[currentPage]);
                                }
                              } else if (reaction.emoji.name === "⬅") {
                                await m.reactions.cache.find(r => r.emoji.name == "⬅").users.remove(message.author.id);
                                if (currentPage !== 0) {
                                  currentPage--;
                                  m.edit(`🔸 ** |  Página actual: (${currentPage + 1}/${embeds.length})**`, embeds[currentPage]);
                                }
                              } else {
                                emojiCollector.stop(); messageCollector.stop();
                                return m.delete();
                              }
                            });
                            
                            messageCollector.on('collect', async (msg) => {
                              let option = claimablePets[currentPage];

                              if (userdata.credits < pets(option, "price")) {
                                  emojiCollector.stop(); messageCollector.stop();
                                  m.delete();
                                  return extras.new_error(message, "Ocurrió un error", 
                                  `¡No tienes suficientes créditos para realizar esta transacción! Revisa tu billetera con **${settings.prefix}credits**.`);
                              }
                      
                              try {
                                if (pets(option, "id") === "cat_1") {
                                    bot.updateUserData(message.author, { pet: option, petMultiplier: pets(option, "defaultMultiplier"), petName: pets(option, "name"), $addToSet: { badges: option }, $inc: { credits: -pets(option, "price") }});
                                } else if (pets(option, "id") === "cat_2") {
                                    bot.updateUserData(message.author, { pet: option, petMultiplier: pets(option, "defaultMultiplier"), petName: pets(option, "name"), $inc: { credits: -pets(option, "price") }});
                                }
                              } catch { return; }
                              
                              emojiCollector.stop(); messageCollector.stop();
                              m.delete();
                              return extras.new_success(message, "Compra realizada", `¡El pet **${pets(option, "name")}** ahora es de tu propiedad!`);
                            });
                      
                            messageCollector.on("end", (msg) => {
                              if (!msg) {
                                emojiCollector.stop(); messageCollector.stop();
                                return m.delete();
                              }
                            });
                        });
                    }
                });

                collectorMsg.on("end", (msg) => {
                    if (!msg) {
                        collectorEmoji.stop(); collectorMsg.stop();
                        return m.delete();
                    }
                });
            }).catch(() => { return; });
            break;
        }
        case "feed": {
            const feedSchedule = [1.44e+7, 1.26e+7, 1.08e+7, 9e+6, 7.2e+6];
            let randomHour = feedSchedule[Math.floor(Math.random() * feedSchedule.length)];
            if (randomHour - (Date.now() - userdata.lastPetFeed) > 0)
                return extras.new_error(message, "Ocurrió un error", `¡Tu mascota está satisfecha! Inténtalo de nuevo más tarde.`);

            let xpToAdd = Math.floor(15 * Math.random() + 90);
            try {
                if (calculatePetLevel(userdata.petLevel + 1) <= userdata.petXp) {
                    bot.updateUserData(message.author, { lastPetFeed: Date.now(), $inc: { timesFed: 1, petXp: xpToAdd, petLevel: 1 }});
                    return extras.new_success(message, "Mascota alimentada", `**+${xpToAdd} EXP**.\n¡Tu mascota ha subido de nivel! (Ahora es nivel **${petLevel + 1}**).`);
                }
                bot.updateUserData(message.author, { lastPetFeed: Date.now(), $inc: { timesFed: 1, petXp: xpToAdd }});
                return extras.new_success(message, "Mascota alimentada", `**+${xpToAdd} EXP**.`);
            } catch { return; }
        }
        
        case "change": {
            const embed = new MessageEmbed()
                .setAuthor(`Confirma esta acción | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(`¿Estás seguro de que quieres cambiar a tu pet, **${userdata.petName}**? Se te reembolsará el 10% de lo que te costó,`+
                ` es decir, 💵 $${pets(userdata.pet, "price") / 10}. Reacciona con ${extras.green_tick} si quieres continuar, o ${extras.red_x} si te arrepientes.`+
                "\n\n⚠ **¡Perderás todo el progreso actual!**")
                .setColor(extras.color_general)
                
            let filter = (reaction, user) => { return [extras.green_tick_id, extras.red_x_id].includes(reaction.emoji.id) && user.id === message.author.id; };
            await message.channel.send(embed).then(async m => { await m.react(extras.green_tick_id); await m.react(extras.red_x_id);
                m.awaitReactions(filter, { max: 1, time: 30000 })
                .then(collected => {
                    let reaction = collected.first();
                    if (reaction.emoji.id === extras.green_tick_id) {
                        try {
                            if (pets(userdata.pet, "id") === "cat_1") {
                                bot.updateUserData(message.author, { lastPetFeed: 0, petXp: 0, timesFed: 0, $pull: { badges: pets(userdata.pet, "id") }, $inc: { credits: pets(userdata.pet, "price") / 10 }, pet: "", petMultiplier: 1, petName: "" });
                            }
                        } catch { return extras.new_error(message, "Ocurrió un error", "No se pudo completar esta operación"); }
                    }
                    else return m.delete();

                    m.delete();
                    return extras.new_success(message, "Acción completada", `¡Ya no posees mascotas! Si quieres comprar una nueva, usa **${settings.prefix}pet buy**.`);
                }).catch(() => { return m.delete(); })
            });
            break;
        }

        case "setname": {
            let newName = args.slice(1).join(" ");
            if (!newName || args.length > 11) return extras.new_error(message, "Ocurrió un error", 
            "Debes especificar un nombre válido para tu mascota. Este debe contener entre 1 y 10 palabras.");
            
            try {
                bot.updateUserData(message.author, { petName: newName });
            } catch { return; }

            return extras.new_success(message, "Acción completada", `¡El nombre de tu pet ha sido cambiado correctamente a **${newName}**!`);
        }
    }
}

function pageGenerator(values, message) {
    const pages = [];
    for (i = 0; i < values.length; i++) {
      const embed = new MessageEmbed()
        .attachFiles(path.join(__dirname, "..", "images", "pets", `${pets(values[i], "id")}.png`))
        .setAuthor(`Menú de mascotas | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setTitle(`${pets(values[i], "name")}:`)
        .setThumbnail(`attachment://${pets(values[i], "id")}.png`)
        .addField("Precio:", `💵 $${pets(values[i], "price")}`, true)
        .addField("Autor:", pets(values[i], "author"), true)
        .addField("Resistencia sin comer:", `${ms(pets(values[i], "food_resistence")).days} día(s)`)
        .addField("Habilidades:", pets(values[i], "habilities").length > 0 ? pets(values[i], "habilities").map(h => `**•** ${h}`).join("\n") : "Ninguna")
        .setColor(extras.color_general)
        .setFooter("Escribe claim en el chat para comprarla.")
      pages.push(embed);
    }
    return pages;
}

function calculatePetLevel(level) {
    return 401 * level ** 2;
}

module.exports.help = {
  nombre: "pet",
  aliases: []
}
