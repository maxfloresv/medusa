const Discord = require("discord.js");
const extras = require("../utils/extras.js");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || bot.users.cache.get(args[0]);
    if (!user) {
        let embed = new Discord.MessageEmbed()
            .setTitle(`Avatar de ${message.author.tag}`)
            .setColor(extras.color_general)
            .setImage(message.author.avatarURL() !== null ? message.author.avatarURL({ format: "png", dynamic: true, size: 1024 }) : message.author.defaultAvatarURL)
        return message.channel.send(embed);

    } else {
        let embed = new Discord.MessageEmbed()
            .setTitle(`Avatar de ${user.username}#${user.discriminator}`)
            .setColor(extras.color_general)
            .setImage(user.avatarURL() !== null ? user.avatarURL({ format: "png", dynamic: true, size: 1024 }) : user.defaultAvatarURL)
        return message.channel.send(embed);
    }

}

module.exports.help = {
  nombre: "avatar"
}
