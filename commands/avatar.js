const Discord = require("discord.js");
const extras = require("../utils/extras.js");
const cooldown = new Map(), cooldownTime = 10000;
const ms = require("parse-ms");

module.exports.run = async (bot, message, args) => {
    let user = message.mentions.users.first() || bot.users.cache.get(args[0]);
    if (!cooldown.has(message.author.id)) {
        if (!user) {
            let embed = new Discord.MessageEmbed()
                .setTitle(`Avatar de ${message.author.tag}`)
                .setColor(extras.color_general)
                .setImage(message.author.avatarURL() !== null ? message.author.avatarURL({ format: "png", dynamic: true, size: 1024 }) : message.author.defaultAvatarURL)
            message.channel.send(embed);
    
        } else {
            let embed = new Discord.MessageEmbed()
                .setTitle(`Avatar de ${user.username}#${user.discriminator}`)
                .setColor(extras.color_general)
                .setImage(user.avatarURL() !== null ? user.avatarURL({ format: "png", dynamic: true, size: 1024 }) : user.defaultAvatarURL)
            message.channel.send(embed);
        }
        cooldown.set(message.author.id, Date.now());
        setTimeout(() => {
            cooldown.delete(message.author.id);
        }, cooldownTime);
    
    } else {
        let remaining = cooldown.get(message.author.id);
        return extras.cooldown_info(message, `Debes esperar \`${ms(cooldownTime - (Date.now() - remaining)).seconds} segundo(s)\` para usar este comando de nuevo.`);
    }
}

module.exports.help = {
  nombre: "avatar",
  aliases: ["picture", "photo"]
}
