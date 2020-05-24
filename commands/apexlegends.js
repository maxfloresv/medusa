const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras.js");
const request = require("request");

module.exports.run = async (bot, message, args) => {
    const platforms = ["xbox", "pc", "ps4"];
    const lastWord = args[args.length - 1];
	let platform, username;

    if (!args[0]) return message.channel.send("Especifica un nombre de usuario...");
	if (platforms.includes(lastWord.toLowerCase())) {
		username = args.slice(0, args.length - 1).join(" ");
		switch (lastWord.toLowerCase()) {
            case "xbox": platform = "1"; break;
            case "pc": platform = "5"; break;
            case "ps4": platform = "2"; break;
            default: return;
        }
	} else {
		username = args.join(" ");
		platform = "5";
	}

    let apiLink = {
        "url": `https://public-api.tracker.gg/apex/v1/standard/profile/${platform}/${username}`,
        "headers": { "TRN-Api-Key": "8c0b40ad-5bf5-49c6-935c-9dfb52438078" }
    };
    let embed = new MessageEmbed()
        .setColor(extras.color_off)
        .setDescription(`${extras.loading} Espera mientras recibo los datos...`)

    message.channel.send(`🔸  Estadísticas de Apex Legends para **${username}:**`, embed).then(async m => {
        try {
            request(apiLink, (err, request, body) => {
                try {
                    body = JSON.parse(body);  
                } catch {
                    m.delete();
                    let embed = new MessageEmbed()
                        .setAuthor(`Ocurrió un error inesperado | ${message.author.tag}`, message.author.avatarURL() !== null ? message.author.avatarURL() : message.author.defaultAvatarURL)
                        .setDescription(`${extras.red_x} *Acciones recomendadas:* Revisa que el nick esté bien escrito. 
                        Si no hay errores con eso, únete a nuestro **[servidor de soporte](https://discord.gg/anYanmX)**.`)
                        .setColor(extras.color_error)
                    return message.channel.send(embed); 
                }
                if (body.errors) {
                    embed.setDescription(`${extras.red_x} No se pudo encontrar a ese usuario.`);
                    return m.edit(embed).then(m => m.delete({ timeout: 5000 })).catch(() => { return; });
                }
    
                for (i = 0; i < body.data.stats.length; i++) {
                    if (body.data.stats[i].metadata.key === "RankScore")
                        rankedpoints = `${body.data.stats[i].value} (Top ${body.data.stats[i].percentile !== undefined ? body.data.stats[i].percentile : "100"}%)`;
                }
    
                embed.setDescription("")
                embed.addField("Nombre de usuario:", body.data.metadata.platformUserHandle, true)
                embed.addField("Nivel:", body.data.metadata.level > 500 ? "500" : body.data.metadata.level, true)
                embed.addField("Asesinatos:", body.data.stats[1].value, true)
                embed.addField("Rango:", body.data.metadata.rankName, true)
                embed.addField("País:", body.data.metadata.countryCode !== null ? body.data.metadata.countryCode : "Sin definir", true)            
                embed.addField("RP:", rankedpoints, true)
                embed.setThumbnail(body.data.metadata.rankImage)
                return m.edit(embed).catch(() => { return; });
            });
        } catch { return message.channel.send("f"); }
    }).catch(() => { return; });
}

module.exports.help = {
  nombre: "apexlegends",
  aliases: []
}
