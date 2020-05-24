const Discord = require("discord.js");
const bot = new Discord.Client({ disableEveryone: true, partials: ['MESSAGE', 'REACTION'] });
const config = require("./config.json");
const fs = require("fs");
const path = require("path");
const mongodb = require("./databases/database.js");
const Giveaway = require("./databases/model/giveaway.js");
const scheduleGiveaways = require("./utils/giveaways.js").scheduleGiveaways;
require("./modules/guildConfigHandler.js")(bot);
require("./modules/userDataHandler.js")(bot);

bot.commands = new Discord.Collection();

(async () => { await mongodb; })();

fs.readdir(path.join(__dirname, "modules"), (err, files) => {
  if (err) console.log(err);
  files.forEach(file => {
    const event = require(path.join(__dirname, "modules", file));
    event.run(bot, con);
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
      let { aliases } = propiedades.help;
      console.log(`[i] ${f} loaded successfully.`);
      bot.commands.set(propiedades.help.nombre, propiedades);
      
      if (aliases.length !== 0) aliases.forEach(alias => bot.commands.set(alias, propiedades));
  });
});

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.info(e));

bot.on("ready", async () => {
  const current = new Date();
  const giveaways = await Giveaway.find({
    endsOn: { $gt: current }
  });
  await scheduleGiveaways(bot, giveaways);

  let estados = ['bot en fase beta!', 'ayuda: m!help', `${bot.guilds.cache.size} servidores`, `${bot.users.cache.size} usuarios`]
  console.log(`Medusa | Conectado en ${bot.guilds.cache.size} servidor(es) con ${bot.users.cache.size} usuario(s).`);
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

bot.login(config.token);
