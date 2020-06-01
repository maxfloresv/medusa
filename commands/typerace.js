const { MessageEmbed, MessageAttachment } = require("discord.js");
const activeGames = new Set();
const extras = require("../utils/extras");
const levenshtein = require('fast-levenshtein');

module.exports.run = async (bot, message, args) => {
    if (activeGames.has(message.channel.id)) 
        return extras.new_error(message, "Ocurrió un error", "Ya hay un juego activo en este canal. Puedes participar en él o comenzar uno en otro.");
    
    activeGames.add(message.channel.id);
    const phrases = ["La tierra bajo sus botas era como un viejo colchón chirriante y elástico: encima una capa de hojas ligeras, frágiles, diferentes entre sí también en la muerte; y, debajo, otra de hojas disecadas, viejas, de hace años, que se habían macerado y que constituían una unica masa marrón: polvo de la vida que un día había brotado en capullos, susurrado en el viento de una tormenta, brillado al sol después de una lluvia.",
    "El aspecto de la isla cuando a la mañana siguiente subí a cubierta había cambiado totalmente. Aunque había cesado por completo la brisa, habíamos avanzado mucho durante la noche y estábamos al pairo a eso de media milla al sudeste de la parte inferior de la costa oriental.",
    "Yo era lo que se suele decir una torpe con la tecnología, una gafe sin remedio. Por avatares de la vida me tuve que enfrentar a mis miedos y ponerme delante de un ordenador a superar todas las barreras posibles.",
    "Si pudiera ser un indio, ahora mismo, y sobre un caballo a todo galope, con el cuerpo inclinado y suspendido en el aire, estremeciéndome sobre el suelo oscilante, hasta dejar las espuelas, pues no tenía espuelas, hasta tirar las riendas, pues no tenía riendas, y sólo viendo ante mí un paisaje como una pradera segada, ya sin el cuello y sin la cabeza del caballo.",
    "Las personas grandes, sin duda, no os creerán. Se imaginan que ocupan mucho lugar. Se sienten importantes, como los baobabs. Les aconsejaréis, pues, que hagan el cálculo. Les agradará porque adornan las cifras. Pero no perdáis el tiempo en esta penitencia. Es inútil. Tened confianza en mí.",
    "Era bella, elástica, con una piel tierna del color del pan y los ojos de almendras verdes, y tenía el cabello liso y negro y largo hasta la espalda y un aura de antigüedad que lo mismo podía ser de Indonesia que de los Andes."];
    
    let randomWord = phrases[Math.floor(Math.random() * phrases.length)];
    const availableTime = Math.floor(17 * randomWord.length / 46) * 1000;
    let participants = [];
    let participantsID = [];

    let embed = new MessageEmbed()
        .setAuthor(`Juego iniciado | ${message.guild.name}`, message.guild.iconURL() !== null ? message.guild.iconURL({ dynamic: true }) : bot.user.avatarURL())
        .setTitle("Carrera de escritura:")
        .setDescription("Escriban lo más rápido posible el texto que se va a mostrar a continuación.\nMientras más rápido lo escriban, más puntos obtendrán. Se aplica descuento por cada error."+
        `\n\n⌛ **Tiempo límite para responder:** ${availableTime / 1000} segundos.`)
        .setColor(extras.color_general)

    await message.channel.send(embed);
    await message.channel.send("¡Prepárense! El juego iniciará en **5 segundos**.").then(m => {
        setTimeout(async () => {
            const timer = Date.now();

            const typeRace = await m.edit(youWillNotCopy(randomWord));
            const filter = msg => { 
                return !msg.author.bot && !participantsID.includes(msg.author.id) && msg.content.length >= randomWord.length / 1.11 
                && levenshtein.get(randomWord, msg.content) <= randomWord.length / 10;
            };
            const collector = typeRace.channel.createMessageCollector(filter, { time: availableTime });
        
            collector.on("collect", (msg) => {
                msg.delete();
                participantsID.push(msg.author.id);

                let time = Math.floor((Date.now() - timer) / 1000);
                let errors = levenshtein.get(randomWord, msg.content);
                let wpm = Math.floor(60 * randomWord.split(" ").length / time);

                participants.push({ author: msg.author, time: time, errors: errors, wpm: wpm, score: wpm - Math.floor(randomWord.length / 25) * errors });
                message.channel.send(`¡${msg.author} ha terminado la carrera en ${time} segundos! WPM: ${wpm} | Errores: ${errors}.`);
            });
        
            collector.on("end", (msg) => {
                activeGames.delete(message.channel.id);
                if (msg.size === 0) return;
                let positions = determinePositions(participants);
                let j = 0;
                let embed = new MessageEmbed()
                    .setTitle("Resultados:")
                    .setColor(extras.color_general)
                    .setThumbnail(positions[0].author.displayAvatarURL({ dynamic: true }))
                    .addField("Ganador:", `🏆 **${positions[0].author.tag}**`)
                    .addField("Clasificación general:", positions.map(w => { 
                        if (j === 0) return `🥇 #${++j} :: **${w.author.username}** (Puntaje: ${w.score < 0 ? 0 : w.score})\nTiempo: ${w.time}s | Errores: ${w.errors} | WPM: ${w.wpm}`;
                        else if (j === 1) return `🥈 #${++j} :: **${w.author.username}** (Puntaje: ${w.score < 0 ? 0 : w.score})\nTiempo: ${w.time}s | Errores: ${w.errors} | WPM: ${w.wpm}`;
                        else if (j === 2) return `🥉 #${++j} :: **${w.author.username}** (Puntaje: ${w.score < 0 ? 0 : w.score})\nTiempo: ${w.time}s | Errores: ${w.errors} | WPM: ${w.wpm}`;
                        else return `#${++j} :: **${w.author.username}** (Puntaje: ${w.score < 0 ? 0 : w.score})\nTiempo: ${w.time}s | Errores: ${w.errors} | WPM: ${w.wpm}`;
                    }).join("\n\n"))
        
                return message.channel.send(embed);
            });
        }, 5000);
    });
}

function youWillNotCopy(str) {
    return str.replace(/\s/g, " \u200B");
}

function determinePositions(arr) {
    return arr.sort((a, b) => (a.score < b.score) ? 1 : -1);
}

module.exports.help = {
    nombre: "typerace",
    aliases: ["tr"]
}
