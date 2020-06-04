const { MessageEmbed, MessageAttachment } = require("discord.js");
const path = require("path");
const cooldown = new Set();
const extras = require("../utils/extras");
const localXp = require("../databases/model/localXp");
const Canvas = require('canvas');
const canvas = Canvas.createCanvas(300, 117);
const ctx = canvas.getContext('2d');

module.exports.run = async (bot) => {
    bot.on("message", async (message) => {
        if (message.author.bot || message.partial || message.content === null || message.member === null || message.guild === null) return;

        let settings, userdata;
        try { settings = await bot.getGuild(message.guild); } catch { return; }
        try { userdata = await bot.getUserData(message.author); } catch { return; }

        if (message.content.toLowerCase().startsWith(settings.prefix.toLowerCase())) {
            let msgDeconstruction = message.content.split(" ");
            let command = msgDeconstruction[0].toLowerCase();
            if (settings.disabledCmds.some(c => command.includes(c))) return;
            let args = msgDeconstruction.slice(1);
            let commandFile = bot.commands.get(command.slice(settings.prefix.length));
    
            if (commandFile) commandFile.run(bot, message, args, settings, userdata);

        } else {
            if (settings.blacklistedWords && settings.blacklistedWords.length !== 0) {
                if (settings.blacklistedWords.some(w => w.length > 3 && message.content.toLowerCase().includes(w.toLowerCase())) && !message.member.hasPermission("MANAGE_MESSAGES")) {
                    let logChannel = message.guild.channels.cache.find(c => c.id == settings.logsChannel);
                    if (!logChannel) return message.delete();
                    let embed = new MessageEmbed()
                        .setAuthor(`Infracción detectada | ${message.guild.name}`, message.guild.iconURL() !== null ? message.guild.iconURL() : bot.user.avatarURL)
                        .setTitle("Información adicional:")
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setColor(extras.color_log_punishments)
                        .addField("Infracción cometida:", "Usar una palabra bloqueada.")
                        .addField("Infractor:", `${message.author.tag} *(${message.author.id})*`)
                        .addField("📄 Contenido del mensaje:", message.content)
    
                    message.delete();
                    return logChannel.send(embed);
                } else if (settings.blacklistedWords.some(w => w.length <= 3 && message.content.toLowerCase().split(" ").indexOf(w.toLowerCase()) !== -1) && !message.member.hasPermission("MANAGE_MESSAGES")) {
                    let logChannel = message.guild.channels.cache.find(c => c.id == settings.logsChannel);
                    if (!logChannel) return message.delete();
                    let embed = new MessageEmbed()
                        .setAuthor(`Infracción detectada | ${message.guild.name}`, message.guild.iconURL() !== null ? message.guild.iconURL() : bot.user.avatarURL)
                        .setTitle("Información adicional:")
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setColor(extras.color_log_punishments)
                        .addField("Infracción cometida:", "Usar una palabra bloqueada.")
                        .addField("Infractor:", `${message.author.tag} *(${message.author.id})*`)
                        .addField("📄 Contenido del mensaje:", message.content)
    
                    message.delete();
                    return logChannel.send(embed);
                }
            }

            if (message.content === "<@!698710925288407079>") {
                let embed = new MessageEmbed()
                    .setAuthor(`Menú de ayuda | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setTitle("Acerca del bot Medusa")
                    .setDescription("Solo puedes acceder aquí si me mencionas. A continuación tienes más información de la configuración del servidor actual y enlaces útiles:")
                    .setColor(extras.color_general)
                    .setThumbnail(bot.user.avatarURL())
                    .addField("❓ **Prefijo:**", settings.prefix, true)
                    .addField("🔸 Comando de ayuda:", `${settings.prefix}help`, true)
                    .addField("🎟️ Servidor de soporte:", "[Haz clic acá para acceder](https://discord.gg/anYanmX)")
                    .addField("🤖 Invitación del bot:", "[Haz clic acá para obtener](https://discord.com/api/oauth2/authorize?client_id=698710925288407079&permissions=8&scope=bot)")
              
                return message.channel.send(embed);
            }

            if (settings.top1 !== "" && settings.top1Role !== "") {
                localXp.find({ guildID: message.guild.id }).sort({ "xp": -1 }).limit(1).exec(async (err, res) => {
                    let leader = message.guild.members.cache.get(res[0].userID);
                    if (!leader) return;
                    else if (settings.top1 !== leader.user.id) {
                        let top1Before = message.guild.members.cache.get(settings.top1);
                        try {
                            await top1Before.roles.remove(settings.top1Role);
                            extras.new_success(message, "Ranking", `Felicidades ${leader.user.username}, eres el nuevo top #1 de **${message.guild.name}**.`+
                            ` Se te ha dado el rol <@&${settings.top1Role}>.`);
                        } catch { return; }
                    }
    
                    try {
                        leader.roles.add(settings.top1Role);
                        await bot.updateGuild(message.guild, { top1: leader.user.id });
                    } catch(err) { return console.log(err); }
                });
            }
            // Optimizable.
            if (!cooldown.has(message.author.id)) {
                cooldown.add(message.author.id);
                setTimeout(() => { cooldown.delete(message.author.id); }, 300000);

                let xpGenerated = Math.floor(Math.random() * 8) + 5;
                localXp.findOne({ userID: message.author.id, guildID: message.guild.id }, async (err, data) => {
                    if (err) return;
                    if (!data) {
                        try {
                            const newXp = new localXp({
                                userID: message.author.id,
                                guildID: message.guild.id,
                                xp: xpGenerated
                            });
                            newXp.save().catch(() => { return; });
                        } catch { return; }
                    } else {
                        try {
                            data.xp = data.xp + xpGenerated;
                            data.save().catch(() => { return; });
                        } catch { return; }
                    }
                });
                
                if (this.calculateLevelXp(userdata.globalLevel + 1) <= userdata.totalGlobalXp + xpGenerated) {
                    let xpDiff = userdata.totalGlobalXp + xpGenerated - this.calculateLevelXp(userdata.globalLevel + 1);
                    try {
                        await bot.updateUserData(message.author, { globalXp: xpDiff, $inc: { totalGlobalXp: xpGenerated, globalLevel: 1 }});
                    } catch { return; }
                    
                    if (!settings.lvlUpAlert) return;

                    const background = await Canvas.loadImage(path.join(__dirname, "..", "images", "bg-lvlup.png"));
                    const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: "png" }));
    
                    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
                    ctx.drawImage(avatar, 18, 20, 76, 76)
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '32px Raleway'
                    ctx.fillText(`${userdata.globalLevel + 1}`, calculateCoord(129, userdata.globalLevel + 1), 65)
    
                    let attachment = new MessageAttachment(canvas.toBuffer());
                    let embed = new MessageEmbed()
                        .setDescription(`:arrow_double_up: ${message.author}, ¡has subido de nivel!`+
                        `\nEXP requerida para el siguiente nivel: **${this.calculateLevelXp(userdata.globalLevel + 2) - this.calculateLevelXp(userdata.globalLevel + 1)}**`)
                        .setColor(extras.color_general)
                            
                    await message.channel.send(embed).catch(() => { return; });
                    await message.channel.send(attachment).catch(() => { return; });
                } else {
                    try {
                        await bot.updateUserData(message.author, { $inc: { globalXp: xpGenerated, totalGlobalXp: xpGenerated }});
                    } catch { return; }
                }
            }
        }
    });
}

function calculateCoord(baseCoord, number) {
    let length = number.toString().length;
    baseCoord -= 4 * (length - 1);
    return baseCoord;
}

module.exports.calculateLevelXp = level => {
    return Math.floor(434 * level ** 2 / 6); 
}
