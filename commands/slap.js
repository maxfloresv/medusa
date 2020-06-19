const { MessageEmbed } = require("discord.js");
const { new_error } = require("../utils/extras");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || (message.guild.members.cache.get(args[0]) !== undefined ? message.guild.members.cache.get(args[0]).user : false);
    if (!user) return new_error(message, "Ocurrió un error", "Debes mencionar a un usuario o especificar su ID."); // hay que cambiar esto por algo más original

    const images = ["https://cdn.discordapp.com/attachments/720857177107202079/720857497518342194/slap1.gif", "https://cdn.discordapp.com/attachments/720857177107202079/720857537141932142/slap2.gif", "https://cdn.discordapp.com/attachments/720857177107202079/720857869947371610/slap3.gif", "https://cdn.discordapp.com/attachments/720857177107202079/723325183267700736/slap4.gif", "https://cdn.discordapp.com/attachments/720857177107202079/723325457713332265/slap6.gif", "https://cdn.discordapp.com/attachments/720857177107202079/723325735170867280/slap7.gif"];
    const phrases = ["{author} le ha metido una cachetada a {user}", "A {author} le pegó una arrechera y le volteó la jeta a {user}"];
    const randomImg = images[Math.floor(Math.random() * images.length)];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    const embed = new MessageEmbed()
        .setAuthor(randomPhrase.replace("{author}", message.author.username).replace("{user}", user.username))
        .setColor("RANDOM")
        .setImage(randomImg)

    return message.channel.send(embed);
}

module.exports.help = {
    nombre: "slap",
    aliases: []
}
