const { MessageEmbed } = require("discord.js");
const { new_error } = require("../utils/extras");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);
    if (!user) return new_error(message, "Ocurrió un error", "Debes mencionar a un usuario o especificar su ID."); // hay que cambiar esto por algo más original

    const images = ["aquí va el link de la imagen 1", "aquí va el de la img 2"] // etc, etc, etc
    const phrases = ["frase 1 cuando ocupas este comando", "frase 2", "frase 3"] // etc...
    const randomImg = images[Math.floor(Math.random() * images.length)];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    const embed = new MessageEmbed()
        .setAuthor(randomPhrase.replace("{author}", message.author.username).replace("{user}", user.username))
        .setImage(randomImg)

    return message.channel.send(embed);
}

module.exports.help = {
    nombre: "slap",
    aliases: []
}
