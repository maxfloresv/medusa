const { MessageEmbed } = require("discord.js");
const { new_error } = require("../utils/extras");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);
    if (!user) return new_error(message, "Ocurrió un error", "Debes mencionar a un usuario o especificar su ID."); // hay que cambiar esto por algo más original

    const images = ["https://cdn.discordapp.com/attachments/720857177107202079/720857497518342194/slap1.gif", "https://cdn.discordapp.com/attachments/720857177107202079/720857537141932142/slap2.gif", "https://cdn.discordapp.com/attachments/720857177107202079/720857869947371610/slap3.gif"] // etc, etc, etc
    const phrases = ["{author} le ha metido una cachetada a {user}", "A {author} le pego una arrechera y le volteo la jeta a {user}"] // etc...
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
