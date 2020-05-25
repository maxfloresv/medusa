const request = require("request");
const extras = require("../utils/extras");

module.exports.run = async (bot, message, args, settings) => {
    console.log(generateNumbers(["1", "2", "3"], 5));
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
    } else {
        switch (args[0].toLowerCase()) {
            case "-tag": {
                let apiLink, tag;
                if (args[args.length - 2].toLowerCase() === "-p" && !isNaN(args[args.length - 1]) && parseInt(args[args.length - 1], 10) > 0) {
                    tag = args.slice(1, args.length - 2).join(" ").split(", ").join("+").replace(" ", "_").toLowerCase();
                    apiLink = `https://r34-json-api.herokuapp.com/posts?tags=${tag}&pid=${args[args.length - 1]}`;
                } else if (args[args.length - 2].includes("-p") && isNaN(args[args.length - 1]) || parseInt(args[args.length - 1], 10) < 0) {
                    return extras.new_error(message, "Ocurrió un error", "Ese no es un número de página válido. Tiene que ser mayor a 0.");
                } else {
                    tag = args.slice(1).join(" ").split(", ").join("+").replace(" ", "_").toLowerCase();
                    apiLink = `https://r34-json-api.herokuapp.com/posts?tags=${tag}`;
                }

                try {
                    request(apiLink, (err, response, body) => {
                        try { body = JSON.parse(body); } catch { return; }
                        if (body.length === 0) return extras.new_error(message, "Ocurrió un error", "No se pudo encontrar esa etiqueta (o página)."+
                        " En el caso de que hayas especificado una página, quita el parámetro -p del comando, porque puede que de esa búsqueda hayan menos de 100 resultados.");

                        let randomImage = generateNumbers(body, 5);
                        let images = randomImage.map(v => `${body[v].file_url.replace("https://r34-json-api.herokuapp.com/images?url=", "")}`).join("\n");
                        return await message.channel.send(images).catch(() => { return; });
                    });
                } catch { return; }
                break;
            }
            default: return extras.new_error(message, "Ocurrió un error", `Ese no es un parámetro válido. Usa **${settings.prefix}r34 -p <#página>** para buscar por página`+
            ` o **${settings.prefix}r34 -tag <tag>** para buscar por etiquetas (si deseas buscar múltiples, sepáralas por una coma).\n\n`+
            `También puedes combinar estos dos parámetros, por ejemplo: **${settings.prefix}r34 -tag <tag> -p <#página>**.`);
        }
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
    nombre: "rule34",
    aliases: ["r34"]
}
