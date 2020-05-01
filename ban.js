const Discord = require("discord.js");
const extras = require("../utils/extras.js");

module.exports.run = async (bot, message, args) => {
  if (!message.member.hasPermission("BAN_MEMBERS")) return extras.info_error(message, "Ha ocurrido un error:", 
    "**¡No tienes suficientes permisos!\nNecesitas el permiso **`BAN_MEMBERS`** para hacer esto.");

  let usuarioBaneado = message.mentions.users.first() || bot.users.cache.get(args[0]);
  let motivoBaneo = args.slice(1, args.length).join(" ");
  let fechaBaneo = message.createdAt.toString().split(" ");
  let canalSancion = message.guild.channels.cache.find(c => c.id === "705840530298241084");

  if (!usuarioBaneado) return extras.info_error(message, "Ha ocurrido un error:", "¡Especifica un usuario válido!\n"+
      "**┇ ⇒** Uso del comando: `m!ban <usuario> [motivo]`")

  if (message.guild.member(usuarioBaneado) !== null && !message.guild.member(usuarioBaneado).bannable) 
    return extras.info_error(message, "Ha ocurrido un error", "**¡Ese usuario no puede ser baneado!**\n"+
      "**┇ ⇒** Asegúrate de que el usuario al que estés sancionando sea el correcto.");

  if (!canalSancion) return message.channel.send("No se pudo encontrar un canal.");

  let embed = new Discord.MessageEmbed()
    .setTitle("Baneo | " + usuarioBaneado.id)
    .setDescription("Baneo")
    .setThumbnail(bot.user.avatarURL())
    .setColor(extras.color_general)
    .addField("Usuario baneado: ", usuarioBaneado, true)
    .addField("Baneado por: ", message.author.tag, true)
    .addField("Baneado en: ", message.channel, true)
    .addField("Fecha de sanción: ", fechaBaneo[1] + ' ' + fechaBaneo[2] + ', ' + fechaBaneo[3], true)
    .addField("Motivo: ", motivoBaneo !== undefined ? motivoBaneo : "No se definió.");

  message.guild.members.ban(usuarioBaneado.id);
  canalSancion.send(embed);
  return extras.success(message, "Acción completada!", "**El usuario ha sido baneado correctamente.\n"+
    `┇ ⇒** Los detalles de la sanción se mostrarán en ${canalSancion}. Puedes revertir esta acción con m!unban ${usuarioBaneado}.`)
}

module.exports.help = {
  nombre: "ban"
}
