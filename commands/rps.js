const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
const schedule = require("node-schedule");
const chooseArr = ["🗻", "📰", "✂"];
let types = {
    "🗻": "🗻 Piedra",
    "📰": "📰 Papel",
    "✂": "✂ Tijera"
}

module.exports.run = async (bot, message, args, settings) => {
    let user = message.mentions.users.first()
    || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);

    if (!user) {
        const embed = new MessageEmbed()
            .setAuthor(`Piedra, papel o tijera | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription("¡Reacciona con uno de los emojis para elegir una opción!\n"+
            `**Tip:** Puedes desafiar a alguien con **${settings.prefix}rps <@usuario>**.`)
            .setColor(extras.color_general) 

        const rpsEmbed = await message.channel.send(embed);

        await rpsEmbed.react("🗻");
        await rpsEmbed.react("📰");
        await rpsEmbed.react("✂");

        const filter = (reaction, user) => { return ["🗻", "📰", "✂"].includes(reaction.emoji.name) && user.id === message.author.id; };
        const collector = rpsEmbed.createReactionCollector(filter, { max: 1, time: 30000 });

        collector.on("collect", (reaction, user) => {
            collector.stop();
            const botOption = chooseArr[Math.floor(Math.random() * chooseArr.length)];
            if ((reaction.emoji.name === "🗻" && botOption === "✂") ||
            (reaction.emoji.name === "✂" && botOption === "📰") ||
            (reaction.emoji.name === "📰" && botOption === "🗻")) {
                return message.channel.send(`¡Elijo ${types[botOption]}! Ganaste... pero solo por esta vez.`);
            } else if (reaction.emoji.name === botOption) {
                return message.channel.send(`¡Empate! Elegí ${types[botOption]}.`);
            } else {
                return message.channel.send(`¡Elijo ${types[botOption]}! Has perdido. :(`);
            }
        });
        collector.on("end", () => { return rpsEmbed.delete(); });
    } else {
        if (user.bot) return extras.new_error(message, "Ocurrió un error", `No me gusta que juegues con otros bots. Prueba mejor con **${settings.prefix}rps** para desafiarme.`);

        const m = await message.channel.send(`Estado: Esperando respuesta de ${user}\n**${user.username}**, escribe \`accept\` en el chat para aceptar el duelo, o \`reject\` para rechazarlo`);

        const filter = (msg) => { return ["accept", "reject"].includes(msg.content.toLowerCase()) && msg.author.id === user.id; };
        const collector = m.channel.createMessageCollector(filter, { time: 60000 });

        collector.on("collect", async (msg) => {
            collector.stop();
            if (msg.content.toLowerCase() === "reject") 
                return extras.new_error(message, "Juego cancelado.", `${user} no quiere jugar en este momento.`);
            else {
                const embedAuthor = new MessageEmbed()
                    .setAuthor(`Piedra, papel o tijera | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Duelo contra **${user.username}**: ¡Reacciona con uno de los emojis para elegir una opción!`)
                    .setColor(extras.color_general)

                const embedUser = new MessageEmbed()
                    .setAuthor(`Piedra, papel o tijera | ${user.username}#${user.discriminator}`, user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Duelo contra **${message.author.tag}**: ¡Reacciona con uno de los emojis para elegir una opción!`)
                    .setColor(extras.color_general)

                try {
                    const authorRps = await message.author.send(embedAuthor);
                    const userRps = await user.send(embedUser);

                    await authorRps.react("🗻"); await userRps.react("🗻");
                    await authorRps.react("📰"); await userRps.react("📰");
                    await authorRps.react("✂"); await userRps.react("✂");

                    const filterAuthor = (reaction, rpsUser) => { return ["🗻", "📰", "✂"].includes(reaction.emoji.name) && rpsUser.id === message.author.id; };
                    const filterUser = (reaction, rpsUser) => { return ["🗻", "📰", "✂"].includes(reaction.emoji.name) && rpsUser.id === user.id; }
                    const collectorAuthor = authorRps.createReactionCollector(filterAuthor, { max: 1, time: 15000 });
                    const collectorUser = userRps.createReactionCollector(filterUser, { max: 1, time: 15000 });

                    let resultsEmbed = new MessageEmbed().setColor(extras.color_general);

                    let authorOption, userOption;
                    collectorAuthor.on("collect", (reaction) => {
                        authorRps.delete();
                        authorOption = reaction.emoji.name;
                        if (userOption !== undefined) {
                            if ((authorOption === "🗻" && userOption === "✂") ||
                            (authorOption === "✂" && userOption === "📰") ||
                            (authorOption === "📰" && userOption === "🗻")) {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`Ganador: ${message.author.username}`)
                                resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** ${types[authorOption]}`+
                                `\n• Elección de **${user.username}:** ${types[userOption]}`)
                                resultsEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                                return message.channel.send(resultsEmbed);
                            } 
                            else if (authorOption === userOption) {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`¡Empate! ${message.author.username} vs. ${user.username}`)
                                resultsEmbed.setDescription(`Esta vez no hubo suerte para ninguno de los dos. Ambos eligieron ${types[authorOption]}`)
                                return message.channel.send(resultsEmbed);
                            }
                            else {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`Ganador: ${user.username}`)
                                resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** ${types[authorOption]}`+
                                `\n• Elección de **${user.username}:** ${types[userOption]}`)
                                resultsEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true }))
                                return message.channel.send(resultsEmbed);
                            }
                        }
                    });

                    collectorUser.on("collect", (reaction) => {
                        collectorUser.stop();
                        userOption = reaction.emoji.name;
                        if (authorOption !== undefined) {
                            if ((authorOption === "🗻" && userOption === "✂") ||
                            (authorOption === "✂" && userOption === "📰") ||
                            (authorOption === "📰" && userOption === "🗻")) {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`Ganador: ${message.author.username}`)
                                resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** ${types[authorOption]}`+
                                `\n• Elección de **${user.username}:** ${types[userOption]}`)
                                resultsEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                                return message.channel.send(resultsEmbed);
                            } 
                            else if (authorOption === userOption) {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`¡Empate! ${message.author.username} vs. ${user.username}`)
                                resultsEmbed.setDescription(`Esta vez no hubo suerte para ninguno de los dos. Ambos eligieron ${types[authorOption]}`)
                                return message.channel.send(resultsEmbed);
                            }
                            else {
                                resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                                resultsEmbed.setTitle(`Ganador: ${user.username}`)
                                resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** ${types[authorOption]}`+
                                `\n• Elección de **${user.username}:** ${types[userOption]}`)
                                resultsEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true }))
                                return message.channel.send(resultsEmbed);
                            }
                        }
                    });

                    collectorUser.on("end", () => { userRps.delete(); });

                    collectorAuthor.on("end", () => { 
                        if (userOption === undefined && authorOption === undefined) {
                            const noResponse = new MessageEmbed()
                                .setTitle("Nadie respondió...")
                                .setDescription(`${extras.red_x} El juego entre ${message.author.username} y ${user.username} finalizó en un empate.`)
                                .setColor(extras.color_error)

                            authorRps.delete();
                            return message.channel.send(noResponse);
                        }
                        else if (authorOption === undefined) {
                            resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                            resultsEmbed.setTitle(`Ganador: ${user.username}`)
                            resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** Ninguna`+
                            `\n• Elección de **${user.username}:** ${types[userOption]}`)
                            resultsEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            authorRps.delete();
                            return message.channel.send(resultsEmbed);
                        }
                        else if (userOption === undefined) {
                            resultsEmbed.setAuthor("Piedra, papel o tijera | Juego terminado", bot.user.displayAvatarURL())
                            resultsEmbed.setTitle(`Ganador: ${message.author.username}`)
                            resultsEmbed.addField(`Resultados:`, `• Elección de **${message.author.username}:** ${types[authorOption]}`+
                            `\n• Elección de **${user.username}:** Ninguna`)
                            resultsEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            return message.channel.send(resultsEmbed);
                        }
                        else return;
                    });
                    message.channel.send("Esperando respuestas...");
                } catch { return extras.new_error(message, "Ocurrió un error", "Uno de los dos participantes tenía los mensajes directos desactivados. Juego cancelado."); }
            }
        });
        collector.on("end", () => { return m.delete(); })
    }
}

module.exports.help = {
    nombre: "rps",
    aliases: []
}
