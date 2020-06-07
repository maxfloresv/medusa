const { MessageEmbed } = require("discord.js");
const extras = require("../utils/extras");
const triesLeft = new Map();
const cooldown = new Set();
const { createCanvas, loadImage } = require("canvas");
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
        const filter = msg => { return msg.author.id === message.author.id; };
        try {
            let embed = new MessageEmbed()
                .setAuthor(`Verificación requerida | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTitle(`¡Bienvenid@ a ${message.guild.name}!`)
                .setDescription("Antes de poder obtener acceso a los canales de usuario del servidor, necesitas verificar que no eres un robot completando el siguiente captcha:")
                .setColor(extras.color_general)
                .addField("Tu captcha:", "Escríbelo **todo junto** y ten en cuenta las **mayúsculas/minúsculas**.")
                .attachFiles([{
                    attachment: path.join(__dirname, "..", "images", "captchas", `${captcha}.png`),
                    name: "captcha.png"
                }])
                .setImage(`attachment://captcha.png`)
                .setFooter("Debes responder a este mensaje privado. Tienes 1 minuto.")
                .setTimestamp()

            const captchaMessage = await message.author.send(embed);
            const collector = captchaMessage.channel.createMessageCollector(filter, { time: 60000 });
            // todo bien hasta acá double check.
            let attempts = []; // hmm

            collector.on("collect", async (msg) => {
                if (msg.content === captcha) {
                    attempts.push(msg.content); // unico
                    triesLeft.delete(message.author.id);
                    collector.stop();
                    let embed = new MessageEmbed()
                        .setAuthor("Verificación completada.")
                        .setTitle("¡Gracias por verificarte!")
                        .setColor(extras.color_off)
                        .setDescription(`Ahora tienes acceso a los canales de usuario de ${message.guild.name}.`)

                    try {
                        await message.member.roles.add(settings.verificationRole);
                    } catch {
                        //fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`); no desvincula? ---pending test
                        msg.channel.send(`**[${message.guild.name}]** No se pudo completar la verificación.\n${extras.red_x} Error: No te pude otorgar el rol.`+
                        `\n\n**• Acciones recomendadas:** Avisarle a un Staff del servidor desde el canal ${channel} para que configure bien este módulo...`);

                        const logChannel = message.guild.channels.cache.find(c => c.id == settings.logsChannel);
                        if (logChannel) {
                            let embed = new MessageEmbed()
                                .setAuthor(`Error de configuración | ${message.guild.name}`, message.guild.iconURL() !== null ? message.guild.iconURL() : bot.user.avatarURL())
                                .setTitle("Información adicional:")
                                .setColor(extras.color_error)
                                .setDescription(message.guild.roles.cache.find(c => c.id == settings.verificationRole) ? `${extras.red_x} No puedo asignar el rol`+
                                ` <@&${settings.verificationRole}> debido a que se encuentra más arriba que el mío en la lista de roles. Más información acá:`+
                                ` [Discord: Parte II. Jerarquías de roles](https://support.discord.com/hc/es/articles/214836687-Administraci%C3%B3n-de-Roles-B%C3%A1sico-).`
                                : `${extras.red_x} El rol a asignar fue eliminado. Configura nuevamente el módulo con **${settings.prefix}settings captcha on**.`)
                                .addField("💾 Módulo:", "**Verificación por captcha**");
                            
                            return logChannel.send(embed).catch(() => { return; });
                        }
                    }
                    await msg.channel.send(embed);
                    //bien de aquí hasta el else

                    if (!!settings.logsChannel) {
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
                    // ta bien el else
                    let i = triesLeft.get(message.author.id);
                    if (i === 1) {
                        attempts.push(msg.content); // no es necesario logear los intentos si no tienen activados los logs
                        triesLeft.delete(message.author.id);
                        collector.stop();
                        if (!!settings.logsChannel) {
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
                // ta bien
                if (triesLeft.has(message.author.id)) {
                    triesLeft.delete(message.author.id);
                    fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`);
                    return message.author.send(`**[${message.guild.name}]** No completaste el captcha a tiempo. Puedes solicitar otro desde ${channel} con: **${settings.prefix}verify**.`);
                }
            });
            // tudo bem
        } catch {
            triesLeft.delete(message.author.id); // revisar si simplemente no se puede añadir

            if (cooldown.has(message.author.id)) {
                message.delete();
                return message.channel.send(`**(${message.author.tag})** Espera un momento antes de usar este comando de nuevo.`).then(m => m.delete({ timeout: 3000 }));
            }

            cooldown.add(message.author.id);
            setTimeout(() => { cooldown.delete(message.author.id); }, 10000);

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
    const canvas = createCanvas(240, 80);
    const ctx = canvas.getContext("2d");
    const charPool = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

    const configureCaptcha = str => {
        const transformText = [...str].map(char => {
            if (/[iIlLoO01]/.test(char)) {
                let randomChar = charPool[Math.floor(Math.random() * charPool.length)];
                return Boolean(Math.round(Math.random())) ? randomChar.toUpperCase() : randomChar.toLowerCase();
            }
            else return Boolean(Math.round(Math.random())) ? char.toUpperCase() : char.toLowerCase();
        }).join("");
        return transformText;
    };

    const randomText = () => configureCaptcha(Math.random().toString(36).substring(2, 8));
    const arbitraryRandom = (min, max) => Math.random() * (max - min) + min;

    const captcha = randomText();
    const background = await loadImage(path.join(__dirname, "..", "images", "captcha_background.png"));
    const initialCoord = (canvas.width - 41) / 6;

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let i = 0; i < captcha.length; i++) {
        let alpha = arbitraryRandom(0.35, 0.5);
        let size = arbitraryRandom(30, 35);
        let angle = arbitraryRandom(-1, 1);
        ctx.font = `${size}px serif`;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha}}`;
        ctx.rotate(angle * Math.PI / 180);
        ctx.fillText(captcha[i], initialCoord * (i + 1), (canvas.height + 7) / 2); // 7 ~= size / 4
    }
    fs.writeFileSync(path.join(__dirname, "..", "images", "captchas", `${captcha}.png`), canvas.toBuffer('image/png'));
    return captcha;
}

module.exports.help = {
    nombre: "verify",
    aliases: []
}
