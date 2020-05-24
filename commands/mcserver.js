const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras.js");
const request = require("request");

module.exports.run = async (bot, message, args) => {
    if (!args[0]) return extras.new_error(message, "Ocurrió un error", "¡Debes especificar un servidor y un puerto (por defecto: 25565)!")

    let serverInfo = args[0].split(":");
    if (!serverInfo[1]) serverInfo[1] = 25565;

    let pingURL = `https://api.minetools.eu/ping/${serverInfo[0]}/${serverInfo[1]}`;
    let icon = `https://api.minetools.eu/favicon/${serverInfo[0]}/${serverInfo[1]}`;
    let embed = new MessageEmbed()
        .setColor(extras.color_off)
        .setDescription(`${extras.loading} Espera mientras recibo los datos...`)

    message.channel.send(`🔸  Información del servidor **${serverInfo[0]}:**`, embed).then(async m => {
        request(pingURL, (err, response, body) => {
            body = JSON.parse(body);
            if (body.error) {
                embed.setDescription(`${extras.red_x} La IP es incorrecta o el servidor está offline.`)
                return m.edit(embed).then(m => m.delete({ timeout: 10000 })).catch(() => { return; });
            }
            if (body.favicon) embed.setThumbnail(icon)
            let descReplace = /§\w/g;
            embed.setDescription("")
            embed.addField("IP:", `${serverInfo[0]}:${serverInfo[1]}`, true)
            embed.addField("Estado:", "Online", true)
            embed.addField("Versiones/(protocolo):", `${body.version.name}/(${body.version.protocol})`)
            embed.addField("Jugadores conectados:", `${body.players.online}/${body.players.max}`, true)
            embed.addField("Latencia promedio:", `${body.latency.toFixed(0)} ms`, true)
            embed.addField("MOTD:", "```" + body.description.replace(descReplace, "").trim() + "```")
            return m.edit(embed);
        });
    })
}

module.exports.help = {
  nombre: "mcserver",
  aliases: []
}
