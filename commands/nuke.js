const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras.js");

module.exports.run = async (bot, message, args) => {
    if (!message.member.hasPermission("ADMINISTRATOR")) return extras.permission_error(message, "Necesitas el permiso `ADMINISTRATOR` para hacer esto.");
    if (!args[0]) return extras.new_error(message, "Ocurrió un error", "Debes especificar un canal.");
    else {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) return extras.new_error(message, "Ocurrió un error", "Ese canal no existe.");
        else if (channel.type === "text" || channel.type === "voice") {
            try {
                let embed = new MessageEmbed()
                .setTitle("¿Estás seguro de que quieres restablecer el canal?")
                .setDescription(":warning: Esta acción lo borrará y creará nuevamente, **conservando sus propiedades**, tales como permisos, "+
                "categoría, nombre, descripción, y en el caso de los canales de voz, también el bitrate y límite de usuarios.\n\n"+
                `\`Los mensajes serán los únicos que se perderán de manera irreversible.\`\nConfirma con ${extras.green_tick}, rechaza con ${extras.red_x}.`)
                .setColor(extras.color_warn)

                let filter = (reaction, user) => { return [extras.green_tick_id, extras.red_x_id].includes(reaction.emoji.id) && user.id === message.author.id; };
                message.channel.send(embed).then(async m => { await m.react(extras.green_tick_id); await m.react(extras.red_x_id);
                    m.awaitReactions(filter, { max: 1, time: 60000 })
                    .then(async collected => {
                        m.delete();
                        let reaction = collected.first();

                        if (reaction.emoji.id === extras.green_tick_id) {
                            let position = channel.rawPosition;
                            let embed = new MessageEmbed()
                            .setAuthor(`Realizando operación... | ${message.author.tag}`, message.author.avatarURL() !== null ? message.author.avatarURL() : message.author.defaultAvatarURL)
                            .setDescription(`${extras.loading} Restableciendo canal... espera un momento.`)
                            .setColor(extras.color_success)
        
                            message.channel.send(embed).then(async m => {
                                embed.setAuthor(`Operación realizada | ${message.author.tag}`, message.author.avatarURL() !== null ? message.author.avatarURL() : message.author.defaultAvatarURL)
                                embed.setDescription(`${extras.green_tick} ¡Canal restablecido con éxito!`)
        
                                await channel.delete();
                                await channel.clone().then(c => c.setPosition(position));
                                await m.edit(embed).catch(() => { return; });
                            }).catch(() => { return; });
                        } 
                        else try { m.delete(); } catch { return; }  
                    })
                    .catch(async () => {
                        m.delete();
                        return extras.new_error(message, "Ocurrió un error", "No reaccionaste al mensaje a tiempo. El menú se ha cerrado.") 
                    })
                })
                .catch(() => { return; })
            } catch { return; }
        }
        else return extras.new_error(message, "Ocurrió un error", "Ese canal no existe.");
    }
}

module.exports.help = {
  nombre: "nuke",
  aliases: []
}
