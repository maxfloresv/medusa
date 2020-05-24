const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras.js");
const request = require("request");

module.exports.run = async (bot, message, args) => {
    if (!args[0]) {
        return extras.new_error(message, "Ocurrió un error", "¡Especifica una opción válida!"+
        "\nUso del comando: `m!mcskin <opción> <usuario>`."+
        "\nOpciones disponibles: `head` (avatar 3D), `body` (cuerpo completo)");

    } else if (args[0].toLowerCase() == "body") {
        let username = args[1];
        if (!username) return extras.new_error(message, "Ocurrió un error", "Debes especificar un nombre de usuario.");

        let apiURL = `https://api.mojang.com/users/profiles/minecraft/${username}`;
        let embed = new MessageEmbed()
            .setColor(extras.color_off)
            .setDescription(`${extras.loading} Espera mientras recibo los datos...`)

        message.channel.send(`🔸  Skin de Minecraft de **${username}:**`, embed).then(async m => {
            try {
                request(apiURL, (err, response, body) => {
                    try {
                        body = JSON.parse(body);
                    } catch {
                        embed.setDescription(`${extras.red_x} Ese usuario no es premium.`)
                        return m.edit(embed).then(m => m.delete({ timeout: 10000 })).catch(() => { return; })
                    }

                    let id = body.id;
                    let bodyURL = `https://crafatar.com/renders/body/${id}.png?overlay`;
                    embed.setDescription("")
                    embed.setImage(bodyURL)
    
                    return m.edit(`🔸  Skin de Minecraft de **${username}:** \nModo: \`Cuerpo completo\`.`, embed).catch(() => { return; });
                });
            } catch { return; }
        }).catch(() => { return; });

    } else if (args[0].toLowerCase() == "head") {
        let username = args[1];
        if (!username) return extras.new_error(message, "Ocurrió un error", "Debes especificar un nombre de usuario.");

        let apiURL = `https://api.mojang.com/users/profiles/minecraft/${username}`;
        let embed = new MessageEmbed()
            .setColor(extras.color_off)
            .setDescription(`${extras.loading} Espera mientras recibo los datos...`)

        message.channel.send(`🔸  Skin de Minecraft de **${username}:**`, embed).then(async m => {
            try {
                request(apiURL, (err, response, body) => {
                    try {
                        body = JSON.parse(body);
                    } catch {
                        embed.setDescription(`${extras.red_x} Ese usuario no es premium.`)
                        return m.edit(embed).then(m => m.delete({ timeout: 10000 })).catch(() => { return; })
                    }

                    let id = body.id;
                    let bodyURL = `https://crafatar.com/renders/head/${id}.png?overlay`;
                    embed.setDescription("")
                    embed.setImage(bodyURL)

                    return m.edit(`🔸  Skin de Minecraft de **${username}:** \nModo: \`Avatar 3D\`.`, embed).catch(() => { return; });
                });
            } catch { return; }
        }).catch(() => { return; });

    } else {
        return extras.new_error(message, "Ocurrió un error", "¡Esa no es una opción válida!"+
        "\nUso del comando: `m!mcskin <opción> <usuario>`."+
        "\nOpciones disponibles: `head` (avatar 3D), `body` (cuerpo completo)");
    }
}

module.exports.help = {
  nombre: "mcskin",
  aliases: []
}
