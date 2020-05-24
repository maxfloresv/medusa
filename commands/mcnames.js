const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras.js");
const request = require("request");
const ms = require("parse-ms");

module.exports.run = async (bot, message, args) => {
    let username = args[0];
    if (!username) return extras.new_error(message, "Ocurrió un error", "Debes especificar un nombre de usuario.");

    let apiURL = `https://api.mojang.com/users/profiles/minecraft/${username}`;
    let embed = new MessageEmbed()
        .setColor(extras.color_off)
        .setDescription(`${extras.loading} Espera mientras recibo los datos...`)

    message.channel.send(`🔸  Historial de nombres de **${username}:**`, embed).then(async m => {
        try {
            request(apiURL, (err, response, body) => {
                try {
                    body = JSON.parse(body);
                } catch {
                    embed.setDescription(`${extras.red_x} Ese usuario no es premium.`)
                    return m.edit(embed).then(m => m.delete({ timeout: 10000 })).catch(() => { return; })
                }

                let id = body.id;
                let namesURL = `https://api.mojang.com/user/profiles/${id}/names`;

                try {
                    request(namesURL, (err, response, body) => {
                        body = JSON.parse(body);
                        let history = "```py\n";

                        if (body.length === 1) embed.setDescription(`${extras.red_x} El usuario no registra cambios en su nombre.`)
                        else {
                            for (i = 0; i < body.length; i++) {
                                if (i === 0) history += `[${i + 1}] ${body[i].name} | Nombre original\n`
                                else history += `[${i + 1}] ${body[i].name} # Cambiado hace ${ms(Date.now() - body[i].changedToAt).days} día(s)\n`
                            }
                            embed.setDescription(history + "```");
                        }
                        return m.edit(embed).catch(() => { return; });
                    });
                } catch { return; }
            });
        } catch { return; }
    }).catch(() => { return; });
}

module.exports.help = {
  nombre: "mcnames",
  aliases: []
}
