const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
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

        collector.on("collect", (msg) => {
            if (msg.content.toLowerCase() === "accept") 
                return extras.new_error(message, "Juego cancelado.", `${user} no quiere jugar en este momento.`);
            else {
                const embed_author = new MessageEmbed()
                    .setAuthor(`Piedra, papel o tijera | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Duelo contra **${user.username}**: ¡Reacciona con uno de los emojis para elegir una opción!`)
                    .setColor(extras.color_general)

                try {
                    const rpsEmbed = await message.author.send(embed_author);

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
                } catch { return extras.new_error(message, "Ocurrió un error", "Uno de los dos participantes tenía los mensajes directos desactivados. Juego cancelado."); }
            }
        });
    }
}

module.exports.help = {
    nombre: "rps",
    aliases: []
}
