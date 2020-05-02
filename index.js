const Discord = require("discord.js");
const bot = new Discord.Client({disableEveryone: true});
const config = require("./config.json");
const Enmap = require("enmap");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql");

bot.commands = new Discord.Collection();

// Conectándose a la bb. dd.
var con = mysql.createConnection({ host: "xxxx", user: "xxxx", password: "xxxx", database: "xxxx" });
con.connect(err => { if (err) throw err; });

// Handlers
fs.readdir(path.join(__dirname, "modules"), (err, files) => {
  if (err) console.log(err);
  files.forEach(file => {
    const event = require(path.join(__dirname, "modules", file));
    event.run(bot);
  });
});

fs.readdir(path.join(__dirname, "commands"), (err, files) => {
  if (err) console.log(err);
  let archivojs = files.filter(f => f.split(".").pop() === "js")
  if (archivojs.length <= 0) {
    console.log("[-] Couldn't find any commands.");
    return;
  }
  archivojs.forEach((f, i) => {
      let propiedades = require(`./commands/${f}`);
      console.log(`[i] ${f} loaded sucessfully.`);
      bot.commands.set(propiedades.help.nombre, propiedades);
  });
});

// Eventos activados durante la fase de pruebas.
bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.info(e));

// Estados del bot.
bot.on("ready", () => {
  let estados = ['docs @ bot.mpecd.com', 'ayuda: m!help', `${bot.guilds.cache.size} servidores`, `${bot.users.cache.size} usuarios`]
  console.log(`-MeD- eSports | Bot oficial | Conectado en ${bot.guilds.cache.size} servidor(es) con ${bot.users.cache.size} usuario(s).`);
  setInterval(function() {
    let estado = estados[Math.floor(Math.random() * estados.length)];
    bot.user.setPresence( {
      activity: {
        name: estado,
        type: "WATCHING"
      },
      status: "online"
    });
  }, 60000)
});

// Pruebas...
bot.on("message", async message => {  
  if (message.mentions.users.equals(bot.user)) { return message.channel.send("test"); }
  
  con.query(`SELECT id, prefix FROM guildCfg WHERE id = '${message.guild.id}'`, (err, rows) => {
    if (!rows[0]) return;
    else {
      let prefix = rows[0].prefix;
      if (!message.content.startsWith(prefix)) return;
  
      let arrayMensaje = message.content.split(" ");
      let comando = arrayMensaje[0];
      let args = arrayMensaje.slice(1);
      let archivoComandos = bot.commands.get(comando.slice(prefix.length));
      if (archivoComandos) {
        archivoComandos.run(bot, message, args, con);
      }
    }
  })
});
bot.login(config.token);
