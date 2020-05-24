const { MessageEmbed } = require("discord.js"); // Importa solo MessageEmbed de la librería de Discord, MessageEmbed son los mensajes que se mandan en los cuadros
const extras = require("../utils/extras"); // Una librería de apoyo que creé para los mensajes de error, éxito, etc

// run significa que todo lo que esté adentro de acá va a ejecutarse cuando pongan el comando
module.exports.run = async (bot, message, args, settings, userdata) /* Estos son parámetros que predefiní para trabajar con ellos */ => {
    if (!userdata.pets && !args[0] || args[0].toLowerCase() !== "buy") // Si el usuario no tiene registros de pets o no puso ningún argumento (los argumentos son las palabras después del comando, por ejemplo si pongo m!pet buy asd 1, args[0] es buy, args[1] es asd y args[2] es 1 (los arrays empiezan en el índice 0))
        return extras.new_error(message, "Ocurrió un error", `No tienes un pet todavía. ¡Compra uno con **${settings.prefix}pet buy**!`); // Msg de error

    // switch lo que hace es tomar un parámetro y revisar en los casos definidos abajo cuál coincide, si ese coincide, ejecuta lo que está dentro (default es el caso donde ninguno coincide)
    switch (args[0].toLowerCase()) {
        case "buy": {
            // esto va a ser el embed que se va a mandar (o sea, el mensaje en el cuadro)
            const embed = new MessageEmbed()
                .setAuthor(`Menú de mascotas | ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription("Responde al mensaje con los números de abajo según lo que quieras hacer!"+
                "\n**1 ::** Comprar una nueva mascota")
            
            // Importante usar await acá para esperar a que se resuelva la "promesa" del bot de enviar el mensaje
            await message.channel.send(embed).then(async m /* el then es para que cuando envíe el mensaje, ejecute todo lo que está dentro de este bloque (async es importante para las promesas) */ => {
                await m.react(extras.red_x_id) // para esto era básicamente el async de arriba, se tiene que resolver la promesa de reaccionar primero antes de seguir ejecutando el código

                let emojiFilter = (reaction, user) => { return reaction.emoji.id === extras.red_x_id && user.id === message.author.id; }; // filtro del colector, solo pasan las reacciones que sean a la "x" (cualquier otro emoji no va a hacer nada) y la id del usuario que reacciona tiene que ser la misma del que envió el mensaje
                let messageFilter = (msg) => { return ["1"].includes(msg.content) && msg.author.id === message.author.id; }; // filtro de los mensajes que se van a recibir, la id del que lo envía tiene que ser la misma del que envió el mensaje original y el mensaje debe contener "1" por ahora, que es la única opción disponible, cualquier otro msg lo ignora

                // crea el colector de emojis
                const collectorEmoji = m.createReactionCollector(emojiFilter);
                // crea el colector de mensajes
                const collectorMsg = m.channel.createMessageCollector(messageFilter, { max: 1, time: 15000 }); // max: 1 significa que va a recibir solo 1 y time: 15000 son 15 segundos en milisegundos, es decir, luego de eso no recibirá nada más.

                // <nombre del colector>.on("collect", (parámetros) => [...] { [código...] }) lo que hace es que cuando capta un emoji, ejecuta todo lo que esté dentro de su bloque
                collectorEmoji.on("collect", () => { 
                    collectorEmoji.stop(); collectorMsg.stop(); // como la opción única para los emojis es la x, al reaccionar a ella pararán todos los colectores y se eliminará el mensaje, puesto que si dejo los colectores andando se gastan recursos innecesariamente.
                    return m.delete();
                });

                // Lo mismo de arriba
                collectorMsg.on("collect", (msg) => { 
                    collectorEmoji.stop(); collectorMsg.stop();
                    m.delete();

                    if (msg.content === "1") {
                        return message.channel.send("proximamente");
                    }
                });

                // Lo mismo de arriba, solo que este lo que hará es que cuando termine el colector (end), ejecutará el código dentro del bloque. ¿Cuándo termina el colector? En 15 segundos desde que se envía el mensaje, ya que lo especifiqué al crear el colector (time: 15000)
                collectorMsg.on("end", (msg) => {
                    if (!msg) {
                        collectorEmoji.stop(); collectorMsg.stop();
                        return m.delete();
                    }
                });
            }).catch((err) => { return console.log(err); }); // debug: si capta algún error, va a devolverlo a la consola (yo aquí por lo general pongo return; ya que solo cuando te reporten algún bug es necesario logearlo a la consola).
            break;
        }
    }
}

module.exports.help = {
  nombre: "pet",
  aliases: []
}
