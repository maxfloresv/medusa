
const request = require("request");
const extras = require("../utils/extras");

module.exports.run = async (bot, message, args, settings) => {
    if (!message.channel.nsfw) return extras.new_error(message, "Ocurrió un error", "Este comando no se puede ejecutar acá debido a que el canal no está categorizado como **NSFW**.");
    if (!args[0]) {
        let random = Math.floor(Math.random() * 2000);
        let apiLink = `https://r34-json-api.herokuapp.com/posts?pid=${random}`;
        try {
            request(apiLink, async (err, response, body) => {
                try { body = JSON.parse(body); } catch { return; }

                let randomImage = generateNumbers(body, 5);
                let images = randomImage.map(v => `${body[v].file_url.replace("https://r34-json-api.herokuapp.com/images?url=", "")}`).join("\n");
                return await message.channel.send(images).catch(() => { return; });
            });
        } catch { message.channel.send("ok"); }
    } 
}

function generateNumbers(page, max) {
    const selected = [];
    let i = 0;
    if (page.length <= max) {
        while (i < page.length) {
            selected.push(i);
            i++;
        }
    } else {
        while (i < max) {
            const random = Math.floor(Math.random() * page.length);
            if (!selected.includes(random)) {
                selected.push(random);
                i++;
            }        
        }
    }
    return selected;
}


module.exports.help = {
    nombre: "hentai",
    aliases: []
}
