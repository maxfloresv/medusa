const { MessageEmbed } = require("discord.js");
const { new_error } = require("../utils/extras");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);
    if (!user) return new_error(message, "Ocurrió un error", "Debes mencionar a un usuario o especificar su ID."); // hay que cambiar esto por algo más original

    const images = ["https://cdn.discordapp.com/attachments/720831146799399014/720866586789019658/Punch1.gif", "https://cdn.discordapp.com/attachments/720831146799399014/720866292491354182/punch2.gif", "https://cdn.discordapp.com/attachments/720831146799399014/720866438457458688/punch3.gif", "https://cdn.discordapp.com/attachments/720831146799399014/723324063165972560/punch4.gif", "] // etc, etc, etc
    const phrases = ["{author} le metio su solo coñazo a {user} por mamaguebo.", "{Author} ha golpeado a {user}", "{author} Estaba rifando una coñaza, y {user} tenia todos los números"] // etc...
    const randomImg = images[Math.floor(Math.random() * images.length)];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    const embed = new MessageEmbed()
        .setAuthor(randomPhrase.replace("{author}", message.author.username).replace("{user}", user.username))
        .setImage(randomImg)

    return message.channel.send(embed);
}

module.exports.help = {
    nombre: "punch",
    aliases: []
}
