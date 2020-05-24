const { new_error, new_success } = require("../utils/extras.js");
const countrydb = require("../utils/countries.js");

module.exports.run = async (bot, message, args, settings, userdata) => {
    let countries = countrydb.countries_es;
    let user = message.mentions.users.first() || bot.users.cache.get(args[0]);
    
    if (!user) {
        if (!userdata || userdata.country === "ND") 
            return new_error(message, "Ocurrió un error", `No tienes país definido aún. Usa **${settings.prefix}setcountry <código de país>** para definirlo.`+
            " [Encuentra la lista de códigos de países haciendo clic aquí](https://bot.mpecd.com/countries).");
        
        return new_success(message, "Información encontrada", `¡El país que te definiste es ${countries[userdata.country]}!`);
    } else {
        if (user.bot) return new_error(message, "Ocurrió un error", "Las cuentas de bots no tienen perfil.");
        
        let fetched;
        try { fetched = await bot.getUserData(user); } catch { return new_error(message, "Ocurrió un error", "No se encontraron datos definidos para ese usuario"); }

        if (!fetched || fetched.country === "ND") return new_error(message, "Ocurrió un error", "Ese usuario todavía no se ha definido un país.");
        return new_success(message, "Información encontrada", `El país de **${user.username}#${user.discriminator}** es ${countries[fetched.country]}.`);
    }
}

module.exports.help = {
  nombre: "country",
  aliases: []
}
