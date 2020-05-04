const Discord = require("discord.js");
const path = require("path");
const fs = require("fs");
const extras = require("../utils/extras.js")

const Canvas = require('canvas'),
      canvas = Canvas.createCanvas(175, 50),
      ctx = canvas.getContext('2d');

const mysql = require("mysql");
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "testdb"
});
con.connect(err => {
    if (err) throw err;
    console.log("[i] Connected succesfully to database.")
});

module.exports.run = (bot) => {
    bot.on("guildMemberAdd", async (member) => {
        con.query(`SELECT * FROM guildCfg WHERE id = '${member.guild.id}'`, async (err, rows) => {
            if (!rows[0]) return;
            // Checking if the guild has the captcha system activated.
            if (rows[0].verification === 0) return;
            else {
                const captcha = await createCaptcha();
                const filter = m => {
                    if (m.author.bot) return;
                    if (m.author.id === member.id && m.content === captcha) return true;
                    else {
                        m.channel.send("Ese no es el captcha correcto");
                        return false;
                    }
                }
                // add random captchas toupper tolower case- add cfg
                try {
                    let embed = new Discord.MessageEmbed()
                        .setAuthor("Verificación requerida.")
                        .setTitle(`¡Bienvenid@ a ${member.guild.name}!`)
                        .setDescription("Antes de poder obtener acceso a todos los canales del servidor, necesitas verificar que no eres un bot completando el siguiente captcha:")
                        .addField("Tu captcha:", "(Ten en cuenta las mayúsculas/minúsculas)")
                        .attachFiles(path.join(__dirname, "..", "images", "captchas", `${captcha}.png`))
                        .setImage(`attachment://${captcha}.png`)
                        .setFooter("Debes responder a este mensaje privado.")
                    member.send(embed).then(async m => {
                        await m.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
                        .then(async collected => {
                            if (collected) { 
                                let embed = new Discord.MessageEmbed()
                                    .setAuthor("Verificación completada.")
                                    .setTitle("¡Gracias por verificarte!")
                                    .setColor(extras.color_off)
                                    .setDescription(`Ahora tienes acceso a los canales de ${member.guild.name}`)
                                await m.channel.send(embed);
                                await member.roles.add("701216579265757345"); // rol
                                fs.unlinkSync(`${path.join(__dirname, "..", "images", "captchas", `${captcha}.png`)}`);
                            }
                        })
                        .catch(async () => {
                            await m.channel.send("No resolviste el captcha a tiempo.");
                            await member.kick();
                            fs.unlinkSync(path.join(__dirname, "..", "images", "captchas", `${captcha}.png`));
                        });
                    })
                } catch (err) { console.log(err); }
            }
            // check 2
        });
    })
}

async function createCaptcha() {
    const captcha = Math.random().toString(36).slice(2, 8);
    const background = await Canvas.loadImage(path.join(__dirname, "..", "images", "captcha_background.png"))
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = "25px Exo 2"
    ctx.fillText(captcha, 28, 31)
    fs.writeFileSync(path.join(__dirname, "..", "images", "captchas", `${captcha}.png`), canvas.toBuffer('image/png'))
    return captcha;
}
