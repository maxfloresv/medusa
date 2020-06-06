const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
const triesLeft = new Map();
const cooldown = new Set();
const Canvas = require("canvas");
const canvas = Canvas.createCanvas(175, 50);
const ctx = canvas.getContext("2d");
const path = require("path");
const fs = require("fs");

module.exports.run = async (bot, message, args, settings) => {
    if (!settings.captchaVerification
        || message.channel.id != settings.verificationChannel
        || message.member.roles.cache.has(settings.verificationRole)
        || !message.member.hasPermission(0)) return;

    else {
        if (triesLeft.has(message.author.id)) return extras.new_error(message, "Ocurrió un error", "Ya tienes un captcha pendiente por resolver. Revisa tus mensajes privados.");

        const channel = message.guild.channels.cache.find(c => c.id == settings.verificationChannel);
        const captcha = await createCaptcha();
        triesLeft.set(message.author.id, 3);
        const filter = msg => {
            if (msg.author.bot) return;
            else if (msg.author.id === message.author.id) return true;
        };
        try {
            let embed = new MessageEmbed()
                .setAuthor(`Verificación requerida | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTitle(`¡Bienvenid@ a ${message.guild.name}!`)
                .setDescription("Antes de poder obtener acceso a los canales de usuario del servidor, necesitas verificar que no eres un bot completando el siguiente captcha:")
                .setColor(extras.color_general)
                .addField("Tu captcha:", "(Ten en cuenta las mayúsculas/minúsculas)")
                .attachFiles([{
                    attachment: path.join(__dirname, "..", "images", "captchas", `${captcha}.png`),
                    name: "captcha.png"
                }])
                .setImage(`attachment://captcha.png`)
                .setFooter("Debes responder a este mensaje privado. Tienes 2 minutos.")
                .setTimestamp()

            const captchaMessage = await message.author.send(embed);
            const collector = captchaMessage.channel.createMessageCollector(filter, { time: 120000 });
            let attempts = [];

            collector.on("collect", async (msg) => {
                if (msg.content === captcha) {
                    attempts.push(msg.content);
                    triesLeft.delete(message.author.id);
                    collector.stop();
                    let embed = new MessageEmbed()
                        .setAuthor("Verificación completada.")
                        .setTitle("¡Gracias por verificarte!")
                        .setColor(extras.color_off)
                        .setDescription(`Ahora tienes acceso a los canales de usuario de ${message.guild.name}.`)
                    await msg.channel.send(embed);
                    await message.member.roles.add(settings.verificationRole);
                    if (settings.logsChannel !== "") {
                        const logChannel = message.guild.channels.cache.find(c => c.id == settings.logsChannel);
                        if (logChannel) {
                            let j = 0;
                            let embed = new MessageEmbed()
                                .setAuthor(`Captcha completado | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                                .setTitle("Información adicional:")
                                .setColor(extras.color_success)
                                .setTimestamp()
                                .addField("Usuario:", `${message.author.tag} *(${message.author.id})*`)
                                .addField("Captcha dado por el bot:", captcha)
                                .addField("Captchas enviados por el usuario:", attempts.map(a => attempts.indexOf(a) < attempts.length - 1 ? `**${++j}** :: [${extras.red_x}] ${a}` : `**${++j}** :: [${extras.green_tick}] ${a}`).join("\n"))
                                .attachFiles([{
                                    attachment: path.join(__dirname, "..", "images", "captchas", `${captcha}.png`),
                                    name: "captcha.png"
                                }])
                                .setImage(`attachment://captcha.png`)

                            await logChannel.send(embed).catch(e => console.log(e));                               
                        }
                    }
                    fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`);
                } else {
                    let i = triesLeft.get(message.author.id);
                    if (i === 1) {
                        attempts.push(msg.content);
                        triesLeft.delete(message.author.id);
                        collector.stop();
                        if (settings.logsChannel !== "") {
                            const logChannel = message.guild.channels.cache.find(c => c.id == settings.logsChannel);
                            if (logChannel) {
                                let j = 0;
                                let embed = new MessageEmbed()
                                    .setAuthor(`Captcha erróneo | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                                    .setTitle("Información adicional:")
                                    .setColor(extras.color_error)
                                    .setTimestamp()
                                    .addField("Usuario:", `${message.author.tag} *(${message.author.id})*`)
                                    .addField("Captcha dado por el bot:", captcha)
                                    .addField("Captchas enviados por el usuario:", attempts.map(a => `**${++j}** :: [${extras.red_x}] ${a}`).join("\n"))
                                    .attachFiles([{
                                        attachment: path.join(__dirname, "..", "images", "captchas", `${captcha}.png`),
                                        name: "captcha.png"
                                    }])
                                    .setImage(`attachment://captcha.png`)

                                await logChannel.send(embed).catch(e => console.log(e));
                            }
                        }
                        fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`);
                        return msg.channel.send(`**[${message.guild.name}]** Se te acabaron los intentos posibles. Para recibir otro captcha, escribe ${settings.prefix}verify en ${channel}.`);
                    } else {
                        attempts.push(msg.content);
                        i--;
                        triesLeft.set(message.author.id, i);
                        msg.channel.send(`**[${message.guild.name}]** Ese no es el captcha correcto. Tienes ${i === 1 ? "1 intento restante" : `${i} intentos restantes`}.`);
                    }
                }
            });

            collector.on("end", () => {
                if (triesLeft.has(message.author.id)) {
                    triesLeft.delete(message.author.id);
                    fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`);
                    return message.author.send(`**[${message.guild.name}]** No completaste el captcha a tiempo. Puedes solicitar otro desde ${channel} con: **${settings.prefix}verify**.`);
                }
            });
        } catch {
            triesLeft.delete(message.author.id);

            if (cooldown.has(message.author.id)) {
                message.delete();
                return message.channel.send(`**(${message.author.tag})** Espera 30 segundos antes de solicitar la información nuevamente.`).then(m => m.delete({ timeout: 3000 }));
            }

            cooldown.add(message.author.id);
            setTimeout(() => { cooldown.delete(message.author.id); }, 30000);

            let embed = new MessageEmbed()
                .setTitle("¿Cómo activo mis mensajes directos?")
                .setURL("https://support.discord.com/hc/es/articles/217916488")
                .setColor(extras.color_general)
                .setImage("https://i.imgur.com/spxOqo3.png")
                .setFooter("Si tienes inquietudes, puedes contactar a un Staff del servidor.")

            return channel.send(`${message.author}, este servidor usa un sistema de verificación por captcha. Necesitas activar tus mensajes directos para poder enviarte un código.`+
            `\nSigue los pasos de la imagen de abajo en la configuración de tu cuenta y luego escribe **${settings.prefix}verify** en este canal para recibir el código.`, embed); 
        }
    }
}

async function createCaptcha() {
    const combinations = "pqqC7G9yKApUAMBFUQjpQ7gT2ZfLyEvhQBQXN2qwpQRyxsak5nH6rLtkT2AHYzhmVkejzUeSDqcuX7YLdKNe9TAkWdtRwjVwqAwz8zMLaKXLSn7YtteafC7qgdAEDNZhcmdtHA9GBy9ngW2z"+
    "S8tYLwUf3eHgNFjBSgj5Jpay2mEzyPSwgyYep5yvLtRcrrjsyhFuZheXqtm3uwra8p37NJgxDjpA54UK38XtfZW6GHweBv4y9jsVawp8SN7tbJ3VKp4PeHr2S7xpsU8fdk63WCpa3mSZ8XcxZ3Nf4dvtCztbd7sZ"+
    "Xv3NSAv3WPM8Ngy76ngpkEUM8zFDmVv2NeN7mKYSAHt9PuyW7Wu632DdEQA4tKhFre3J2hVvfvzFk94DJ5tKy5627wCMYAjpBLJmyF7vs2cECE5thGqUa85Mz33xt5R8sk8nj8697xGvA4Vme3gHjepsbfJt6kHU"+
    "aqFKeveNpT2AhkdW85c9SgZj4vCp4gPwAPC3NZFLXhkLKkvwCru6n2gFKgbZtT3MpFaGfnzevEmHL78F8RLMvpz3AcDhDZYM4n4pP8MB8j8EGCssKbREnADqNgX5wRH26sC2WtCrVkaEwb4sfAk6bU2Z5hQEXSRm";
    let randomCombination = Math.floor(Math.random() * (combinations.length - 6));
    const captcha = combinations.slice(randomCombination, randomCombination + 6);
    
    const background = await Canvas.loadImage(path.join(__dirname, "..", "images", "captcha_background.png"))
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
    ctx.font = "25px Raleway Light"
    const text = ctx.measureText(captcha).width;
    for (let i = 0; i < captcha.length; i++) {
        let alpha = Math.random() * 0.25 + 0.4;
        let size = Math.floor(Math.random() * 10) + 20;
        let angle = Math.floor(Math.random() * 37) + 11;
        ctx.font = `${size}px Raleway SemiBold`
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha}}`
        //ctx.rotate(angle * (Math.PI / 180))
        ctx.fillText(captcha[i], ((5 - i) * canvas.width - 2 * text) / 10 - 2 * i, (canvas.height + 12.5) / 2)
    }
    //ctx.fillText(captcha, (canvas.width - text) / 2, (canvas.height + 12.5) / 2) // 37, 32
    fs.writeFileSync(path.join(__dirname, "..", "images", "captchas", `${captcha}.png`), canvas.toBuffer('image/png'))
    return captcha;
}

module.exports.help = {
    nombre: "verify",
    aliases: []
}
